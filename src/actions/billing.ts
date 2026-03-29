// src/actions/billing.ts
// Server Actions for credits, Stripe checkout, and subscription management

"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { addCredits } from "@/lib/credits";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreditReason } from "@prisma/client";
import Stripe from "stripe";

// ─── Stripe singleton ──────────────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Get full billing info ─────────────────────────────────────────────────────
export async function getBillingInfoAction() {
  try {
    const user = await requireUser();

    const dbUser = await prisma.user.findUnique({
      where:   { id: user.id },
      select:  { credits: true, plan: true, creditsResetAt: true },
    });

    const subscription = await prisma.subscription.findUnique({
      where:  { userId: user.id },
    });

    const creditLogs = await prisma.creditLog.findMany({
      where:    { userId: user.id },
      orderBy:  { createdAt: "desc" },
      take:     10,
    });

    // Calculate next daily reset time for FREE users
    const nextReset = dbUser?.plan === "FREE" && dbUser.creditsResetAt
      ? new Date(dbUser.creditsResetAt.getTime() + 24 * 60 * 60 * 1000)
      : null;

    return {
      success: true,
      plan:           dbUser?.plan ?? "FREE",
      credits:        dbUser?.credits ?? 0,
      nextReset,
      subscription,
      creditLogs,
    };
  } catch (err) {
    console.error("[getBillingInfoAction]", err);
    return { success: false, error: "Failed to fetch billing info." };
  }
}

// ─── Create Stripe checkout — Pro subscription ─────────────────────────────────
export async function createProCheckoutAction(): Promise<never> {
  const user = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { email: true, name: true },
  });

  // Get or create Stripe customer
  let subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  let customerId   = subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser?.email ?? user.email,
      name:  dbUser?.name  ?? user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    await prisma.subscription.upsert({
      where:  { userId: user.id },
      update: { stripeCustomerId: customerId },
      create: { userId: user.id, stripeCustomerId: customerId, plan: "FREE", status: "ACTIVE" },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer:             customerId,
    mode:                 "subscription",
    payment_method_types: ["card"],
    line_items: [{
      price:    process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      quantity: 1,
    }],
    success_url: `${APP_URL}/app/billing?success=pro`,
    cancel_url:  `${APP_URL}/app/billing?canceled=1`,
    metadata:    { userId: user.id, plan: "PRO" },
  });

  redirect(session.url!);
}

// ─── Create Stripe checkout — Pay-as-you-go 50 credits ────────────────────────
export async function createPaygCheckoutAction(): Promise<never> {
  const user = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { email: true, name: true },
  });

  let subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  let customerId   = subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser?.email ?? user.email,
      name:  dbUser?.name  ?? user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    await prisma.subscription.upsert({
      where:  { userId: user.id },
      update: { stripeCustomerId: customerId },
      create: { userId: user.id, stripeCustomerId: customerId, plan: "FREE", status: "ACTIVE" },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer:             customerId,
    mode:                 "payment",
    payment_method_types: ["card"],
    line_items: [{
      price:    process.env.STRIPE_PAYG_50_PRICE_ID!,
      quantity: 1,
    }],
    success_url: `${APP_URL}/app/billing?success=payg`,
    cancel_url:  `${APP_URL}/app/billing?canceled=1`,
    metadata:    { userId: user.id, plan: "PAYG", credits: "50" },
  });

  redirect(session.url!);
}

// ─── Open Stripe customer portal (manage/cancel subscription) ─────────────────
export async function openBillingPortalAction(): Promise<never> {
  const user = await requireUser();

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  if (!subscription?.stripeCustomerId) {
    redirect("/app/billing");
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer:   subscription.stripeCustomerId,
    return_url: `${APP_URL}/app/billing`,
  });

  redirect(portal.url);
}

// ─── Cancel subscription (immediate, via portal is preferred) ─────────────────
export async function cancelSubscriptionAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription?.stripeSubId) {
      return { success: false, error: "No active subscription found." };
    }

    // Cancel at period end (not immediately)
    await stripe.subscriptions.update(subscription.stripeSubId, {
      cancel_at_period_end: true,
    });

    revalidatePath("/app/billing");

    return { success: true };
  } catch (err) {
    console.error("[cancelSubscriptionAction]", err);
    return { success: false, error: "Failed to cancel subscription." };
  }
}

// ─── Admin: manually add credits (for testing / support) ──────────────────────
export async function adminAddCreditsAction(
  userId: string,
  amount: number,
  reason: CreditReason = CreditReason.BONUS
): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, add proper admin role check here
    await addCredits(userId, amount, reason, "Manual credit addition");
    revalidatePath("/app/billing");
    return { success: true };
  } catch (err) {
    console.error("[adminAddCreditsAction]", err);
    return { success: false, error: "Failed to add credits." };
  }
}
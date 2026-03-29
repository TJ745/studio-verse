// src/app/api/webhooks/stripe/route.ts
// Stripe webhook handler — processes payment and subscription events

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";
import { CreditReason } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("[stripe-webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── One-time payment completed (PAYG credits) ────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId  = session.metadata?.userId;
        const plan    = session.metadata?.plan;

        if (!userId) break;

        if (plan === "PAYG") {
          const credits = parseInt(session.metadata?.credits ?? "50");
          await addCredits(userId, credits, CreditReason.PURCHASE, "Pay-as-you-go purchase");

          await prisma.user.update({
            where: { id: userId },
            data:  { plan: "PAYG" },
          });

          await prisma.subscription.upsert({
            where:  { userId },
            update: { plan: "PAYG" },
            create: { userId, plan: "PAYG", status: "ACTIVE" },
          });
        }

        if (plan === "PRO" && session.mode === "subscription") {
          // Sub creation handled in customer.subscription.created
          // Just log it here
          console.log("[stripe-webhook] PRO checkout completed for", userId);
        }

        break;
      }

      // ── Subscription created ─────────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub      = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
        const userId   = customer.metadata?.userId;

        if (!userId) break;

        const isActive = ["active", "trialing"].includes(sub.status);
        const renewsAt = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null;

        if (isActive) {
          await prisma.user.update({
            where: { id: userId },
            data:  { plan: "PRO" },
          });
        }

        await prisma.subscription.upsert({
          where:  { userId },
          update: {
            stripeSubId:  sub.id,
            stripePriceId: sub.items.data[0]?.price.id ?? null,
            plan:         isActive ? "PRO" : "FREE",
            status:       isActive ? "ACTIVE" : sub.status === "past_due" ? "PAST_DUE" : "CANCELED",
            renewsAt,
          },
          create: {
            userId,
            stripeSubId:  sub.id,
            stripePriceId: sub.items.data[0]?.price.id ?? null,
            plan:         isActive ? "PRO" : "FREE",
            status:       "ACTIVE",
            renewsAt,
          },
        });

        break;
      }

      // ── Subscription canceled / deleted ──────────────────────────────────
      case "customer.subscription.deleted": {
        const sub      = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
        const userId   = customer.metadata?.userId;

        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data:  { plan: "FREE" },
        });

        await prisma.subscription.upsert({
          where:  { userId },
          update: {
            plan:       "FREE",
            status:     "CANCELED",
            canceledAt: new Date(),
          },
          create: {
            userId,
            plan:       "FREE",
            status:     "CANCELED",
            canceledAt: new Date(),
          },
        });

        break;
      }

      // ── Invoice payment failed ────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice  = event.data.object as Stripe.Invoice;
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        const userId   = customer.metadata?.userId;

        if (!userId) break;

        await prisma.subscription.updateMany({
          where: { userId },
          data:  { status: "PAST_DUE" },
        });

        // TODO: send payment failed email via Nodemailer

        break;
      }

      default:
        // Unhandled event — ignore silently
        break;
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
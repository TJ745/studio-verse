// src/lib/credits.ts
// Credit management helpers

import { prisma } from "@/lib/prisma";
import { Plan, ImageQuality, CreditReason } from "@prisma/client";

// How many credits each quality costs
export const CREDIT_COST: Record<ImageQuality, number> = {
  STANDARD: 1,
  HD: 2,
};

// Daily free credits per plan
export const DAILY_CREDITS: Record<Plan, number | null> = {
  FREE: 10,
  PRO: null,   // unlimited
  PAYG: null,  // credits are purchased, not reset daily
};

/**
 * Check if user has enough credits for a generation.
 * Also resets daily credits for FREE users if 24h has passed.
 */
export async function checkAndDeductCredits(
  userId: string,
  quality: ImageQuality
): Promise<{ success: boolean; message?: string }> {
  const cost = CREDIT_COST[quality];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, credits: true, creditsResetAt: true },
  });

  if (!user) return { success: false, message: "User not found" };

  // PRO users have unlimited generations
  if (user.plan === "PRO") return { success: true };

  // Reset daily credits for FREE users
  if (user.plan === "FREE") {
    const now = new Date();
    const lastReset = new Date(user.creditsResetAt);
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: 10,
          creditsResetAt: now,
        },
      });
      // Re-fetch updated credits
      user.credits = 10;

      await prisma.creditLog.create({
        data: {
          userId,
          amount: 10,
          reason: CreditReason.DAILY_RESET,
          note: "Daily free credit reset",
        },
      });
    }
  }

  // Check if enough credits
  if (user.credits < cost) {
    return {
      success: false,
      message: `Not enough credits. This generation costs ${cost} credit(s), you have ${user.credits}.`,
    };
  }

  // Deduct credits
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: cost } },
    }),
    prisma.creditLog.create({
      data: {
        userId,
        amount: -cost,
        reason:
          quality === "HD"
            ? CreditReason.GENERATION_HD
            : CreditReason.GENERATION_STANDARD,
        note: `${quality} generation`,
      },
    }),
  ]);

  return { success: true };
}

/**
 * Add credits to a user (purchase, refund, bonus)
 */
export async function addCredits(
  userId: string,
  amount: number,
  reason: CreditReason,
  note?: string
) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
    prisma.creditLog.create({
      data: { userId, amount, reason, note },
    }),
  ]);
}

/**
 * Get user's current credit info
 */
export async function getCreditInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, credits: true, creditsResetAt: true },
  });

  if (!user) return null;

  const now = new Date();
  const nextReset =
    user.plan === "FREE"
      ? new Date(user.creditsResetAt.getTime() + 24 * 60 * 60 * 1000)
      : null;

  return {
    plan: user.plan,
    credits: user.plan === "PRO" ? Infinity : user.credits,
    isUnlimited: user.plan === "PRO",
    nextReset,
    hoursUntilReset: nextReset
      ? Math.max(0, Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60)))
      : null,
  };
}
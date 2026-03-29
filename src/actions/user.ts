// src/actions/user.ts
// Server Actions for user account management

"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// ─── Get current user profile ──────────────────────────────────────────────────
export async function getUserProfileAction() {
  try {
    const user = await requireUser();

    const dbUser = await prisma.user.findUnique({
      where:  { id: user.id },
      select: {
        id:              true,
        name:            true,
        email:           true,
        emailVerified:   true,
        image:           true,
        plan:            true,
        credits:         true,
        creditsResetAt:  true,
        createdAt:       true,
        _count: {
          select: { generations: true, savedImages: true },
        },
      },
    });

    return { success: true, user: dbUser };
  } catch (err) {
    console.error("[getUserProfileAction]", err);
    return { success: false, error: "Failed to fetch profile.", user: null };
  }
}

// ─── Update display name ───────────────────────────────────────────────────────
const UpdateNameSchema = z.object({
  name: z.string().min(1).max(80).trim(),
});

export async function updateNameAction(
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user   = await requireUser();
    const parsed = UpdateNameSchema.safeParse({ name });

    if (!parsed.success) {
      return { success: false, error: "Name must be between 1 and 80 characters." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data:  { name: parsed.data.name },
    });

    revalidatePath("/app/dashboard");

    return { success: true };
  } catch (err) {
    console.error("[updateNameAction]", err);
    return { success: false, error: "Failed to update name." };
  }
}

// ─── Change password ───────────────────────────────────────────────────────────
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8, "New password must be at least 8 characters"),
});

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = ChangePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
    }

    // BetterAuth handles password verification and hashing
    const result = await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword:     parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    if (!result) {
      return { success: false, error: "Current password is incorrect." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[changePasswordAction]", err);
    if (err?.message?.toLowerCase().includes("password")) {
      return { success: false, error: "Current password is incorrect." };
    }
    return { success: false, error: "Failed to change password." };
  }
}

// ─── Resend verification email ─────────────────────────────────────────────────
export async function resendVerificationAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    await auth.api.sendVerificationEmail({
      body:    { email: user.email, callbackURL: "/dashboard" },
      headers: await headers(),
    });

    return { success: true };
  } catch (err) {
    console.error("[resendVerificationAction]", err);
    return { success: false, error: "Failed to send verification email." };
  }
}

// ─── Delete account ────────────────────────────────────────────────────────────
export async function deleteAccountAction(
  confirmText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    if (confirmText.trim().toLowerCase() !== "delete my account") {
      return { success: false, error: 'Please type "delete my account" to confirm.' };
    }

    // Delete all user data (Prisma cascades handle related records)
    await prisma.user.delete({ where: { id: user.id } });

    // Sign out
    await auth.api.signOut({ headers: await headers() });

  } catch (err) {
    console.error("[deleteAccountAction]", err);
    return { success: false, error: "Failed to delete account. Please try again." };
  }

  redirect("/");
}

// ─── Get dashboard stats ───────────────────────────────────────────────────────
export async function getDashboardStatsAction() {
  try {
    const user = await requireUser();

    const [totalGenerations, savedCount, favoriteCount, dbUser, recentGenerations] =
      await Promise.all([
        prisma.generation.count({ where: { userId: user.id } }),
        prisma.savedImage.count({ where: { userId: user.id } }),
        prisma.savedImage.count({ where: { userId: user.id, isFavorite: true } }),
        prisma.user.findUnique({
          where:  { id: user.id },
          select: { credits: true, plan: true, creditsResetAt: true },
        }),
        prisma.generation.findMany({
          where:    { userId: user.id },
          orderBy:  { createdAt: "desc" },
          take:     6,
          select: {
            id:          true,
            imageUrl:    true,
            prompt:      true,
            stylePreset: true,
            quality:     true,
            size:        true,
            createdAt:   true,
          },
        }),
      ]);

    return {
      success: true,
      stats: {
        totalGenerations,
        savedCount,
        favoriteCount,
        credits:    dbUser?.credits ?? 0,
        plan:       dbUser?.plan    ?? "FREE",
      },
      recentGenerations,
    };
  } catch (err) {
    console.error("[getDashboardStatsAction]", err);
    return { success: false, error: "Failed to fetch stats." };
  }
}
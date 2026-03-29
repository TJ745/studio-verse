// src/actions/style-profile.ts
// Server Actions for Style DNA profile management

"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const StyleProfileSchema = z.object({
  favoriteStyles:    z.array(z.string()).max(6),
  colorMood:         z.enum(["warm", "cool", "monochrome", "vibrant", "earthy", "pastel"]).nullable().optional(),
  artistInfluences:  z.array(z.string().max(50)).max(5),
  defaultSize:       z.enum(["SQUARE", "PORTRAIT", "LANDSCAPE"]).default("SQUARE"),
  defaultQuality:    z.enum(["STANDARD", "HD"]).default("STANDARD"),
  defaultStyle:      z.enum(["VIVID", "NATURAL"]).default("VIVID"),
});

export type StyleProfileInput = z.infer<typeof StyleProfileSchema>;

// ─── Get style profile ─────────────────────────────────────────────────────────
export async function getStyleProfileAction() {
  try {
    const user = await requireUser();

    const profile = await prisma.styleProfile.findUnique({
      where: { userId: user.id },
    });

    return { success: true, profile };
  } catch (err) {
    console.error("[getStyleProfileAction]", err);
    return { success: false, error: "Failed to fetch style profile.", profile: null };
  }
}

// ─── Upsert style profile ──────────────────────────────────────────────────────
export async function upsertStyleProfileAction(
  input: StyleProfileInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    const parsed = StyleProfileSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
    }

    const { favoriteStyles, colorMood, artistInfluences, defaultSize, defaultQuality, defaultStyle } = parsed.data;

    await prisma.styleProfile.upsert({
      where:  { userId: user.id },
      update: {
        favoriteStyles,
        colorMood:        colorMood ?? null,
        artistInfluences,
        defaultSize,
        defaultQuality,
        defaultStyle,
      },
      create: {
        userId: user.id,
        favoriteStyles,
        colorMood:        colorMood ?? null,
        artistInfluences,
        defaultSize,
        defaultQuality,
        defaultStyle,
      },
    });

    revalidatePath("/app/style-profile");
    revalidatePath("/app/dashboard");

    return { success: true };
  } catch (err) {
    console.error("[upsertStyleProfileAction]", err);
    return { success: false, error: "Failed to save style profile." };
  }
}

// ─── Reset style profile to defaults ──────────────────────────────────────────
export async function resetStyleProfileAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    await prisma.styleProfile.upsert({
      where:  { userId: user.id },
      update: {
        favoriteStyles:   [],
        colorMood:        null,
        artistInfluences: [],
        defaultSize:      "SQUARE",
        defaultQuality:   "STANDARD",
        defaultStyle:     "VIVID",
      },
      create: {
        userId:           user.id,
        favoriteStyles:   [],
        colorMood:        null,
        artistInfluences: [],
        defaultSize:      "SQUARE",
        defaultQuality:   "STANDARD",
        defaultStyle:     "VIVID",
      },
    });

    revalidatePath("/app/style-profile");

    return { success: true };
  } catch (err) {
    console.error("[resetStyleProfileAction]", err);
    return { success: false, error: "Failed to reset style profile." };
  }
}
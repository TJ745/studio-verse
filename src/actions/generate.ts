// src/actions/generate.ts
// Server Actions for image generation flow

"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { openai, IMAGE_SIZE_MAP, buildFinalPrompt } from "@/lib/openai";
import { enhancePrompt } from "@/lib/openai-enhance";
import { checkAndDeductCredits } from "@/lib/credits";
import { revalidatePath } from "next/cache";
import { ImageSize, ImageQuality, DalleStyle } from "@prisma/client";
import { z } from "zod";

// ─── Input schema ──────────────────────────────────────────────────────────────
const GenerateSchema = z.object({
  prompt:      z.string().min(3, "Prompt must be at least 3 characters").max(1000),
  stylePreset: z.string().nullable().optional(),
  size:        z.enum(["SQUARE", "PORTRAIT", "LANDSCAPE"]).default("SQUARE"),
  quality:     z.enum(["STANDARD", "HD"]).default("STANDARD"),
  dalleStyle:  z.enum(["VIVID", "NATURAL"]).default("VIVID"),
  useEnhance:  z.boolean().default(true),
});

export type GenerateInput = z.infer<typeof GenerateSchema>;

export type GenerateResult =
  | { success: true;  id: string; imageUrl: string; prompt: string; enhancedPrompt: string | null }
  | { success: false; error: string };

// ─── Generate action ───────────────────────────────────────────────────────────
export async function generateImageAction(input: GenerateInput): Promise<GenerateResult> {
  try {
    const user = await requireUser();

    // Validate
    const parsed = GenerateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }

    const { prompt, stylePreset, size, quality, dalleStyle, useEnhance } = parsed.data;

    // Check + deduct credits
    const creditResult = await checkAndDeductCredits(user.id, quality as ImageQuality);
    if (!creditResult.success) {
      return { success: false, error: creditResult.message ?? "Insufficient credits" };
    }

    // Enhance prompt with GPT-4o
    let enhancedPrompt: string | null = null;
    if (useEnhance) {
      try {
        enhancedPrompt = await enhancePrompt(prompt, stylePreset);
      } catch {
        // Silent fallback — generation continues with original prompt
      }
    }

    // Build final prompt (inject style suffix)
    const finalPrompt = buildFinalPrompt(enhancedPrompt ?? prompt, stylePreset);

    // Call DALL·E 3
    const response = await openai.images.generate({
      model:           "dall-e-3",
      prompt:          finalPrompt,
      n:               1,
      size:            IMAGE_SIZE_MAP[size as ImageSize],
      quality:         quality === "HD" ? "hd" : "standard",
      style:           dalleStyle === "VIVID" ? "vivid" : "natural",
      response_format: "url",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      return { success: false, error: "No image returned from DALL·E 3. Please try again." };
    }

    // Save to DB
    const generation = await prisma.generation.create({
      data: {
        userId:         user.id,
        prompt,
        enhancedPrompt,
        imageUrl,
        size:           size as ImageSize,
        quality:        quality as ImageQuality,
        style:          dalleStyle as DalleStyle,
        stylePreset:    stylePreset ?? null,
        model:          "dall-e-3",
        creditsUsed:    quality === "HD" ? 2 : 1,
        status:         "COMPLETED",
      },
    });

    // Revalidate dashboard + history
    revalidatePath("/app/dashboard");
    revalidatePath("/app/history");

    return {
      success:        true,
      id:             generation.id,
      imageUrl,
      prompt,
      enhancedPrompt,
    };

  } catch (err: any) {
    console.error("[generateImageAction]", err);

    if (err?.code === "content_policy_violation") {
      return { success: false, error: "Prompt flagged by OpenAI content policy. Please try a different description." };
    }
    if (err?.status === 429) {
      return { success: false, error: "OpenAI rate limit reached. Please wait a moment and try again." };
    }

    return { success: false, error: "Generation failed. Please try again." };
  }
}
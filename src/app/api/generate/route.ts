// src/app/api/generate/route.ts
// DALL·E 3 image generation endpoint

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { openai, IMAGE_SIZE_MAP, buildFinalPrompt } from "@/lib/openai";
import { enhancePrompt } from "@/lib/openai-enhance";
import { checkAndDeductCredits } from "@/lib/credits";
import { ImageSize, ImageQuality, DalleStyle } from "@prisma/client";
import { z } from "zod";

// ─── Request validation schema ─────────────────────────────────────────────────
const GenerateSchema = z.object({
  prompt:      z.string().min(3).max(1000),
  stylePreset: z.string().nullable().optional(),
  size:        z.enum(["SQUARE", "PORTRAIT", "LANDSCAPE"]).default("SQUARE"),
  quality:     z.enum(["STANDARD", "HD"]).default("STANDARD"),
  dalleStyle:  z.enum(["VIVID", "NATURAL"]).default("VIVID"),
  useEnhance:  z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ─────────────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // ── 2. Validate body ──────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, stylePreset, size, quality, dalleStyle, useEnhance } = parsed.data;

    // ── 3. Credit check & deduction ───────────────────────────────────────────
    const creditResult = await checkAndDeductCredits(userId, quality as ImageQuality);
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.message }, { status: 402 });
    }

    // ── 4. Enhance prompt with GPT-4o (optional) ─────────────────────────────
    let enhancedPrompt: string | undefined;
    if (useEnhance) {
      try {
        enhancedPrompt = await enhancePrompt(prompt, stylePreset);
      } catch {
        // Graceful fallback — don't fail the whole generation if GPT-4o is down
        enhancedPrompt = undefined;
      }
    }

    // ── 5. Build final prompt with style injection ────────────────────────────
    const basePrompt = enhancedPrompt ?? prompt;
    const finalPrompt = buildFinalPrompt(basePrompt, stylePreset);

    // ── 6. Call DALL·E 3 ──────────────────────────────────────────────────────
    const openaiSize = IMAGE_SIZE_MAP[size as ImageSize];

    const response = await openai.images.generate({
      model:   "dall-e-3",
      prompt:  finalPrompt,
      n:       1,
      size:    openaiSize,
      quality: quality === "HD" ? "hd" : "standard",
      style:   dalleStyle === "VIVID" ? "vivid" : "natural",
      response_format: "url",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image returned from DALL·E 3. Please try again." },
        { status: 500 }
      );
    }

    // ── 7. Save generation to DB ──────────────────────────────────────────────
    const generation = await prisma.generation.create({
      data: {
        userId,
        prompt,
        enhancedPrompt: enhancedPrompt ?? null,
        imageUrl,
        size:        size as ImageSize,
        quality:     quality as ImageQuality,
        style:       dalleStyle as DalleStyle,
        stylePreset: stylePreset ?? null,
        model:       "dall-e-3",
        creditsUsed: quality === "HD" ? 2 : 1,
        status:      "COMPLETED",
      },
    });

    // ── 8. Return result ──────────────────────────────────────────────────────
    return NextResponse.json({
      id:             generation.id,
      imageUrl,
      prompt,
      enhancedPrompt: enhancedPrompt ?? null,
    });

  } catch (err: any) {
    console.error("[/api/generate]", err);

    // OpenAI content policy error
    if (err?.code === "content_policy_violation") {
      return NextResponse.json(
        { error: "Your prompt was flagged by OpenAI's content policy. Please try a different prompt." },
        { status: 422 }
      );
    }

    // OpenAI billing / quota error
    if (err?.status === 429) {
      return NextResponse.json(
        { error: "OpenAI rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong during generation. Please try again." },
      { status: 500 }
    );
  }
}
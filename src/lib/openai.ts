// src/lib/openai.ts
// OpenAI singleton for DALL·E 3 image generation

import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

if (process.env.NODE_ENV !== "production") {
  globalForOpenAI.openai = openai;
}

// ============================================================
// Image Size mapping (enum → OpenAI string)
// ============================================================

export const IMAGE_SIZE_MAP = {
  SQUARE:    "1024x1024",
  PORTRAIT:  "1024x1792",
  LANDSCAPE: "1792x1024",
} as const;

export type OpenAIImageSize = (typeof IMAGE_SIZE_MAP)[keyof typeof IMAGE_SIZE_MAP];

// ============================================================
// Style Preset → Prompt suffix injection
// ============================================================

export const STYLE_PRESETS: Record<string, string> = {
  cartoon:      "cartoon style, bold outlines, vibrant colors, 2D animation illustration",
  anime:        "anime style, Studio Ghibli inspired, cel shading, detailed linework",
  photorealistic: "photorealistic, DSLR photograph, 8K resolution, sharp focus, natural lighting",
  oil_painting: "oil painting, thick brushstrokes, classical fine art style, canvas texture",
  cinematic:    "cinematic, dramatic lighting, movie still, anamorphic lens, film grain",
  render_3d:    "3D render, Blender, octane render, subsurface scattering, studio lighting",
  sketch:       "pencil sketch, hand-drawn, crosshatching, detailed linework, monochrome",
  pixel_art:    "pixel art, 16-bit retro game style, crisp edges, limited color palette",
  watercolor:   "watercolor painting, soft edges, pastel tones, wet-on-wet technique",
  fantasy:      "fantasy art, epic scale, magical atmosphere, detailed digital illustration",
  cyberpunk:    "cyberpunk, neon lights, dystopian city, rain-soaked streets, futuristic",
  vintage:      "vintage photography, film grain, faded colors, 1970s aesthetic, retro",
};

export type StylePresetKey = keyof typeof STYLE_PRESETS;

/**
 * Build the final prompt sent to DALL·E 3
 * Injects style preset suffix if provided
 */
export function buildFinalPrompt(
  prompt: string,
  stylePreset?: string | null
): string {
  if (!stylePreset || !STYLE_PRESETS[stylePreset]) return prompt;
  return `${prompt}, ${STYLE_PRESETS[stylePreset]}`;
}
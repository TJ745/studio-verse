// src/lib/openai-enhance.ts
// Prompt enhancement using OpenAI GPT-4o

import { openai } from "@/lib/openai";

/**
 * Enhances a raw user prompt using GPT-4o before sending to DALL·E 3.
 * Adds composition, lighting, mood, and style-appropriate quality boosters.
 */
export async function enhancePrompt(
  rawPrompt: string,
  stylePreset?: string | null
): Promise<string> {
  const styleContext = stylePreset && stylePreset !== "none"
    ? `The user has selected the "${stylePreset}" visual style.`
    : "No specific style has been selected.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are an expert AI image prompt engineer specializing in DALL·E 3. " +
            "Your job is to take a user's raw prompt and enhance it for the best possible image generation result. " +
            "Add composition details (foreground, background, perspective), lighting (golden hour, studio lighting, dramatic shadows, etc.), " +
            "mood and atmosphere, and relevant quality boosters appropriate for the chosen style. " +
            "Keep the enhanced prompt under 200 words. " +
            "Return ONLY the enhanced prompt text — no explanations, no preamble, no quotes.",
        },
        {
          role: "user",
          content: `${styleContext}\n\nUser's raw prompt: "${rawPrompt}"`,
        },
      ],
    });

    const enhanced = completion.choices[0]?.message?.content?.trim();
    return enhanced && enhanced.length > 0 ? enhanced : rawPrompt;
  } catch {
    // Graceful fallback — return original prompt if GPT-4o call fails
    return rawPrompt;
  }
}
// src/actions/gallery.ts
// Server Actions for managing saved images, favorites, tags, and deletion

"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Save a generation to the gallery ─────────────────────────────────────────
export async function saveGenerationAction(
  generationId: string,
  title?: string
): Promise<{ success: boolean; error?: string; savedImageId?: string }> {
  try {
    const user = await requireUser();

    // Verify the generation belongs to this user
    const generation = await prisma.generation.findFirst({
      where: { id: generationId, userId: user.id },
    });

    if (!generation) {
      return { success: false, error: "Generation not found." };
    }

    // Upsert — safe to call multiple times
    const saved = await prisma.savedImage.upsert({
      where:  { generationId },
      update: { title: title ?? null },
      create: {
        userId:       user.id,
        generationId,
        title:        title ?? null,
      },
    });

    revalidatePath("/app/history");
    revalidatePath(`/app/workbench/${generationId}`);

    return { success: true, savedImageId: saved.id };
  } catch (err) {
    console.error("[saveGenerationAction]", err);
    return { success: false, error: "Failed to save image." };
  }
}

// ─── Unsave / remove from gallery ─────────────────────────────────────────────
export async function unsaveGenerationAction(
  generationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    await prisma.savedImage.deleteMany({
      where: { generationId, userId: user.id },
    });

    revalidatePath("/app/history");
    revalidatePath(`/app/workbench/${generationId}`);

    return { success: true };
  } catch (err) {
    console.error("[unsaveGenerationAction]", err);
    return { success: false, error: "Failed to unsave image." };
  }
}

// ─── Toggle favorite ───────────────────────────────────────────────────────────
export async function toggleFavoriteAction(
  generationId: string
): Promise<{ success: boolean; isFavorite?: boolean; error?: string }> {
  try {
    const user = await requireUser();

    const saved = await prisma.savedImage.findFirst({
      where: { generationId, userId: user.id },
    });

    if (!saved) {
      // Auto-save + favorite in one action
      await prisma.savedImage.create({
        data: {
          userId:       user.id,
          generationId,
          isFavorite:   true,
        },
      });

      revalidatePath("/app/history");
      return { success: true, isFavorite: true };
    }

    const updated = await prisma.savedImage.update({
      where: { id: saved.id },
      data:  { isFavorite: !saved.isFavorite },
    });

    revalidatePath("/app/history");
    revalidatePath(`/app/workbench/${generationId}`);

    return { success: true, isFavorite: updated.isFavorite };
  } catch (err) {
    console.error("[toggleFavoriteAction]", err);
    return { success: false, error: "Failed to update favorite." };
  }
}

// ─── Update tags ───────────────────────────────────────────────────────────────
const TagsSchema = z.object({
  generationId: z.string(),
  tags:         z.array(z.string().max(32)).max(10),
});

export async function updateTagsAction(
  generationId: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    const parsed = TagsSchema.safeParse({ generationId, tags });
    if (!parsed.success) {
      return { success: false, error: "Invalid tags." };
    }

    // Sanitize tags — lowercase, trim, remove empty
    const cleanTags = tags
      .map((t) => t.toLowerCase().trim())
      .filter((t) => t.length > 0)
      .slice(0, 10);

    // Upsert saved image with new tags
    await prisma.savedImage.upsert({
      where:  { generationId },
      update: { tags: cleanTags },
      create: {
        userId:       user.id,
        generationId,
        tags:         cleanTags,
      },
    });

    revalidatePath("/app/history");
    revalidatePath(`/app/workbench/${generationId}`);

    return { success: true };
  } catch (err) {
    console.error("[updateTagsAction]", err);
    return { success: false, error: "Failed to update tags." };
  }
}

// ─── Update title ──────────────────────────────────────────────────────────────
export async function updateTitleAction(
  generationId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    const cleanTitle = title.trim().slice(0, 100);

    await prisma.savedImage.upsert({
      where:  { generationId },
      update: { title: cleanTitle || null },
      create: {
        userId:       user.id,
        generationId,
        title:        cleanTitle || null,
      },
    });

    revalidatePath("/app/history");
    revalidatePath(`/app/workbench/${generationId}`);

    return { success: true };
  } catch (err) {
    console.error("[updateTitleAction]", err);
    return { success: false, error: "Failed to update title." };
  }
}

// ─── Delete a generation entirely ─────────────────────────────────────────────
export async function deleteGenerationAction(
  generationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    // Verify ownership
    const generation = await prisma.generation.findFirst({
      where: { id: generationId, userId: user.id },
    });

    if (!generation) {
      return { success: false, error: "Generation not found." };
    }

    // Cascade deletes SavedImage too (via Prisma relation onDelete: Cascade)
    await prisma.generation.delete({
      where: { id: generationId },
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/history");

    return { success: true };
  } catch (err) {
    console.error("[deleteGenerationAction]", err);
    return { success: false, error: "Failed to delete generation." };
  }
}

// ─── Bulk delete ───────────────────────────────────────────────────────────────
export async function bulkDeleteGenerationsAction(
  generationIds: string[]
): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    const user = await requireUser();

    if (generationIds.length === 0) return { success: true, deleted: 0 };
    if (generationIds.length > 50)  return { success: false, deleted: 0, error: "Cannot delete more than 50 at once." };

    const result = await prisma.generation.deleteMany({
      where: {
        id:     { in: generationIds },
        userId: user.id,           // security: only delete own images
      },
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/history");

    return { success: true, deleted: result.count };
  } catch (err) {
    console.error("[bulkDeleteGenerationsAction]", err);
    return { success: false, deleted: 0, error: "Failed to delete generations." };
  }
}

// ─── Get generation by ID (for workbench) ─────────────────────────────────────
export async function getGenerationAction(generationId: string) {
  try {
    const user = await requireUser();

    const generation = await prisma.generation.findFirst({
      where: { id: generationId, userId: user.id },
      include: {
        savedImage: {
          select: { id: true, title: true, tags: true, isFavorite: true },
        },
      },
    });

    if (!generation) return { success: false, error: "Generation not found." };

    return { success: true, generation };
  } catch (err) {
    console.error("[getGenerationAction]", err);
    return { success: false, error: "Failed to fetch generation." };
  }
}

// ─── Get paginated history ─────────────────────────────────────────────────────
export async function getHistoryAction(page = 1, perPage = 24, filter?: {
  stylePreset?: string;
  quality?: string;
  favoritesOnly?: boolean;
}) {
  try {
    const user = await requireUser();
    const skip = (page - 1) * perPage;

    const where: any = { userId: user.id };

    if (filter?.stylePreset) where.stylePreset = filter.stylePreset;
    if (filter?.quality)     where.quality     = filter.quality;
    if (filter?.favoritesOnly) {
      where.savedImage = { isFavorite: true };
    }

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        orderBy:  { createdAt: "desc" },
        skip,
        take:     perPage,
        include: {
          savedImage: {
            select: { id: true, title: true, tags: true, isFavorite: true },
          },
        },
      }),
      prisma.generation.count({ where }),
    ]);

    return {
      success:     true,
      generations,
      total,
      page,
      perPage,
      totalPages:  Math.ceil(total / perPage),
      hasMore:     skip + perPage < total,
    };
  } catch (err) {
    console.error("[getHistoryAction]", err);
    return { success: false, error: "Failed to fetch history.", generations: [], total: 0 };
  }
}
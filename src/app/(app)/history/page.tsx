import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { HistoryClient } from "@/components/history/HistoryClient";

export default async function HistoryPage() {
  const user = await requireUser();

  const [generations, total] = await Promise.all([
    prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 24,
      include: {
        savedImage: {
          select: { id: true, title: true, tags: true, isFavorite: true },
        },
      },
    }),
    prisma.generation.count({ where: { userId: user.id } }),
  ]);

  return <HistoryClient initialGenerations={generations} total={total} />;
}

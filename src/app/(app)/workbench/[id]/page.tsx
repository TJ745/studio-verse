import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { WorkbenchClient } from "@/components/workbench/WorkbenchClient";

export default async function WorkbenchPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();

  const generation = await prisma.generation.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      savedImage: {
        select: { id: true, title: true, tags: true, isFavorite: true },
      },
    },
  });

  if (!generation) notFound();

  return <WorkbenchClient generation={generation} />;
}

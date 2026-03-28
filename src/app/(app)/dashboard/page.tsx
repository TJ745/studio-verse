// src/app/(app)/dashboard/page.tsx
// Main dashboard — embeds the Generator UI

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Generator } from "@/components/generator/Generator";

export default async function DashboardPage() {
  const user = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true, plan: true },
  });

  return (
    <Generator
      userCredits={dbUser?.credits ?? 10}
      userPlan={dbUser?.plan ?? "FREE"}
    />
  );
}

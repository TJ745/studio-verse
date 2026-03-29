import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { BillingClient } from "@/components/billing/BillingClient";

export default async function BillingPage() {
  const user = await requireUser();

  const [dbUser, subscription, creditLogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true, plan: true, creditsResetAt: true },
    }),
    prisma.subscription.findUnique({ where: { userId: user.id } }),
    prisma.creditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const nextReset =
    dbUser?.plan === "FREE" && dbUser.creditsResetAt
      ? new Date(dbUser.creditsResetAt.getTime() + 24 * 60 * 60 * 1000)
      : null;

  return (
    <BillingClient
      plan={dbUser?.plan ?? "FREE"}
      credits={dbUser?.credits ?? 0}
      nextReset={nextReset?.toISOString() ?? null}
      subscription={subscription}
      creditLogs={creditLogs}
    />
  );
}

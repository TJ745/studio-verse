// src/app/(app)/layout.tsx
// App shell layout — wraps all /app/* routes with sidebar + topbar

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Fetch credit info server-side
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true, plan: true, name: true, email: true, image: true },
  });

  return (
    <div className="app-shell">
      <Sidebar user={dbUser} />
      <div className="app-main">
        <Topbar user={dbUser} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

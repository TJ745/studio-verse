// src/lib/session.ts
// Server-side session helpers for Server Components and Server Actions

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get the current session in a Server Component.
 * Returns null if not authenticated.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Get the current session and redirect to /login if not authenticated.
 * Use in protected Server Components.
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Get just the user from the session.
 * Redirects if not authenticated.
 */
export async function requireUser() {
  const session = await requireAuth();
  return session.user;
}
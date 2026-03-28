// src/lib/auth-client.ts
// BetterAuth client — use this in "use client" components

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  forgetPassword,
  resetPassword,
  verifyEmail,
  sendVerificationEmail,
} = authClient;
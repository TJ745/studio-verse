// src/app/api/auth/[...all]/route.ts
// BetterAuth catch-all route — handles all auth endpoints automatically

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
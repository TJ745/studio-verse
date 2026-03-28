// src/lib/auth.ts
// BetterAuth configuration for Lumina Studio

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Email & Password auth
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },

  // Email verification via Nodemailer
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Lumina Studio account",
        html: verifyEmailTemplate(user.name, url),
      });
    },
  },

  // Password reset
  // BetterAuth handles this automatically with the sendResetPassword hook
  // @ts-expect-error - sendResetPassword is supported in BetterAuth
  sendResetPassword: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
    await sendEmail({
      to: user.email,
      subject: "Reset your Lumina Studio password",
      html: resetPasswordTemplate(user.name, url),
    });
  },

  // Session config
  session: {
    expiresIn: 60 * 60 * 24 * 7,        // 7 days
    updateAge: 60 * 60 * 24,             // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                    // 5 min client-side cache
    },
  },

  // User fields — BetterAuth syncs these to the User table
  user: {
    additionalFields: {
      plan: {
        type: "string",
        defaultValue: "FREE",
      },
      credits: {
        type: "number",
        defaultValue: 10,
      },
    },
  },

  plugins: [nextCookies()],

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;

// ============================================================
// Nodemailer email sender
// ============================================================

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: `"Lumina Studio" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html,
  });
}

// ============================================================
// Email Templates
// ============================================================

function verifyEmailTemplate(name: string, url: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Welcome to Lumina Studio, ${name}!</h2>
      <p>Please verify your email to start generating images.</p>
      <a href="${url}" style="
        display: inline-block;
        background: #7c3aed;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
      ">Verify Email</a>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">
        This link expires in 24 hours. If you didn't sign up, ignore this email.
      </p>
    </div>
  `;
}

function resetPasswordTemplate(name: string, url: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your password, ${name}</h2>
      <p>Click below to set a new password for your Lumina Studio account.</p>
      <a href="${url}" style="
        display: inline-block;
        background: #7c3aed;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
      ">Reset Password</a>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">
        This link expires in 1 hour. If you didn't request this, ignore this email.
      </p>
    </div>
  `;
}
"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    const result = await signIn.email({
      email,
      password,
      callbackURL: callbackUrl,
    });

    if (result.error) {
      setError(
        result.error.message === "Invalid credentials"
          ? "Incorrect email or password. Please try again."
          : (result.error.message ?? "Something went wrong. Please try again."),
      );
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <>
      <style>{`
        /* ── Form shell ─────────────────────────── */
        .auth-heading {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .auth-heading em { font-style: italic; color: var(--gold); }

        .auth-sub {
          font-size: 14px;
          color: var(--muted);
          font-weight: 300;
          margin-bottom: 36px;
          line-height: 1.6;
        }

        /* ── Fields ─────────────────────────────── */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 18px;
        }

        .field-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .field-wrap {
          position: relative;
        }

        .auth-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 10px;
          background: var(--panel);
          border: 1px solid var(--border2);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .auth-input:focus {
          border-color: var(--gold-dim);
          box-shadow: 0 0 0 3px rgba(200,169,110,0.08);
        }
        .auth-input::placeholder { color: var(--muted); }
        .auth-input.has-toggle { padding-right: 44px; }

        .pass-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 13px;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
          line-height: 1;
        }
        .pass-toggle:hover { color: var(--text2); }

        /* ── Forgot password ─────────────────────── */
        .forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -10px;
          margin-bottom: 24px;
        }

        .forgot-link {
          font-size: 12px;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
          font-weight: 400;
        }
        .forgot-link:hover { color: var(--gold); }

        /* ── Submit button ───────────────────────── */
        .auth-btn {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: none;
          background: var(--gold);
          color: var(--void);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 0 32px rgba(200,169,110,0.15);
          margin-bottom: 24px;
        }
        .auth-btn:hover:not(:disabled) {
          background: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 0 48px rgba(200,169,110,0.25);
        }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .auth-spinner {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.15);
          border-top-color: var(--void);
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Error ───────────────────────────────── */
        .auth-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px 14px;
          border-radius: 10px;
          background: rgba(200,110,110,0.07);
          border: 1px solid rgba(200,110,110,0.2);
          color: var(--danger);
          font-size: 13px;
          font-weight: 300;
          line-height: 1.5;
          margin-bottom: 20px;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }

        /* ── Divider ─────────────────────────────── */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          color: var(--muted);
          font-size: 12px;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border2);
        }

        /* ── Switch link ─────────────────────────── */
        .auth-switch {
          text-align: center;
          font-size: 14px;
          color: var(--muted);
          font-weight: 300;
        }

        .auth-switch a {
          color: var(--gold);
          text-decoration: none;
          font-weight: 400;
          transition: opacity 0.2s;
        }
        .auth-switch a:hover { opacity: 0.75; }

        /* ── Terms ───────────────────────────────── */
        .auth-terms {
          text-align: center;
          font-size: 11px;
          color: var(--muted);
          font-weight: 300;
          margin-top: 28px;
          line-height: 1.6;
        }
        .auth-terms a { color: var(--muted); text-decoration: underline; }
        .auth-terms a:hover { color: var(--text2); }
      `}</style>

      {/* Heading */}
      <div className="auth-heading">
        Welcome <em>back</em>
      </div>
      <p className="auth-sub">Sign in to your Lumina Studio account.</p>

      {/* Error */}
      {error && (
        <div className="auth-error">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="field-group">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <div className="field-wrap">
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Password */}
        <div className="field-group">
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <div className="field-wrap">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              className="auth-input has-toggle"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
            <button
              type="button"
              className="pass-toggle"
              onClick={() => setShowPass(!showPass)}
              tabIndex={-1}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="forgot-row">
          <Link href="/forgot-password" className="forgot-link">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="auth-btn"
          disabled={loading || !email || !password}
        >
          {loading ? (
            <>
              <div className="auth-spinner" />
              Signing in…
            </>
          ) : (
            <>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 16,
                }}
              >
                ✦
              </span>
              Sign in
            </>
          )}
        </button>
      </form>

      <div className="auth-divider">or</div>

      {/* Switch to register */}
      <div className="auth-switch">
        Don&apos;t have an account?{" "}
        <Link href="/register">Create one free →</Link>
      </div>

      <p className="auth-terms">
        By signing in you agree to our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </>
  );
}

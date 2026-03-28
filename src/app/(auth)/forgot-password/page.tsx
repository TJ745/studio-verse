"use client";

import { useState } from "react";
import { forgetPassword } from "@/lib/auth-client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    const result = await forgetPassword({
      email,
      redirectTo: "/reset-password",
    });

    if (result.error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    } else {
      setSent(true);
    }
  };

  return (
    <>
      <style>{`
        .auth-heading {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 6px;
        }
        .auth-heading em { font-style: italic; color: var(--gold); }
        .auth-sub { font-size: 14px; color: var(--muted); font-weight: 300; margin-bottom: 32px; line-height: 1.6; }
        .field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
        .field-label { font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
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
        }
        .auth-input:focus { border-color: var(--gold-dim); box-shadow: 0 0 0 3px rgba(200,169,110,0.08); }
        .auth-input::placeholder { color: var(--muted); }
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
          transition: background 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .auth-btn:hover:not(:disabled) { background: var(--accent); transform: translateY(-1px); }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-spinner { width:16px;height:16px;border-radius:50%;border:2px solid rgba(0,0,0,0.15);border-top-color:var(--void);animation:spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-error { display:flex;gap:10px;padding:13px 14px;border-radius:10px;background:rgba(200,110,110,0.07);border:1px solid rgba(200,110,110,0.2);color:var(--danger);font-size:13px;font-weight:300;margin-bottom:18px; }
        .auth-switch { text-align:center;font-size:14px;color:var(--muted);font-weight:300; }
        .auth-switch a { color:var(--gold);text-decoration:none;font-weight:400; }
        .sent-wrap { text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;animation:slide-up 0.4s ease both; }
        @keyframes slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .sent-icon { width:60px;height:60px;border-radius:50%;background:rgba(200,169,110,0.1);border:1px solid rgba(200,169,110,0.3);display:flex;align-items:center;justify-content:center;font-size:26px;animation:pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes pop { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
        .sent-title { font-family:'Playfair Display',serif;font-size:24px;font-weight:600;color:var(--text); }
        .sent-sub { font-size:14px;color:var(--muted);font-weight:300;line-height:1.7;max-width:300px; }
        .sent-sub strong { color:var(--text2);font-weight:400; }
      `}</style>

      {sent ? (
        <div className="sent-wrap">
          <div className="sent-icon">✉</div>
          <div className="sent-title">Check your inbox</div>
          <p className="sent-sub">
            We sent a password reset link to <strong>{email}</strong>. It
            expires in 1 hour.
          </p>
          <Link
            href="/login"
            style={{
              fontSize: 14,
              color: "var(--gold)",
              textDecoration: "none",
              marginTop: 8,
            }}
          >
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="auth-heading">
            Reset your <em>password</em>
          </div>
          <p className="auth-sub">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {error && (
            <div className="auth-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="auth-btn"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <div className="auth-spinner" />
                  Sending…
                </>
              ) : (
                <>✦ Send reset link</>
              )}
            </button>
          </form>

          <div className="auth-switch">
            <Link href="/login">← Back to sign in</Link>
          </div>
        </>
      )}
    </>
  );
}

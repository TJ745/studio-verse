"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/auth-client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordMismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Invalid or expired reset link. Please request a new one.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await resetPassword({ newPassword: password, token });

    if (result.error) {
      setError("This reset link may have expired. Please request a new one.");
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    }
  };

  return (
    <>
      <style>{`
        .auth-heading { font-family:'Playfair Display',serif;font-size:28px;font-weight:600;color:var(--text);margin-bottom:6px; }
        .auth-heading em { font-style:italic;color:var(--gold); }
        .auth-sub { font-size:14px;color:var(--muted);font-weight:300;margin-bottom:32px;line-height:1.6; }
        .field-group { display:flex;flex-direction:column;gap:6px;margin-bottom:16px; }
        .field-label { font-size:11px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted); }
        .field-wrap { position:relative; }
        .auth-input { width:100%;padding:13px 16px;border-radius:10px;background:var(--panel);border:1px solid var(--border2);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:300;outline:none;transition:border-color 0.2s,box-shadow 0.2s;appearance:none; }
        .auth-input:focus { border-color:var(--gold-dim);box-shadow:0 0 0 3px rgba(200,169,110,0.08); }
        .auth-input.valid { border-color:rgba(110,200,138,0.4); }
        .auth-input.invalid { border-color:rgba(200,110,110,0.4); }
        .auth-input::placeholder { color:var(--muted); }
        .auth-input.has-toggle { padding-right:44px; }
        .pass-toggle { position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;padding:4px;border-radius:4px;transition:color 0.2s;font-family:'DM Sans',sans-serif;line-height:1; }
        .pass-toggle:hover { color:var(--text2); }
        .auth-btn { width:100%;padding:14px;border-radius:10px;border:none;background:var(--gold);color:var(--void);font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:background 0.2s,transform 0.15s;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;margin-bottom:20px; }
        .auth-btn:hover:not(:disabled) { background:var(--accent);transform:translateY(-1px); }
        .auth-btn:disabled { opacity:0.5;cursor:not-allowed; }
        .auth-spinner { width:16px;height:16px;border-radius:50%;border:2px solid rgba(0,0,0,0.15);border-top-color:var(--void);animation:spin 0.7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .auth-error { display:flex;gap:10px;padding:13px 14px;border-radius:10px;background:rgba(200,110,110,0.07);border:1px solid rgba(200,110,110,0.2);color:var(--danger);font-size:13px;font-weight:300;margin-bottom:18px; }
        .done-wrap { text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;animation:slide-up 0.4s ease both; }
        @keyframes slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .done-icon { width:60px;height:60px;border-radius:50%;background:rgba(110,200,138,0.1);border:1px solid rgba(110,200,138,0.3);display:flex;align-items:center;justify-content:center;font-size:26px;animation:pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes pop { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
        .done-title { font-family:'Playfair Display',serif;font-size:24px;font-weight:600;color:var(--text); }
        .done-sub { font-size:14px;color:var(--muted);font-weight:300;line-height:1.7; }
      `}</style>

      {done ? (
        <div className="done-wrap">
          <div className="done-icon">✓</div>
          <div className="done-title">Password updated</div>
          <p className="done-sub">Redirecting you to sign in…</p>
        </div>
      ) : (
        <>
          <div className="auth-heading">
            Set new <em>password</em>
          </div>
          <p className="auth-sub">Choose a strong password for your account.</p>

          {!token && (
            <div className="auth-error">
              <span>⚠</span>
              <span>
                Invalid reset link.{" "}
                <Link href="/forgot-password" style={{ color: "var(--gold)" }}>
                  Request a new one →
                </Link>
              </span>
            </div>
          )}

          {error && (
            <div className="auth-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label" htmlFor="password">
                New Password
              </label>
              <div className="field-wrap">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className="auth-input has-toggle"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || !token}
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

            <div className="field-group">
              <label className="field-label" htmlFor="confirm">
                Confirm Password
              </label>
              <input
                id="confirm"
                type={showPass ? "text" : "password"}
                className={`auth-input ${passwordsMatch ? "valid" : passwordMismatch ? "invalid" : ""}`}
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={loading || !token}
              />
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={
                loading || !password || !confirm || passwordMismatch || !token
              }
            >
              {loading ? (
                <>
                  <div className="auth-spinner" />
                  Updating…
                </>
              ) : (
                <>✦ Update password</>
              )}
            </button>
          </form>
        </>
      )}
    </>
  );
}

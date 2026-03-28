"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Password strength
  const strength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very strong"][
    strength
  ];
  const strengthColor = [
    "",
    "#c86e6e",
    "#c8a96e",
    "#c8c86e",
    "#8fba8a",
    "#6ec88a",
  ][strength];

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordMismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) return;

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

    const result = await signUp.email({
      name,
      email,
      password,
      callbackURL: "/app/dashboard",
    });

    if (result.error) {
      setError(
        result.error.message?.includes("already exists") ||
          result.error.message?.includes("in use")
          ? "An account with this email already exists. Try signing in instead."
          : (result.error.message ?? "Registration failed. Please try again."),
      );
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <>
        <style>{`
          .success-wrap {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            animation: slide-up 0.5s ease both;
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .success-icon {
            width: 64px; height: 64px;
            border-radius: 50%;
            background: rgba(110,200,138,0.1);
            border: 1px solid rgba(110,200,138,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
          }
          @keyframes pop {
            from { transform: scale(0.5); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }
          .success-title {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            font-weight: 600;
            color: var(--text);
          }
          .success-sub {
            font-size: 14px;
            color: var(--muted);
            font-weight: 300;
            line-height: 1.7;
            max-width: 300px;
          }
          .success-sub strong { color: var(--text2); font-weight: 400; }
          .success-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 13px 28px;
            border-radius: 10px;
            background: var(--gold);
            color: var(--void);
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            transition: background 0.2s;
            margin-top: 8px;
          }
          .success-btn:hover { background: var(--accent); }
        `}</style>

        <div className="success-wrap">
          <div className="success-icon">✉</div>
          <div className="success-title">Check your inbox</div>
          <p className="success-sub">
            We sent a verification link to <strong>{email}</strong>. Click it to
            activate your account and start generating.
          </p>
          <Link href="/login" className="success-btn">
            ✦ Go to sign in
          </Link>
          <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 300 }}>
            Didn't get it? Check your spam folder.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
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
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }

        .field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .field-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .field-hint {
          font-size: 11px;
          color: var(--muted);
          font-weight: 300;
          transition: color 0.2s;
        }
        .field-hint.match   { color: var(--success); }
        .field-hint.mismatch { color: var(--danger); }

        .field-wrap { position: relative; }

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
        .auth-input.valid   { border-color: rgba(110,200,138,0.4); }
        .auth-input.invalid { border-color: rgba(200,110,110,0.4); }
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

        /* Strength meter */
        .strength-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .strength-bars {
          display: flex;
          gap: 3px;
          flex: 1;
        }

        .strength-bar {
          height: 3px;
          flex: 1;
          border-radius: 2px;
          background: var(--border2);
          transition: background 0.3s;
        }

        .strength-text {
          font-size: 11px;
          font-weight: 500;
          min-width: 60px;
          text-align: right;
          transition: color 0.3s;
        }

        /* Free badge */
        .free-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(200,169,110,0.05);
          border: 1px solid rgba(200,169,110,0.15);
          margin-bottom: 20px;
        }

        .free-badge-icon {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: var(--gold);
        }

        .free-badge-text {
          font-size: 13px;
          color: var(--text2);
          font-weight: 300;
          line-height: 1.4;
        }

        .free-badge-text strong {
          color: var(--gold);
          font-weight: 500;
        }

        /* Submit */
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
          margin-bottom: 20px;
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

        /* Error */
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
          margin-bottom: 18px;
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }

        /* Switch */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          color: var(--muted);
          font-size: 12px;
        }
        .auth-divider::before, .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border2);
        }

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
        }
        .auth-switch a:hover { opacity: 0.75; }

        .auth-terms {
          text-align: center;
          font-size: 11px;
          color: var(--muted);
          font-weight: 300;
          margin-top: 24px;
          line-height: 1.7;
        }
        .auth-terms a { color: var(--muted); text-decoration: underline; }
        .auth-terms a:hover { color: var(--text2); }
      `}</style>

      <div className="auth-heading">
        Create your <em>studio</em>
      </div>
      <p className="auth-sub">
        Free account. 10 credits every day. No card needed.
      </p>

      {/* Free tier badge */}
      <div className="free-badge-row">
        <span className="free-badge-icon">✦</span>
        <div className="free-badge-text">
          Start with <strong>10 free credits daily</strong> — enough to generate
          10 standard images every day.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="auth-error">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="field-group">
          <label className="field-label" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            className="auth-input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            disabled={loading}
          />
        </div>

        {/* Email */}
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
            autoComplete="email"
            required
            disabled={loading}
          />
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
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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

          {/* Strength meter */}
          {password.length > 0 && (
            <div className="strength-row">
              <div className="strength-bars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="strength-bar"
                    style={{
                      background: i <= strength ? strengthColor : undefined,
                    }}
                  />
                ))}
              </div>
              <span className="strength-text" style={{ color: strengthColor }}>
                {strengthLabel}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="field-group">
          <div className="field-row">
            <label className="field-label" htmlFor="confirm">
              Confirm Password
            </label>
            {confirm.length > 0 && (
              <span
                className={`field-hint ${passwordsMatch ? "match" : "mismatch"}`}
              >
                {passwordsMatch ? "✓ Matches" : "✗ Mismatch"}
              </span>
            )}
          </div>
          <input
            id="confirm"
            type={showPass ? "text" : "password"}
            className={`auth-input ${passwordsMatch ? "valid" : passwordMismatch ? "invalid" : ""}`}
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="auth-btn"
          disabled={
            loading ||
            !name ||
            !email ||
            !password ||
            !confirm ||
            passwordMismatch
          }
          style={{ marginTop: 8 }}
        >
          {loading ? (
            <>
              <div className="auth-spinner" />
              Creating account…
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
              Create free account
            </>
          )}
        </button>
      </form>

      <div className="auth-divider">already have an account?</div>

      <div className="auth-switch">
        <Link href="/login">Sign in instead →</Link>
      </div>

      <p className="auth-terms">
        By creating an account you agree to our{" "}
        <a href="/terms">Terms of Service</a> and{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </>
  );
}

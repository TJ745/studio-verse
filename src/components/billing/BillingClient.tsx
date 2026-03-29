"use client";

import { useState, useTransition } from "react";
// import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  createProCheckoutAction,
  createPaygCheckoutAction,
  openBillingPortalAction,
  cancelSubscriptionAction,
} from "@/actions/billing";

// ─── Types ────────────────────────────────────────────────────────────────────
type CreditLog = {
  id: string;
  amount: number;
  reason: string;
  note: string | null;
  createdAt: Date | string;
};

type Subscription = {
  plan: string;
  status: string;
  renewsAt: Date | string | null;
  canceledAt: Date | string | null;
} | null;

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  DAILY_RESET: { label: "Daily reset", color: "var(--success)" },
  PURCHASE: { label: "Purchase", color: "var(--success)" },
  GENERATION_STANDARD: { label: "Standard gen", color: "var(--danger)" },
  GENERATION_HD: { label: "HD gen", color: "var(--danger)" },
  REFUND: { label: "Refund", color: "var(--success)" },
  BONUS: { label: "Bonus", color: "var(--success)" },
  SUBSCRIPTION_PRO: { label: "Pro subscription", color: "var(--success)" },
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hoursUntil(isoStr: string | null): number {
  if (!isoStr) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(isoStr).getTime() - Date.now()) / (1000 * 60 * 60)),
  );
}

export function BillingClient({
  plan,
  credits,
  nextReset,
  subscription,
  creditLogs,
}: {
  plan: string;
  credits: number;
  nextReset: string | null;
  subscription: Subscription;
  creditLogs: CreditLog[];
}) {
  const searchParams = useSearchParams();
  const [isPending, startT] = useTransition();
  const [activeAction, setAA] = useState<string | null>(null);
  const [cancelDone, setCD] = useState(false);
  const [showCancel, setSC] = useState(false);

  const successParam = searchParams.get("success");
  const isPro = plan === "PRO";
  const isPayg = plan === "PAYG";
  const hoursLeft = hoursUntil(nextReset);
  const creditPct = isPro ? 100 : Math.min(100, (credits / 10) * 100);

  const run = (key: string, fn: () => Promise<any>) => {
    setAA(key);
    startT(async () => {
      await fn();
      setAA(null);
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .billing-wrap {
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* ── Success banner ─────────────────────── */
        .success-banner {
          padding: 16px 20px;
          border-radius: 12px;
          background: rgba(110,200,138,0.08);
          border: 1px solid rgba(110,200,138,0.25);
          color: var(--success);
          font-size: 14px;
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slide-down 0.3s ease;
        }
        @keyframes slide-down { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

        /* ── Current plan hero ──────────────────── */
        .plan-hero {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px 32px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 24px;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .plan-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 50% 80% at 100% 50%, rgba(200,169,110,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .plan-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .plan-badge.pro   { background: rgba(200,169,110,0.12); border: 1px solid rgba(200,169,110,0.3); color: var(--gold); }
        .plan-badge.free  { background: var(--panel2); border: 1px solid var(--border2); color: var(--muted); }
        .plan-badge.payg  { background: rgba(110,181,200,0.1); border: 1px solid rgba(110,181,200,0.3); color: #6eb5c8; }

        .plan-name {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 6px;
        }

        .plan-desc {
          font-size: 14px;
          color: var(--muted);
          font-weight: 300;
          line-height: 1.6;
        }

        /* Credit meter */
        .credit-meter {
          text-align: center;
          min-width: 140px;
        }

        .credit-ring-wrap {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 12px;
        }

        .credit-ring-svg { transform: rotate(-90deg); }

        .credit-ring-bg   { fill: none; stroke: var(--border2); stroke-width: 6; }
        .credit-ring-fill {
          fill: none;
          stroke: var(--gold);
          stroke-width: 6;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1);
        }

        .credit-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
        }

        .credit-ring-num {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--text);
          line-height: 1;
        }

        .credit-ring-label {
          font-size: 9px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .credit-reset-text {
          font-size: 11px;
          color: var(--muted);
          font-weight: 300;
        }

        /* ── Plan cards ─────────────────────────── */
        .plan-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 640px) { .plan-cards { grid-template-columns: 1fr; } }

        .plan-card {
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--panel);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          transition: border-color 0.2s, transform 0.2s;
        }
        .plan-card:hover { transform: translateY(-2px); }
        .plan-card.highlight {
          border-color: var(--gold);
          background: linear-gradient(135deg, var(--panel) 0%, #13110e 100%);
          box-shadow: 0 0 40px rgba(200,169,110,0.08);
        }
        .plan-card.current {
          border-color: rgba(110,200,138,0.3);
        }

        .plan-card-badge {
          position: absolute;
          top: -11px; left: 50%;
          transform: translateX(-50%);
          padding: 3px 14px;
          border-radius: 20px;
          background: var(--gold);
          color: var(--void);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .plan-card-current {
          position: absolute;
          top: -11px; left: 50%;
          transform: translateX(-50%);
          padding: 3px 14px;
          border-radius: 20px;
          background: rgba(110,200,138,0.15);
          border: 1px solid rgba(110,200,138,0.3);
          color: var(--success);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .plan-card-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
        }

        .plan-card-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .price-num {
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          font-weight: 600;
          color: var(--text);
          line-height: 1;
        }

        .price-sub { font-size: 13px; color: var(--muted); }

        .plan-card-credits {
          font-size: 12px;
          color: var(--gold);
          padding: 5px 10px;
          background: rgba(200,169,110,0.07);
          border: 1px solid rgba(200,169,110,0.15);
          border-radius: 6px;
          width: fit-content;
          font-weight: 500;
        }

        .plan-card-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .plan-card-features li {
          font-size: 13px;
          color: var(--muted);
          font-weight: 300;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .plan-card-features li::before {
          content: '✓';
          color: var(--gold);
          font-size: 11px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .plan-cta {
          display: block;
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          border: none;
        }
        .plan-cta.gold { background: var(--gold); color: var(--void); }
        .plan-cta.gold:hover:not(:disabled) { background: var(--accent); }
        .plan-cta.outline { border: 1px solid var(--border2); background: transparent; color: var(--muted); }
        .plan-cta.outline:hover:not(:disabled) { border-color: var(--gold-dim); color: var(--text2); }
        .plan-cta.current-plan { border: 1px solid rgba(110,200,138,0.3); background: rgba(110,200,138,0.07); color: var(--success); cursor: default; }
        .plan-cta:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Subscription management ────────────── */
        .sub-manage {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 22px 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .sub-manage-info { display: flex; flex-direction: column; gap: 4px; }

        .sub-manage-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 600;
          color: var(--text);
        }

        .sub-manage-sub {
          font-size: 13px;
          color: var(--muted);
          font-weight: 300;
        }

        .sub-status-chip {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .sub-status-chip.active { background: rgba(110,200,138,0.1); border: 1px solid rgba(110,200,138,0.25); color: var(--success); }
        .sub-status-chip.canceled { background: rgba(200,110,110,0.08); border: 1px solid rgba(200,110,110,0.2); color: var(--danger); }
        .sub-status-chip.past_due { background: rgba(200,169,110,0.1); border: 1px solid rgba(200,169,110,0.25); color: var(--gold); }

        .sub-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .btn-outline-sm {
          padding: 8px 16px;
          border-radius: 7px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-outline-sm:hover { border-color: var(--gold-dim); color: var(--text2); }
        .btn-outline-sm:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-danger-sm {
          padding: 8px 16px;
          border-radius: 7px;
          border: 1px solid rgba(200,110,110,0.3);
          background: rgba(200,110,110,0.06);
          color: var(--danger);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-danger-sm:hover { background: rgba(200,110,110,0.12); }

        /* ── Credit log ─────────────────────────── */
        .log-section {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
        }

        .log-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .log-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 600;
          color: var(--text);
        }

        .log-table { width: 100%; }

        .log-row {
          display: grid;
          grid-template-columns: 1fr 120px 100px 140px;
          align-items: center;
          padding: 12px 24px;
          border-bottom: 1px solid var(--border);
          transition: background 0.1s;
          gap: 12px;
        }
        .log-row:last-child { border-bottom: none; }
        .log-row:hover { background: var(--panel2); }

        .log-row-header {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          background: var(--panel2);
          padding: 10px 24px;
          border-bottom: 1px solid var(--border);
        }

        .log-reason {
          font-size: 13px;
          color: var(--text2);
          font-weight: 400;
        }

        .log-note {
          font-size: 11px;
          color: var(--muted);
          font-weight: 300;
          margin-top: 1px;
        }

        .log-amount {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 600;
          text-align: right;
        }

        .log-type {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
          letter-spacing: 0.04em;
          width: fit-content;
        }

        .log-date {
          font-size: 11px;
          color: var(--muted);
          font-weight: 300;
          text-align: right;
        }

        .log-empty {
          padding: 40px 24px;
          text-align: center;
          color: var(--muted);
          font-size: 14px;
          font-weight: 300;
          font-style: italic;
        }

        /* ── Cancel confirm modal ───────────────── */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: fade-in 0.15s ease;
        }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }

        .modal-card {
          background: var(--panel);
          border: 1px solid var(--border2);
          border-radius: 16px;
          padding: 32px;
          max-width: 380px; width: 100%;
          animation: modal-up 0.2s ease;
        }
        @keyframes modal-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .modal-title { font-family:'Playfair Display',serif;font-size:20px;font-weight:600;color:var(--text);margin-bottom:10px; }
        .modal-sub   { font-size:14px;color:var(--muted);font-weight:300;line-height:1.6;margin-bottom:24px; }
        .modal-actions { display:flex;gap:10px; }
        .modal-btn { flex:1;padding:11px;border-radius:8px;border:1px solid var(--border2);background:transparent;color:var(--text2);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all 0.15s; }
        .modal-btn:hover { background:var(--panel2); }
        .modal-btn.danger { background:rgba(200,110,110,0.1);border-color:rgba(200,110,110,0.3);color:var(--danger);font-weight:500; }
        .modal-btn.danger:hover { background:rgba(200,110,110,0.2); }

        .spinner { width:14px;height:14px;border-radius:50%;border:2px solid rgba(0,0,0,0.15);border-top-color:var(--void);animation:spin 0.7s linear infinite;display:inline-block; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className="billing-wrap">
        {/* ── Success banner ──────────────────────── */}
        {successParam === "pro" && (
          <div className="success-banner">
            ✦ Welcome to Pro! Unlimited generations are now active.
          </div>
        )}
        {successParam === "payg" && (
          <div className="success-banner">
            ✦ 50 credits added to your account. Happy generating!
          </div>
        )}

        {/* ── Current plan hero ────────────────────── */}
        <div className="plan-hero">
          <div>
            <div
              className={`plan-badge ${isPro ? "pro" : isPayg ? "payg" : "free"}`}
            >
              {isPro
                ? "✦ Pro Plan"
                : isPayg
                  ? "◈ Pay-as-you-go"
                  : "◇ Free Plan"}
            </div>
            <div className="plan-name">
              {isPro
                ? "Unlimited generations"
                : isPayg
                  ? `${credits} credits remaining`
                  : `${credits} / 10 daily credits`}
            </div>
            <p className="plan-desc">
              {isPro
                ? "You have full access to all features including HD quality and priority generation."
                : isPayg
                  ? "Your credits never expire. Top up anytime for more."
                  : `Credits reset every 24 hours. ${hoursLeft > 0 ? `Next reset in ${hoursLeft}h.` : "Resetting soon."}`}
            </p>
          </div>

          {/* Credit ring */}
          <div className="credit-meter">
            <div className="credit-ring-wrap">
              <svg
                className="credit-ring-svg"
                width="100"
                height="100"
                viewBox="0 0 100 100"
              >
                <circle className="credit-ring-bg" cx="50" cy="50" r="40" />
                <circle
                  className="credit-ring-fill"
                  cx="50"
                  cy="50"
                  r="40"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - creditPct / 100)}`}
                />
              </svg>
              <div className="credit-ring-center">
                <span className="credit-ring-num">{isPro ? "∞" : credits}</span>
                <span className="credit-ring-label">credits</span>
              </div>
            </div>
            <div className="credit-reset-text">
              {isPro ? "Unlimited" : nextReset ? `Resets in ${hoursLeft}h` : ""}
            </div>
          </div>
        </div>

        {/* ── Plan cards ────────────────────────── */}
        <div className="plan-cards">
          {/* Free */}
          <div className={`plan-card ${!isPro && !isPayg ? "current" : ""}`}>
            {!isPro && !isPayg && (
              <div className="plan-card-current">Current Plan</div>
            )}
            <div className="plan-card-name">Free</div>
            <div className="plan-card-price">
              <span className="price-num">$0</span>
              <span className="price-sub">/ forever</span>
            </div>
            <div className="plan-card-credits">10 credits / day</div>
            <ul className="plan-card-features">
              <li>Standard quality</li>
              <li>All 12 style presets</li>
              <li>Generation history</li>
              <li>GPT-4o prompt enhancer</li>
            </ul>
            <button className="plan-cta current-plan" disabled>
              Free forever
            </button>
          </div>

          {/* Pro */}
          <div className={`plan-card highlight ${isPro ? "current" : ""}`}>
            {isPro ? (
              <div className="plan-card-current">Current Plan</div>
            ) : (
              <div className="plan-card-badge">Most Popular</div>
            )}
            <div className="plan-card-name">Pro</div>
            <div className="plan-card-price">
              <span className="price-num">$12</span>
              <span className="price-sub">/ month</span>
            </div>
            <div className="plan-card-credits">Unlimited generations</div>
            <ul className="plan-card-features">
              <li>HD quality unlocked</li>
              <li>Priority generation queue</li>
              <li>Style DNA profiles</li>
              <li>Full Workbench access</li>
              <li>Early access to new features</li>
            </ul>
            {isPro ? (
              <button className="plan-cta current-plan" disabled>
                Active
              </button>
            ) : (
              <button
                className="plan-cta gold"
                onClick={() => run("pro", createProCheckoutAction)}
                disabled={isPending}
              >
                {activeAction === "pro" ? (
                  <>
                    <span className="spinner" /> Processing…
                  </>
                ) : (
                  "✦ Upgrade to Pro"
                )}
              </button>
            )}
          </div>

          {/* PAYG */}
          <div className={`plan-card ${isPayg ? "current" : ""}`}>
            {isPayg && <div className="plan-card-current">Current Plan</div>}
            <div className="plan-card-name">Pay-as-you-go</div>
            <div className="plan-card-price">
              <span className="price-num">$5</span>
              <span className="price-sub">one-time</span>
            </div>
            <div className="plan-card-credits">50 credits — never expire</div>
            <ul className="plan-card-features">
              <li>HD quality unlocked</li>
              <li>Credits never expire</li>
              <li>All style presets</li>
              <li>Workbench access</li>
            </ul>
            <button
              className="plan-cta outline"
              onClick={() => run("payg", createPaygCheckoutAction)}
              disabled={isPending}
            >
              {activeAction === "payg" ? (
                <>
                  <span className="spinner" /> Processing…
                </>
              ) : (
                "Buy 50 credits"
              )}
            </button>
          </div>
        </div>

        {/* ── Subscription management (Pro only) ──── */}
        {isPro && subscription && (
          <div className="sub-manage">
            <div className="sub-manage-info">
              <div className="sub-manage-title">Subscription Management</div>
              <div className="sub-manage-sub">
                {subscription.renewsAt
                  ? `Renews ${formatDate(subscription.renewsAt)}`
                  : subscription.canceledAt
                    ? `Cancels ${formatDate(subscription.canceledAt)}`
                    : "Active subscription"}
                {" · "}
                <span
                  className={`sub-status-chip ${subscription.status.toLowerCase()}`}
                >
                  {subscription.status === "ACTIVE"
                    ? "● Active"
                    : subscription.status === "CANCELED"
                      ? "● Canceling"
                      : "● Past due"}
                </span>
              </div>
            </div>
            <div className="sub-actions">
              <button
                className="btn-outline-sm"
                onClick={() => run("portal", openBillingPortalAction)}
                disabled={isPending}
              >
                {activeAction === "portal" ? "Opening…" : "Manage billing"}
              </button>
              {!subscription.canceledAt && (
                <button className="btn-danger-sm" onClick={() => setSC(true)}>
                  Cancel plan
                </button>
              )}
              {cancelDone && (
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--success)",
                    alignSelf: "center",
                  }}
                >
                  ✓ Will cancel at period end
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Credit log ────────────────────────── */}
        <div className="log-section">
          <div className="log-header">
            <span className="log-title">Credit History</span>
            <span
              style={{ fontSize: 12, color: "var(--muted)", fontWeight: 300 }}
            >
              Last 15 transactions
            </span>
          </div>

          {creditLogs.length === 0 ? (
            <div className="log-empty">No credit activity yet</div>
          ) : (
            <div className="log-table">
              <div className="log-row log-row-header">
                <span>Transaction</span>
                <span style={{ textAlign: "right" }}>Amount</span>
                <span>Type</span>
                <span style={{ textAlign: "right" }}>Date</span>
              </div>
              {creditLogs.map((log) => {
                const info = REASON_LABELS[log.reason] ?? {
                  label: log.reason,
                  color: "var(--muted)",
                };
                const isAdd = log.amount > 0;
                return (
                  <div key={log.id} className="log-row">
                    <div>
                      <div className="log-reason">{info.label}</div>
                      {log.note && <div className="log-note">{log.note}</div>}
                    </div>
                    <div
                      className="log-amount"
                      style={{
                        color: isAdd ? "var(--success)" : "var(--danger)",
                      }}
                    >
                      {isAdd ? "+" : ""}
                      {log.amount}
                    </div>
                    <div>
                      <span
                        className="log-type"
                        style={{
                          background: `${info.color}15`,
                          border: `1px solid ${info.color}30`,
                          color: info.color,
                        }}
                      >
                        {isAdd ? "credit" : "debit"}
                      </span>
                    </div>
                    <div className="log-date">{formatDate(log.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Cancel confirm modal ─────────────────── */}
      {showCancel && (
        <div className="modal-backdrop" onClick={() => setSC(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Cancel Pro subscription?</div>
            <p className="modal-sub">
              You&apos;ll keep Pro access until the end of your current billing
              period. After that, your account reverts to Free with 10 daily
              credits.
            </p>
            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setSC(false)}>
                Keep Pro
              </button>
              <button
                className="modal-btn danger"
                onClick={async () => {
                  await cancelSubscriptionAction();
                  setCD(true);
                  setSC(false);
                }}
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

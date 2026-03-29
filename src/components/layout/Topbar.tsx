"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Page title map ────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Generate", sub: "Create images with DALL·E 3" },
  "/history": { title: "History", sub: "Your generation timeline" },
  "/style-profile": {
    title: "Style DNA",
    sub: "Your personal aesthetic profile",
  },
  "/workbench": { title: "Workbench", sub: "Edit and refine your images" },
  "/billing": { title: "Billing", sub: "Credits and subscription" },
};

type TopbarUser = {
  credits: number;
  plan: string;
  name: string;
  email: string;
  image?: string | null;
} | null;

export function Topbar({ user }: { user: TopbarUser }) {
  const pathname = usePathname();

  // Find best matching page title
  const pageKey = Object.keys(PAGE_TITLES).find(
    (k) => pathname === k || pathname.startsWith(k + "/"),
  );
  const page = pageKey
    ? PAGE_TITLES[pageKey]
    : { title: "Lumina Studio", sub: "" };

  const isPro = user?.plan === "PRO";

  return (
    <>
      <style>{`
        .topbar {
          height: 60px;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          border-bottom: 1px solid var(--border);
          background: rgba(6,6,8,0.8);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 40;
          gap: 16px;
        }

        .topbar-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
          min-width: 0;
        }

        .topbar-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
        }

        .topbar-sep {
          color: var(--border2);
          font-size: 14px;
        }

        .topbar-sub {
          font-size: 13px;
          color: var(--muted);
          font-weight: 300;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        /* Credit pill */
        .topbar-credit-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 20px;
          background: var(--panel2);
          border: 1px solid var(--border2);
          font-size: 13px;
          font-weight: 400;
          color: var(--text2);
          white-space: nowrap;
          cursor: default;
          transition: border-color 0.2s;
        }
        .topbar-credit-pill:hover { border-color: var(--gold-dim); }

        .credit-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
        }

        .credit-dot.pulse {
          animation: credit-pulse 2s ease-in-out infinite;
        }

        @keyframes credit-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        .topbar-credit-val {
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          color: var(--gold);
          font-weight: 600;
        }

        /* New generation button */
        .topbar-gen-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 8px;
          background: var(--gold);
          color: var(--void);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .topbar-gen-btn:hover {
          background: var(--accent, #e8c46b);
          transform: translateY(-1px);
        }

        .topbar-gen-btn .btn-icon {
          font-size: 14px;
          font-family: 'Playfair Display', serif;
        }

        /* Plan badge */
        .plan-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid;
        }

        .plan-badge.pro {
          color: var(--gold);
          border-color: rgba(200,169,110,0.3);
          background: rgba(200,169,110,0.07);
        }

        .plan-badge.free {
          color: var(--muted);
          border-color: var(--border2);
          background: transparent;
        }

        @media (max-width: 640px) {
          .topbar-sub { display: none; }
          .topbar-sep { display: none; }
          .topbar-credit-label { display: none; }
        }
      `}</style>

      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">{page.title}</span>
          {page.sub && (
            <>
              <span className="topbar-sep">/</span>
              <span className="topbar-sub">{page.sub}</span>
            </>
          )}
        </div>

        <div className="topbar-right">
          {/* Plan badge */}
          <span className={`plan-badge ${isPro ? "pro" : "free"}`}>
            {isPro ? "Pro" : "Free"}
          </span>

          {/* Credit pill */}
          <Link href="/billing" style={{ textDecoration: "none" }}>
            <div className="topbar-credit-pill">
              <div className={`credit-dot ${!isPro ? "pulse" : ""}`} />
              <span className="topbar-credit-val">
                {isPro ? "∞" : (user?.credits ?? 0)}
              </span>
              <span
                className="topbar-credit-label"
                style={{ fontSize: 12, color: "var(--muted)" }}
              >
                {isPro ? "unlimited" : "credits"}
              </span>
            </div>
          </Link>

          {/* Quick generate button (hidden on dashboard itself) */}
          {pathname !== "/dashboard" && (
            <Link href="/dashboard" className="topbar-gen-btn">
              <span className="btn-icon">✦</span>
              Generate
            </Link>
          )}
        </div>
      </header>
    </>
  );
}

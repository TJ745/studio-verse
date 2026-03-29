"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  {
    group: "Create",
    items: [
      { href: "/dashboard", icon: "✦", label: "Generate" },
      { href: "/history", icon: "◈", label: "History" },
      { href: "/style-profile", icon: "◉", label: "Style DNA" },
    ],
  },
  {
    group: "Account",
    items: [
      { href: "/workbench", icon: "⬡", label: "Workbench" },
      { href: "/billing", icon: "◇", label: "Billing" },
    ],
  },
];

type SidebarUser = {
  credits: number;
  plan: string;
  name: string;
  email: string;
  image?: string | null;
} | null;

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/login");
  };

  const isPro = user?.plan === "PRO";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --obsidian:  #0a0a0c;
          --void:      #060608;
          --panel:     #0e0e12;
          --panel2:    #111116;
          --border:    #1a1a22;
          --border2:   #222230;
          --gold:      #c8a96e;
          --gold-dim:  #7a6540;
          --gold-glow: rgba(200,169,110,0.12);
          --text:      #e8e4dc;
          --text2:     #a8a4a0;
          --muted:     #5a5868;
          --danger:    #c86e6e;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: var(--void);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
        }

        /* ── Shell layout ──────────────────────────── */
        .app-shell {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        .app-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .app-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          background: var(--void);
          position: relative;
        }

        /* subtle grid pattern on content bg */
        .app-content::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .app-content > * { position: relative; z-index: 1; }

        /* ── Sidebar ───────────────────────────────── */
        .sidebar {
          width: 240px;
          min-width: 240px;
          height: 100vh;
          background: var(--panel);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1),
                      min-width 0.3s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
          position: relative;
          z-index: 50;
        }

        .sidebar.collapsed {
          width: 64px;
          min-width: 64px;
        }

        /* ── Logo area ─────────────────────────────── */
        .sidebar-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 18px 18px;
          border-bottom: 1px solid var(--border);
          min-height: 64px;
          gap: 8px;
        }

        .logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 600;
          color: var(--gold);
          white-space: nowrap;
          overflow: hidden;
          transition: opacity 0.2s, max-width 0.3s;
          max-width: 160px;
          text-decoration: none;
        }

        .sidebar.collapsed .logo-text {
          opacity: 0;
          max-width: 0;
        }

        .logo-mark {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: var(--void);
          font-weight: 700;
          flex-shrink: 0;
          font-family: 'Playfair Display', serif;
        }

        .collapse-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          transition: background 0.2s, color 0.2s, transform 0.3s;
          flex-shrink: 0;
        }
        .collapse-btn:hover { background: var(--border); color: var(--text2); }
        .sidebar.collapsed .collapse-btn { transform: rotate(180deg); }

        /* ── Nav ───────────────────────────────────── */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 10px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          scrollbar-width: none;
        }
        .sidebar-nav::-webkit-scrollbar { display: none; }

        .nav-group-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          padding: 0 8px;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          transition: opacity 0.2s;
        }
        .sidebar.collapsed .nav-group-label { opacity: 0; }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 10px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--muted);
          font-size: 14px;
          font-weight: 400;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }
        .nav-item:hover {
          background: var(--panel2);
          color: var(--text2);
        }
        .nav-item.active {
          background: var(--gold-glow);
          color: var(--gold);
          border: 1px solid rgba(200,169,110,0.12);
        }
        .nav-item.active .nav-icon {
          color: var(--gold);
        }

        /* gold left bar for active */
        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 25%; bottom: 25%;
          width: 2px;
          border-radius: 2px;
          background: var(--gold);
        }

        .nav-icon {
          font-size: 15px;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
          font-family: 'Playfair Display', serif;
          transition: color 0.15s;
        }

        .nav-label {
          flex: 1;
          overflow: hidden;
          transition: opacity 0.2s, max-width 0.3s;
          max-width: 160px;
        }
        .sidebar.collapsed .nav-label {
          opacity: 0;
          max-width: 0;
        }

        /* tooltip for collapsed mode */
        .sidebar.collapsed .nav-item {
          justify-content: center;
        }

        /* ── Credit badge ──────────────────────────── */
        .credit-section {
          padding: 12px 10px;
          border-top: 1px solid var(--border);
        }

        .credit-card {
          border-radius: 10px;
          background: var(--panel2);
          border: 1px solid var(--border2);
          padding: 14px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .sidebar.collapsed .credit-card {
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .credit-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          transition: opacity 0.2s;
        }
        .sidebar.collapsed .credit-top { display: none; }

        .credit-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .credit-count {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
          line-height: 1;
        }

        .credit-pro-badge {
          font-size: 9px;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(200,169,110,0.15);
          color: var(--gold);
          border: 1px solid rgba(200,169,110,0.2);
          font-weight: 500;
          letter-spacing: 0.08em;
        }

        .credit-bar-track {
          height: 3px;
          background: var(--border2);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .credit-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--gold-dim), var(--gold));
          transition: width 0.5s ease;
        }

        .credit-sub {
          font-size: 11px;
          color: var(--muted);
          font-weight: 300;
        }

        .credit-icon-only {
          font-size: 14px;
          color: var(--gold);
          display: none;
        }
        .sidebar.collapsed .credit-icon-only { display: block; }

        .upgrade-btn {
          display: block;
          margin-top: 10px;
          padding: 8px;
          border-radius: 7px;
          background: rgba(200,169,110,0.1);
          border: 1px solid rgba(200,169,110,0.2);
          color: var(--gold);
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          text-decoration: none;
          transition: background 0.2s;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
        }
        .upgrade-btn:hover { background: rgba(200,169,110,0.18); }
        .sidebar.collapsed .upgrade-btn { display: none; }

        /* ── User footer ───────────────────────────── */
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 12px;
          border-top: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
        }
        .sidebar-user:hover { background: var(--panel2); }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--gold-dim), #3a2a10);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: var(--gold);
          flex-shrink: 0;
          border: 1px solid var(--gold-dim);
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-info {
          flex: 1;
          overflow: hidden;
          min-width: 0;
          transition: opacity 0.2s, max-width 0.3s;
          max-width: 140px;
        }
        .sidebar.collapsed .user-info {
          opacity: 0;
          max-width: 0;
        }

        .user-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 11px;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 300;
        }

        .signout-btn {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 13px;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .signout-btn:hover { color: var(--danger); background: rgba(200,110,110,0.08); }
        .sidebar.collapsed .signout-btn { display: none; }
      `}</style>

      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">S</div>
          <Link href="/dashboard" className="logo-text">
            StudioVerse
          </Link>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title="Toggle sidebar"
          >
            ‹
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="nav-group-label">{group.group}</div>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Credit badge */}
        <div className="credit-section">
          <div className="credit-card">
            <span className="credit-icon-only">◇</span>

            {isPro ? (
              <>
                <div className="credit-top">
                  <span className="credit-label">Credits</span>
                  <span className="credit-pro-badge">PRO</span>
                </div>
                <div className="credit-count" style={{ marginBottom: 4 }}>
                  ∞
                </div>
                <div className="credit-sub">Unlimited generations</div>
              </>
            ) : (
              <>
                <div className="credit-top">
                  <span className="credit-label">Daily Credits</span>
                  <span className="credit-count">{user?.credits ?? 0}</span>
                </div>
                <div className="credit-bar-track">
                  <div
                    className="credit-bar-fill"
                    style={{
                      width: `${Math.max(0, ((user?.credits ?? 0) / 10) * 100)}%`,
                    }}
                  />
                </div>
                <div className="credit-sub">
                  {user?.credits ?? 0} / 10 remaining today
                </div>
                <Link href="/billing" className="upgrade-btn">
                  ✦ Upgrade to Pro
                </Link>
              </>
            )}
          </div>
        </div>

        {/* User footer */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.image ? (
              <Image src={user.image} alt={user.name} width={50} height={50} />
            ) : (
              initials
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name ?? "User"}</div>
            <div className="user-email">{user?.email ?? ""}</div>
          </div>
          <button
            className="signout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
          >
            {signingOut ? "…" : "→"}
          </button>
        </div>
      </aside>
    </>
  );
}

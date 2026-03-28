// src/app/(auth)/layout.tsx
// Auth layout — split screen with animated showcase panel on the left

import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --obsidian: #0a0a0c;
          --void:     #060608;
          --panel:    #0e0e12;
          --panel2:   #111116;
          --border:   #1a1a22;
          --border2:  #222230;
          --gold:     #c8a96e;
          --gold-dim: #7a6540;
          --accent:   #e8c46b;
          --text:     #e8e4dc;
          --text2:    #a8a4a0;
          --muted:    #5a5868;
          --danger:   #c86e6e;
          --success:  #6ec88a;
        }

        html, body { height: 100%; }

        body {
          background: var(--void);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          -webkit-font-smoothing: antialiased;
        }

        ::selection { background: rgba(200,169,110,0.2); color: var(--text); }
        :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; border-radius: 4px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

        /* ── Auth shell ─────────────────────────── */
        .auth-shell {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }

        /* ── Left panel — animated showcase ──────── */
        .auth-showcase {
          position: relative;
          background: var(--obsidian);
          border-right: 1px solid var(--border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px;
        }

        /* Radial glow background */
        .auth-showcase::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 30% 40%, rgba(200,169,110,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 80%, rgba(110,181,200,0.04) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Animated grid lines */
        .auth-showcase::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .showcase-logo {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .showcase-logo-mark {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--void);
        }

        .showcase-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--gold);
        }

        /* ── Floating style tiles ─────────────────── */
        .showcase-tiles {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .tile {
          position: absolute;
          border-radius: 12px;
          border: 1px solid var(--border2);
          background: var(--panel);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          animation: float-tile linear infinite;
          opacity: 0;
        }

        .tile-emoji { font-size: 22px; line-height: 1; }
        .tile-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
        }

        @keyframes float-tile {
          0%   { transform: translateY(110vh) rotate(-4deg); opacity: 0; }
          5%   { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(-20vh) rotate(4deg); opacity: 0; }
        }

        /* Particles */
        .particle {
          position: absolute;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: var(--gold);
          animation: float-particle linear infinite;
          opacity: 0;
        }

        @keyframes float-particle {
          0%   { transform: translateY(100vh); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-10vh); opacity: 0; }
        }

        /* ── Showcase bottom quote ────────────────── */
        .showcase-bottom {
          position: relative;
          z-index: 2;
        }

        .showcase-quote {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--text);
          line-height: 1.3;
          margin-bottom: 12px;
        }

        .showcase-quote em { font-style: italic; color: var(--gold); }

        .showcase-sub {
          font-size: 14px;
          color: var(--muted);
          font-weight: 300;
          line-height: 1.6;
          max-width: 320px;
        }

        .showcase-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }

        .showcase-pill {
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid var(--border2);
          background: rgba(200,169,110,0.06);
          font-size: 12px;
          color: var(--gold);
          font-weight: 400;
        }

        /* ── Right panel — form ───────────────────── */
        .auth-form-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
          background: var(--void);
          min-height: 100vh;
          overflow-y: auto;
        }

        .auth-form-inner {
          width: 100%;
          max-width: 380px;
          animation: slide-up 0.5s ease both;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .auth-shell { grid-template-columns: 1fr; }
          .auth-showcase { display: none; }
          .auth-form-panel { padding: 40px 24px; }
        }
      `}</style>

      <div className="auth-shell">
        {/* Left — Animated showcase */}
        <div className="auth-showcase">
          <Link href="/" className="showcase-logo">
            <div className="showcase-logo-mark">S</div>
            <span className="showcase-logo-text">StudioVerse</span>
          </Link>

          {/* Floating tiles injected via CSS animations */}
          <div className="showcase-tiles">
            <style>{`
              .tile:nth-child(1)  { width:80px;height:80px; left:8%;  animation-duration:14s; animation-delay:0s;   border-color: rgba(200,169,110,0.3); }
              .tile:nth-child(2)  { width:70px;height:70px; left:25%; animation-duration:18s; animation-delay:2s;   border-color: rgba(232,124,107,0.3); }
              .tile:nth-child(3)  { width:90px;height:90px; left:55%; animation-duration:16s; animation-delay:4s;   border-color: rgba(110,181,200,0.3); }
              .tile:nth-child(4)  { width:65px;height:65px; left:75%; animation-duration:12s; animation-delay:1s;   border-color: rgba(143,186,138,0.3); }
              .tile:nth-child(5)  { width:75px;height:75px; left:40%; animation-duration:20s; animation-delay:6s;   border-color: rgba(176,110,200,0.3); }
              .tile:nth-child(6)  { width:60px;height:60px; left:15%; animation-duration:15s; animation-delay:8s;   border-color: rgba(200,131,110,0.3); }
              .tile:nth-child(7)  { width:85px;height:85px; left:62%; animation-duration:17s; animation-delay:3s;   border-color: rgba(200,196,107,0.3); }
              .tile:nth-child(8)  { width:68px;height:68px; left:82%; animation-duration:13s; animation-delay:9s;   border-color: rgba(122,110,200,0.3); }

              .particle:nth-child(9)  { left: 10%; animation-duration: 8s;  animation-delay: 0s;  width:2px;height:2px; }
              .particle:nth-child(10) { left: 30%; animation-duration: 11s; animation-delay: 3s;  }
              .particle:nth-child(11) { left: 50%; animation-duration: 9s;  animation-delay: 1s;  width:4px;height:4px; }
              .particle:nth-child(12) { left: 70%; animation-duration: 13s; animation-delay: 5s;  }
              .particle:nth-child(13) { left: 88%; animation-duration: 7s;  animation-delay: 2s;  width:2px;height:2px; }
              .particle:nth-child(14) { left: 20%; animation-duration: 10s; animation-delay: 7s;  }
              .particle:nth-child(15) { left: 60%; animation-duration: 12s; animation-delay: 4s;  width:2px;height:2px; }
            `}</style>

            <div className="tile">
              <span className="tile-emoji">🎬</span>
              <span className="tile-label">Cinematic</span>
            </div>
            <div className="tile">
              <span className="tile-emoji">🎌</span>
              <span className="tile-label">Anime</span>
            </div>
            <div className="tile">
              <span className="tile-emoji">🧊</span>
              <span className="tile-label">3D Render</span>
            </div>
            <div className="tile">
              <span className="tile-emoji">🌊</span>
              <span className="tile-label">Watercolor</span>
            </div>
            <div className="tile">
              <span className="tile-emoji">🎨</span>
              <span className="tile-label">Cartoon</span>
            </div>
            <div className="tile">
              <span className="tile-emoji">✏️</span>
              <span className="tile-label">Sketch</span>
            </div>
            <div className="tile">
              <span className="tile-emoji">🌌</span>
              <span className="tile-label">Fantasy</span>
            </div>
            <div className="tile">
              <span className="tile-emoji">⚡</span>
              <span className="tile-label">Cyberpunk</span>
            </div>
            <div className="particle" />
            <div className="particle" />
            <div className="particle" />
            <div className="particle" />
            <div className="particle" />
            <div className="particle" />
            <div className="particle" />
          </div>

          <div className="showcase-bottom">
            <div className="showcase-quote">
              Describe anything.
              <br />
              Make it <em>extraordinary.</em>
            </div>
            <p className="showcase-sub">
              DALL·E 3 image generation with 12 style presets and GPT-4o prompt
              enhancement — all in one studio.
            </p>
            <div className="showcase-pills">
              <span className="showcase-pill">✦ 12 Style Presets</span>
              <span className="showcase-pill">◈ GPT-4o Enhanced</span>
              <span className="showcase-pill">◉ HD Quality</span>
            </div>
          </div>
        </div>

        {/* Right — Auth form */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">{children}</div>
        </div>
      </div>
    </>
  );
}

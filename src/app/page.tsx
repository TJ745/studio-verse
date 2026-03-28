"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── Style presets preview data ───────────────────────────────────────────────
const STYLE_TILES = [
  { label: "Cinematic", emoji: "🎬", color: "#c8a96e" },
  { label: "Anime", emoji: "🇯🇵", color: "#e87c6b" },
  { label: "Oil Paint", emoji: "🖼️", color: "#8fba8a" },
  { label: "3D Render", emoji: "🧊", color: "#6eb5c8" },
  { label: "Pixel Art", emoji: "🎮", color: "#b06ec8" },
  { label: "Watercolor", emoji: "🌊", color: "#c8836e" },
  { label: "Sketch", emoji: "✏️", color: "#a8a8a8" },
  { label: "Cartoon", emoji: "🎨", color: "#e8c46b" },
  { label: "Fantasy", emoji: "🌌", color: "#7a6ec8" },
  { label: "Cyberpunk", emoji: "⚡", color: "#6ec8a9" },
];

const FEATURES = [
  {
    icon: "✦",
    title: "Smart Prompt Architect",
    desc: "GPT-4o rewrites your prompt behind the scenes — adding lighting, depth, and composition you'd never think to add yourself.",
  },
  {
    icon: "◈",
    title: "Style DNA System",
    desc: "Build your personal aesthetic profile. Every generation is quietly influenced by your saved styles, palettes, and inspirations.",
  },
  {
    icon: "⬡",
    title: "Generation Timeline",
    desc: "A visual mood board of everything you've created. Fork, remix, and iterate — not just a boring list.",
  },
  {
    icon: "◉",
    title: "Image Workbench",
    desc: "Upscale, crop to any ratio, remove backgrounds, and tag images — all without leaving the app.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    sub: "forever",
    credits: "10 credits / day",
    features: [
      "Standard quality",
      "All 12 style presets",
      "Generation history",
      "Prompt enhancer",
    ],
    cta: "Start Free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    sub: "/ month",
    credits: "Unlimited generations",
    features: [
      "HD quality unlocked",
      "Priority queue",
      "Style DNA profiles",
      "Image Workbench",
      "Early access to new features",
    ],
    cta: "Go Pro",
    href: "/register?plan=pro",
    highlight: true,
  },
  {
    name: "Pay-as-you-go",
    price: "$5",
    sub: "one-time",
    credits: "50 credits",
    features: [
      "HD quality unlocked",
      "Never expire",
      "All style presets",
      "Workbench access",
    ],
    cta: "Buy Credits",
    href: "/register?plan=payg",
    highlight: false,
  },
];

// ─── Floating orb component ────────────────────────────────────────────────────
function Orb({ style }: { style: React.CSSProperties }) {
  return <div className="orb" style={style} />;
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = target / 60;
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else setCount(Math.floor(start));
          }, 16);
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeStyle, setActiveStyle] = useState(0);
  const [promptText, setPromptText] = useState(
    "A lone samurai standing on a misty mountain peak at dawn",
  );

  // Cycle style preview
  useEffect(() => {
    const t = setInterval(
      () => setActiveStyle((p) => (p + 1) % STYLE_TILES.length),
      2200,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --obsidian:  #0a0a0c;
          --void:      #060608;
          --panel:     #111116;
          --border:    #1e1e26;
          --gold:      #c8a96e;
          --gold-dim:  #8a7048;
          --gold-glow: rgba(200,169,110,0.15);
          --text:      #e8e4dc;
          --muted:     #6b6878;
          --accent:    #e8c46b;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--void);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          overflow-x: hidden;
        }

        /* Grain overlay */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 9999;
          opacity: 0.4;
        }

        /* ── Nav ───────────────────────────────────── */
        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          background: rgba(6,6,8,0.7);
          backdrop-filter: blur(20px);
        }

        .nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--gold);
          letter-spacing: 0.02em;
          text-decoration: none;
        }

        .nav-links {
          display: flex;
          gap: 32px;
          list-style: none;
        }

        .nav-links a {
          color: var(--muted);
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--text); }

        .nav-cta {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn-ghost {
          padding: 9px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 400;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-ghost:hover { color: var(--text); }

        .btn-gold {
          padding: 10px 22px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          background: var(--gold);
          color: #0a0a0c;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
        }
        .btn-gold:hover { background: var(--accent); transform: translateY(-1px); }

        /* ── Hero ──────────────────────────────────── */
        .hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 0;
          padding: 120px 48px 80px;
          position: relative;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 50%, rgba(200,169,110,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 80% 20%, rgba(110,181,200,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 70% 80%, rgba(180,110,200,0.03) 0%, transparent 60%);
        }

        .hero-left {
          position: relative;
          z-index: 2;
          max-width: 560px;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 28px;
        }

        .hero-eyebrow::before {
          content: '';
          width: 24px;
          height: 1px;
          background: var(--gold);
        }

        h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(44px, 5.5vw, 72px);
          font-weight: 600;
          line-height: 1.08;
          color: var(--text);
          margin-bottom: 24px;
          letter-spacing: -0.01em;
        }

        h1 em {
          font-style: italic;
          color: var(--gold);
        }

        .hero-desc {
          font-size: 17px;
          line-height: 1.7;
          color: var(--muted);
          margin-bottom: 40px;
          max-width: 440px;
          font-weight: 300;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-large {
          padding: 15px 32px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          background: var(--gold);
          color: #0a0a0c;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 0 40px rgba(200,169,110,0.2);
        }
        .btn-large:hover {
          background: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 0 60px rgba(200,169,110,0.35);
        }

        .btn-outline {
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 400;
          border: 1px solid var(--border);
          color: var(--muted);
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-outline:hover { border-color: var(--gold-dim); color: var(--text); }

        .hero-stat-row {
          display: flex;
          gap: 40px;
          margin-top: 56px;
          padding-top: 40px;
          border-top: 1px solid var(--border);
        }

        .hero-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 600;
          color: var(--text);
          display: block;
          line-height: 1;
          margin-bottom: 4px;
        }

        .hero-stat-label {
          font-size: 12px;
          color: var(--muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ── Hero Right: Live Demo ─────────────────── */
        .hero-right {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .demo-card {
          width: 100%;
          max-width: 460px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.02),
            0 40px 80px rgba(0,0,0,0.6),
            0 0 60px rgba(200,169,110,0.06);
        }

        .demo-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
        }

        .demo-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
        }

        .demo-image-area {
          aspect-ratio: 1;
          background: linear-gradient(135deg, #141420 0%, #0d0d18 100%);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .demo-image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          opacity: 0.6;
        }

        .demo-image-icon {
          font-size: 48px;
          filter: grayscale(0.3);
          animation: pulse-icon 3s ease-in-out infinite;
        }

        @keyframes pulse-icon {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.9; }
        }

        .demo-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(200,169,110,0.04) 50%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .demo-style-badge {
          position: absolute;
          top: 16px; right: 16px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid;
          transition: all 0.4s ease;
          backdrop-filter: blur(8px);
          background: rgba(10,10,12,0.6);
        }

        .demo-bottom {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .demo-prompt-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 14px;
        }

        .demo-prompt-text {
          flex: 1;
          font-size: 13px;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-style: italic;
        }

        .demo-enhance-tag {
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(200,169,110,0.1);
          color: var(--gold);
          border: 1px solid rgba(200,169,110,0.2);
          white-space: nowrap;
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        .demo-btn-row {
          display: flex;
          gap: 8px;
        }

        .demo-gen-btn {
          flex: 1;
          padding: 10px;
          border-radius: 7px;
          background: var(--gold);
          color: #0a0a0c;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .demo-gen-btn:hover { background: var(--accent); }

        .demo-icon-btn {
          width: 36px; height: 36px;
          border-radius: 7px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .demo-icon-btn:hover { background: rgba(255,255,255,0.07); }

        /* ── Style Grid Section ────────────────────── */
        section { padding: 100px 48px; }

        .section-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
          max-width: 80px;
        }

        h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 600;
          line-height: 1.12;
          color: var(--text);
          margin-bottom: 16px;
          letter-spacing: -0.01em;
        }

        h2 em { font-style: italic; color: var(--gold); }

        .section-sub {
          font-size: 16px;
          color: var(--muted);
          line-height: 1.7;
          max-width: 480px;
          font-weight: 300;
          margin-bottom: 56px;
        }

        .styles-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        .style-tile {
          aspect-ratio: 1;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--panel);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .style-tile::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: inherit;
        }

        .style-tile:hover { transform: translateY(-3px); border-color: var(--gold-dim); }
        .style-tile:hover::before { opacity: 1; }

        .style-tile.active {
          border-color: var(--gold);
          box-shadow: 0 0 24px rgba(200,169,110,0.15);
        }

        .style-emoji { font-size: 28px; }
        .style-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* ── Features ──────────────────────────────── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }

        .feature-card {
          background: var(--panel);
          padding: 48px 40px;
          transition: background 0.2s;
        }
        .feature-card:hover { background: #13131a; }

        .feature-icon {
          font-size: 28px;
          color: var(--gold);
          margin-bottom: 20px;
          display: block;
          font-family: 'Playfair Display', serif;
        }

        .feature-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 12px;
        }

        .feature-desc {
          font-size: 15px;
          line-height: 1.7;
          color: var(--muted);
          font-weight: 300;
        }

        /* ── How it works ──────────────────────────── */
        .steps-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          position: relative;
        }

        .steps-row::before {
          content: '';
          position: absolute;
          top: 28px;
          left: calc(16.67% + 16px);
          right: calc(16.67% + 16px);
          height: 1px;
          background: linear-gradient(90deg, var(--border), var(--gold-dim), var(--border));
        }

        .step-card {
          text-align: center;
          padding: 40px 24px;
        }

        .step-num {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: var(--panel);
          border: 1px solid var(--gold-dim);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: var(--gold);
          margin: 0 auto 24px;
          position: relative;
          z-index: 1;
          background: var(--obsidian);
        }

        .step-title {
          font-family: 'Playfair Display', serif;
          font-size: 19px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 10px;
        }

        .step-desc {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.7;
          font-weight: 300;
        }

        /* ── Pricing ───────────────────────────────── */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 56px;
        }

        .plan-card {
          border-radius: 16px;
          border: 1px solid var(--border);
          background: var(--panel);
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          transition: border-color 0.2s, transform 0.2s;
          position: relative;
        }
        .plan-card:hover { transform: translateY(-4px); }

        .plan-card.highlight {
          border-color: var(--gold);
          background: linear-gradient(135deg, #111116 0%, #13110e 100%);
          box-shadow: 0 0 60px rgba(200,169,110,0.1);
        }

        .plan-badge {
          position: absolute;
          top: -12px; left: 50%; transform: translateX(-50%);
          padding: 4px 16px;
          border-radius: 20px;
          background: var(--gold);
          color: #0a0a0c;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .plan-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
        }

        .plan-price-row { display: flex; align-items: baseline; gap: 6px; }

        .plan-price {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          font-weight: 600;
          color: var(--text);
        }

        .plan-sub { font-size: 14px; color: var(--muted); }

        .plan-credits {
          font-size: 13px;
          color: var(--gold);
          padding: 6px 12px;
          background: rgba(200,169,110,0.07);
          border-radius: 6px;
          border: 1px solid rgba(200,169,110,0.15);
          width: fit-content;
          font-weight: 500;
        }

        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 10px; flex: 1; }

        .plan-features li {
          font-size: 14px;
          color: var(--muted);
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-weight: 300;
        }

        .plan-features li::before {
          content: '✓';
          color: var(--gold);
          font-size: 12px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .plan-btn {
          display: block;
          text-align: center;
          padding: 13px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          margin-top: auto;
        }

        .plan-btn-default {
          border: 1px solid var(--border);
          color: var(--muted);
        }
        .plan-btn-default:hover { border-color: var(--gold-dim); color: var(--text); }

        .plan-btn-highlight {
          background: var(--gold);
          color: #0a0a0c;
        }
        .plan-btn-highlight:hover { background: var(--accent); }

        /* ── Footer ────────────────────────────────── */
        footer {
          padding: 48px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-logo {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: var(--gold);
          font-weight: 600;
        }

        .footer-copy { font-size: 13px; color: var(--muted); }

        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 13px; color: var(--muted); text-decoration: none; }
        .footer-links a:hover { color: var(--text); }

        /* ── Animations ────────────────────────────── */
        @keyframes float-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fade-in { animation: float-up 0.8s ease forwards; }
        .fade-in-1 { animation: float-up 0.8s 0.1s ease both; }
        .fade-in-2 { animation: float-up 0.8s 0.25s ease both; }
        .fade-in-3 { animation: float-up 0.8s 0.4s ease both; }
        .fade-in-4 { animation: float-up 0.8s 0.55s ease both; }
        .fade-in-5 { animation: float-up 0.8s 0.7s ease both; }

        @media (max-width: 900px) {
          nav { padding: 16px 24px; }
          .nav-links { display: none; }
          .hero { grid-template-columns: 1fr; padding: 100px 24px 60px; gap: 48px; }
          .hero-left { max-width: 100%; }
          section { padding: 64px 24px; }
          .styles-grid { grid-template-columns: repeat(5, 1fr); gap: 8px; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-row { grid-template-columns: 1fr; }
          .steps-row::before { display: none; }
          .pricing-grid { grid-template-columns: 1fr; }
          footer { flex-direction: column; gap: 24px; text-align: center; }
        }
      `}</style>

      {/* ── Navigation ─────────────────────────────── */}
      <nav>
        <Link href="/" className="nav-logo">
          Lumina Studio
        </Link>
        <ul className="nav-links">
          <li>
            <a href="#styles">Styles</a>
          </li>
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#how">How it works</a>
          </li>
          <li>
            <a href="#pricing">Pricing</a>
          </li>
        </ul>
        <div className="nav-cta">
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/register" className="btn-gold">
            Start free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />

        <div className="hero-left">
          <div className="hero-eyebrow fade-in-1">
            Powered by DALL·E 3 & GPT-4o
          </div>

          <h1 className="fade-in-2">
            Generate images
            <br />
            that feel <em>intentional</em>
          </h1>

          <p className="hero-desc fade-in-3">
            Not just a prompt box. Lumina Studio gives you style presets, an AI
            prompt architect, and a full image workbench — so every generation
            looks like it came from a professional.
          </p>

          <div className="hero-actions fade-in-4">
            <Link href="/register" className="btn-large">
              Generate for free
            </Link>
            <Link href="#how" className="btn-outline">
              See how it works
            </Link>
          </div>

          <div className="hero-stat-row fade-in-5">
            <div>
              <span className="hero-stat-num">
                <Counter target={12} />+
              </span>
              <span className="hero-stat-label">Visual styles</span>
            </div>
            <div>
              <span className="hero-stat-num">
                <Counter target={3} />
              </span>
              <span className="hero-stat-label">Image sizes</span>
            </div>
            <div>
              <span className="hero-stat-num">Free</span>
              <span className="hero-stat-label">To start</span>
            </div>
          </div>
        </div>

        {/* Demo card */}
        <div className="hero-right fade-in-3">
          <div className="demo-card">
            <div className="demo-bar">
              <div className="demo-dot" style={{ background: "#ff5f57" }} />
              <div className="demo-dot" style={{ background: "#febc2e" }} />
              <div className="demo-dot" style={{ background: "#28c840" }} />
              <span
                style={{ marginLeft: 8, fontSize: 12, color: "var(--muted)" }}
              >
                Lumina Studio — Dashboard
              </span>
            </div>

            <div className="demo-image-area">
              <div className="demo-shimmer" />
              <div className="demo-image-placeholder">
                <div className="demo-image-icon">
                  {STYLE_TILES[activeStyle].emoji}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    fontStyle: "italic",
                  }}
                >
                  {STYLE_TILES[activeStyle].label} style
                </span>
              </div>
              <div
                className="demo-style-badge"
                style={{
                  color: STYLE_TILES[activeStyle].color,
                  borderColor: `${STYLE_TILES[activeStyle].color}44`,
                }}
              >
                {STYLE_TILES[activeStyle].label}
              </div>
            </div>

            <div className="demo-bottom">
              <div className="demo-prompt-row">
                <span className="demo-prompt-text">"{promptText}"</span>
                <span className="demo-enhance-tag">✦ AI Enhanced</span>
              </div>
              <div className="demo-btn-row">
                <button className="demo-gen-btn">Generate Image</button>
                <button className="demo-icon-btn">↗</button>
                <button className="demo-icon-btn">♡</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Style Presets ──────────────────────────── */}
      <section id="styles" style={{ background: "var(--obsidian)" }}>
        <div className="section-label">Visual Styles</div>
        <h2>
          12 styles. <em>Infinite</em> possibilities.
        </h2>
        <p className="section-sub">
          Pick a style preset and your prompt is automatically enhanced with the
          right artistic direction — no prompt engineering needed.
        </p>
        <div className="styles-grid">
          {STYLE_TILES.map((s, i) => (
            <div
              key={s.label}
              className={`style-tile ${i === activeStyle ? "active" : ""}`}
              onClick={() => setActiveStyle(i)}
              style={
                i === activeStyle
                  ? { borderColor: s.color, boxShadow: `0 0 24px ${s.color}22` }
                  : {}
              }
            >
              <span className="style-emoji">{s.emoji}</span>
              <span className="style-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section id="features">
        <div className="section-label">Features</div>
        <h2>
          Built different.
          <br />
          <em>Works</em> different.
        </h2>
        <p className="section-sub">
          Every feature is designed to close the gap between what you imagine
          and what you generate.
        </p>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────── */}
      <section id="how" style={{ background: "var(--obsidian)" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="section-label" style={{ justifyContent: "center" }}>
            How it works
          </div>
          <h2>
            Three steps to <em>extraordinary</em>
          </h2>
        </div>
        <div className="steps-row">
          {[
            {
              n: "I",
              title: "Describe your vision",
              desc: "Type anything — a mood, a scene, a concept. Keep it simple or go into detail.",
            },
            {
              n: "II",
              title: "GPT-4o perfects it",
              desc: "Our AI architect rewrites your prompt with lighting, composition, and mood details automatically.",
            },
            {
              n: "III",
              title: "DALL·E 3 renders it",
              desc: "Your enhanced prompt is sent to DALL·E 3 with your chosen style, size, and quality settings.",
            },
          ].map((s) => (
            <div key={s.n} className="step-card">
              <div className="step-num">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────── */}
      <section id="pricing">
        <div className="section-label">Pricing</div>
        <h2>
          Start free.
          <br />
          <em>Scale</em> when ready.
        </h2>
        <div className="pricing-grid">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`plan-card ${p.highlight ? "highlight" : ""}`}
            >
              {p.highlight && <div className="plan-badge">Most Popular</div>}
              <div>
                <div className="plan-name">{p.name}</div>
                <div className="plan-price-row">
                  <span className="plan-price">{p.price}</span>
                  <span className="plan-sub">{p.sub}</span>
                </div>
              </div>
              <div className="plan-credits">{p.credits}</div>
              <ul className="plan-features">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`plan-btn ${p.highlight ? "plan-btn-highlight" : "plan-btn-default"}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────── */}
      <section
        style={{
          background: "var(--obsidian)",
          textAlign: "center",
          padding: "100px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(200,169,110,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className="section-label" style={{ justifyContent: "center" }}>
          Get started
        </div>
        <h2 style={{ marginBottom: 16 }}>
          Your first image is
          <br />
          <em>waiting</em> to be made.
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 16,
            marginBottom: 40,
            fontWeight: 300,
          }}
        >
          10 free credits daily. No credit card required.
        </p>
        <Link href="/register" className="btn-large">
          Open Lumina Studio →
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer>
        <span className="footer-logo">Lumina Studio</span>
        <span className="footer-copy">
          © {new Date().getFullYear()} Lumina Studio. All rights reserved.
        </span>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </>
  );
}

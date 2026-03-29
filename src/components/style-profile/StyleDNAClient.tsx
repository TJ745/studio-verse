"use client";

import { useState, useTransition } from "react";
// import Link from "next/link";
import {
  upsertStyleProfileAction,
  resetStyleProfileAction,
} from "@/actions/style-profile";

// ─── Data ────────────────────────────────────────────────────────────────────
const STYLE_PRESETS = [
  {
    key: "photorealistic",
    emoji: "📸",
    label: "Photorealistic",
    desc: "True-to-life photography",
    color: "#a8c4d4",
  },
  {
    key: "cinematic",
    emoji: "🎬",
    label: "Cinematic",
    desc: "Movie-grade lighting",
    color: "#c8a96e",
  },
  {
    key: "anime",
    emoji: "🎌",
    label: "Anime",
    desc: "Japanese animation style",
    color: "#e87c6b",
  },
  {
    key: "cartoon",
    emoji: "🎨",
    label: "Cartoon",
    desc: "Bold and expressive",
    color: "#e8c46b",
  },
  {
    key: "oil_painting",
    emoji: "🖼️",
    label: "Oil Painting",
    desc: "Classical fine art",
    color: "#8fba8a",
  },
  {
    key: "render_3d",
    emoji: "🧊",
    label: "3D Render",
    desc: "Digital 3D realism",
    color: "#6eb5c8",
  },
  {
    key: "watercolor",
    emoji: "🌊",
    label: "Watercolor",
    desc: "Soft and painterly",
    color: "#c8836e",
  },
  {
    key: "sketch",
    emoji: "✏️",
    label: "Sketch",
    desc: "Hand-drawn linework",
    color: "#a8a8a8",
  },
  {
    key: "pixel_art",
    emoji: "🎮",
    label: "Pixel Art",
    desc: "Retro 8/16-bit aesthetic",
    color: "#b06ec8",
  },
  {
    key: "fantasy",
    emoji: "🌌",
    label: "Fantasy",
    desc: "Epic and magical",
    color: "#7a6ec8",
  },
  {
    key: "cyberpunk",
    emoji: "⚡",
    label: "Cyberpunk",
    desc: "Neon dystopian future",
    color: "#6ec8a9",
  },
  {
    key: "vintage",
    emoji: "📷",
    label: "Vintage",
    desc: "Faded retro nostalgia",
    color: "#c8a080",
  },
];

const COLOR_MOODS = [
  {
    key: "warm",
    label: "Warm",
    swatch: ["#c8a96e", "#e87c6b", "#e8c46b"],
    desc: "Golds, ambers, reds",
  },
  {
    key: "cool",
    label: "Cool",
    swatch: ["#6eb5c8", "#7a6ec8", "#a8c4d4"],
    desc: "Blues, teals, purples",
  },
  {
    key: "monochrome",
    label: "Monochrome",
    swatch: ["#e8e4dc", "#888", "#222"],
    desc: "Blacks, whites, greys",
  },
  {
    key: "vibrant",
    label: "Vibrant",
    swatch: ["#e87c6b", "#e8c46b", "#6ec8a9"],
    desc: "Bold saturated hues",
  },
  {
    key: "earthy",
    label: "Earthy",
    swatch: ["#8fba8a", "#c8a080", "#7a6540"],
    desc: "Greens, browns, terracotta",
  },
  {
    key: "pastel",
    label: "Pastel",
    swatch: ["#f0c8c8", "#c8d8f0", "#d8f0c8"],
    desc: "Soft muted tones",
  },
];

const ARTIST_SUGGESTIONS = [
  "Studio Ghibli",
  "Monet",
  "Banksy",
  "Tim Burton",
  "Roger Deakins",
  "Hayao Miyazaki",
  "Salvador Dalí",
  "Frida Kahlo",
  "Wes Anderson",
  "Edward Hopper",
];

const SIZE_OPTIONS = [
  { v: "SQUARE", l: "Square", d: "1:1" },
  { v: "PORTRAIT", l: "Portrait", d: "9:16" },
  { v: "LANDSCAPE", l: "Landscape", d: "16:9" },
];
const QUALITY_OPTIONS = [
  { v: "STANDARD", l: "Standard", d: "1 credit" },
  { v: "HD", l: "HD", d: "2 credits" },
];
const STYLE_OPTIONS = [
  { v: "VIVID", l: "Vivid", d: "Hyper-real" },
  { v: "NATURAL", l: "Natural", d: "Realistic" },
];

type Profile = {
  favoriteStyles: string[];
  colorMood: string | null;
  artistInfluences: string[];
  defaultSize: string;
  defaultQuality: string;
  defaultStyle: string;
} | null;

export function StyleDNAClient({
  initialProfile,
}: {
  initialProfile: Profile;
}) {
  const [isPending, startT] = useTransition();

  const [favoriteStyles, setFavoriteStyles] = useState<string[]>(
    initialProfile?.favoriteStyles ?? [],
  );
  const [colorMood, setColorMood] = useState<string | null>(
    initialProfile?.colorMood ?? null,
  );
  const [artistInfluences, setArtistInfluences] = useState<string[]>(
    initialProfile?.artistInfluences ?? [],
  );
  const [artistInput, setArtistInput] = useState("");
  const [defaultSize, setDefaultSize] = useState(
    initialProfile?.defaultSize ?? "SQUARE",
  );
  const [defaultQuality, setDefaultQuality] = useState(
    initialProfile?.defaultQuality ?? "STANDARD",
  );
  const [defaultStyle, setDefaultStyle] = useState(
    initialProfile?.defaultStyle ?? "VIVID",
  );

  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Style toggle (max 6)
  const toggleStyle = (key: string) => {
    setFavoriteStyles((prev) =>
      prev.includes(key)
        ? prev.filter((s) => s !== key)
        : prev.length < 6
          ? [...prev, key]
          : prev,
    );
  };

  // Artist input
  const addArtist = (name?: string) => {
    const val = (name ?? artistInput).trim();
    if (!val || artistInfluences.includes(val) || artistInfluences.length >= 5)
      return;
    setArtistInfluences((prev) => [...prev, val]);
    setArtistInput("");
  };
  const removeArtist = (a: string) =>
    setArtistInfluences((prev) => prev.filter((x) => x !== a));

  // Save
  const handleSave = () => {
    setError(null);
    startT(async () => {
      const result = await upsertStyleProfileAction({
        favoriteStyles,
        colorMood: colorMood as any,
        artistInfluences,
        defaultSize: defaultSize as any,
        defaultQuality: defaultQuality as any,
        defaultStyle: defaultStyle as any,
      });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else setError(result.error ?? "Failed to save.");
    });
  };

  // Reset
  const handleReset = () => {
    setResetting(true);
    startT(async () => {
      await resetStyleProfileAction();
      setFavoriteStyles([]);
      setColorMood(null);
      setArtistInfluences([]);
      setDefaultSize("SQUARE");
      setDefaultQuality("STANDARD");
      setDefaultStyle("VIVID");
      setResetting(false);
    });
  };

  const hasChanges =
    JSON.stringify(favoriteStyles) !==
      JSON.stringify(initialProfile?.favoriteStyles ?? []) ||
    colorMood !== (initialProfile?.colorMood ?? null) ||
    JSON.stringify(artistInfluences) !==
      JSON.stringify(initialProfile?.artistInfluences ?? []) ||
    defaultSize !== (initialProfile?.defaultSize ?? "SQUARE") ||
    defaultQuality !== (initialProfile?.defaultQuality ?? "STANDARD") ||
    defaultStyle !== (initialProfile?.defaultStyle ?? "VIVID");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .dna-wrap {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* ── Page header ────────────────────────── */
        .dna-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .dna-header-left {}

        .dna-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dna-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 6px;
        }
        .dna-title em { font-style: italic; color: var(--gold); }

        .dna-sub {
          font-size: 14px;
          color: var(--muted);
          font-weight: 300;
          line-height: 1.6;
          max-width: 480px;
        }

        .dna-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-shrink: 0;
        }

        /* ── Section card ───────────────────────── */
        .dna-section {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }

        .dna-section-header {
          padding: 22px 26px 18px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .dna-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }

        .dna-section-sub {
          font-size: 13px;
          color: var(--muted);
          font-weight: 300;
          line-height: 1.5;
        }

        .section-count {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 20px;
          background: rgba(200,169,110,0.1);
          border: 1px solid rgba(200,169,110,0.2);
          color: var(--gold);
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .dna-section-body { padding: 24px 26px; }

        /* ── Style grid ─────────────────────────── */
        .style-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        @media (max-width: 640px) { .style-grid { grid-template-columns: repeat(3, 1fr); } }

        .style-card {
          border-radius: 12px;
          border: 1px solid var(--border2);
          background: var(--panel2);
          padding: 16px 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .style-card:hover { border-color: var(--gold-dim); background: var(--border); }
        .style-card.active { border-width: 1px; }

        .style-card-check {
          position: absolute;
          top: 8px; right: 8px;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--gold);
          color: var(--void);
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.6);
          transition: all 0.2s;
        }
        .style-card.active .style-card-check { opacity: 1; transform: scale(1); }

        .style-card-emoji { font-size: 26px; line-height: 1; }

        .style-card-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text2);
          line-height: 1.2;
        }
        .style-card.active .style-card-label { color: inherit; }

        .style-card-desc {
          font-size: 10px;
          color: var(--muted);
          font-weight: 300;
          line-height: 1.3;
        }

        .max-note {
          font-size: 12px;
          color: var(--muted);
          font-weight: 300;
          margin-top: 12px;
          text-align: center;
        }
        .max-note strong { color: var(--gold); font-weight: 500; }

        /* ── Color mood grid ────────────────────── */
        .mood-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        @media (max-width: 520px) { .mood-grid { grid-template-columns: repeat(2, 1fr); } }

        .mood-card {
          border-radius: 12px;
          border: 1px solid var(--border2);
          background: var(--panel2);
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .mood-card:hover { border-color: var(--gold-dim); }
        .mood-card.active {
          border-color: var(--gold);
          background: rgba(200,169,110,0.05);
        }

        .mood-swatches {
          display: flex;
          gap: 4px;
          margin-bottom: 10px;
        }

        .mood-swatch {
          width: 20px; height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }

        .mood-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text2);
          margin-bottom: 2px;
        }
        .mood-card.active .mood-label { color: var(--gold); }

        .mood-desc {
          font-size: 11px;
          color: var(--muted);
          font-weight: 300;
        }

        .mood-check {
          position: absolute;
          top: 10px; right: 10px;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--gold);
          color: var(--void);
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.2s;
        }
        .mood-card.active .mood-check { opacity: 1; transform: scale(1); }

        .mood-clear-btn {
          font-size: 12px;
          color: var(--muted);
          background: none;
          border: 1px solid var(--border2);
          border-radius: 6px;
          padding: 5px 12px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
          margin-top: 12px;
        }
        .mood-clear-btn:hover { color: var(--text2); border-color: var(--gold-dim); }

        /* ── Artist influences ──────────────────── */
        .artist-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
          min-height: 32px;
        }

        .artist-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(200,169,110,0.08);
          border: 1px solid rgba(200,169,110,0.2);
          color: var(--gold);
          font-size: 13px;
          font-weight: 400;
          animation: pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes pop-in { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .artist-remove {
          background: none;
          border: none;
          color: var(--gold-dim);
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0;
          transition: color 0.15s;
        }
        .artist-remove:hover { color: var(--gold); }

        .artist-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }

        .artist-text-input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 8px;
          background: var(--panel2);
          border: 1px solid var(--border2);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          outline: none;
          transition: border-color 0.2s;
        }
        .artist-text-input:focus { border-color: var(--gold-dim); }
        .artist-text-input::placeholder { color: var(--muted); }

        .artist-add-btn {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--text2);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .artist-add-btn:hover { border-color: var(--gold-dim); color: var(--gold); }

        .artist-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .suggestion-pill {
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--muted);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .suggestion-pill:hover { border-color: var(--gold-dim); color: var(--text2); background: var(--panel2); }
        .suggestion-pill:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── Default settings ───────────────────── */
        .defaults-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 540px) { .defaults-grid { grid-template-columns: 1fr; } }

        .default-group { display: flex; flex-direction: column; gap: 8px; }

        .default-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .default-options { display: flex; flex-direction: column; gap: 6px; }

        .default-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--border2);
          background: var(--panel2);
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .default-option:hover { border-color: var(--gold-dim); }
        .default-option.active {
          border-color: var(--gold);
          background: rgba(200,169,110,0.07);
        }

        .default-radio {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 1.5px solid var(--border2);
          flex-shrink: 0;
          transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .default-option.active .default-radio {
          border-color: var(--gold);
          background: var(--gold);
        }
        .default-option.active .default-radio::after {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--void);
        }

        .default-option-text { display: flex; flex-direction: column; gap: 1px; }
        .default-option-label { font-size: 13px; color: var(--text2); font-weight: 400; }
        .default-option.active .default-option-label { color: var(--gold); font-weight: 500; }
        .default-option-desc { font-size: 10px; color: var(--muted); font-weight: 300; }

        /* ── Preview card ───────────────────────── */
        .preview-card {
          background: linear-gradient(135deg, var(--panel) 0%, var(--panel2) 100%);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px 26px;
          position: relative;
          overflow: hidden;
        }

        .preview-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 60% at 90% 10%, rgba(200,169,110,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .preview-title {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .preview-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .preview-tag {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 400;
          border: 1px solid;
          background: rgba(200,169,110,0.07);
          color: var(--gold);
          border-color: rgba(200,169,110,0.2);
          animation: pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }

        .preview-empty {
          font-size: 13px;
          color: var(--muted);
          font-weight: 300;
          font-style: italic;
        }

        /* ── Buttons ────────────────────────────── */
        .btn-gold {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          background: var(--gold);
          color: var(--void);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: background 0.2s, transform 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-gold:hover:not(:disabled) { background: var(--accent); transform: translateY(-1px); }
        .btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          border-radius: 8px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--muted);
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-ghost:hover { border-color: var(--gold-dim); color: var(--text2); }

        .save-feedback {
          font-size: 13px;
          color: var(--success);
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .error-box {
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(200,110,110,0.07);
          border: 1px solid rgba(200,110,110,0.2);
          color: var(--danger);
          font-size: 13px;
          font-weight: 300;
        }

        .spinner {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.15);
          border-top-color: var(--void);
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="dna-wrap">
        {/* ── Header ─────────────────────────────── */}
        <div className="dna-header">
          <div className="dna-header-left">
            <div className="dna-eyebrow">◉ Style Profile</div>
            <h1 className="dna-title">
              Your Style <em>DNA</em>
            </h1>
            <p className="dna-sub">
              Build your personal aesthetic. These preferences quietly shape
              every generation — injecting your taste into prompts
              automatically.
            </p>
          </div>
          <div className="dna-header-actions">
            {saved && <span className="save-feedback">✓ Saved</span>}
            {error && (
              <span style={{ fontSize: 13, color: "var(--danger)" }}>
                {error}
              </span>
            )}
            <button
              className="btn-ghost"
              onClick={handleReset}
              disabled={isPending}
            >
              {resetting ? "Resetting…" : "Reset"}
            </button>
            <button
              className="btn-gold"
              onClick={handleSave}
              disabled={isPending || !hasChanges}
            >
              {isPending && !resetting ? (
                <>
                  <div className="spinner" />
                  Saving…
                </>
              ) : (
                "Save DNA"
              )}
            </button>
          </div>
        </div>

        {/* ── Live preview ──────────────────────── */}
        <div className="preview-card">
          <div className="preview-title">✦ Your current aesthetic</div>
          {favoriteStyles.length === 0 &&
          !colorMood &&
          artistInfluences.length === 0 ? (
            <p className="preview-empty">
              No preferences set yet — select styles, a color mood, and artist
              influences below.
            </p>
          ) : (
            <div className="preview-tags">
              {favoriteStyles.map((s) => {
                const preset = STYLE_PRESETS.find((p) => p.key === s);
                return preset ? (
                  <span
                    key={s}
                    className="preview-tag"
                    style={{
                      borderColor: `${preset.color}44`,
                      color: preset.color,
                      background: `${preset.color}12`,
                    }}
                  >
                    {preset.emoji} {preset.label}
                  </span>
                ) : null;
              })}
              {colorMood && (
                <span className="preview-tag">
                  🎨 {COLOR_MOODS.find((m) => m.key === colorMood)?.label}{" "}
                  palette
                </span>
              )}
              {artistInfluences.map((a) => (
                <span
                  key={a}
                  className="preview-tag"
                  style={{
                    color: "var(--text2)",
                    borderColor: "var(--border2)",
                    background: "transparent",
                  }}
                >
                  ◉ {a}
                </span>
              ))}
              <span
                className="preview-tag"
                style={{
                  color: "var(--muted)",
                  borderColor: "var(--border2)",
                  background: "transparent",
                }}
              >
                {defaultSize.toLowerCase()} · {defaultQuality.toLowerCase()} ·{" "}
                {defaultStyle.toLowerCase()}
              </span>
            </div>
          )}
        </div>

        {/* ── 1. Favorite styles ────────────────── */}
        <div className="dna-section">
          <div className="dna-section-header">
            <div>
              <div className="dna-section-title">Favorite Styles</div>
              <div className="dna-section-sub">
                Choose up to 6 styles you love. These will be suggested first in
                the generator.
              </div>
            </div>
            <span className="section-count">{favoriteStyles.length} / 6</span>
          </div>
          <div className="dna-section-body">
            <div className="style-grid">
              {STYLE_PRESETS.map((s) => {
                const isActive = favoriteStyles.includes(s.key);
                const isDisabled = !isActive && favoriteStyles.length >= 6;
                return (
                  <div
                    key={s.key}
                    className={`style-card ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                    onClick={() => !isDisabled && toggleStyle(s.key)}
                    style={
                      isActive
                        ? {
                            borderColor: s.color,
                            background: `${s.color}10`,
                            color: s.color,
                            cursor: "pointer",
                          }
                        : {
                            cursor: isDisabled ? "not-allowed" : "pointer",
                            opacity: isDisabled ? 0.4 : 1,
                          }
                    }
                  >
                    <div className="style-card-check">✓</div>
                    <span className="style-card-emoji">{s.emoji}</span>
                    <span className="style-card-label">{s.label}</span>
                    <span className="style-card-desc">{s.desc}</span>
                  </div>
                );
              })}
            </div>
            {favoriteStyles.length >= 6 && (
              <p className="max-note">
                Maximum reached — <strong>remove a style</strong> to add
                another.
              </p>
            )}
          </div>
        </div>

        {/* ── 2. Color mood ──────────────────────── */}
        <div className="dna-section">
          <div className="dna-section-header">
            <div>
              <div className="dna-section-title">Color Mood</div>
              <div className="dna-section-sub">
                Your preferred palette direction. Subtly influences every
                generation&apos;s color temperature.
              </div>
            </div>
            {colorMood && <span className="section-count">1 selected</span>}
          </div>
          <div className="dna-section-body">
            <div className="mood-grid">
              {COLOR_MOODS.map((m) => (
                <div
                  key={m.key}
                  className={`mood-card ${colorMood === m.key ? "active" : ""}`}
                  onClick={() =>
                    setColorMood(colorMood === m.key ? null : m.key)
                  }
                >
                  <div className="mood-check">✓</div>
                  <div className="mood-swatches">
                    {m.swatch.map((c, i) => (
                      <div
                        key={i}
                        className="mood-swatch"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="mood-label">{m.label}</div>
                  <div className="mood-desc">{m.desc}</div>
                </div>
              ))}
            </div>
            {colorMood && (
              <button
                className="mood-clear-btn"
                onClick={() => setColorMood(null)}
              >
                Clear color mood
              </button>
            )}
          </div>
        </div>

        {/* ── 3. Artist influences ───────────────── */}
        <div className="dna-section">
          <div className="dna-section-header">
            <div>
              <div className="dna-section-title">Artist Influences</div>
              <div className="dna-section-sub">
                Directors, painters, animators — their aesthetic gets woven into
                your prompts.
              </div>
            </div>
            <span className="section-count">{artistInfluences.length} / 5</span>
          </div>
          <div className="dna-section-body">
            {artistInfluences.length > 0 && (
              <div className="artist-chips">
                {artistInfluences.map((a) => (
                  <span key={a} className="artist-chip">
                    {a}
                    <button
                      className="artist-remove"
                      onClick={() => removeArtist(a)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="artist-input-row">
              <input
                className="artist-text-input"
                placeholder="e.g. Studio Ghibli, Monet, Wes Anderson…"
                value={artistInput}
                onChange={(e) => setArtistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addArtist();
                  }
                }}
                disabled={artistInfluences.length >= 5}
              />
              <button
                className="artist-add-btn"
                onClick={() => addArtist()}
                disabled={!artistInput.trim() || artistInfluences.length >= 5}
              >
                Add
              </button>
            </div>
            <div className="artist-suggestions">
              {ARTIST_SUGGESTIONS.filter((a) => !artistInfluences.includes(a))
                .slice(0, 8)
                .map((a) => (
                  <button
                    key={a}
                    className="suggestion-pill"
                    onClick={() => addArtist(a)}
                    disabled={artistInfluences.length >= 5}
                  >
                    + {a}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* ── 4. Default generation settings ────── */}
        <div className="dna-section">
          <div className="dna-section-header">
            <div>
              <div className="dna-section-title">Default Settings</div>
              <div className="dna-section-sub">
                Pre-fill the generator with your preferred size, quality, and
                DALL·E mode.
              </div>
            </div>
          </div>
          <div className="dna-section-body">
            <div className="defaults-grid">
              <div className="default-group">
                <span className="default-label">Image Size</span>
                <div className="default-options">
                  {SIZE_OPTIONS.map((o) => (
                    <div
                      key={o.v}
                      className={`default-option ${defaultSize === o.v ? "active" : ""}`}
                      onClick={() => setDefaultSize(o.v)}
                    >
                      <div className="default-radio" />
                      <div className="default-option-text">
                        <span className="default-option-label">{o.l}</span>
                        <span className="default-option-desc">{o.d}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="default-group">
                <span className="default-label">Quality</span>
                <div className="default-options">
                  {QUALITY_OPTIONS.map((o) => (
                    <div
                      key={o.v}
                      className={`default-option ${defaultQuality === o.v ? "active" : ""}`}
                      onClick={() => setDefaultQuality(o.v)}
                    >
                      <div className="default-radio" />
                      <div className="default-option-text">
                        <span className="default-option-label">{o.l}</span>
                        <span className="default-option-desc">{o.d}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="default-group">
                <span className="default-label">DALL·E Mode</span>
                <div className="default-options">
                  {STYLE_OPTIONS.map((o) => (
                    <div
                      key={o.v}
                      className={`default-option ${defaultStyle === o.v ? "active" : ""}`}
                      onClick={() => setDefaultStyle(o.v)}
                    >
                      <div className="default-radio" />
                      <div className="default-option-text">
                        <span className="default-option-label">{o.l}</span>
                        <span className="default-option-desc">{o.d}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom save bar ────────────────────── */}
        {hasChanges && (
          <div
            style={{
              position: "sticky",
              bottom: 20,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              background: "rgba(6,6,8,0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border2)",
              borderRadius: 12,
              padding: "14px 20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              animation: "slide-up 0.2s ease",
            }}
          >
            <style>{`@keyframes slide-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
            <span
              style={{
                fontSize: 13,
                color: "var(--muted)",
                alignSelf: "center",
                fontWeight: 300,
              }}
            >
              You have unsaved changes
            </span>
            <button
              className="btn-ghost"
              onClick={handleReset}
              disabled={isPending}
            >
              Discard
            </button>
            <button
              className="btn-gold"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <div className="spinner" />
                  Saving…
                </>
              ) : (
                "✦ Save DNA"
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
type ImageSize = "SQUARE" | "PORTRAIT" | "LANDSCAPE";
type ImageQuality = "STANDARD" | "HD";
type DalleStyle = "VIVID" | "NATURAL";

interface GenerateResult {
  id: string;
  imageUrl: string;
  prompt: string;
  enhancedPrompt?: string;
}

// ─── Style presets ────────────────────────────────────────────────────────────
const STYLE_PRESETS = [
  { key: "none", emoji: "✦", label: "None", color: "#6b6878" },
  { key: "photorealistic", emoji: "📸", label: "Photo", color: "#a8c4d4" },
  { key: "cinematic", emoji: "🎬", label: "Cinematic", color: "#c8a96e" },
  { key: "anime", emoji: "🎌", label: "Anime", color: "#e87c6b" },
  { key: "cartoon", emoji: "🎨", label: "Cartoon", color: "#e8c46b" },
  { key: "oil_painting", emoji: "🖼️", label: "Oil Paint", color: "#8fba8a" },
  { key: "render_3d", emoji: "🧊", label: "3D Render", color: "#6eb5c8" },
  { key: "watercolor", emoji: "🌊", label: "Watercolor", color: "#c8836e" },
  { key: "sketch", emoji: "✏️", label: "Sketch", color: "#a8a8a8" },
  { key: "pixel_art", emoji: "🎮", label: "Pixel Art", color: "#b06ec8" },
  { key: "fantasy", emoji: "🌌", label: "Fantasy", color: "#7a6ec8" },
  { key: "cyberpunk", emoji: "⚡", label: "Cyberpunk", color: "#6ec8a9" },
  { key: "vintage", emoji: "📷", label: "Vintage", color: "#c8a080" },
];

const SIZE_OPTIONS: {
  value: ImageSize;
  label: string;
  icon: string;
  dim: string;
}[] = [
  { value: "SQUARE", label: "Square", icon: "⬜", dim: "1024×1024" },
  { value: "PORTRAIT", label: "Portrait", icon: "▭", dim: "1024×1792" },
  { value: "LANDSCAPE", label: "Landscape", icon: "▬", dim: "1792×1024" },
];

const EXAMPLE_PROMPTS = [
  "A lone astronaut discovering an ancient temple on Mars at sunset",
  "A tea house floating among cherry blossoms above the clouds",
  "A cyberpunk alley at night, rain-soaked, neon signs reflected in puddles",
  "An elderly lighthouse keeper reading by candlelight during a storm",
  "A dragon made entirely of stained glass, light refracting through its wings",
  "A cozy library inside a giant oak tree, filled with glowing lanterns",
];

// ─── Main component ───────────────────────────────────────────────────────────
export function Generator({
  userCredits,
  userPlan,
}: {
  userCredits: number;
  userPlan: string;
}) {
  const router = useRouter();

  // Form state
  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState("none");
  const [size, setSize] = useState<ImageSize>("SQUARE");
  const [quality, setQuality] = useState<ImageQuality>("STANDARD");
  const [dalleStyle, setDalleStyle] = useState<DalleStyle>("VIVID");
  const [useEnhance, setUseEnhance] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState(userCredits);
  const [showEnhanced, setShowEnhanced] = useState(false);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isPro = userPlan === "PRO";
  const creditCost = quality === "HD" ? 2 : 1;
  const canGenerate =
    prompt.trim().length > 0 && !loading && (isPro || credits >= creditCost);

  // Auto-resize textarea
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  };

  const useExamplePrompt = (p: string) => {
    setPrompt(p);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const copyPrompt = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowEnhanced(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          stylePreset: stylePreset === "none" ? null : stylePreset,
          size,
          quality,
          dalleStyle,
          useEnhance,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Generation failed. Please try again.");
        return;
      }

      setResult(data);
      if (!isPro) setCredits((c) => Math.max(0, c - creditCost));
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [
    canGenerate,
    prompt,
    stylePreset,
    size,
    quality,
    dalleStyle,
    useEnhance,
    creditCost,
    isPro,
    router,
  ]);

  const activeStyle =
    STYLE_PRESETS.find((s) => s.key === stylePreset) ?? STYLE_PRESETS[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .gen-wrap {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
          align-items: start;
        }

        /* ── Left panel ─────────────────────────── */
        .gen-panel {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          position: sticky;
          top: 92px;
        }

        .gen-panel-header {
          padding: 20px 22px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .gen-panel-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
        }

        .credit-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          background: var(--panel2);
          border: 1px solid var(--border2);
          font-size: 12px;
          color: var(--text2);
        }

        .credit-chip-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--gold);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
        }

        .gen-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 22px; }

        /* ── Prompt input ───────────────────────── */
        .prompt-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .field-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .char-count {
          font-size: 11px;
          color: var(--muted);
          font-weight: 300;
        }

        .prompt-textarea {
          width: 100%;
          min-height: 100px;
          background: var(--panel2);
          border: 1px solid var(--border2);
          border-radius: 10px;
          padding: 14px;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.6;
          resize: none;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          overflow: hidden;
        }
        .prompt-textarea:focus {
          border-color: var(--gold-dim);
          box-shadow: 0 0 0 3px rgba(200,169,110,0.08);
        }
        .prompt-textarea::placeholder { color: var(--muted); }

        /* Example prompts */
        .examples-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .example-pill {
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--muted);
          font-size: 11px;
          font-weight: 300;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
        .example-pill:hover {
          border-color: var(--gold-dim);
          color: var(--text2);
          background: var(--panel2);
        }

        /* ── Style presets ──────────────────────── */
        .styles-scroll {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .style-btn {
          aspect-ratio: 1;
          border-radius: 8px;
          border: 1px solid var(--border2);
          background: var(--panel2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s;
          padding: 6px 4px;
          font-family: 'DM Sans', sans-serif;
        }
        .style-btn:hover { background: var(--border); }
        .style-btn.active { border-width: 1px; }

        .style-btn-emoji { font-size: 18px; line-height: 1; }
        .style-btn-label {
          font-size: 9px;
          font-weight: 500;
          color: var(--muted);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1;
        }
        .style-btn.active .style-btn-label { color: inherit; }

        /* ── Size selector ──────────────────────── */
        .size-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

        .size-btn {
          border-radius: 8px;
          border: 1px solid var(--border2);
          background: var(--panel2);
          padding: 10px 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          font-family: 'DM Sans', sans-serif;
        }
        .size-btn:hover { background: var(--border); }
        .size-btn.active {
          border-color: var(--gold);
          background: rgba(200,169,110,0.07);
        }

        .size-icon {
          font-size: 16px;
          line-height: 1;
          color: var(--text2);
        }
        .size-btn.active .size-icon { color: var(--gold); }

        .size-label { font-size: 11px; font-weight: 500; color: var(--muted); }
        .size-btn.active .size-label { color: var(--gold); }

        .size-dim { font-size: 9px; color: var(--muted); font-weight: 300; }

        /* ── Quality + Style toggles ────────────── */
        .toggle-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .toggle-group { display: flex; flex-direction: column; gap: 6px; }

        .toggle-tabs {
          display: flex;
          border-radius: 8px;
          background: var(--panel2);
          border: 1px solid var(--border2);
          padding: 3px;
          gap: 2px;
        }

        .toggle-tab {
          flex: 1;
          padding: 7px 8px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--muted);
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          text-align: center;
          white-space: nowrap;
        }
        .toggle-tab:hover { color: var(--text2); }
        .toggle-tab.active {
          background: var(--border2);
          color: var(--text);
          font-weight: 500;
        }

        .hd-badge {
          font-size: 8px;
          padding: 1px 5px;
          border-radius: 3px;
          background: rgba(200,169,110,0.15);
          color: var(--gold);
          font-weight: 600;
          letter-spacing: 0.06em;
          margin-left: 3px;
          vertical-align: middle;
        }

        /* ── Enhance toggle ─────────────────────── */
        .enhance-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 10px;
          background: var(--panel2);
          border: 1px solid var(--border2);
          cursor: pointer;
          transition: border-color 0.2s;
          user-select: none;
        }
        .enhance-row:hover { border-color: var(--gold-dim); }
        .enhance-row.active { border-color: rgba(200,169,110,0.3); background: rgba(200,169,110,0.04); }

        .enhance-left { display: flex; flex-direction: column; gap: 2px; }
        .enhance-title { font-size: 13px; font-weight: 500; color: var(--text2); }
        .enhance-sub { font-size: 11px; color: var(--muted); font-weight: 300; }

        .switch {
          width: 36px; height: 20px;
          border-radius: 10px;
          background: var(--border2);
          position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .switch.on { background: var(--gold); }
        .switch::after {
          content: '';
          position: absolute;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: white;
          top: 3px; left: 3px;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .switch.on::after { transform: translateX(16px); }

        /* ── Generate button ────────────────────── */
        .gen-btn {
          width: 100%;
          padding: 15px;
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
          gap: 10px;
          box-shadow: 0 0 32px rgba(200,169,110,0.15);
        }
        .gen-btn:hover:not(:disabled) {
          background: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 0 48px rgba(200,169,110,0.25);
        }
        .gen-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .gen-btn-spinner {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: var(--void);
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .gen-btn-cost {
          font-size: 12px;
          opacity: 0.7;
          font-weight: 300;
        }

        .no-credits-msg {
          text-align: center;
          font-size: 12px;
          color: var(--danger);
          font-weight: 300;
          margin-top: -10px;
        }

        /* ── Right panel: Result ────────────────── */
        .result-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 500px;
        }

        /* Empty state */
        .result-empty {
          flex: 1;
          border-radius: 16px;
          border: 1px dashed var(--border2);
          background: var(--panel);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 40px;
          text-align: center;
          min-height: 480px;
        }

        .empty-glyph {
          font-family: 'Playfair Display', serif;
          font-size: 56px;
          color: var(--border2);
          line-height: 1;
          animation: float-glyph 4s ease-in-out infinite;
        }
        @keyframes float-glyph {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }

        .empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: var(--text2);
        }

        .empty-sub { font-size: 14px; color: var(--muted); font-weight: 300; }

        /* Loading skeleton */
        .result-skeleton {
          flex: 1;
          border-radius: 16px;
          background: var(--panel);
          border: 1px solid var(--border);
          overflow: hidden;
          position: relative;
          min-height: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .skeleton-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 20%,
            rgba(200,169,110,0.04) 50%,
            transparent 80%
          );
          animation: skeleton-sweep 2s ease-in-out infinite;
        }
        @keyframes skeleton-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .loading-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
          padding: 40px;
        }

        .loading-ring {
          width: 56px; height: 56px;
          border-radius: 50%;
          border: 2px solid var(--border2);
          border-top-color: var(--gold);
          animation: spin 1s linear infinite;
        }

        .loading-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: var(--text);
        }

        .loading-steps {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 240px;
        }

        .loading-step {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--muted);
          font-weight: 300;
          transition: color 0.3s;
        }

        .loading-step.done { color: var(--text2); }
        .loading-step.active { color: var(--gold); }

        .step-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--border2);
          flex-shrink: 0;
          transition: background 0.3s;
        }
        .loading-step.done .step-dot   { background: var(--text2); }
        .loading-step.active .step-dot { background: var(--gold); animation: pulse-dot 1s ease-in-out infinite; }

        /* Result image */
        .result-image-wrap {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--panel);
          position: relative;
        }

        .result-image {
          width: 100%;
          display: block;
          animation: reveal-img 0.6s ease forwards;
        }
        @keyframes reveal-img {
          from { opacity: 0; transform: scale(1.02); }
          to   { opacity: 1; transform: scale(1); }
        }

        .result-badge-row {
          position: absolute;
          top: 14px; left: 14px;
          display: flex;
          gap: 6px;
        }

        .result-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.06em;
          backdrop-filter: blur(8px);
          background: rgba(6,6,8,0.7);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text2);
        }

        .result-badge.gold {
          color: var(--gold);
          border-color: rgba(200,169,110,0.3);
        }

        /* Actions bar */
        .result-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid var(--border2);
          background: var(--panel);
          color: var(--text2);
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
        }
        .action-btn:hover { border-color: var(--gold-dim); color: var(--text); background: var(--panel2); }
        .action-btn.primary {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--void);
          font-weight: 500;
        }
        .action-btn.primary:hover { background: var(--accent); border-color: var(--accent); }

        /* Prompt reveal */
        .prompt-reveal {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .prompt-reveal-header {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s;
        }
        .prompt-reveal-header:hover { background: var(--panel2); }

        .prompt-reveal-title {
          font-size: 12px;
          font-weight: 500;
          color: var(--muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .prompt-reveal-arrow {
          font-size: 11px;
          color: var(--muted);
          transition: transform 0.2s;
        }
        .prompt-reveal-arrow.open { transform: rotate(180deg); }

        .prompt-reveal-body {
          padding: 0 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .prompt-text-block {
          font-size: 13px;
          line-height: 1.65;
          color: var(--text2);
          font-weight: 300;
          font-style: italic;
        }

        .prompt-copy-btn {
          font-size: 11px;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0;
          transition: color 0.2s;
        }
        .prompt-copy-btn:hover { color: var(--gold); }

        /* Error */
        .error-box {
          padding: 14px 16px;
          border-radius: 10px;
          background: rgba(200,110,110,0.07);
          border: 1px solid rgba(200,110,110,0.2);
          color: var(--danger);
          font-size: 13px;
          font-weight: 300;
          line-height: 1.5;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        @media (max-width: 900px) {
          .gen-wrap { grid-template-columns: 1fr; }
          .gen-panel { position: static; }
        }
      `}</style>

      <div className="gen-wrap">
        {/* ── Left: Controls ─────────────────────── */}
        <div className="gen-panel">
          <div className="gen-panel-header">
            <span className="gen-panel-title">New Generation</span>
            <div className="credit-chip">
              <div className="credit-chip-dot" />
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "var(--gold)",
                  fontWeight: 600,
                }}
              >
                {isPro ? "∞" : credits}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {isPro ? "unlimited" : "credits"}
              </span>
            </div>
          </div>

          <div className="gen-body">
            {/* Prompt */}
            <div>
              <div className="prompt-label">
                <span className="field-label">Your Prompt</span>
                <span className="char-count">{prompt.length} / 1000</span>
              </div>
              <textarea
                ref={textareaRef}
                className="prompt-textarea"
                placeholder="Describe what you want to create…"
                value={prompt}
                onChange={handlePromptChange}
                maxLength={1000}
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                    handleGenerate();
                }}
              />
              <div className="examples-row">
                {EXAMPLE_PROMPTS.slice(0, 4).map((p) => (
                  <button
                    key={p}
                    className="example-pill"
                    onClick={() => useExamplePrompt(p)}
                  >
                    {p.split(" ").slice(0, 5).join(" ")}…
                  </button>
                ))}
              </div>
            </div>

            {/* Style presets */}
            <div>
              <div className="field-label" style={{ marginBottom: 10 }}>
                Style Preset
              </div>
              <div className="styles-scroll">
                {STYLE_PRESETS.map((s) => {
                  const isActive = stylePreset === s.key;
                  return (
                    <button
                      key={s.key}
                      className={`style-btn ${isActive ? "active" : ""}`}
                      onClick={() => setStylePreset(s.key)}
                      style={
                        isActive
                          ? {
                              borderColor: s.color,
                              background: `${s.color}12`,
                              color: s.color,
                            }
                          : {}
                      }
                    >
                      <span className="style-btn-emoji">{s.emoji}</span>
                      <span className="style-btn-label">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size */}
            <div>
              <div className="field-label" style={{ marginBottom: 10 }}>
                Image Size
              </div>
              <div className="size-row">
                {SIZE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    className={`size-btn ${size === s.value ? "active" : ""}`}
                    onClick={() => setSize(s.value)}
                  >
                    <span className="size-icon">{s.icon}</span>
                    <span className="size-label">{s.label}</span>
                    <span className="size-dim">{s.dim}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality + DALL·E style */}
            <div className="toggle-row">
              <div className="toggle-group">
                <span className="field-label">Quality</span>
                <div className="toggle-tabs">
                  <button
                    className={`toggle-tab ${quality === "STANDARD" ? "active" : ""}`}
                    onClick={() => setQuality("STANDARD")}
                  >
                    Standard
                  </button>
                  <button
                    className={`toggle-tab ${quality === "HD" ? "active" : ""}`}
                    onClick={() => setQuality("HD")}
                  >
                    HD <span className="hd-badge">2×</span>
                  </button>
                </div>
              </div>
              <div className="toggle-group">
                <span className="field-label">Mode</span>
                <div className="toggle-tabs">
                  <button
                    className={`toggle-tab ${dalleStyle === "VIVID" ? "active" : ""}`}
                    onClick={() => setDalleStyle("VIVID")}
                  >
                    Vivid
                  </button>
                  <button
                    className={`toggle-tab ${dalleStyle === "NATURAL" ? "active" : ""}`}
                    onClick={() => setDalleStyle("NATURAL")}
                  >
                    Natural
                  </button>
                </div>
              </div>
            </div>

            {/* AI enhance toggle */}
            <div
              className={`enhance-row ${useEnhance ? "active" : ""}`}
              onClick={() => setUseEnhance(!useEnhance)}
            >
              <div className="enhance-left">
                <span className="enhance-title">✦ AI Prompt Enhancer</span>
                <span className="enhance-sub">
                  GPT-4o refines your prompt automatically
                </span>
              </div>
              <div className={`switch ${useEnhance ? "on" : ""}`} />
            </div>

            {/* Generate button */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="gen-btn"
                onClick={handleGenerate}
                disabled={!canGenerate}
              >
                {loading ? (
                  <>
                    <div className="gen-btn-spinner" />
                    Generating…
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 17,
                      }}
                    >
                      ✦
                    </span>
                    Generate
                    {!isPro && (
                      <span className="gen-btn-cost">
                        · {creditCost} credit{creditCost > 1 ? "s" : ""}
                      </span>
                    )}
                  </>
                )}
              </button>

              {!isPro && credits < creditCost && !loading && (
                <p className="no-credits-msg">
                  Not enough credits.{" "}
                  <a
                    href="/app/billing"
                    style={{ color: "var(--gold)", textDecoration: "none" }}
                  >
                    Upgrade to Pro →
                  </a>
                </p>
              )}

              <p
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  textAlign: "center",
                  fontWeight: 300,
                }}
              >
                ⌘ + Enter to generate
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Result ───────────────────────── */}
        <div className="result-panel">
          {/* Error */}
          {error && (
            <div className="error-box">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="result-skeleton">
              <div className="skeleton-shimmer" />
              <div className="loading-content">
                <div className="loading-ring" />
                <div className="loading-title">
                  {useEnhance
                    ? "Crafting your masterpiece…"
                    : "Generating your image…"}
                </div>
                <div className="loading-steps">
                  {useEnhance && (
                    <div className="loading-step active">
                      <div className="step-dot" />
                      GPT-4o is enhancing your prompt
                    </div>
                  )}
                  <div
                    className={`loading-step ${!useEnhance ? "active" : ""}`}
                  >
                    <div className="step-dot" />
                    Sending to DALL·E 3
                  </div>
                  <div className="loading-step">
                    <div className="step-dot" />
                    Rendering image
                  </div>
                </div>
                {activeStyle.key !== "none" && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: activeStyle.color,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{activeStyle.emoji}</span>
                    {activeStyle.label} style
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !result && (
            <div className="result-empty">
              <div className="empty-glyph">✦</div>
              <div className="empty-title">Your image will appear here</div>
              <p className="empty-sub">
                Write a prompt, pick a style, and hit Generate.
                <br />
                {useEnhance &&
                  "GPT-4o will enhance your prompt before sending to DALL·E 3."}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginTop: 8,
                }}
              >
                {EXAMPLE_PROMPTS.slice(4).map((p) => (
                  <button
                    key={p}
                    className="example-pill"
                    onClick={() => useExamplePrompt(p)}
                  >
                    {p.split(" ").slice(0, 5).join(" ")}…
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {!loading && result && (
            <>
              <div className="result-image-wrap">
                <img
                  src={result.imageUrl}
                  alt={result.prompt}
                  className="result-image"
                />
                <div className="result-badge-row">
                  {activeStyle.key !== "none" && (
                    <span className="result-badge gold">
                      {activeStyle.emoji} {activeStyle.label}
                    </span>
                  )}
                  <span className="result-badge">{size.toLowerCase()}</span>
                  <span className="result-badge">{quality}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="result-actions">
                <a
                  href={result.imageUrl}
                  download={`lumina-${result.id}.png`}
                  className="action-btn primary"
                >
                  ↓ Download
                </a>
                <a href={`/app/workbench/${result.id}`} className="action-btn">
                  ⬡ Open in Workbench
                </a>
                <button
                  className="action-btn"
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                >
                  ✦ Generate another
                </button>
              </div>

              {/* Prompt reveal */}
              <div className="prompt-reveal">
                <div
                  className="prompt-reveal-header"
                  onClick={() => setShowEnhanced(!showEnhanced)}
                >
                  <span className="prompt-reveal-title">
                    <span style={{ color: "var(--gold)" }}>✦</span>
                    {result.enhancedPrompt
                      ? "AI-Enhanced Prompt"
                      : "Original Prompt"}
                  </span>
                  <span
                    className={`prompt-reveal-arrow ${showEnhanced ? "open" : ""}`}
                  >
                    ▾
                  </span>
                </div>

                {showEnhanced && (
                  <div className="prompt-reveal-body">
                    {result.enhancedPrompt &&
                      result.enhancedPrompt !== result.prompt && (
                        <>
                          <p className="prompt-text-block">
                            "{result.enhancedPrompt}"
                          </p>
                          <button
                            className="prompt-copy-btn"
                            onClick={() => copyPrompt(result.enhancedPrompt!)}
                          >
                            {copied ? "✓ Copied" : "⎘ Copy enhanced prompt"}
                          </button>
                          <div
                            style={{
                              height: 1,
                              background: "var(--border)",
                              margin: "4px 0",
                            }}
                          />
                          <p style={{ fontSize: 11, color: "var(--muted)" }}>
                            Original: <em>"{result.prompt}"</em>
                          </p>
                        </>
                      )}
                    {(!result.enhancedPrompt ||
                      result.enhancedPrompt === result.prompt) && (
                      <p className="prompt-text-block">"{result.prompt}"</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  toggleFavoriteAction,
  updateTitleAction,
  updateTagsAction,
  saveGenerationAction,
  deleteGenerationAction,
} from "@/actions/gallery";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
type Generation = {
  id: string;
  imageUrl: string;
  prompt: string;
  enhancedPrompt: string | null;
  stylePreset: string | null;
  size: string;
  quality: string;
  style: string;
  model: string;
  creditsUsed: number;
  createdAt: Date | string;
  savedImage: {
    id: string;
    title: string | null;
    tags: string[];
    isFavorite: boolean;
  } | null;
};

const SIZE_LABEL: Record<string, string> = {
  SQUARE: "1024 × 1024",
  PORTRAIT: "1024 × 1792",
  LANDSCAPE: "1792 × 1024",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({
  tags,
  onSave,
}: {
  tags: string[];
  onSave: (tags: string[]) => Promise<void>;
}) {
  const [localTags, setLocalTags] = useState<string[]>(tags);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addTag = () => {
    const clean = input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    if (!clean || localTags.includes(clean) || localTags.length >= 10) return;
    setLocalTags((prev) => [...prev, clean]);
    setInput("");
  };

  const removeTag = (tag: string) =>
    setLocalTags((prev) => prev.filter((t) => t !== tag));

  const handleSave = async () => {
    setSaving(true);
    await onSave(localTags);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !input && localTags.length)
      removeTag(localTags[localTags.length - 1]);
  };

  return (
    <div className="tag-editor">
      <div className="tag-input-wrap">
        {localTags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
            <button className="tag-remove" onClick={() => removeTag(tag)}>
              ×
            </button>
          </span>
        ))}
        <input
          className="tag-text-input"
          placeholder={localTags.length < 10 ? "Add tag…" : "Max 10 tags"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          disabled={localTags.length >= 10}
        />
      </div>
      {JSON.stringify(localTags) !== JSON.stringify(tags) && (
        <button className="tag-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save tags"}
        </button>
      )}
    </div>
  );
}

// ─── Main workbench ───────────────────────────────────────────────────────────
export function WorkbenchClient({ generation }: { generation: Generation }) {
  const router = useRouter();
  const [isPending, startT] = useTransition();

  const [isFavorite, setIsFavorite] = useState(
    generation.savedImage?.isFavorite ?? false,
  );
  const [title, setTitle] = useState(generation.savedImage?.title ?? "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleSaving, setTitleSaving] = useState(false);
  const [titleSaved, setTitleSaved] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [showEnhanced, setShowEnhanced] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // ── Favorite ───────────────────────────────────────────────────────────────
  const handleFavorite = async () => {
    const result = await toggleFavoriteAction(generation.id);
    if (result.success) setIsFavorite(result.isFavorite ?? false);
  };

  // ── Title ──────────────────────────────────────────────────────────────────
  const saveTitle = async () => {
    setTitleSaving(true);
    await updateTitleAction(generation.id, title);
    setTitleSaving(false);
    setTitleSaved(true);
    setEditingTitle(false);
    setTimeout(() => setTitleSaved(false), 2000);
  };

  // ── Tags ───────────────────────────────────────────────────────────────────
  const saveTags = async (tags: string[]) => {
    await updateTagsAction(generation.id, tags);
  };

  // ── Copy ──────────────────────────────────────────────────────────────────
  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const downloadImage = async () => {
    try {
      const res = await fetch(generation.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lumina-${generation.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(generation.imageUrl, "_blank");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = () => setDeleteConfirm(true);
  const confirmDelete = () => {
    startT(async () => {
      const result = await deleteGenerationAction(generation.id);
      if (result.success) router.push("/history");
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        /* ── Layout ─────────────────────────────── */
        .wb-wrap {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 900px) {
          .wb-wrap { grid-template-columns: 1fr; }
        }

        /* ── Breadcrumb ─────────────────────────── */
        .wb-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 13px;
          color: var(--muted);
          grid-column: 1 / -1;
        }
        .wb-breadcrumb a { color: var(--muted); text-decoration: none; transition: color 0.15s; }
        .wb-breadcrumb a:hover { color: var(--gold); }
        .wb-breadcrumb-sep { color: var(--border2); }

        /* ── Image panel ────────────────────────── */
        .wb-image-panel {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .wb-image-wrap {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--panel);
          position: relative;
          cursor: zoom-in;
        }
        .wb-image-wrap.zoomed { cursor: zoom-out; }

        .wb-image {
          width: 100%;
          display: block;
          transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .wb-image-wrap.zoomed .wb-image { transform: scale(1.5); }

        /* Image action bar */
        .wb-image-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .wb-action-btn {
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
        .wb-action-btn:hover { border-color: var(--gold-dim); color: var(--text); background: var(--panel2); }
        .wb-action-btn.gold {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--void);
          font-weight: 500;
        }
        .wb-action-btn.gold:hover { background: var(--accent); border-color: var(--accent); }
        .wb-action-btn.active { border-color: #e87c6b; color: #e87c6b; background: rgba(232,124,107,0.07); }
        .wb-action-btn.danger:hover { border-color: rgba(200,110,110,0.4); color: var(--danger); background: rgba(200,110,110,0.07); }

        /* ── Sidebar panel ──────────────────────── */
        .wb-sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: sticky;
          top: 92px;
        }

        .wb-section {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
        }

        .wb-section-header {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s;
        }
        .wb-section-header:hover { background: var(--panel2); }

        .wb-section-title {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .wb-section-title-icon { color: var(--gold); }

        .wb-chevron {
          font-size: 11px;
          color: var(--muted);
          transition: transform 0.2s;
        }
        .wb-chevron.open { transform: rotate(180deg); }

        .wb-section-body { padding: 16px 18px; }

        /* ── Title editor ───────────────────────── */
        .title-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title-text {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          flex: 1;
          line-height: 1.3;
        }

        .title-placeholder {
          font-style: italic;
          color: var(--muted);
          font-weight: 400;
        }

        .title-edit-btn {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .title-edit-btn:hover { color: var(--gold); background: var(--panel2); }

        .title-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          background: var(--panel2);
          border: 1px solid var(--border2);
          color: var(--text);
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 8px;
        }
        .title-input:focus { border-color: var(--gold-dim); }

        .title-save-row {
          display: flex;
          gap: 6px;
        }

        .title-save-btn {
          padding: 7px 14px;
          border-radius: 6px;
          border: none;
          background: var(--gold);
          color: var(--void);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .title-save-btn:hover { background: var(--accent); }
        .title-save-btn:disabled { opacity: 0.5; }

        .title-cancel-btn {
          padding: 7px 12px;
          border-radius: 6px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .title-cancel-btn:hover { color: var(--text2); }

        /* ── Prompt section ─────────────────────── */
        .prompt-block {
          font-size: 13px;
          color: var(--text2);
          font-weight: 300;
          line-height: 1.7;
          font-style: italic;
          margin-bottom: 10px;
        }

        .prompt-copy-btn {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 11px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0;
          transition: color 0.15s;
        }
        .prompt-copy-btn:hover { color: var(--gold); }

        .enhanced-toggle {
          font-size: 11px;
          color: var(--gold);
          cursor: pointer;
          margin-top: 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: opacity 0.15s;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
        }
        .enhanced-toggle:hover { opacity: 0.75; }

        /* ── Metadata grid ──────────────────────── */
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .meta-item { display: flex; flex-direction: column; gap: 3px; }

        .meta-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .meta-value {
          font-size: 13px;
          color: var(--text2);
          font-weight: 400;
          text-transform: capitalize;
        }
        .meta-value.gold { color: var(--gold); }

        /* ── Tag editor ─────────────────────────── */
        .tag-editor { display: flex; flex-direction: column; gap: 8px; }

        .tag-input-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 8px;
          background: var(--panel2);
          border: 1px solid var(--border2);
          min-height: 44px;
          align-items: center;
          cursor: text;
          transition: border-color 0.2s;
        }
        .tag-input-wrap:focus-within { border-color: var(--gold-dim); }

        .tag-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(200,169,110,0.1);
          border: 1px solid rgba(200,169,110,0.2);
          color: var(--gold);
          font-size: 11px;
          font-weight: 500;
        }

        .tag-remove {
          background: none;
          border: none;
          color: var(--gold-dim);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
          transition: color 0.15s;
        }
        .tag-remove:hover { color: var(--gold); }

        .tag-text-input {
          background: none;
          border: none;
          outline: none;
          color: var(--text2);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 300;
          flex: 1;
          min-width: 80px;
        }
        .tag-text-input::placeholder { color: var(--muted); }

        .tag-hint { font-size: 10px; color: var(--muted); font-weight: 300; }

        .tag-save-btn {
          align-self: flex-start;
          padding: 6px 14px;
          border-radius: 6px;
          border: none;
          background: var(--gold);
          color: var(--void);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .tag-save-btn:hover { background: var(--accent); }

        /* ── Delete modal ───────────────────────── */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fade-in 0.15s ease;
        }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }

        .modal-card {
          background: var(--panel);
          border: 1px solid var(--border2);
          border-radius: 16px;
          padding: 32px;
          max-width: 360px;
          width: 100%;
          animation: slide-up 0.2s ease;
        }
        @keyframes slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 10px;
        }

        .modal-sub {
          font-size: 14px;
          color: var(--muted);
          font-weight: 300;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .modal-actions { display: flex; gap: 10px; }

        .modal-btn {
          flex: 1;
          padding: 11px;
          border-radius: 8px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--text2);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .modal-btn:hover { background: var(--panel2); }
        .modal-btn.danger {
          background: rgba(200,110,110,0.1);
          border-color: rgba(200,110,110,0.3);
          color: var(--danger);
          font-weight: 500;
        }
        .modal-btn.danger:hover { background: rgba(200,110,110,0.2); }
      `}</style>

      {/* ── Breadcrumb ─────────────────────────── */}
      <div className="wb-breadcrumb">
        <Link href="/history">◈ History</Link>
        <span className="wb-breadcrumb-sep">/</span>
        <span style={{ color: "var(--text2)" }}>
          {generation.savedImage?.title ??
            generation.prompt.slice(0, 40) +
              (generation.prompt.length > 40 ? "…" : "")}
        </span>
      </div>

      <div className="wb-wrap">
        {/* ── Left: Image ───────────────────────── */}
        <div className="wb-image-panel">
          <div
            className={`wb-image-wrap ${zoom ? "zoomed" : ""}`}
            onClick={() => setZoom(!zoom)}
          >
            <img
              src={generation.imageUrl}
              alt={generation.prompt}
              className="wb-image"
            />
          </div>

          {/* Action bar */}
          <div className="wb-image-actions">
            <button className="wb-action-btn gold" onClick={downloadImage}>
              ↓ Download PNG
            </button>
            <button
              className={`wb-action-btn ${isFavorite ? "active" : ""}`}
              onClick={handleFavorite}
            >
              {isFavorite ? "♥ Favorited" : "♡ Favorite"}
            </button>
            <Link href="/dashboard" className="wb-action-btn">
              ✦ Generate similar
            </Link>
            <button className="wb-action-btn danger" onClick={handleDelete}>
              ✕ Delete
            </button>
          </div>

          {/* Zoom hint */}
          <p
            style={{
              fontSize: 11,
              color: "var(--muted)",
              fontWeight: 300,
              textAlign: "center",
            }}
          >
            {zoom ? "Click image to zoom out" : "Click image to zoom in"}
          </p>
        </div>

        {/* ── Right: Sidebar ────────────────────── */}
        <div className="wb-sidebar">
          {/* Title */}
          <div className="wb-section">
            <div
              className="wb-section-header"
              onClick={() => !editingTitle && setEditingTitle(true)}
            >
              <span className="wb-section-title">
                <span className="wb-section-title-icon">✦</span>
                Title
              </span>
              {!editingTitle && (
                <button
                  className="title-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTitle(true);
                  }}
                >
                  Edit
                </button>
              )}
            </div>
            <div className="wb-section-body">
              {editingTitle ? (
                <>
                  <input
                    className="title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give this image a title…"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle();
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                    maxLength={100}
                  />
                  <div className="title-save-row">
                    <button
                      className="title-save-btn"
                      onClick={saveTitle}
                      disabled={titleSaving}
                    >
                      {titleSaving
                        ? "Saving…"
                        : titleSaved
                          ? "✓ Saved"
                          : "Save"}
                    </button>
                    <button
                      className="title-cancel-btn"
                      onClick={() => setEditingTitle(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="title-display">
                  {title ? (
                    <span className="title-text">{title}</span>
                  ) : (
                    <span className="title-text title-placeholder">
                      Untitled generation
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Prompt */}
          <div className="wb-section">
            <div
              className="wb-section-header"
              onClick={() => setShowPrompt(!showPrompt)}
            >
              <span className="wb-section-title">
                <span className="wb-section-title-icon">◈</span>
                Prompt
              </span>
              <span className={`wb-chevron ${showPrompt ? "open" : ""}`}>
                ▾
              </span>
            </div>
            {showPrompt && (
              <div className="wb-section-body">
                <p className="prompt-block">&quot;{generation.prompt}&quot;</p>
                <button
                  className="prompt-copy-btn"
                  onClick={() => copyText(generation.prompt, "prompt")}
                >
                  {copied === "prompt" ? "✓ Copied" : "⎘ Copy prompt"}
                </button>

                {generation.enhancedPrompt &&
                  generation.enhancedPrompt !== generation.prompt && (
                    <>
                      <button
                        className="enhanced-toggle"
                        onClick={() => setShowEnhanced(!showEnhanced)}
                      >
                        {showEnhanced ? "▾" : "▸"}{" "}
                        {showEnhanced ? "Hide" : "Show"} GPT-4o enhanced
                      </button>
                      {showEnhanced && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: "1px solid var(--border)",
                          }}
                        >
                          <p
                            className="prompt-block"
                            style={{ color: "var(--gold)", opacity: 0.85 }}
                          >
                            &quot;{generation.enhancedPrompt}&quot;
                          </p>
                          <button
                            className="prompt-copy-btn"
                            onClick={() =>
                              copyText(generation.enhancedPrompt!, "enhanced")
                            }
                          >
                            {copied === "enhanced"
                              ? "✓ Copied"
                              : "⎘ Copy enhanced"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="wb-section">
            <div className="wb-section-header" style={{ cursor: "default" }}>
              <span className="wb-section-title">
                <span className="wb-section-title-icon">◉</span>
                Details
              </span>
            </div>
            <div className="wb-section-body">
              <div className="meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Size</span>
                  <span className="meta-value">
                    {SIZE_LABEL[generation.size] ?? generation.size}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Quality</span>
                  <span
                    className={`meta-value ${generation.quality === "HD" ? "gold" : ""}`}
                  >
                    {generation.quality}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Mode</span>
                  <span className="meta-value">
                    {generation.style.toLowerCase()}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Style preset</span>
                  <span className="meta-value">
                    {generation.stylePreset?.replace("_", " ") ?? "None"}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Credits used</span>
                  <span className="meta-value gold">
                    ◇ {generation.creditsUsed}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Model</span>
                  <span className="meta-value">{generation.model}</span>
                </div>
                <div className="meta-item" style={{ gridColumn: "1 / -1" }}>
                  <span className="meta-label">Created</span>
                  <span className="meta-value" style={{ fontSize: 12 }}>
                    {formatDate(generation.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="wb-section">
            <div className="wb-section-header" style={{ cursor: "default" }}>
              <span className="wb-section-title">
                <span className="wb-section-title-icon">⬡</span>
                Tags
              </span>
            </div>
            <div className="wb-section-body">
              <TagInput
                tags={generation.savedImage?.tags ?? []}
                onSave={saveTags}
              />
              <p className="tag-hint" style={{ marginTop: 6 }}>
                Press Enter or comma to add · up to 10 tags
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete confirm modal ─────────────────── */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Delete this image?</div>
            <p className="modal-sub">
              This will permanently remove this generation from your history and
              cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn danger"
                onClick={confirmDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

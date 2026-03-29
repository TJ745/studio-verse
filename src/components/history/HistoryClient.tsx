"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleFavoriteAction,
  deleteGenerationAction,
  bulkDeleteGenerationsAction,
  getHistoryAction,
} from "@/actions/gallery";

// ─── Types ────────────────────────────────────────────────────────────────────
type Generation = {
  id: string;
  imageUrl: string;
  prompt: string;
  stylePreset: string | null;
  size: string;
  quality: string;
  creditsUsed: number;
  createdAt: Date | string;
  savedImage: {
    id: string;
    title: string | null;
    tags: string[];
    isFavorite: boolean;
  } | null;
};

const STYLE_FILTERS = [
  { key: "all", label: "All" },
  { key: "photorealistic", label: "Photo" },
  { key: "cinematic", label: "Cinematic" },
  { key: "anime", label: "Anime" },
  { key: "cartoon", label: "Cartoon" },
  { key: "oil_painting", label: "Oil Paint" },
  { key: "render_3d", label: "3D Render" },
  { key: "watercolor", label: "Watercolor" },
  { key: "sketch", label: "Sketch" },
  { key: "pixel_art", label: "Pixel Art" },
  { key: "fantasy", label: "Fantasy" },
  { key: "cyberpunk", label: "Cyberpunk" },
  { key: "vintage", label: "Vintage" },
];

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Single card ──────────────────────────────────────────────────────────────
function GenCard({
  gen,
  selected,
  selecting,
  onSelect,
  onFavorite,
  onDelete,
}: {
  gen: Generation;
  selected: boolean;
  selecting: boolean;
  onSelect: (id: string) => void;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [favoriting, setFavoriting] = useState(false);
  const isFav = gen.savedImage?.isFavorite ?? false;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavoriting(true);
    await onFavorite(gen.id);
    setFavoriting(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(gen.id);
  };

  return (
    <div
      className={`gen-card ${selected ? "selected" : ""} ${selecting ? "selecting-mode" : ""}`}
    >
      {/* Select checkbox */}
      {selecting && (
        <button
          className={`card-checkbox ${selected ? "checked" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(gen.id);
          }}
        >
          {selected ? "✓" : ""}
        </button>
      )}

      {/* Image */}
      <Link href={`/workbench/${gen.id}`} className="card-img-wrap">
        <img
          src={gen.imageUrl}
          alt={gen.prompt}
          className="card-img"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div className="card-overlay">
          <p className="card-prompt">{gen.prompt}</p>
          <div className="card-overlay-actions">
            <span className="overlay-btn">⬡ Workbench</span>
          </div>
        </div>

        {/* Badges */}
        <div className="card-badges">
          {gen.stylePreset && (
            <span className="card-badge gold">
              {gen.stylePreset.replace("_", " ")}
            </span>
          )}
          {gen.quality === "HD" && <span className="card-badge">HD</span>}
        </div>
      </Link>

      {/* Footer */}
      <div className="card-footer">
        <span className="card-time">{timeAgo(gen.createdAt)}</span>
        <div className="card-actions">
          <button
            className={`card-action-btn ${isFav ? "favorited" : ""}`}
            onClick={handleFavorite}
            disabled={favoriting}
            title={isFav ? "Unfavorite" : "Favorite"}
          >
            {isFav ? "♥" : "♡"}
          </button>
          <button
            className="card-action-btn danger"
            onClick={handleDelete}
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────
export function HistoryClient({
  initialGenerations,
  total,
}: {
  initialGenerations: Generation[];
  total: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [generations, setGenerations] =
    useState<Generation[]>(initialGenerations);
  const [totalCount, setTotalCount] = useState(total);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [styleFilter, setStyleFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const hasMore = generations.length < totalCount;

  // ── Filter locally on already-loaded data ─────────────────────────────────
  const filtered = generations.filter((g) => {
    if (styleFilter !== "all" && g.stylePreset !== styleFilter) return false;
    if (qualityFilter !== "all" && g.quality !== qualityFilter) return false;
    if (favoritesOnly && !g.savedImage?.isFavorite) return false;
    return true;
  });

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = async () => {
    setLoading(true);
    const nextPage = page + 1;
    const result = await getHistoryAction(nextPage, 24);
    if (result.success && result.generations) {
      setGenerations((prev) => [
        ...prev,
        ...(result.generations as Generation[]),
      ]);
      setPage(nextPage);
      setTotalCount(result.total);
    }
    setLoading(false);
  };

  // ── Favorite toggle ───────────────────────────────────────────────────────
  const handleFavorite = async (id: string) => {
    const result = await toggleFavoriteAction(id);
    if (result.success) {
      setGenerations((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                savedImage: {
                  id: g.savedImage?.id ?? "",
                  title: g.savedImage?.title ?? null,
                  tags: g.savedImage?.tags ?? [],
                  isFavorite: result.isFavorite ?? false,
                },
              }
            : g,
        ),
      );
    }
  };

  // ── Delete single ─────────────────────────────────────────────────────────
  const handleDelete = (id: string) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteGenerationAction(deleteTarget);
      if (result.success) {
        setGenerations((prev) => prev.filter((g) => g.id !== deleteTarget));
        setTotalCount((c) => c - 1);
      }
      setDeleteTarget(null);
    });
  };

  // ── Bulk select ───────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map((g) => g.id)));
  const clearSelection = () => {
    setSelected(new Set());
    setSelecting(false);
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selected);
    const result = await bulkDeleteGenerationsAction(ids);
    if (result.success) {
      setGenerations((prev) => prev.filter((g) => !ids.includes(g.id)));
      setTotalCount((c) => c - result.deleted);
      clearSelection();
    }
    setBulkLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        /* ── Toolbar ────────────────────────────── */
        .history-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          flex-wrap: wrap;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Filter pills */
        .filter-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          flex-wrap: nowrap;
        }
        .filter-scroll::-webkit-scrollbar { display: none; }

        .filter-pill {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--muted);
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .filter-pill:hover { border-color: var(--gold-dim); color: var(--text2); }
        .filter-pill.active {
          background: rgba(200,169,110,0.1);
          border-color: rgba(200,169,110,0.3);
          color: var(--gold);
          font-weight: 500;
        }

        .toolbar-sep {
          width: 1px;
          height: 20px;
          background: var(--border2);
          flex-shrink: 0;
        }

        .toolbar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--muted);
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .toolbar-btn:hover { border-color: var(--gold-dim); color: var(--text2); }
        .toolbar-btn.active {
          background: rgba(200,169,110,0.08);
          border-color: rgba(200,169,110,0.25);
          color: var(--gold);
        }
        .toolbar-btn.danger { color: var(--danger); border-color: rgba(200,110,110,0.3); }
        .toolbar-btn.danger:hover { background: rgba(200,110,110,0.07); }

        .count-badge {
          background: var(--gold);
          color: var(--void);
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 10px;
        }

        /* ── Masonry grid ───────────────────────── */
        .history-grid {
          columns: 4;
          column-gap: 12px;
        }

        @media (max-width: 1200px) { .history-grid { columns: 3; } }
        @media (max-width: 800px)  { .history-grid { columns: 2; } }
        @media (max-width: 480px)  { .history-grid { columns: 1; } }

        /* ── Generation card ────────────────────── */
        .gen-card {
          break-inside: avoid;
          margin-bottom: 12px;
          border-radius: 12px;
          overflow: hidden;
          background: var(--panel);
          border: 1px solid var(--border);
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
          position: relative;
        }
        .gen-card:hover { transform: translateY(-3px); border-color: var(--gold-dim); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .gen-card.selected {
          border-color: var(--gold);
          box-shadow: 0 0 0 2px rgba(200,169,110,0.2);
        }

        /* Checkbox */
        .card-checkbox {
          position: absolute;
          top: 10px; left: 10px;
          z-index: 10;
          width: 22px; height: 22px;
          border-radius: 6px;
          border: 2px solid rgba(255,255,255,0.3);
          background: rgba(6,6,8,0.7);
          backdrop-filter: blur(4px);
          color: var(--gold);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .card-checkbox.checked {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--void);
        }

        .card-img-wrap {
          display: block;
          position: relative;
          overflow: hidden;
          text-decoration: none;
        }

        .card-img {
          width: 100%;
          display: block;
          transition: transform 0.3s;
        }
        .gen-card:hover .card-img { transform: scale(1.02); }

        /* Overlay */
        .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(6,6,8,0.9) 0%, rgba(6,6,8,0.3) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.25s;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 14px;
          gap: 10px;
        }
        .gen-card:hover .card-overlay { opacity: 1; }

        .card-prompt {
          font-size: 12px;
          color: var(--text2);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-weight: 300;
          font-style: italic;
        }

        .card-overlay-actions { display: flex; gap: 6px; }

        .overlay-btn {
          padding: 5px 12px;
          border-radius: 6px;
          background: rgba(200,169,110,0.15);
          border: 1px solid rgba(200,169,110,0.3);
          color: var(--gold);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        /* Badges */
        .card-badges {
          position: absolute;
          top: 10px; right: 10px;
          display: flex;
          gap: 4px;
          flex-direction: column;
          align-items: flex-end;
        }

        .card-badge {
          font-size: 9px;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(6,6,8,0.75);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.07);
          color: var(--muted);
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: capitalize;
          white-space: nowrap;
        }
        .card-badge.gold { color: var(--gold); border-color: rgba(200,169,110,0.2); }

        /* Card footer */
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
        }

        .card-time {
          font-size: 11px;
          color: var(--muted);
          font-weight: 300;
        }

        .card-actions { display: flex; gap: 4px; }

        .card-action-btn {
          width: 26px; height: 26px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .card-action-btn:hover { background: var(--panel2); color: var(--text2); }
        .card-action-btn.favorited { color: #e87c6b; }
        .card-action-btn.favorited:hover { color: #e87c6b; background: rgba(232,124,107,0.1); }
        .card-action-btn.danger:hover { color: var(--danger); background: rgba(200,110,110,0.08); }

        /* ── Empty state ────────────────────────── */
        .history-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          text-align: center;
          gap: 16px;
        }

        .empty-glyph {
          font-family: 'Playfair Display', serif;
          font-size: 52px;
          color: var(--border2);
          animation: float-g 4s ease-in-out infinite;
        }
        @keyframes float-g {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }

        .empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: var(--text2);
        }

        .empty-sub {
          font-size: 14px;
          color: var(--muted);
          font-weight: 300;
          max-width: 320px;
          line-height: 1.7;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          background: var(--gold);
          color: var(--void);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-primary:hover { background: var(--accent); }

        /* ── Load more ──────────────────────────── */
        .load-more-wrap {
          text-align: center;
          padding: 32px 0 8px;
        }

        .load-more-btn {
          padding: 11px 32px;
          border-radius: 8px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--text2);
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .load-more-btn:hover { border-color: var(--gold-dim); color: var(--gold); }
        .load-more-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .load-spinner {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid var(--border2);
          border-top-color: var(--gold);
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Stats bar ──────────────────────────── */
        .stats-bar {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          font-weight: 300;
        }

        .stats-bar strong { color: var(--text2); font-weight: 500; }

        /* ── Delete confirm modal ───────────────── */
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
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

        .modal-card {
          background: var(--panel);
          border: 1px solid var(--border2);
          border-radius: 16px;
          padding: 32px;
          max-width: 360px;
          width: 100%;
          animation: slide-up 0.2s ease;
        }
        @keyframes slide-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

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
          font-weight: 400;
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

      {/* ── Toolbar ────────────────────────────── */}
      <div className="history-toolbar">
        <div className="toolbar-left">
          {/* Style filter pills */}
          <div className="filter-scroll">
            {STYLE_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-pill ${styleFilter === f.key ? "active" : ""}`}
                onClick={() => setStyleFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="toolbar-sep" />

          {/* Quality filter */}
          <button
            className={`filter-pill ${qualityFilter === "HD" ? "active" : ""}`}
            onClick={() =>
              setQualityFilter(qualityFilter === "HD" ? "all" : "HD")
            }
          >
            HD only
          </button>

          {/* Favorites filter */}
          <button
            className={`toolbar-btn ${favoritesOnly ? "active" : ""}`}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          >
            ♥ Favorites
          </button>
        </div>

        <div className="toolbar-right">
          {selecting ? (
            <>
              <button className="toolbar-btn" onClick={selectAll}>
                Select all
              </button>
              {selected.size > 0 && (
                <button
                  className="toolbar-btn danger"
                  onClick={bulkDelete}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? "Deleting…" : `Delete`}
                  {selected.size > 0 && !bulkLoading && (
                    <span className="count-badge">{selected.size}</span>
                  )}
                </button>
              )}
              <button className="toolbar-btn" onClick={clearSelection}>
                Cancel
              </button>
            </>
          ) : (
            <button className="toolbar-btn" onClick={() => setSelecting(true)}>
              ◻ Select
            </button>
          )}
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────── */}
      {totalCount > 0 && (
        <div className="stats-bar">
          <span>
            <strong>{filtered.length}</strong> shown of{" "}
            <strong>{totalCount}</strong> total
          </span>
          {favoritesOnly && <span>· Favorites only</span>}
          {styleFilter !== "all" && (
            <span>· Style: {styleFilter.replace("_", " ")}</span>
          )}
        </div>
      )}

      {/* ── Grid / Empty ───────────────────────── */}
      {filtered.length === 0 ? (
        <div className="history-empty">
          <span className="empty-glyph">◈</span>
          {totalCount === 0 ? (
            <>
              <div className="empty-title">No generations yet</div>
              <p className="empty-sub">
                Your creations will appear here. Start generating to build your
                timeline.
              </p>
              <Link href="/dashboard" className="btn-primary">
                ✦ Start generating
              </Link>
            </>
          ) : (
            <>
              <div className="empty-title">No results</div>
              <p className="empty-sub">
                No generations match your current filters. Try changing the
                style or removing filters.
              </p>
              <button
                className="btn-primary"
                onClick={() => {
                  setStyleFilter("all");
                  setQualityFilter("all");
                  setFavoritesOnly(false);
                }}
                style={{ border: "none", cursor: "pointer" }}
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="history-grid">
            {filtered.map((gen) => (
              <GenCard
                key={gen.id}
                gen={gen}
                selected={selected.has(gen.id)}
                selecting={selecting}
                onSelect={toggleSelect}
                onFavorite={handleFavorite}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="load-more-wrap">
              <button
                className="load-more-btn"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="load-spinner" /> Loading…
                  </>
                ) : (
                  `Load more · ${totalCount - generations.length} remaining`
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Delete confirm modal ────────────────── */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Delete image?</div>
            <p className="modal-sub">
              This will permanently remove the generation from your history.
              This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="modal-btn danger"
                onClick={confirmDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// src/app/(app)/history/page.tsx
// History — full generation timeline (Phase 7 fills the full UI)

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HistoryPage() {
  const user = await requireUser();

  const generations = await prisma.generation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      imageUrl: true,
      prompt: true,
      stylePreset: true,
      size: true,
      quality: true,
      creditsUsed: true,
      createdAt: true,
    },
  });

  return (
    <>
      <style>{`
        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .history-card {
          border-radius: 12px;
          overflow: hidden;
          background: var(--panel);
          border: 1px solid var(--border);
          transition: transform 0.2s, border-color 0.2s;
          text-decoration: none;
          display: block;
          cursor: pointer;
        }
        .history-card:hover { transform: translateY(-4px); border-color: var(--gold-dim); }

        .history-img-wrap {
          aspect-ratio: 1;
          background: var(--panel2);
          overflow: hidden;
          position: relative;
        }

        .history-img { width: 100%; height: 100%; object-fit: cover; }

        .history-card-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .history-prompt {
          font-size: 12px;
          color: var(--text2);
          font-weight: 300;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .history-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .meta-tag {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 4px;
          background: var(--panel2);
          border: 1px solid var(--border2);
          color: var(--muted);
          font-weight: 400;
          letter-spacing: 0.04em;
        }

        .meta-tag.gold {
          color: var(--gold);
          background: rgba(200,169,110,0.06);
          border-color: rgba(200,169,110,0.15);
        }

        .history-empty {
          text-align: center;
          padding: 80px 24px;
          color: var(--muted);
        }

        .history-empty-icon {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          color: var(--gold-dim);
          display: block;
          margin-bottom: 16px;
        }

        .history-empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: var(--text2);
          margin-bottom: 8px;
        }
      `}</style>

      {generations.length === 0 ? (
        <div className="history-empty">
          <span className="history-empty-icon">◈</span>
          <div className="history-empty-title">No history yet</div>
          <p style={{ fontSize: 14, marginBottom: 20, fontWeight: 300 }}>
            Generate your first image to see it here.
          </p>
          <Link
            href="/app/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 22px",
              borderRadius: 8,
              background: "var(--gold)",
              color: "var(--void)",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ✦ Start generating
          </Link>
        </div>
      ) : (
        <div className="history-grid">
          {generations.map((gen) => (
            <Link
              key={gen.id}
              href={`/app/workbench/${gen.id}`}
              className="history-card"
            >
              <div className="history-img-wrap">
                <img
                  src={gen.imageUrl}
                  alt={gen.prompt}
                  className="history-img"
                />
              </div>
              <div className="history-card-body">
                <p className="history-prompt">{gen.prompt}</p>
                <div className="history-meta">
                  {gen.stylePreset && (
                    <span className="meta-tag gold">{gen.stylePreset}</span>
                  )}
                  <span className="meta-tag">{gen.size.toLowerCase()}</span>
                  <span className="meta-tag">{gen.quality.toLowerCase()}</span>
                  <span className="meta-tag">◇ {gen.creditsUsed}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

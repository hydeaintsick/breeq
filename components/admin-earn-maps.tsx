"use client";

import { useState, useTransition } from "react";
import { setMapFeatured, setMapStatus } from "@/app/actions/admin";
import { GemGlyph } from "@/components/currency-glyphs";
import { formatGems } from "@/lib/economy";

export type AdminMapRow = {
  id: string;
  title: string;
  author: string;
  ticketGems: number;
  difficulty: number;
  difficultyLabel: string;
  plays: number;
  wins: number;
  featured: boolean;
  featuredOrder: number;
  status: "PUBLISHED" | "HIDDEN";
  createdAt: string;
};

export function AdminEarnMaps({ rows }: { rows: AdminMapRow[] }) {
  const [pending, startTransition] = useTransition();
  const [orders, setOrders] = useState<Record<string, number>>(() =>
    Object.fromEntries(rows.map((row) => [row.id, row.featuredOrder])),
  );

  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-ink-muted">No maps published yet.</p>;
  }

  return (
    <div className="admin-table-wrap mt-6" data-pending={pending}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Map</th>
            <th>Ticket</th>
            <th>Difficulty</th>
            <th>Plays</th>
            <th>Won</th>
            <th>Featured</th>
            <th>Order</th>
            <th>Visible</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rate = row.plays > 0 ? Math.round((row.wins / row.plays) * 100) : 0;
            return (
              <tr key={row.id} className={row.status === "HIDDEN" ? "opacity-60" : undefined}>
                <td>
                  <p className="font-medium text-ink">{row.title}</p>
                  <p className="text-xs text-ink-muted">
                    by {row.author} · {new Date(row.createdAt).toLocaleDateString("en-US")}
                  </p>
                </td>
                <td className="whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <GemGlyph /> {formatGems(row.ticketGems)}
                  </span>
                </td>
                <td className="whitespace-nowrap">
                  {row.difficulty} · {row.difficultyLabel}
                </td>
                <td>{row.plays.toLocaleString("en-US")}</td>
                <td className="whitespace-nowrap">
                  {row.wins.toLocaleString("en-US")} <span className="text-ink-muted">({rate}%)</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="editor-switch"
                    role="switch"
                    aria-checked={row.featured}
                    aria-label={`Feature ${row.title}`}
                    onClick={() => startTransition(() => setMapFeatured(row.id, !row.featured, orders[row.id]))}
                  >
                    <span className="editor-switch-track" aria-hidden="true">
                      <span className="editor-switch-thumb" />
                    </span>
                  </button>
                </td>
                <td>
                  <input
                    type="number"
                    className="field field-sm w-16 tabular-nums"
                    min={0}
                    value={orders[row.id] ?? 0}
                    aria-label={`Featured order for ${row.title}`}
                    onChange={(e) => setOrders((current) => ({ ...current, [row.id]: Number(e.target.value) }))}
                    onBlur={(e) => {
                      const next = Number(e.target.value);
                      if (next !== row.featuredOrder) startTransition(() => setMapFeatured(row.id, row.featured, next));
                    }}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-glass btn-sm"
                    onClick={() => startTransition(() => setMapStatus(row.id, row.status === "HIDDEN" ? "PUBLISHED" : "HIDDEN"))}
                  >
                    {row.status === "HIDDEN" ? "Show" : "Hide"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

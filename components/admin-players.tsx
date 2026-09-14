"use client";

import { useState } from "react";
import { grantGems } from "@/app/actions/admin";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { formatEth, formatGems } from "@/lib/economy";

export type AdminPlayerRow = {
  id: string;
  username: string;
  email: string | null;
  role: string;
  level: number;
  gems: number;
  eth: number;
  runs: number;
  maps: number;
  createdAt: string;
};

export function AdminPlayers({ rows }: { rows: AdminPlayerRow[] }) {
  const [granting, setGranting] = useState<string | null>(null);
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ id: string; text: string; error?: boolean } | null>(null);

  async function grant(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await grantGems(id, Number(amount), note);
      if ("error" in result) setMessage({ id, text: result.error, error: true });
      else {
        setMessage({ id, text: `Done: ${Number(amount) > 0 ? "+" : ""}${formatGems(Number(amount))} gems.` });
        setGranting(null);
      }
    } catch {
      setMessage({ id, text: "Could not grant. Try again.", error: true });
    } finally {
      setBusy(false);
    }
  }

  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-ink-muted">No players match.</p>;
  }

  return (
    <div className="admin-table-wrap mt-6">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Level</th>
            <th>Gems</th>
            <th>ETH</th>
            <th>Tickets</th>
            <th>Maps</th>
            <th>Joined</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <p className="font-medium text-ink">
                  {row.username}
                  {row.role === "ADMIN" ? <span className="ml-2 font-mono text-[0.62rem] tracking-[0.1em] text-accent">ADMIN</span> : null}
                </p>
                <p className="text-xs text-ink-muted">{row.email ?? "—"}</p>
              </td>
              <td>{row.level}</td>
              <td className="whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <GemGlyph /> {formatGems(row.gems)}
                </span>
              </td>
              <td className="whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <EthGlyph /> {formatEth(row.eth, { unit: false })}
                </span>
              </td>
              <td>{row.runs.toLocaleString("en-US")}</td>
              <td>{row.maps.toLocaleString("en-US")}</td>
              <td className="whitespace-nowrap text-ink-muted">{new Date(row.createdAt).toLocaleDateString("en-US")}</td>
              <td>
                {granting === row.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      className="field field-sm w-24 tabular-nums"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      aria-label="Gems to grant (negative to take)"
                    />
                    <input
                      className="field field-sm w-36"
                      placeholder="Note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      aria-label="Note"
                      maxLength={80}
                    />
                    <button type="button" className="btn-play btn-sm" disabled={busy} onClick={() => void grant(row.id)}>
                      {busy ? "…" : "Grant"}
                    </button>
                    <button type="button" className="btn-glass btn-sm" onClick={() => setGranting(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn-glass btn-sm" onClick={() => setGranting(row.id)}>
                    Grant gems
                  </button>
                )}
                {message?.id === row.id ? (
                  <p className={`mt-1 text-xs ${message.error ? "text-danger" : "text-ink-muted"}`}>{message.text}</p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

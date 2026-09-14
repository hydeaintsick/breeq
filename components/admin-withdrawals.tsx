"use client";

import { useState } from "react";
import { resolveWithdrawal } from "@/app/actions/admin";
import { EthGlyph } from "@/components/currency-glyphs";
import { formatEth } from "@/lib/economy";

export type AdminWithdrawalRow = {
  id: string;
  username: string;
  email: string | null;
  eth: number;
  toAddress: string;
  status: "PENDING" | "PAID" | "REJECTED";
  txHash: string | null;
  note: string | null;
  createdAt: string;
};

export function AdminWithdrawals({ rows }: { rows: AdminWithdrawalRow[] }) {
  const [hash, setHash] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; error?: boolean } | null>(null);

  async function resolve(id: string, decision: { status: "PAID"; txHash: string } | { status: "REJECTED"; note?: string }) {
    setBusy(id);
    setMessage(null);
    try {
      const result = await resolveWithdrawal(id, decision);
      if ("error" in result) setMessage({ id, text: result.error, error: true });
    } catch {
      setMessage({ id, text: "Could not update. Try again.", error: true });
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-ink-muted">No withdrawal requests.</p>;
  }

  return (
    <div className="mt-6 grid gap-3">
      {rows.map((row) => (
        <div key={row.id} className="glass p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xl font-semibold tracking-tight text-ink">
                <EthGlyph /> {formatEth(row.eth)}
              </p>
              <p className="mt-1 text-sm text-ink">
                {row.username} <span className="text-ink-muted">{row.email ? `· ${row.email}` : ""}</span>
              </p>
              <p className="mt-1 break-all font-mono text-xs text-ink-muted">{row.toAddress}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {new Date(row.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                {row.status !== "PENDING" ? ` · ${row.status === "PAID" ? "Paid" : "Returned"}` : ""}
                {row.txHash ? ` · ${row.txHash.slice(0, 12)}…` : ""}
                {row.note ? ` · ${row.note}` : ""}
              </p>
            </div>
            {row.status === "PENDING" ? (
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <input
                  className="field field-sm min-w-0 flex-1 font-mono text-xs sm:w-72"
                  placeholder="Transaction hash 0x…"
                  value={hash[row.id] ?? ""}
                  onChange={(e) => setHash((current) => ({ ...current, [row.id]: e.target.value }))}
                  aria-label="Transaction hash"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="btn-play btn-sm"
                  disabled={busy === row.id}
                  onClick={() => void resolve(row.id, { status: "PAID", txHash: hash[row.id] ?? "" })}
                >
                  Mark paid
                </button>
                <button
                  type="button"
                  className="btn-glass btn-sm"
                  disabled={busy === row.id}
                  onClick={() => void resolve(row.id, { status: "REJECTED", note: "Returned by admin" })}
                >
                  Return
                </button>
              </div>
            ) : null}
          </div>
          {message?.id === row.id ? (
            <p className={`mt-2 text-xs ${message.error ? "text-danger" : "text-ink-muted"}`}>{message.text}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

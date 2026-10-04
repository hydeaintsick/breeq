"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { deletePlayer } from "@/app/actions/admin";

export type AdminPlayerRow = {
  id: string;
  username: string;
  email: string | null;
  partner: string | null;
  partnerEmail: string | null;
  role: string;
  joined: string;
  playTime: string;
  country: string;
  channel: string;
  device: string | null;
};

export function AdminPlayers({ rows, selfId }: { rows: AdminPlayerRow[]; selfId: string }) {
  const router = useRouter();
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const [target, setTarget] = useState<AdminPlayerRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  busyRef.current = busy;

  useEffect(() => {
    if (!target) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        setTarget(null);
        setError(null);
        return;
      }
      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button:not(:disabled)")];
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && root.contains(active);
      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [target]);

  async function confirm() {
    if (!target || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await deletePlayer(target.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setTarget(null);
      router.refresh();
    } catch {
      setError("Could not delete this account. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    if (busy) return;
    setTarget(null);
    setError(null);
  }

  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-ink-muted">No players match.</p>;
  }

  return (
    <>
      <div className="admin-table-wrap mt-6">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Joined</th>
              <th>Play time</th>
              <th>Country</th>
              <th>Support</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/players/${row.id}`} className="inline-flex min-h-11 flex-col justify-center underline decoration-hairline underline-offset-4">
                    <span className="font-medium text-ink">
                      {row.username}
                      {row.role === "ADMIN" ? <span className="ml-2 font-mono text-[0.62rem] tracking-[0.1em] text-accent no-underline">ADMIN</span> : null}
                    </span>
                    <span className="text-xs text-ink-muted">{row.email ?? "—"}</span>
                    {row.partner ? (
                      <span className="text-xs text-ink-muted">
                        From {row.partner}
                        {row.partnerEmail ? ` · ${row.partnerEmail}` : ""}
                      </span>
                    ) : null}
                  </Link>
                </td>
                <td className="whitespace-nowrap text-ink-muted">{row.joined}</td>
                <td className="whitespace-nowrap">{row.playTime}</td>
                <td className="whitespace-nowrap">{row.country}</td>
                <td>
                  <span className="block whitespace-nowrap">{row.channel}</span>
                  {row.device ? <span className="block text-xs text-ink-muted">{row.device}</span> : null}
                </td>
                <td className="whitespace-nowrap">
                  {row.id === selfId ? null : (
                    <button
                      type="button"
                      className="admin-row-delete"
                      aria-label={`Delete ${row.username}`}
                      onClick={() => {
                        setError(null);
                        setTarget(row);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {target ? (
        <div className="admin-confirm" onClick={close}>
          <div
            ref={dialogRef}
            className="glass admin-confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="text-xl font-semibold tracking-tight text-ink">
              Delete {target.username}?
            </h2>
            <p id={bodyId} className="mt-2 text-sm leading-6 text-ink-muted">
              This removes the account. Play history, balances, purchases, withdrawals, and any maps they published go with it. None of it is counted anymore.
            </p>
            {error ? (
              <p className="mt-3 text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-5 grid gap-2">
              <button type="button" className="btn-danger min-h-11 w-full" disabled={busy} onClick={() => void confirm()}>
                {busy ? "Deleting…" : "Delete account"}
              </button>
              <button type="button" className="btn-glass min-h-11 w-full" disabled={busy} onClick={close}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

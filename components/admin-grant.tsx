"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { grantGems } from "@/app/actions/admin";
import { formatGems } from "@/lib/economy";

/** Add or remove gems from this player. A negative amount takes them back. */
export function AdminGrant({ userId }: { userId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function grant() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await grantGems(userId, Number(amount), note);
      if ("error" in result) setMessage({ text: result.error, error: true });
      else {
        setMessage({ text: `Done: ${Number(amount) > 0 ? "+" : ""}${formatGems(Number(amount))} gems.` });
        setNote("");
        router.refresh();
      }
    } catch {
      setMessage({ text: "Could not grant. Try again.", error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass p-5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Grant gems</h2>
      <p className="mt-1 text-sm text-ink-muted">A negative number takes gems back. It shows up in their activity.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="number"
          className="field field-sm w-28 tabular-nums"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-label="Gems to grant (negative to take)"
        />
        <input
          className="field field-sm min-w-0 flex-1"
          placeholder="Note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-label="Note"
          maxLength={80}
        />
        <button type="button" className="btn-play min-h-11" disabled={busy} onClick={() => void grant()}>
          {busy ? "Granting…" : "Grant"}
        </button>
      </div>
      {message ? <p className={`mt-2 text-sm ${message.error ? "text-danger" : "text-ink-muted"}`}>{message.text}</p> : null}
    </div>
  );
}

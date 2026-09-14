"use client";

import { useState } from "react";
import { fetchEthPrice, updateEconomy } from "@/app/actions/admin";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { GemBag, bagTierFor } from "@/components/gem-bag";
import {
  formatCents,
  formatEth,
  formatGems,
  formatUsd,
  packListCents,
  packPriceCents,
  payoutFor,
  type Economy,
  type GemPack,
} from "@/lib/economy";

/**
 * The economy, editable, with the consequences shown live: what each pack
 * costs, what a default ticket pays, how many gems a dollar buys.
 */
export function EconomyForm({ initial }: { initial: Economy }) {
  const [form, setForm] = useState<Economy>(initial);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const set = <K extends keyof Economy>(key: K, value: Economy[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };
  const setPack = (index: number, patch: Partial<GemPack>) => {
    setForm((current) => ({
      ...current,
      packs: current.packs.map((pack, i) => (i === index ? { ...pack, ...patch } : pack)),
    }));
    setSaved(false);
  };

  async function save() {
    setPending(true);
    setError(null);
    try {
      const result = await updateEconomy(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function pullPrice() {
    setFetching(true);
    try {
      const result = await fetchEthPrice();
      if ("usd" in result) set("ethPriceUsd", Math.round(result.usd * 100) / 100);
      else setError(result.error);
    } finally {
      setFetching(false);
    }
  }

  const defaultPayout = payoutFor(form.ticketDefaultGems, form);
  const gemsPerDollar = form.gemPriceUsd > 0 ? 1 / form.gemPriceUsd : 0;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="grid gap-6">
        <div className="glass p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Prices</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Num label="Gem price (USD)" value={form.gemPriceUsd} step={0.001} min={0.0001} onChange={(v) => set("gemPriceUsd", v)} hint={`${Math.round(gemsPerDollar)} gems per dollar`} />
            <div className="grid gap-2 text-sm text-ink-muted">
              <span className="flex items-baseline justify-between">
                ETH reference (USD)
                <button type="button" className="text-xs text-ink underline decoration-hairline underline-offset-4" disabled={fetching} onClick={pullPrice}>
                  {fetching ? "Fetching…" : "Use live price"}
                </button>
              </span>
              <input type="number" className="field tabular-nums" step={1} min={1} value={form.ethPriceUsd} onChange={(e) => set("ethPriceUsd", Number(e.target.value))} />
              <span className="text-xs">Payouts are converted at this rate when the ticket is paid.</span>
            </div>
            <Num label="Win multiplier" value={form.winMultiplier} step={0.05} min={0.1} onChange={(v) => set("winMultiplier", v)} hint={`A clear pays ${Math.round(form.winMultiplier * 100)}% of the ticket`} />
            <Num label="Withdrawal minimum (ETH)" value={form.withdrawMinEth} step={0.0001} min={0} onChange={(v) => set("withdrawMinEth", v)} />
          </div>
        </div>

        <div className="glass p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Tickets and publishing</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Num label="Publish cost (gems)" value={form.publishCostGems} step={1} min={0} onChange={(v) => set("publishCostGems", Math.round(v))} />
            <Num label="Default ticket (gems)" value={form.ticketDefaultGems} step={1} min={1} onChange={(v) => set("ticketDefaultGems", Math.round(v))} />
            <Num label="Minimum ticket (gems)" value={form.ticketMinGems} step={1} min={1} onChange={(v) => set("ticketMinGems", Math.round(v))} />
            <Num label="Maximum ticket (gems)" value={form.ticketMaxGems} step={1} min={1} onChange={(v) => set("ticketMaxGems", Math.round(v))} />
          </div>
        </div>

        <div className="glass p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Gem packs</h2>
            <button
              type="button"
              className="text-sm text-ink underline decoration-hairline underline-offset-4"
              onClick={() => set("packs", [...form.packs, { gems: (form.packs.at(-1)?.gems ?? 100) * 2, discountPct: 0, tag: "" }])}
            >
              Add a pack
            </button>
          </div>
          <div className="admin-table-wrap mt-3">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Bag</th>
                  <th>Gems</th>
                  <th>Discount %</th>
                  <th>Badge</th>
                  <th>Price</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {form.packs.map((pack, index) => (
                  <tr key={index}>
                    <td>
                      <GemBag tier={bagTierFor(index, form.packs.length)} className="h-9 w-9" />
                    </td>
                    <td>
                      <input type="number" className="field field-sm w-24 tabular-nums" min={1} value={pack.gems} onChange={(e) => setPack(index, { gems: Number(e.target.value) })} />
                    </td>
                    <td>
                      <input type="number" className="field field-sm w-20 tabular-nums" min={0} max={90} value={pack.discountPct} onChange={(e) => setPack(index, { discountPct: Number(e.target.value) })} />
                    </td>
                    <td>
                      <input className="field field-sm w-32" maxLength={24} placeholder="—" value={pack.tag} onChange={(e) => setPack(index, { tag: e.target.value })} />
                    </td>
                    <td className="whitespace-nowrap">
                      {pack.discountPct > 0 ? <s className="mr-1 text-ink-muted">{formatCents(packListCents(pack.gems, form))}</s> : null}
                      <strong className="text-ink">{formatCents(packPriceCents(pack, form))}</strong>
                    </td>
                    <td>
                      <button type="button" className="text-sm text-ink-muted underline decoration-hairline underline-offset-4" onClick={() => set("packs", form.packs.filter((_, i) => i !== index))}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-play min-h-11" disabled={pending} onClick={save}>
            {pending ? "Saving…" : "Save economy"}
          </button>
          <button type="button" className="btn-glass min-h-11" disabled={pending} onClick={() => setForm(initial)}>
            Reset
          </button>
          {saved ? <span className="text-sm text-ink">Saved.</span> : null}
          {error ? <span className="text-sm text-danger">{error}</span> : null}
        </div>
      </div>

      <aside className="glass h-fit p-5 sm:p-6 lg:sticky lg:top-28">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Live check</p>
        <div className="mt-3">
          <div className="earn-sheet-row">
            <span>Default ticket</span>
            <strong className="inline-flex items-center gap-1.5">
              <GemGlyph /> {formatGems(form.ticketDefaultGems)} · {formatUsd(form.ticketDefaultGems * form.gemPriceUsd)}
            </strong>
          </div>
          <div className="earn-sheet-row" data-big="true">
            <span>A clear pays</span>
            <strong className="inline-flex items-center gap-1.5">
              <EthGlyph /> {formatEth(defaultPayout.eth)}
            </strong>
          </div>
          <div className="earn-sheet-row">
            <span>≈ in USD</span>
            <strong>{formatUsd(defaultPayout.usd)}</strong>
          </div>
          <div className="earn-sheet-row">
            <span>House margin per lost ticket</span>
            <strong>{formatUsd(form.ticketDefaultGems * form.gemPriceUsd)}</strong>
          </div>
          <div className="earn-sheet-row">
            <span>Break-even win rate</span>
            <strong>{form.winMultiplier > 0 ? `${Math.round((1 / form.winMultiplier) * 100)}%` : "—"}</strong>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-ink-muted">
          Below that win rate the pot grows; above it, payouts exceed tickets. The difficulty score on each card is
          the robot&apos;s estimate; watch the real win rate on the dashboard.
        </p>
      </aside>
    </div>
  );
}

function Num({
  label,
  value,
  step,
  min,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  min: number;
  hint?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-ink-muted">
      {label}
      <input type="number" className="field tabular-nums" step={step} min={min} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint ? <span className="text-xs">{hint}</span> : null}
    </label>
  );
}

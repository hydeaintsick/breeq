"use client";

import { useEffect, useRef, useState } from "react";
import { useBalances } from "@/components/balances-provider";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { useGemShop } from "@/components/gem-shop";
import { formatEth, formatGems } from "@/lib/economy";

const COUNT_MS = 720;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * A number that rolls to its new value instead of jumping — the header pill
 * ticks up when a pack lands and down when a ticket is bought. Reduced motion
 * jumps.
 */
function useRolling(value: number): number {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    // Reduced motion: the whole roll happens in one frame.
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : COUNT_MS;
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = ms === 0 ? 1 : Math.min(1, (now - start) / ms);
      const v = from + (value - from) * easeOutCubic(t);
      setShown(t >= 1 ? value : v);
      if (t < 1) raf = requestAnimationFrame(frame);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = value;
    };
  }, [value]);
  return shown;
}

function PlusMark() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The player's bag in the game header: gems and ETH, and a "+" that opens the
 * gem shop sheet — the whole pill is the button, so the tap target is the pill.
 * Folded, it is a 44px chip with the gem on it; tapping unfolds it and folds
 * the level pill beside it.
 */
export function WalletChip({ folded, onUnfold }: { folded: boolean; onUnfold: () => void }) {
  const ctx = useBalances();
  const shop = useGemShop();
  const gems = useRolling(ctx?.balances.gems ?? 0);
  const eth = useRolling(ctx?.balances.eth ?? 0);
  const summary = `${formatGems(Math.round(gems))} gems · ${formatEth(eth)}. Top up.`;

  if (folded) {
    return (
      <button type="button" className="header-chip wallet-folded" aria-label={`Show your bag: ${summary}`} aria-expanded={false} onClick={onUnfold}>
        <GemGlyph className="gem-glyph wallet-folded-gem" />
      </button>
    );
  }

  return (
    <button type="button" className="rank-chip wallet-chip" aria-label={summary} title={summary} aria-haspopup="dialog" aria-expanded={shop.isOpen} onClick={shop.open}>
      <span className="wallet-amount">
        <GemGlyph />
        <span className="wallet-n">{formatGems(Math.round(gems))}</span>
      </span>
      <span className="wallet-amount wallet-eth">
        <EthGlyph />
        <span className="wallet-n">{formatEth(eth, { unit: false })}</span>
      </span>
      <span className="wallet-plus" aria-hidden="true">
        <PlusMark />
      </span>
    </button>
  );
}

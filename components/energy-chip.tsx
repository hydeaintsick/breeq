"use client";

import { useEffect, useRef } from "react";
import { BoltGlyph } from "@/components/currency-glyphs";
import { EnergyGauge } from "@/components/energy-gauge";
import { useEnergy } from "@/components/energy-provider";
import { createEnergySfx, type EnergySfx } from "@/game/breakout/audio";
import { ENERGY_PLAY_COST, formatEnergyWait, runsLeft } from "@/lib/energy";

function PlusMark() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** The gauge's voice follows the shared state: a cell leaving or landing while a pill is on screen is heard. */
function useEnergyVoice(energy: number, max: number) {
  const previous = useRef(energy);
  const sfxRef = useRef<EnergySfx | null>(null);
  useEffect(() => {
    const sfx = createEnergySfx();
    sfxRef.current = sfx;
    return () => {
      sfxRef.current = null;
      sfx.destroy();
    };
  }, []);
  useEffect(() => {
    const from = previous.current;
    previous.current = energy;
    if (from === energy) return;
    if (energy < from) {
      sfxRef.current?.drain(energy / max);
      if (energy <= 0) sfxRef.current?.empty();
    }
  }, [energy, max]);
}

function summaryFor(energy: number, max: number, resetAt: string) {
  const runs = runsLeft(energy);
  const wait = energy < max ? ` Free recharge in ${formatEnergyWait(resetAt)}.` : "";
  return `Energy ${energy} of ${max}: ${runs} ${runs === 1 ? "run" : "runs"} left.${wait} Recharge.`;
}

/**
 * The energy pill in the game header, Story's answer to the bag: the gauge
 * and a "+" that opens the recharge sheet — the whole pill is the button.
 * Folded, it is a 44px chip with the bolt and the count; tapping it unfolds
 * it and folds the level pill beside it.
 */
export function EnergyChip({ folded, onUnfold }: { folded: boolean; onUnfold: () => void }) {
  const ctx = useEnergy();
  const state = ctx?.state ?? { energy: 0, max: 6, resetAt: new Date().toISOString() };
  useEnergyVoice(state.energy, state.max);
  const summary = summaryFor(state.energy, state.max, state.resetAt);
  const low = state.energy < ENERGY_PLAY_COST;

  if (folded) {
    return (
      <button
        type="button"
        className="header-chip energy-folded"
        data-low={low ? "true" : undefined}
        aria-label={`Show your energy: ${summary}`}
        aria-expanded={false}
        onClick={onUnfold}
      >
        <BoltGlyph className="bolt-glyph energy-folded-bolt" />
        <span className="energy-folded-n" aria-hidden="true">
          {state.energy}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="rank-chip energy-chip"
      data-low={low ? "true" : undefined}
      aria-label={summary}
      title={summary}
      aria-haspopup="dialog"
      aria-expanded={ctx?.isOpen ?? false}
      onClick={() => ctx?.open({ reason: "browse" })}
    >
      <EnergyGauge energy={state.energy} max={state.max} size="sm" />
      <span className="wallet-plus energy-plus" aria-hidden="true">
        <PlusMark />
      </span>
    </button>
  );
}

/**
 * The same gauge in an episode sheet's top bar, between the title and the
 * close button: it lands a beat after the iris has opened, taking no room
 * from either. Tapping it opens the recharge sheet.
 */
export function EnergyBarChip({ live }: { live: boolean }) {
  const ctx = useEnergy();
  if (!ctx) return null;
  const { state } = ctx;
  const summary = summaryFor(state.energy, state.max, state.resetAt);
  const low = state.energy < ENERGY_PLAY_COST;
  return (
    <button
      type="button"
      className="energy-bar-chip"
      data-in={live ? "true" : undefined}
      data-low={low ? "true" : undefined}
      aria-label={summary}
      title={summary}
      aria-haspopup="dialog"
      onClick={() => ctx.open({ reason: "browse" })}
    >
      <EnergyGauge energy={state.energy} max={state.max} size="sm" />
    </button>
  );
}

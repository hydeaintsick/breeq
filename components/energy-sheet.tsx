"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buyEnergy, type EnergyBought } from "@/app/actions/energy";
import { useBalances } from "@/components/balances-provider";
import { BoltGlyph, GemGlyph } from "@/components/currency-glyphs";
import { useEnergy, writeEnergyIntent } from "@/components/energy-provider";
import { EnergyGauge } from "@/components/energy-gauge";
import { useGemShop } from "@/components/gem-shop";
import { CloseIcon } from "@/components/nav-icons";
import { createEnergySfx, type EnergySfx } from "@/game/breakout/audio";
import { isHapticsEnabled, isHapticsSupported } from "@/game/breakout/haptics";
import { formatGems } from "@/lib/economy";
import {
  ENERGY_CLEAR_REFUND,
  ENERGY_PACKS,
  ENERGY_PLAY_COST,
  formatEnergyClock,
  runsLeft,
  type EnergyPack,
} from "@/lib/energy";

export type EnergySheetReason = "play" | "retry" | "browse";

/** Timeline of the landing, ms from the purchase. */
const T = {
  stamp: 260,
  fillStart: 760,
  /** Per cell. */
  cellGap: 150,
  buttonsAfter: 320,
} as const;

function pulse(pattern: number | number[]) {
  if (!isHapticsEnabled() || !isHapticsSupported()) return;
  navigator.vibrate(pattern);
}

/** A live clock to the next free recharge. */
export function EnergyClock({ resetAt, className = "" }: { resetAt: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time className={`energy-clock ${className}`.trim()} dateTime={resetAt}>
      {formatEnergyClock(resetAt, new Date(now))}
    </time>
  );
}

const COPY: Record<EnergySheetReason, { title: [string, string]; line: string }> = {
  play: {
    title: ["Out of", "energy"],
    line: `Every run takes ${ENERGY_PLAY_COST} cells and a clear gives ${ENERGY_CLEAR_REFUND} back. The core is drained — recharge now, or it refills for free at midnight UTC.`,
  },
  retry: {
    title: ["Out of", "energy"],
    line: `One more try takes ${ENERGY_PLAY_COST} cells. The core is drained — recharge now, or it refills for free at midnight UTC.`,
  },
  browse: {
    title: ["Recharge the", "core"],
    line: `Every run takes ${ENERGY_PLAY_COST} cells and a clear gives ${ENERGY_CLEAR_REFUND} back. Cells you buy stack past the max and stay through midnight.`,
  },
};

/**
 * The recharge sheet — where an empty gauge always leads. The core at the
 * top, a clock to the free recharge, three packs paid in gems; a pack that
 * lands fills the cells one by one on the energy voice, then the run the
 * player was after is one tap away. Short on gems it hands over to the gem
 * shop and stays up underneath.
 */
export function EnergySheet({
  reason,
  hasReady,
  onReady,
  onClose,
}: {
  reason: EnergySheetReason;
  /** A run is waiting on the other side: the landing's primary button serves it. */
  hasReady: boolean;
  onReady: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const energy = useEnergy();
  const balances = useBalances();
  const shop = useGemShop();
  const gems = balances?.balances.gems ?? 0;
  const state = energy?.state ?? { energy: 0, max: 6, resetAt: new Date().toISOString() };

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [landed, setLanded] = useState<EnergyBought | null>(null);

  const depleted = state.energy < ENERGY_PLAY_COST;
  const copy = depleted && reason === "browse" ? COPY.play : COPY[reason];

  // The page behind holds still; Escape closes (unless the shop is up over us); focus starts on the sheet.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    if (landed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !shop.isOpen) {
        event.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [landed, onClose, shop.isOpen]);

  async function buy(pack: EnergyPack) {
    setBusy(pack.id);
    setError(null);
    try {
      const result = await buyEnergy(pack.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      balances?.setBalances(result.balances);
      setLanded(result);
    } catch {
      setError("Could not recharge. Try again.");
    } finally {
      setBusy(null);
    }
  }

  function topUp() {
    writeEnergyIntent();
    shop.open();
  }

  return (
    <div className="energy-sheet" data-depleted={depleted ? "true" : undefined} onClick={landed ? undefined : onClose}>
      <div
        ref={sheetRef}
        className="energy-sheet-body"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="gem-shop-handle" aria-hidden="true" />
        {landed ? (
          <EnergyLanded
            bought={landed}
            hasReady={hasReady}
            onReady={onReady}
            onDone={onClose}
            onMore={() => {
              energy?.setState(landed.energy);
              setLanded(null);
            }}
            onCount={() => energy?.setState(landed.energy)}
          />
        ) : (
          <>
            <div className="energy-sheet-head">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Energy</p>
                <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {copy.title[0]} <span className="text-neon">{copy.title[1]}</span>
                </h2>
              </div>
              <button type="button" className="header-chip energy-sheet-close" aria-label="Close" onClick={onClose}>
                <span className="sr-only">Close</span>
                <CloseIcon />
              </button>
            </div>

            <div className="energy-core" data-depleted={depleted ? "true" : undefined}>
              <EnergyGauge energy={state.energy} max={state.max} size="lg" />
              <p className="energy-core-line">
                {depleted
                  ? "No run left today"
                  : `${runsLeft(state.energy)} ${runsLeft(state.energy) === 1 ? "run" : "runs"} left`}
                <span className="energy-core-dot" aria-hidden="true">
                  ·
                </span>
                <span className="energy-core-clock">
                  Free recharge in <EnergyClock resetAt={state.resetAt} />
                </span>
              </p>
            </div>

            <p className="energy-sheet-copy">{copy.line}</p>

            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

            <ul className="energy-packs" aria-label="Recharges">
              {ENERGY_PACKS.map((pack) => {
                const short = gems < pack.gems;
                return (
                  <li key={pack.id} className="energy-pack" data-tag={pack.tag || undefined} data-short={short ? "true" : undefined}>
                    {pack.tag ? <span className="pack-tag">{pack.tag}</span> : null}
                    <span className="energy-pack-art" aria-hidden="true" data-cells={pack.cells}>
                      {Array.from({ length: Math.min(6, pack.cells) }, (_, i) => (
                        <i key={i} style={{ "--cell-i": i } as React.CSSProperties} />
                      ))}
                      <BoltGlyph className="bolt-glyph energy-pack-bolt" />
                    </span>
                    <span className="energy-pack-copy">
                      <span className="energy-pack-name">{pack.name}</span>
                      <span className="energy-pack-cells">
                        +{pack.cells} {pack.cells === 1 ? "cell" : "cells"}
                        <span className="energy-pack-runs"> · {runsLeft(pack.cells)} {runsLeft(pack.cells) === 1 ? "run" : "runs"}</span>
                      </span>
                      <span className="energy-pack-line">{pack.line}</span>
                    </span>
                    <button
                      type="button"
                      className={`energy-pack-cta ${short ? "btn-glass story-clear-glass" : "btn-play"}`}
                      disabled={busy !== null}
                      aria-label={
                        short
                          ? `${pack.name}: ${pack.cells} cells for ${formatGems(pack.gems)} gems. You are ${formatGems(pack.gems - gems)} gems short. Get gems.`
                          : `Buy ${pack.name}: ${pack.cells} cells for ${formatGems(pack.gems)} gems`
                      }
                      onClick={() => (short ? topUp() : void buy(pack))}
                    >
                      {busy === pack.id ? (
                        "Charging…"
                      ) : short ? (
                        <>
                          <GemGlyph /> {formatGems(pack.gems)}
                          <span className="energy-pack-cta-sub">Get gems</span>
                        </>
                      ) : (
                        <>
                          <GemGlyph /> {formatGems(pack.gems)}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="energy-sheet-fine">
              You have <GemGlyph /> {formatGems(gems)}. Cells you buy stack past the max and are never taken by the midnight recharge.
            </p>

            <button type="button" className="btn-glass story-clear-glass energy-sheet-later" onClick={onClose}>
              {depleted ? "Wait for midnight" : "Not now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The recharge has landed: the "+N" stamps, then the cells light one by one on
 * the energy voice — up the scale, a chord when the gauge reaches the max —
 * and the run the player was after is the primary button. A tap skips.
 */
function EnergyLanded({
  bought,
  hasReady,
  onReady,
  onDone,
  onMore,
  onCount,
}: {
  bought: EnergyBought;
  hasReady: boolean;
  onReady: () => void;
  onDone: () => void;
  onMore: () => void;
  /** The cells have started landing: the header pill may move now. */
  onCount: () => void;
}) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const from = bought.before.energy.energy;
  const to = bought.energy.energy;
  const max = bought.energy.max;
  const [skipped, setSkipped] = useState(false);
  const [stageAnim, setStage] = useState<"drop" | "stamp" | "fill" | "done">("drop");
  const [shownAnim, setShown] = useState(from);
  const [buttonsTimed, setButtons] = useState(false);
  const sfxRef = useRef<EnergySfx | null>(null);
  const counted = useRef(false);
  // Read through a ref: the parent re-renders when the count lands in the
  // provider, and a fresh callback identity must not restart the animation.
  const onCountRef = useRef(onCount);
  useEffect(() => {
    onCountRef.current = onCount;
  }, [onCount]);

  const skip = reduced || skipped;
  const stage = skip ? "done" : stageAnim;
  const shown = skip ? to : shownAnim;
  const buttons = skip || buttonsTimed;

  useEffect(() => {
    const sfx = createEnergySfx();
    sfxRef.current = sfx;
    return () => {
      sfxRef.current = null;
      sfx.destroy();
    };
  }, []);

  useEffect(() => {
    if (skip) {
      if (!counted.current) {
        counted.current = true;
        onCountRef.current();
        sfxRef.current?.full();
      }
      return;
    }
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        setStage("stamp");
        sfxRef.current?.stamp();
        pulse(14);
      }, T.stamp),
    );
    timers.push(
      window.setTimeout(() => {
        setStage("fill");
        if (!counted.current) {
          counted.current = true;
          onCountRef.current();
        }
      }, T.fillStart),
    );
    const cells = Math.max(0, to - from);
    for (let i = 1; i <= cells; i += 1) {
      timers.push(
        window.setTimeout(() => {
          const value = from + i;
          setShown(value);
          sfxRef.current?.charge(value / max);
          pulse(value >= max ? [10, 30, 16] : 9);
          if (i === cells) {
            if (value >= max) sfxRef.current?.full();
            setStage("done");
          }
        }, T.fillStart + i * T.cellGap),
      );
    }
    if (cells === 0) timers.push(window.setTimeout(() => setStage("done"), T.fillStart + 200));
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [from, max, skip, to]);

  useEffect(() => {
    if (stage !== "done" || buttons) return;
    const id = window.setTimeout(() => setButtons(true), T.buttonsAfter);
    return () => window.clearTimeout(id);
  }, [buttons, stage]);

  return (
    <div
      className="energy-landed"
      data-stage={stage}
      data-skip={skip ? "true" : undefined}
      role="group"
      aria-label={`Recharged: ${bought.pack.cells} cells added. Energy ${to} of ${max}.`}
      onClick={() => setSkipped(true)}
    >
      <p className="story-clear-kicker">Recharged</p>
      <h2 className="energy-landed-title">{bought.pack.name}</h2>

      <div className="story-clear-xp" data-stage={stage === "drop" ? "hidden" : "stamp"}>
        <span className="story-clear-stamp energy-landed-stamp">
          <BoltGlyph /> +{bought.pack.cells}
        </span>
      </div>

      <div className="energy-core energy-landed-core" data-live={stage === "fill" || stage === "done"}>
        <EnergyGauge energy={shown} max={max} size="lg" />
        <p className="energy-core-line" data-show={stage === "done"}>
          {runsLeft(shown)} {runsLeft(shown) === 1 ? "run" : "runs"} ready
        </p>
      </div>

      <p className="story-clear-note mt-3">
        <GemGlyph /> −{formatGems(bought.pack.gems)} · {formatGems(bought.balances.gems)} left in the bag
      </p>

      <div className="story-clear-actions energy-landed-actions" data-show={buttons}>
        {hasReady ? (
          <button
            type="button"
            className="btn-play min-h-12 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onReady();
            }}
          >
            <span className="inline-flex items-center gap-2">
              Play now
              <span className="play-cost">
                <BoltGlyph /> {ENERGY_PLAY_COST}
              </span>
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-play min-h-12 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onDone();
            }}
          >
            Back to the story
          </button>
        )}
        <button
          type="button"
          className="btn-glass story-clear-glass min-h-12 w-full"
          onClick={(e) => {
            e.stopPropagation();
            onMore();
          }}
        >
          Buy more
        </button>
      </div>
    </div>
  );
}

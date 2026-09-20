"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BoltGlyph, GemGlyph, HeartGlyph } from "@/components/currency-glyphs";
import { EnergyGauge } from "@/components/energy-gauge";
import { EnergyClock } from "@/components/energy-sheet";
import { createReviveSfx, type ReviveSfx } from "@/game/breakout/audio";
import { formatGems } from "@/lib/economy";
import { ENERGY_PLAY_COST, type EnergyState } from "@/lib/energy";
import { SKIP_CHAPTER_GEMS } from "@/lib/progress";

/** The heart on offer: what it costs, what the bag holds, and the tap that buys it. */
export type ReviveOffer = {
  cost: number;
  gems: number;
  /** The server is taking the gems. */
  busy: boolean;
  error: string | null;
  onRevive: () => void;
};

/** Heartbeats the offer sounds before it falls quiet (the heart keeps pulsing in silence). */
const OFFER_BEATS = 4;
/** The CSS pulse's period, ms: the voice beats on the same clock. */
const OFFER_BEAT_MS = 1800;

/** Timeline, in ms from mount — same beats as the clear screen. */
const T = {
  scoreStart: 380,
  scoreDur: 950,
  stampStart: 1250,
  buttonsAfter: 260,
} as const;

function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - 2 ** (-10 * t);
}

function format(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

const NOTE: Record<"lives" | "timeout" | "crushed", string> = {
  lives: "The last ball got past you.",
  timeout: "The clock ran out.",
  crushed: "The wall reached the paddle.",
};

export function StoryLose({
  title,
  score,
  reason,
  onRetry,
  onSkip,
  revive = null,
  energy = null,
  veiled = false,
  onClose,
}: {
  title: string;
  score: number;
  reason: "lives" | "timeout" | "crushed";
  /** One more run. Short on energy this still answers: the parent opens the recharge sheet. */
  onRetry: () => void;
  /** Buy past this wall for gems. Omitted where a skip makes no sense (tutorial, replays). */
  onSkip?: () => void;
  /**
   * A heart for gems: the run goes on from here, wall and score kept. The
   * primary button when set; short on gems it still answers (the parent opens
   * the revive sheet). Null where no heart is sold (tutorial, Earn, a clock
   * or a wall that ended the run, revives used up).
   */
  revive?: ReviveOffer | null;
  /** The gauge after this run was paid. Null hides the energy row (tutorial). */
  energy?: EnergyState | null;
  /** A sheet is up over the screen: the copy steps out so it does not bleed through the glass. */
  veiled?: boolean;
  onClose: () => void;
}) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const mountedAt = useRef(0);
  const [skipped, setSkipped] = useState(false);
  const [scoreCounted, setScoreCounted] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [buttonsTimed, setButtons] = useState(false);
  const scoreRef = useRef<HTMLSpanElement>(null);

  const skip = reduced || skipped;
  const scoreDone = skip || score === 0 || scoreCounted;
  const stampReady = skip || stamped;
  const stampStage = skip ? "done" : stamped ? "stamp" : "hidden";
  const buttons = skip || buttonsTimed;
  /** The gauge cannot pay for another try: the primary button leads to the recharge. */
  const short = energy !== null && energy.energy < ENERGY_PLAY_COST;

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  useEffect(() => {
    const el = scoreRef.current;
    if (!el) return;
    if (skip || score === 0) {
      el.textContent = format(score);
      return;
    }
    let raf = 0;
    const start = mountedAt.current + T.scoreStart;
    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / T.scoreDur));
      el.textContent = format(score * easeOutExpo(t));
      if (t < 1) raf = requestAnimationFrame(frame);
      else setScoreCounted(true);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [score, skip]);

  useEffect(() => {
    if (stampReady) return;
    const id = window.setTimeout(() => setStamped(true), Math.max(0, mountedAt.current + T.stampStart - performance.now()));
    return () => window.clearTimeout(id);
  }, [stampReady]);

  useEffect(() => {
    if (buttons || !stampReady || !scoreDone) return;
    const id = window.setTimeout(() => setButtons(true), T.buttonsAfter);
    return () => window.clearTimeout(id);
  }, [buttons, stampReady, scoreDone]);

  // The heart on offer beats: one heartbeat with a high note when the buttons
  // land, then a few quieter ones on the CSS pulse's clock, then silence.
  const sfxRef = useRef<ReviveSfx | null>(null);
  const offered = revive !== null;
  useEffect(() => {
    if (!offered) return;
    const sfx = createReviveSfx();
    sfxRef.current = sfx;
    return () => {
      sfxRef.current = null;
      sfx.destroy();
    };
  }, [offered]);
  useEffect(() => {
    if (!offered || !buttons || reduced) return;
    sfxRef.current?.offer();
    let beats = 1;
    const id = window.setInterval(() => {
      sfxRef.current?.pulse();
      beats += 1;
      if (beats >= OFFER_BEATS) window.clearInterval(id);
    }, OFFER_BEAT_MS);
    return () => window.clearInterval(id);
  }, [buttons, offered, reduced]);

  const reviveShort = revive !== null && revive.gems < revive.cost;

  return (
    <div
      className="story-clear"
      data-kind="lose"
      role="dialog"
      aria-modal="true"
      aria-label={`Game over: ${title}`}
      data-skip={skip}
      data-veiled={veiled ? "true" : undefined}
      onClick={() => setSkipped(true)}
    >
      <div className="story-clear-body">
        <p className="story-clear-kicker">Game over</p>
        <h2 className="story-clear-title">{title}</h2>

        <div className="story-clear-score" data-done={scoreDone}>
          <span className="story-clear-label">Score</span>
          <span ref={scoreRef} className="story-clear-number">
            0
          </span>
        </div>

        <div className="story-clear-xp" data-stage={stampStage} data-replay="true">
          <span className="story-clear-stamp">No XP</span>
          <span className="story-clear-note">
            {NOTE[reason]} {revive ? "One heart puts you back where you were." : "Clear the wall to earn it."}
          </span>
        </div>

        {energy ? (
          <div className="story-clear-energy" data-show={stampReady} data-short={short ? "true" : undefined}>
            <span className="story-clear-label">Energy</span>
            <EnergyGauge energy={energy.energy} max={energy.max} size="md" />
            <span className="story-clear-energy-note">
              {short ? (
                <>
                  Out of energy. Free recharge in <EnergyClock resetAt={energy.resetAt} />
                </>
              ) : (
                <>
                  One more try takes <BoltGlyph /> {ENERGY_PLAY_COST}.
                </>
              )}
            </span>
          </div>
        ) : null}

        {revive?.error ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {revive.error}
          </p>
        ) : null}

        <div className="story-clear-actions" data-show={buttons}>
          {revive ? (
            <button
              type="button"
              className="btn-play story-clear-revive min-h-12 w-full"
              data-short={reviveShort ? "true" : undefined}
              disabled={revive.busy}
              aria-label={
                reviveShort
                  ? `Revive for ${formatGems(revive.cost)} gems. You are ${formatGems(revive.cost - revive.gems)} gems short: get gems and continue.`
                  : `Revive for ${formatGems(revive.cost)} gems: keep the wall and the score, one heart back.`
              }
              onClick={(e) => {
                e.stopPropagation();
                revive.onRevive();
              }}
            >
              <span className="story-clear-revive-heart" aria-hidden="true">
                <HeartGlyph />
              </span>
              <span className="story-clear-revive-label">{revive.busy ? "Reviving…" : "Revive"}</span>
              <span className="revive-cost" data-short={reviveShort ? "true" : undefined} aria-hidden="true">
                <GemGlyph /> {formatGems(revive.cost)}
              </span>
            </button>
          ) : null}
          <button
            type="button"
            className={revive ? "btn-glass story-clear-glass min-h-11 w-full" : "btn-play min-h-11 w-full"}
            aria-label={short ? "Out of energy. Recharge" : energy ? `Try again for ${ENERGY_PLAY_COST} energy` : "Try again"}
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
          >
            {short ? (
              <span className="inline-flex items-center gap-2">
                <BoltGlyph /> Recharge
              </span>
            ) : energy ? (
              <span className="inline-flex items-center gap-2">
                Try again
                <span className="play-cost" aria-hidden="true">
                  <BoltGlyph /> {ENERGY_PLAY_COST}
                </span>
              </span>
            ) : (
              "Try again"
            )}
          </button>
          {onSkip ? (
            <button
              type="button"
              className="story-clear-skip"
              aria-label={`Skip ${title} for ${formatGems(SKIP_CHAPTER_GEMS)} gems`}
              onClick={(e) => {
                e.stopPropagation();
                onSkip();
              }}
            >
              Skip for <GemGlyph /> {formatGems(SKIP_CHAPTER_GEMS)}
            </button>
          ) : null}
          <button
            type="button"
            className="btn-glass story-clear-glass min-h-11 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}

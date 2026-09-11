"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ChapterClearResult } from "@/app/actions/progress";
import { progressFromXp, type Progress } from "@/lib/progress";

/** Timeline, in ms from mount. */
const T = {
  scoreStart: 380,
  scoreDur: 950,
  xpStart: 1250,
  xpDur: 1000,
  /** Extra bar time per level crossed, so a rollover is legible. */
  xpPerLevel: 520,
  buttonsAfter: 260,
} as const;

const SPARKS = 16;
const SPARK_COLORS = ["blue", "violet", "pink", "cyan", "lime", "amber"] as const;

/** Fast start, long settle: digits flicker then lock. */
function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - 2 ** (-10 * t);
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function format(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

export function StoryClear({
  title,
  score,
  result,
  hasNext,
  episodeDone,
  kicker: kickerOverride,
  note,
  nextLabel = "Next chapter",
  closeLabel = "Close",
  onNext,
  onClose,
}: {
  title: string;
  score: number;
  /** Null until the server has paid the clear out. */
  result: ChapterClearResult | null;
  hasNext: boolean;
  /** Every chapter of the episode is now cleared. */
  episodeDone: boolean;
  /** Replaces the "Chapter cleared" line. */
  kicker?: string;
  /** A line under the level meter, for what comes next. */
  note?: string;
  nextLabel?: string;
  closeLabel?: string;
  onNext: () => void;
  onClose: () => void;
}) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const mountedAt = useRef<number>(0);
  // Animation progress lives in these; the "skip" and "replay" cases are
  // derived below so a tap can jump straight to the end state.
  const [skipped, setSkipped] = useState(false);
  const [scoreCounted, setScoreCounted] = useState(false);
  const [xpStageAnim, setXpStage] = useState<"hidden" | "stamp" | "done">("hidden");
  const [shownAnim, setShown] = useState<Progress | null>(null);
  const [levelUpsAnim, setLevelUps] = useState(0);
  const [buttonsTimed, setButtons] = useState(false);

  const scoreRef = useRef<HTMLSpanElement>(null);
  const xpRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const intoRef = useRef<HTMLSpanElement>(null);

  const skip = reduced || skipped;
  const replay = result !== null && result.xpGained === 0;
  const scoreDone = skip || score === 0 || scoreCounted;
  const xpStage = skip || replay ? "done" : xpStageAnim;
  const shown = skip || replay ? (result?.progress ?? null) : (shownAnim ?? result?.before ?? null);
  const levelUps = result && (skip || replay) ? result.progress.level - result.before.level : levelUpsAnim;
  const buttons = skip || buttonsTimed;

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  // Score: count up from 0.
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

  // XP + level bar: replay the payout, rolling the level over when it happens.
  useEffect(() => {
    if (!result) return;
    const { before, progress, xpGained } = result;
    const paint = (p: Progress, xp: number) => {
      if (barRef.current) barRef.current.style.width = `${Math.min(100, p.ratio * 100)}%`;
      if (intoRef.current) intoRef.current.textContent = `${format(p.into)} / ${format(p.next)} XP`;
      if (xpRef.current && xpGained > 0) xpRef.current.textContent = `+${format(xp)} XP`;
    };

    if (skip || xpGained === 0) {
      paint(progress, xpGained);
      return;
    }

    paint(before, 0);
    const levelsCrossed = progress.level - before.level;
    const dur = T.xpDur + T.xpPerLevel * levelsCrossed;
    const stampAt = Math.max(performance.now(), mountedAt.current + T.xpStart);
    let raf = 0;
    let lastLevel = before.level;
    const timer = window.setTimeout(() => setXpStage("stamp"), Math.max(0, stampAt - performance.now()));
    const barStart = stampAt + 320;
    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - barStart) / dur));
      const xp = xpGained * easeOutCubic(t);
      const p = progressFromXp(before.xp + xp);
      if (p.level !== lastLevel) {
        lastLevel = p.level;
        setShown(p);
        setLevelUps((n) => n + 1);
      }
      paint(t >= 1 ? progress : p, xp);
      if (t < 1) raf = requestAnimationFrame(frame);
      else {
        setShown(progress);
        setXpStage("done");
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [result, skip]);

  // Buttons a beat after the payout has landed.
  useEffect(() => {
    if (buttons || xpStage !== "done" || !scoreDone) return;
    const id = window.setTimeout(() => setButtons(true), T.buttonsAfter);
    return () => window.clearTimeout(id);
  }, [buttons, xpStage, scoreDone]);

  // Never trap the player on a failed payout: after a while, show the buttons anyway.
  useEffect(() => {
    if (result) return;
    const id = window.setTimeout(() => setButtons(true), 6000);
    return () => window.clearTimeout(id);
  }, [result]);

  const level = shown?.level ?? null;
  const kicker = kickerOverride ?? (episodeDone ? "Episode complete" : "Chapter cleared");

  return (
    <div
      className="story-clear"
      role="dialog"
      aria-modal="true"
      aria-label={`${kicker}: ${title}`}
      data-skip={skip}
      onClick={() => setSkipped(true)}
    >
      <div className="story-clear-body">
        <p className="story-clear-kicker">{kicker}</p>
        <h2 className="story-clear-title">{title}</h2>

        <div className="story-clear-score" data-done={scoreDone}>
          <span className="story-clear-label">Score</span>
          <span ref={scoreRef} className="story-clear-number">
            0
          </span>
        </div>

        <div className="story-clear-xp" data-stage={xpStage} data-replay={replay}>
          <span ref={xpRef} className="story-clear-stamp">
            {replay ? "Already cleared" : "+0 XP"}
          </span>
          {replay ? <span className="story-clear-note">No new XP for a replay. Score still counts.</span> : null}
        </div>

        <div className="story-clear-level" data-ready={result !== null}>
          <div className="story-clear-badge" key={levelUps} data-up={levelUps > 0}>
            <span className="story-clear-badge-label">Lvl</span>
            <span className="story-clear-badge-number">{level ?? "–"}</span>
            {levelUps > 0 && !skip ? <Sparks /> : null}
          </div>
          <div className="story-clear-track">
            <div className="story-clear-bar" aria-hidden="true">
              <span ref={barRef} className="story-clear-bar-fill" />
            </div>
            <span ref={intoRef} className="story-clear-into">
              {result ? `${format(result.before.into)} / ${format(result.before.next)} XP` : "Saving your clear…"}
            </span>
          </div>
        </div>

        {note ? (
          <p className="story-clear-next" data-show={buttons}>
            {note}
          </p>
        ) : null}

        <div className="story-clear-actions" data-show={buttons}>
          {hasNext ? (
            <button
              type="button"
              className="btn-play min-h-11 w-full"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
            >
              {nextLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={`${hasNext ? "btn-glass story-clear-glass" : "btn-play"} min-h-11 w-full`}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Neon shards thrown from the level badge — little bricks, the game's motif. */
function Sparks() {
  return (
    <span className="story-clear-sparks" aria-hidden="true">
      {Array.from({ length: SPARKS }, (_, i) => {
        const angle = (i / SPARKS) * 360 + (i % 2 ? 11 : -7);
        const dist = 3.2 + (i % 3) * 0.9;
        const color = SPARK_COLORS[i % SPARK_COLORS.length];
        return (
          <span
            key={i}
            className="story-clear-spark"
            style={
              {
                "--angle": `${angle}deg`,
                "--dist": `${dist}rem`,
                "--delay": `${(i % 4) * 30}ms`,
                "--spark": `var(--neon-${color})`,
              } as CSSProperties
            }
          />
        );
      })}
    </span>
  );
}

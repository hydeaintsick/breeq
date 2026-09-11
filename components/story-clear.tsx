"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ChapterClearResult } from "@/app/actions/progress";
import { StarRating } from "@/components/star-rating";
import { createPayoutSfx, type PayoutSfx } from "@/game/breakout/audio";
import { isHapticsEnabled, isHapticsSupported } from "@/game/breakout/haptics";
import type { StarCount } from "@/game/breakout/engine/stars";
import { progressFromXp, type Progress } from "@/lib/progress";

/** Timeline, in ms from mount. */
const T = {
  starsStart: 380,
  starLead: 220,
  starGap: 440,
  starSettle: 620,
  /** When there is no star grade (tutorial), XP starts on this beat. */
  xpStart: 720,
  xpDur: 1000,
  /** Extra bar time per level crossed, so a rollover is legible. */
  xpPerLevel: 520,
  buttonsAfter: 260,
} as const;

/** Counter steps that tick, spread over the XP gained. */
const XP_TICKS = 24;

const SPARKS = 16;
const SPARK_COLORS = ["blue", "violet", "pink", "cyan", "lime", "amber"] as const;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function format(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function pulseStar(index: number) {
  if (!isHapticsEnabled() || !isHapticsSupported()) return;
  navigator.vibrate(index >= 2 ? [16, 40, 22] : 12);
}

export function StoryClear({
  title,
  score,
  stars = 0,
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
  /** 1–3 for a story wall; 0 hides the grade (tutorial). */
  stars?: 0 | StarCount;
  /** Null until the server has paid the clear out. */
  result: ChapterClearResult | null;
  hasNext: boolean;
  /** Every chapter of the episode is now cleared. */
  episodeDone: boolean;
  /** Replaces the "Victory" line. */
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
  const earned = stars === 1 || stars === 2 || stars === 3 ? stars : 0;
  const showStars = earned > 0;

  const [skipped, setSkipped] = useState(false);
  const [starsReadyAnim, setStarsReady] = useState(false);
  const [litAnim, setLit] = useState(0);
  const [starsDoneAnim, setStarsDone] = useState(!showStars);
  const [xpStageAnim, setXpStage] = useState<"hidden" | "stamp" | "done">("hidden");
  const [shownAnim, setShown] = useState<Progress | null>(null);
  const [levelUpsAnim, setLevelUps] = useState(0);
  const [buttonsTimed, setButtons] = useState(false);

  const xpRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const intoRef = useRef<HTMLSpanElement>(null);
  const sfxRef = useRef<PayoutSfx | null>(null);
  const countingRef = useRef(false);

  const skip = reduced || skipped;
  const replay = result !== null && result.xpGained === 0;
  const starsReady = skip || starsReadyAnim;
  const lit = skip ? earned : litAnim;
  const starsDone = skip || starsDoneAnim;
  const xpStage = skip ? "done" : !starsDone ? "hidden" : replay ? "done" : xpStageAnim;
  const shown = skip || replay ? (result?.progress ?? null) : (shownAnim ?? result?.before ?? null);
  const levelUps = result && (skip || replay) ? result.progress.level - result.before.level : levelUpsAnim;
  const buttons = skip || buttonsTimed;
  const improved = Boolean(result?.improved && replay);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  useEffect(() => {
    const sfx = createPayoutSfx();
    sfxRef.current = sfx;
    return () => {
      sfxRef.current = null;
      sfx.destroy();
    };
  }, []);

  // Three outlines, then each earned star fills with a deep note.
  useEffect(() => {
    if (!showStars) {
      setStarsDone(true);
      return;
    }
    if (skip) {
      setStarsReady(true);
      setLit(earned);
      setStarsDone(true);
      return;
    }
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStarsReady(true), T.starsStart));
    for (let i = 0; i < earned; i += 1) {
      const at = T.starsStart + T.starLead + i * T.starGap;
      timers.push(
        window.setTimeout(() => {
          setLit(i + 1);
          sfxRef.current?.star(i, true);
          pulseStar(i);
        }, at),
      );
    }
    timers.push(
      window.setTimeout(
        () => setStarsDone(true),
        T.starsStart + T.starLead + Math.max(0, earned - 1) * T.starGap + T.starSettle,
      ),
    );
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [earned, showStars, skip]);

  // XP + level bar: waits until the stars have landed.
  useEffect(() => {
    if (!result || !starsDone) return;
    const { before, progress, xpGained } = result;
    const paint = (p: Progress, xp: number) => {
      if (barRef.current) barRef.current.style.width = `${Math.min(100, p.ratio * 100)}%`;
      if (intoRef.current) intoRef.current.textContent = `${format(p.into)} / ${format(p.next)} XP`;
      if (xpRef.current && xpGained > 0) xpRef.current.textContent = `+${format(xp)} XP`;
    };

    if (skip || xpGained === 0) {
      paint(progress, xpGained);
      if (countingRef.current) {
        countingRef.current = false;
        sfxRef.current?.settle();
      }
      return;
    }

    paint(before, 0);
    const levelsCrossed = progress.level - before.level;
    const dur = T.xpDur + T.xpPerLevel * levelsCrossed;
    const stampAt = Math.max(performance.now(), mountedAt.current + T.xpStart);
    let raf = 0;
    let lastLevel = before.level;
    let lastStep = 0;
    const stepXp = xpGained / XP_TICKS;
    const timer = window.setTimeout(() => {
      setXpStage("stamp");
      countingRef.current = true;
      sfxRef.current?.stamp();
    }, Math.max(0, stampAt - performance.now()));
    const barStart = stampAt + 320;
    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - barStart) / dur));
      const xp = xpGained * easeOutCubic(t);
      const p = progressFromXp(before.xp + xp);
      if (p.level !== lastLevel) {
        lastLevel = p.level;
        setShown(p);
        setLevelUps((n) => n + 1);
        sfxRef.current?.levelUp();
      } else {
        const step = Math.floor(xp / stepXp);
        if (step !== lastStep) {
          lastStep = step;
          sfxRef.current?.tick(p.ratio);
        }
      }
      paint(t >= 1 ? progress : p, xp);
      if (t < 1) raf = requestAnimationFrame(frame);
      else {
        countingRef.current = false;
        sfxRef.current?.settle();
        setShown(progress);
        setXpStage("done");
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [result, skip, starsDone]);

  useEffect(() => {
    if (buttons || xpStage !== "done" || !starsDone) return;
    const id = window.setTimeout(() => setButtons(true), T.buttonsAfter);
    return () => window.clearTimeout(id);
  }, [buttons, xpStage, starsDone]);

  useEffect(() => {
    if (result) return;
    const id = window.setTimeout(() => setButtons(true), 6000);
    return () => window.clearTimeout(id);
  }, [result]);

  const level = shown?.level ?? null;
  const kicker = kickerOverride ?? "Victory";

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
        {episodeDone && !kickerOverride ? (
          <p className="story-clear-epilogue">Episode complete</p>
        ) : null}

        {showStars ? (
          <div
            className="story-clear-stars"
            data-ready={starsReady}
            data-done={starsDone}
            aria-label={`${earned} of 3 stars`}
          >
            <StarRating value={lit} size="lg" label={`${earned} of 3 stars`} />
          </div>
        ) : null}

        <p className="story-clear-scoreline">
          <span className="story-clear-label">Score</span>
          <span className="story-clear-scoreline-n">{format(score)}</span>
        </p>

        <div className="story-clear-xp" data-stage={xpStage} data-replay={replay}>
          <span ref={xpRef} className="story-clear-stamp">
            {replay ? (improved ? "New best" : "Already cleared") : "+0 XP"}
          </span>
          {replay ? (
            <span className="story-clear-note">
              {improved ? "Stars go up. No new XP for a replay." : "No new XP for a replay. Stars still count."}
            </span>
          ) : null}
        </div>

        <div className="story-clear-level" data-ready={result !== null && starsDone}>
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

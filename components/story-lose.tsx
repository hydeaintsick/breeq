"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  onClose,
}: {
  title: string;
  score: number;
  reason: "lives" | "timeout" | "crushed";
  onRetry: () => void;
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

  return (
    <div
      className="story-clear"
      data-kind="lose"
      role="dialog"
      aria-modal="true"
      aria-label={`Game over: ${title}`}
      data-skip={skip}
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
          <span className="story-clear-note">{NOTE[reason]} Clear the wall to earn it.</span>
        </div>

        <div className="story-clear-actions" data-show={buttons}>
          <button
            type="button"
            className="btn-play min-h-11 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
          >
            Try again
          </button>
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

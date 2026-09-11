"use client";

import { useEffect, useRef, useState } from "react";
import { starBands, type Difficulty, type Level } from "@/game/breakout/engine";
import { createDifficultyRater, EDITOR_DIFFICULTY_OPTIONS, type DifficultyRater } from "@/game/breakout/preview";

const DEBOUNCE_MS = 500;

type MeterState =
  | { status: "blocked" }
  | { status: "rating"; last: Difficulty | null }
  | { status: "ready"; result: Difficulty };

/**
 * Live difficulty of the wall being edited. Waits for the author to pause,
 * then rates the draft in a worker: a flawless proof, then fallible pilots.
 * `blocked` is true while the level has validation errors.
 */
export function useDifficulty(level: Level, blocked: boolean): MeterState {
  const raterRef = useRef<DifficultyRater | null>(null);
  // The last rating and the draft it was computed for; a different draft means "stale".
  const [rated, setRated] = useState<{ level: Level; result: Difficulty } | null>(null);

  useEffect(() => {
    const rater = createDifficultyRater();
    raterRef.current = rater;
    return () => {
      rater.destroy();
      raterRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (blocked) {
      return;
    }
    const timer = window.setTimeout(() => {
      raterRef.current?.rate(level, EDITOR_DIFFICULTY_OPTIONS).then((result) => {
        if (result) {
          setRated({ level, result });
        }
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [level, blocked]);

  if (blocked) {
    return { status: "blocked" };
  }
  if (!rated || rated.level !== level) {
    return { status: "rating", last: rated?.result ?? null };
  }
  return { status: "ready", result: rated.result };
}

function formatSeconds(seconds: number | null) {
  if (seconds == null) return null;
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function DifficultyMeter({ level, blocked }: { level: Level; blocked: boolean }) {
  const state = useDifficulty(level, blocked);
  const shown = state.status === "ready" ? state.result : state.status === "rating" ? state.last : null;
  const rating = state.status === "rating";
  const bands = starBands(level);

  return (
    <div className="difficulty" data-tier={shown?.tier ?? 0} aria-live="polite">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink">
          Difficulty
          {shown ? (
            <span className="difficulty-label"> · {shown.label}</span>
          ) : null}
        </p>
        <p className="text-sm tabular-nums text-ink-muted">
          {state.status === "blocked" ? "—" : shown ? `${shown.score}/100` : "…"}
        </p>
      </div>
      <div
        className="rank-bar difficulty-bar mt-2"
        role="progressbar"
        aria-label="Difficulty score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown?.score ?? 0}
        data-rating={rating ? "true" : undefined}
      >
        <span className="rank-bar-fill difficulty-fill" style={{ width: `${shown?.score ?? 0}%` }} />
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-muted">
        {state.status === "blocked" ? (
          "Fix the errors above to rate the wall."
        ) : !shown ? (
          "Rating: a flawless autopilot proves the wall, then fallible players try it…"
        ) : !shown.clearable ? (
          "The flawless autopilot could not clear this wall. It cannot be published."
        ) : (
          <>
            {shown.samples.map((sample, index) => (
              <span key={sample.skill}>
                {index > 0 ? " · " : null}
                {sample.skill >= 0.97 ? "Good players" : "Average players"} clear {Math.round(sample.winRate * 100)}%
              </span>
            ))}
            {shown.meanSeconds != null ? ` · about ${formatSeconds(shown.meanSeconds)} a run` : null}
            {rating ? " · updating…" : null}
            {shown.clearable ? (
              <>
                {" "}
                · 3 stars at ≤{bands.three} hits
                {" "}
                · 2 stars at ≤{bands.two} hits
              </>
            ) : null}
          </>
        )}
      </p>
    </div>
  );
}

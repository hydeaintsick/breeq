"use client";

import type { Progress } from "@/lib/progress";

function format(n: number) {
  return n.toLocaleString("en-US");
}

/** The player's level in the game header: a badge, the XP to the next rung, and the bar. */
export function RankMeter({ progress }: { progress: Progress }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress.ratio * 100)));
  const summary = `Level ${progress.level} · ${format(progress.into)} / ${format(progress.next)} XP`;

  return (
    <div className="rank-chip" title={summary}>
      <span className="rank-badge" aria-hidden="true">
        {progress.level}
      </span>
      <div className="rank-meter">
        <div className="rank-meter-row">
          <span className="rank-label">Level {progress.level}</span>
          <span className="rank-xp">
            {format(progress.into)}
            <span className="rank-xp-sep">/</span>
            {format(progress.next)}
          </span>
        </div>
        <div
          className="rank-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.next}
          aria-valuenow={progress.into}
          aria-label={`Level ${progress.level}, ${pct} percent to the next level`}
        >
          <span className="rank-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

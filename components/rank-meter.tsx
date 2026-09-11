"use client";

import type { Progress, StarTally } from "@/lib/progress";

function format(n: number) {
  return n.toLocaleString("en-US");
}

function StarMark() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
      <path
        d="M12 2.4l2.62 6.38 6.88.62-5.22 4.58 1.58 6.72L12 16.92 6.14 20.7l1.58-6.72L2.5 9.4l6.88-.62L12 2.4z"
        fill="currentColor"
      />
    </svg>
  );
}

/** The player's level in the game header: a badge, the XP to the next rung, the bar, and stars collected. */
export function RankMeter({ progress, stars }: { progress: Progress; stars: StarTally }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress.ratio * 100)));
  const summary = `Level ${progress.level} · ${format(progress.into)} / ${format(progress.next)} XP · ${format(stars.earned)} stars`;

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
      <span className="rank-stars" aria-label={`${format(stars.earned)} stars collected`}>
        <StarMark />
        <span className="rank-stars-count">{format(stars.earned)}</span>
      </span>
    </div>
  );
}
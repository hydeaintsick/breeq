"use client";

import type { Progress } from "@/lib/progress";

export function RankMeter({ progress }: { progress: Progress }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress.ratio * 100)));

  return (
    <div
      className="rank-chip"
      title={`Level ${progress.level} · ${progress.into} / ${progress.next} XP`}
    >
      <span className="font-mono text-xs tracking-[0.08em] text-ink">
        Lv {progress.level}
      </span>
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
  );
}

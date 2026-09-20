"use client";

import { useEffect, useRef, useState } from "react";
import { BoltGlyph } from "@/components/currency-glyphs";
import { ENERGY_MAX, ENERGY_PLAY_COST } from "@/lib/energy";

/**
 * The gauge: `max` cells in a row, lit up to `energy`, with the bolt ahead of
 * them. Cells that just lit or went dark carry `data-lit` / `data-dark` for a
 * beat so the stylesheet can flash them; once cells are banked past the max,
 * the count folds into a single gold badge with the full total (the plain
 * "x/y" would be redundant next to it). `data-low` marks a gauge that cannot
 * pay for a run, `data-empty` one with nothing left.
 */
export function EnergyGauge({
  energy,
  max = ENERGY_MAX,
  cost = ENERGY_PLAY_COST,
  size = "md",
  showCount = true,
  label,
  className = "",
}: {
  energy: number;
  max?: number;
  /** What a run costs: below it the gauge reads low. */
  cost?: number;
  size?: "sm" | "md" | "lg";
  /** The "4/6" after the cells. */
  showCount?: boolean;
  /** Screen-reader text; defaults to "Energy 4 of 6". */
  label?: string;
  className?: string;
}) {
  const lit = Math.max(0, Math.min(max, Math.floor(energy)));
  const banked = Math.max(0, Math.floor(energy) - max);
  const previous = useRef(lit);
  const [flash, setFlash] = useState<{ from: number; to: number } | null>(null);

  // A change in the lit count marks the cells that moved, for one beat.
  useEffect(() => {
    const from = previous.current;
    if (from === lit) return;
    previous.current = lit;
    setFlash({ from, to: lit });
    const id = window.setTimeout(() => setFlash(null), 900);
    return () => window.clearTimeout(id);
  }, [lit]);

  const low = energy < cost;
  const empty = energy <= 0;

  return (
    <span
      className={`energy-gauge ${className}`.trim()}
      data-size={size}
      data-low={low ? "true" : undefined}
      data-empty={empty ? "true" : undefined}
      data-full={energy >= max ? "true" : undefined}
      role="img"
      aria-label={label ?? `Energy ${Math.floor(energy)} of ${max}`}
    >
      <BoltGlyph className="bolt-glyph energy-gauge-bolt" />
      <span className="energy-cells" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => {
          const on = i < lit;
          const justLit = flash !== null && i >= flash.from && i < flash.to;
          const justDark = flash !== null && i >= flash.to && i < flash.from;
          return (
            <i
              key={i}
              className="energy-cell"
              data-on={on ? "true" : undefined}
              data-lit={justLit ? "true" : undefined}
              data-dark={justDark ? "true" : undefined}
              style={{ "--cell-i": i } as React.CSSProperties}
            />
          );
        })}
      </span>
      {banked > 0 ? (
        // Past the max, the total already says it all: the badge carries the
        // whole count and the "x/y" beside it would be redundant clutter.
        <span className="energy-banked" aria-hidden="true">
          {Math.floor(energy)}
        </span>
      ) : showCount ? (
        <span className="energy-count" aria-hidden="true">
          {Math.floor(energy)}
          <span className="energy-count-sep">/</span>
          {max}
        </span>
      ) : null}
    </span>
  );
}

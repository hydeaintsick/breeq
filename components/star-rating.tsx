"use client";

import { STARS_PER_CLEAR } from "@/game/breakout/engine/stars";

function clampFill(value: number) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function StarGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path d="M12 2.4l2.62 6.38 6.88.62-5.22 4.58 1.58 6.72L12 16.92 6.14 20.7l1.58-6.72L2.5 9.4l6.88-.62L12 2.4z" />
    </svg>
  );
}

function Star({ fill }: { fill: number }) {
  const lit = clampFill(fill);
  const pct = Math.round(lit * 100);
  return (
    <span className="star" data-on={lit >= 0.97 ? "true" : lit > 0.02 ? "partial" : "false"}>
      <StarGlyph className="star-ghost" />
      {pct > 0 ? (
        <span className="star-lit" style={{ width: `${pct}%` }}>
          <StarGlyph />
        </span>
      ) : null}
    </span>
  );
}

/** Three stars, each empty / partial / filled. `value` is 0..3. */
export function StarRating({
  value,
  size = "md",
  label,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  /** Accessible name. Defaults to "N of 3 stars". */
  label?: string;
}) {
  const safe = Math.max(0, Math.min(STARS_PER_CLEAR, value));
  const rounded = Math.round(safe * 10) / 10;
  const summary = label ?? `${rounded} of ${STARS_PER_CLEAR} stars`;

  return (
    <span className="star-rating" data-size={size} role="img" aria-label={summary}>
      {Array.from({ length: STARS_PER_CLEAR }, (_, i) => (
        <Star key={i} fill={safe - i} />
      ))}
    </span>
  );
}

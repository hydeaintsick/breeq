"use client";

import { useId } from "react";
import { STARS_PER_CLEAR } from "@/game/breakout/engine/stars";

/** A soft five-point star: rounded tips and valleys, centered in a 24×24 box. */
const STAR_PATH =
  "M11.1 4.02Q12 2.2 12.9 4.02L14.34 6.94Q15 8.27 16.47 8.49L19.69 8.96Q21.7 9.25 20.25 10.67L17.92 12.94Q16.85 13.98 17.1 15.44L17.65 18.65Q18 20.65 16.2 19.71L13.32 18.19Q12 17.5 10.68 18.19L7.8 19.71Q6 20.65 6.35 18.65L6.9 15.44Q7.15 13.98 6.08 12.94L3.75 10.67Q2.3 9.25 4.31 8.96L7.53 8.49Q9 8.27 9.66 6.94Z";

function clampFill(value: number) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/** The unlit slot: a hairline outline over a faint glass fill. */
function GhostStar() {
  return (
    <svg className="star-ghost" viewBox="0 0 24 24" aria-hidden="true">
      <path d={STAR_PATH} />
    </svg>
  );
}

/**
 * The lit star, a glossy glass gem: a soft shaded body under a gradient face,
 * a bright specular cap and a thin rim. A partial fill clips every layer
 * inside the SVG, so the glow around it is never boxed in.
 */
function LitStar({ fill }: { fill: number }) {
  // React ids carry punctuation (`«r3»`) that breaks `url(#…)` paint references.
  const id = `star-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const clipId = `${id}-clip`;
  const faceId = `${id}-face`;
  const bodyId = `${id}-body`;
  const specId = `${id}-spec`;
  const shadeId = `${id}-shade`;
  const width = 24 * clampFill(fill);

  return (
    <svg className="star-lit" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="-2" width={width} height="28" />
        </clipPath>
        <linearGradient id={faceId} x1="0.25" y1="0" x2="0.75" y2="1">
          <stop offset="0" className="star-face-hi" />
          <stop offset="0.55" className="star-face-mid" />
          <stop offset="1" className="star-face-lo" />
        </linearGradient>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="star-body-hi" />
          <stop offset="1" className="star-body-lo" />
        </linearGradient>
        <radialGradient id={specId} cx="0.36" cy="0.2" r="0.5">
          <stop offset="0" stopColor="white" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.16" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={shadeId} cx="0.5" cy="1.05" r="0.75">
          <stop offset="0" stopColor="#0b0d1a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#0b0d1a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d={STAR_PATH} transform="translate(0.35 1.15)" fill={`url(#${bodyId})`} className="star-body" />
        <path d={STAR_PATH} fill={`url(#${faceId})`} />
        <path d={STAR_PATH} fill={`url(#${shadeId})`} />
        <path d={STAR_PATH} fill={`url(#${specId})`} />
        <path d={STAR_PATH} className="star-rim" />
      </g>
    </svg>
  );
}

function Star({ fill }: { fill: number }) {
  const lit = clampFill(fill);
  return (
    <span className="star" data-on={lit >= 0.97 ? "true" : lit > 0.02 ? "partial" : "false"}>
      <GhostStar />
      {lit > 0.02 ? <LitStar fill={lit} /> : null}
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

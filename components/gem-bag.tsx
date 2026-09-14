"use client";

import { useId } from "react";

/**
 * The gem bags: five hand-drawn SVG pouches, one per pack size. A glass sack
 * drawn with the site's tokens, gems spilling from the neck; the bigger the
 * pack, the fuller the bag and the brighter the bloom behind it. No raster
 * assets, no third-party art — one component, five tiers, any size.
 */

export type BagTier = 1 | 2 | 3 | 4 | 5;

/** Which bag a pack gets: by rank among the packs on sale. */
export function bagTierFor(index: number, count: number): BagTier {
  if (count <= 1) return 3;
  const t = Math.round((index / (count - 1)) * 4) + 1;
  return Math.min(5, Math.max(1, t)) as BagTier;
}

const NEONS = ["var(--neon-cyan)", "var(--neon-blue)", "var(--neon-violet)", "var(--neon-pink)", "var(--neon-lime)", "var(--neon-amber)"];

/** A shard, pointing up, at a place and scale. */
function Shard({ x, y, s, color, rotate = 0, id }: { x: number; y: number; s: number; color: string; rotate?: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <path d="M-5 -6h10l3.5 5L0 10l-8.5-11z" fill={color} />
      <path d="M-5 -6h10l3.5 5h-17z" fill={`url(#${id}-facet)`} />
      <path d="M-2.4 -1 0 10 2.4 -1 0 -6z" fill="#ffffff" opacity="0.22" />
      <path d="M-5 -6h10l3.5 5L0 10l-8.5-11z" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.7" />
    </g>
  );
}

const PILES: Record<BagTier, { x: number; y: number; s: number; c: number; r: number }[]> = {
  1: [{ x: 60, y: 44, s: 1.05, c: 0, r: -8 }],
  2: [
    { x: 54, y: 44, s: 1, c: 0, r: -12 },
    { x: 68, y: 42, s: 0.9, c: 2, r: 10 },
  ],
  3: [
    { x: 50, y: 44, s: 0.95, c: 0, r: -14 },
    { x: 62, y: 40, s: 1.05, c: 1, r: 0 },
    { x: 74, y: 45, s: 0.9, c: 3, r: 12 },
    { x: 27, y: 99, s: 0.8, c: 2, r: 20 },
  ],
  4: [
    { x: 46, y: 43, s: 0.9, c: 4, r: -18 },
    { x: 57, y: 38, s: 1, c: 0, r: -6 },
    { x: 69, y: 39, s: 1, c: 1, r: 6 },
    { x: 80, y: 44, s: 0.85, c: 3, r: 16 },
    { x: 24, y: 100, s: 0.85, c: 2, r: 24 },
    { x: 100, y: 101, s: 0.8, c: 5, r: -20 },
  ],
  5: [
    { x: 42, y: 42, s: 0.9, c: 5, r: -22 },
    { x: 52, y: 36, s: 1, c: 0, r: -10 },
    { x: 63, y: 33, s: 1.1, c: 1, r: 0 },
    { x: 74, y: 36, s: 1, c: 2, r: 10 },
    { x: 84, y: 42, s: 0.9, c: 3, r: 22 },
    { x: 20, y: 98, s: 0.9, c: 4, r: 26 },
    { x: 104, y: 99, s: 0.9, c: 0, r: -26 },
    { x: 32, y: 108, s: 0.7, c: 1, r: 8 },
    { x: 94, y: 109, s: 0.7, c: 5, r: -8 },
  ],
};

/** Bag silhouettes: the pouch widens and rises with the tier. */
const BAGS: Record<BagTier, { body: string; neck: string; tie: string; bloom: number }> = {
  1: {
    body: "M48 60 C38 62 30 78 30 92 C30 108 44 112 62 112 C80 112 94 108 94 92 C94 78 86 62 76 60 Z",
    neck: "M50 60 C52 54 56 50 62 50 C68 50 72 54 74 60 Z",
    tie: "M48 61 L76 61",
    bloom: 0.35,
  },
  2: {
    body: "M46 58 C34 60 26 78 26 94 C26 110 42 114 62 114 C82 114 98 110 98 94 C98 78 90 60 78 58 Z",
    neck: "M48 58 C50 51 55 47 62 47 C69 47 74 51 76 58 Z",
    tie: "M46 59 L78 59",
    bloom: 0.45,
  },
  3: {
    body: "M44 56 C30 58 22 78 22 96 C22 112 40 116 62 116 C84 116 102 112 102 96 C102 78 94 58 80 56 Z",
    neck: "M46 56 C48 48 54 44 62 44 C70 44 76 48 78 56 Z",
    tie: "M44 57 L80 57",
    bloom: 0.55,
  },
  4: {
    body: "M42 54 C26 56 18 78 18 98 C18 114 38 118 62 118 C86 118 106 114 106 98 C106 78 98 56 82 54 Z",
    neck: "M44 54 C46 45 53 41 62 41 C71 41 78 45 80 54 Z",
    tie: "M42 55 L82 55",
    bloom: 0.7,
  },
  5: {
    body: "M40 52 C22 54 14 78 14 100 C14 116 36 120 62 120 C88 120 110 116 110 100 C110 78 102 54 84 52 Z",
    neck: "M42 52 C44 42 52 38 62 38 C72 38 80 42 82 52 Z",
    tie: "M40 53 L84 53",
    bloom: 0.9,
  },
};

export function GemBag({ tier, className = "pack-art" }: { tier: BagTier; className?: string }) {
  const id = useId().replace(/:/g, "");
  const bag = BAGS[tier];
  const pile = PILES[tier];
  return (
    <svg viewBox="0 0 124 124" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-bloom`} cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="var(--neon-violet)" stopOpacity={bag.bloom * 0.55} />
          <stop offset="55%" stopColor="var(--neon-cyan)" stopOpacity={bag.bloom * 0.18} />
          <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--neon-blue)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--neon-violet)" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${id}-facet`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={bag.body} />
        </clipPath>
      </defs>

      <circle cx="62" cy="80" r="58" fill={`url(#${id}-bloom)`} />

      {/* Shards on the ground, behind the bag. */}
      {pile
        .filter((g) => g.y > 90)
        .map((g, i) => (
          <Shard key={`b${i}`} id={id} x={g.x} y={g.y} s={g.s} color={NEONS[g.c]} rotate={g.r} />
        ))}

      {/* The pouch: dark glass, neon inside, a white rim. */}
      <path d={bag.body} fill="#0b0d1a" opacity="0.92" />
      <path d={bag.body} fill={`url(#${id}-inner)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {/* The gems inside, seen through the glass. */}
        {Array.from({ length: tier * 3 + 2 }, (_, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const x = 36 + col * 17 + (row % 2) * 8;
          const y = 104 - row * 13;
          return <Shard key={`in${i}`} id={id} x={x} y={y} s={0.62} color={NEONS[(i + tier) % NEONS.length]} rotate={(i % 3) * 14 - 14} />;
        })}
        <path d={bag.body} fill="#0b0d1a" opacity="0.35" />
      </g>
      <path d={bag.body} fill={`url(#${id}-glass)`} opacity="0.55" />
      <path d={bag.body} fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1.2" />
      {/* Highlight along the left shoulder. */}
      <path d="M36 70 C30 80 29 92 32 104" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round" />

      {/* Neck and tie. */}
      <path d={bag.neck} fill="#0b0d1a" opacity="0.9" />
      <path d={bag.neck} fill={`url(#${id}-glass)`} opacity="0.5" />
      <path d={bag.neck} fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.2" />
      <path d={bag.tie} stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.95" />
      <path d={bag.tie} stroke="var(--neon-cyan)" strokeWidth="1" strokeLinecap="round" opacity="0.9" />

      {/* Shards spilling from the neck, in front. */}
      {pile
        .filter((g) => g.y <= 90)
        .map((g, i) => (
          <Shard key={`f${i}`} id={id} x={g.x} y={g.y} s={g.s} color={NEONS[g.c]} rotate={g.r} />
        ))}
    </svg>
  );
}

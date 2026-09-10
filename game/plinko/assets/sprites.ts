/**
 * Sprite library — the visual kit of King of Thieves.
 *
 * Every sprite is authored as SVG so it stays vector, scales to any device
 * pixel ratio, and can carry gradients and soft shadows that Canvas 2D is bad
 * at. Colors are injected from the shared palette (design tokens), so the kit
 * re-themes with the site and never hardcodes a brand color.
 *
 * Dimensions are in *world units* (the same units the physics engine uses).
 * The rasterizer scales them to screen pixels.
 */
import { shade, type Palette } from "./palette";

export interface SpriteSource {
  /** Width in world units. */
  w: number;
  /** Height in world units. */
  h: number;
  /** Anchor point in world units, relative to the sprite's top-left. */
  ax: number;
  ay: number;
  svg: (p: Palette) => string;
}

const NS = 'xmlns="http://www.w3.org/2000/svg"';

function svg(w: number, h: number, body: string): string {
  return `<svg ${NS} width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

/** Soft Gaussian blur filter, usable as `filter="url(#id)"`. */
function blur(id: string, radius: number): string {
  return `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${radius}"/></filter>`;
}

/** Brushed-metal gradient across the horizontal axis. */
function metal(id: string, p: Palette, angle: "h" | "v" = "h"): string {
  const dir = angle === "h" ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"';
  return `<linearGradient id="${id}" ${dir}>
    <stop offset="0" stop-color="${shade(p.goldDim, 0.55)}"/>
    <stop offset="0.35" stop-color="${p.goldDim}"/>
    <stop offset="0.5" stop-color="${p.gold}"/>
    <stop offset="0.65" stop-color="${p.goldDim}"/>
    <stop offset="1" stop-color="${shade(p.goldDim, 0.5)}"/>
  </linearGradient>`;
}

/** Lit gold sphere gradient, highlight top-left. */
function sphere(id: string, p: Palette): string {
  return `<radialGradient id="${id}" cx="0.36" cy="0.3" r="0.78">
    <stop offset="0" stop-color="#fff8dd"/>
    <stop offset="0.16" stop-color="${p.goldBright}"/>
    <stop offset="0.52" stop-color="${p.gold}"/>
    <stop offset="0.84" stop-color="${p.goldDim}"/>
    <stop offset="1" stop-color="${p.goldDeep}"/>
  </radialGradient>`;
}

/**
 * Peg — a polished gold stud set into the board. The shadow is baked into the
 * sprite so 40 pegs cost 40 `drawImage` calls and nothing else.
 */
export const peg: SpriteSource = {
  w: 24,
  h: 24,
  ax: 12,
  ay: 12,
  svg: (p) =>
    svg(
      24,
      24,
      `<defs>${sphere("s", p)}${blur("b", 1.5)}</defs>
      <ellipse cx="12" cy="14.6" rx="5.8" ry="3.6" fill="#000" fill-opacity="0.6" filter="url(#b)"/>
      <circle cx="12" cy="12" r="5" fill="url(#s)"/>
      <circle cx="12" cy="12" r="5" fill="none" stroke="${p.goldBright}" stroke-opacity="0.22" stroke-width="0.6"/>
      <ellipse cx="10.3" cy="9.8" rx="1.7" ry="1" fill="#fffdf4" fill-opacity="0.85" transform="rotate(-32 10.3 9.8)"/>
      <path d="M8.4 14.2a5 5 0 0 0 7.2 0" fill="none" stroke="${p.goldBright}" stroke-opacity="0.28" stroke-width="0.7"/>`,
    ),
};

/** Ball — the attacker's gold coin, rendered as a sphere with a warm halo. */
export const ball: SpriteSource = {
  w: 36,
  h: 36,
  ax: 18,
  ay: 18,
  svg: (p) =>
    svg(
      36,
      36,
      `<defs>
        ${sphere("s", p)}
        <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.4" stop-color="${p.goldBright}" stop-opacity="0.55"/>
          <stop offset="0.7" stop-color="${p.gold}" stop-opacity="0.16"/>
          <stop offset="1" stop-color="${p.gold}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="18" fill="url(#halo)"/>
      <circle cx="18" cy="18" r="7" fill="url(#s)"/>
      <circle cx="18" cy="18" r="7" fill="none" stroke="#fff6d8" stroke-opacity="0.35" stroke-width="0.6"/>
      <ellipse cx="15.4" cy="14.8" rx="2.4" ry="1.4" fill="#fffef8" fill-opacity="0.9" transform="rotate(-30 15.4 14.8)"/>`,
    ),
};

/** Chest body — bronze box with two gold bands and a lock plate. */
export const chestBase: SpriteSource = {
  w: 72,
  h: 40,
  ax: 36,
  ay: 40,
  svg: (p) => {
    const bodyTop = p.goldDim;
    const bodyBottom = shade(p.goldDim, 0.42);
    return svg(
      72,
      40,
      `<defs>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${bodyTop}"/>
          <stop offset="1" stop-color="${bodyBottom}"/>
        </linearGradient>
        <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000" stop-opacity="0.35"/>
          <stop offset="0.18" stop-color="#000" stop-opacity="0"/>
          <stop offset="0.82" stop-color="#000" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
        </linearGradient>
        ${metal("band", p, "v")}
        ${blur("b", 2.2)}
      </defs>
      <ellipse cx="36" cy="38" rx="32" ry="4" fill="#000" fill-opacity="0.65" filter="url(#b)"/>
      <rect x="4" y="8" width="64" height="30" rx="3" fill="url(#body)"/>
      <rect x="4" y="8" width="64" height="30" rx="3" fill="url(#side)"/>
      <rect x="15" y="6" width="6" height="33" rx="1" fill="url(#band)"/>
      <rect x="51" y="6" width="6" height="33" rx="1" fill="url(#band)"/>
      <rect x="4.5" y="8.5" width="63" height="1" fill="${p.goldBright}" fill-opacity="0.35"/>
      <rect x="30" y="14" width="12" height="12" rx="2" fill="url(#band)"/>
      <circle cx="36" cy="18.6" r="1.7" fill="${p.goldDeep}"/>
      <rect x="35.2" y="19" width="1.6" height="4" fill="${p.goldDeep}"/>
      <rect x="4" y="8" width="64" height="30" rx="3" fill="none" stroke="${p.goldDeep}" stroke-opacity="0.9" stroke-width="0.8"/>`,
    );
  },
};

/** Chest lid — domed, gold, hinged at the back. Anchor is the hinge line. */
export const chestLid: SpriteSource = {
  w: 72,
  h: 22,
  ax: 36,
  ay: 22,
  svg: (p) =>
    svg(
      72,
      22,
      `<defs>
        <linearGradient id="lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.goldBright}"/>
          <stop offset="0.45" stop-color="${p.gold}"/>
          <stop offset="1" stop-color="${p.goldDim}"/>
        </linearGradient>
        ${metal("band", p, "v")}
      </defs>
      <path d="M4 22V12Q4 3 14 3H58Q68 3 68 12V22Z" fill="url(#lid)"/>
      <path d="M4 22V12Q4 3 14 3H58Q68 3 68 12V22Z" fill="none" stroke="${p.goldDeep}" stroke-opacity="0.85" stroke-width="0.8"/>
      <path d="M8 21V12Q8 6 14 6H58Q64 6 64 12V21" fill="none" stroke="#fff6d8" stroke-opacity="0.28" stroke-width="0.8"/>
      <rect x="15" y="2.5" width="6" height="19.5" rx="1" fill="url(#band)"/>
      <rect x="51" y="2.5" width="6" height="19.5" rx="1" fill="url(#band)"/>
      <rect x="30" y="17" width="12" height="5" rx="1.2" fill="url(#band)"/>`,
    ),
};

/** Void — a pit cut into the floor with a faint red breath around the rim. */
export const voidPit: SpriteSource = {
  w: 88,
  h: 34,
  ax: 44,
  ay: 17,
  svg: (p) =>
    svg(
      88,
      34,
      `<defs>
        <radialGradient id="pit" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#000"/>
          <stop offset="0.62" stop-color="#040203"/>
          <stop offset="1" stop-color="${shade(p.danger, 0.22)}"/>
        </radialGradient>
        ${blur("mist", 3.2)}
        ${blur("edge", 0.8)}
      </defs>
      <ellipse cx="44" cy="17" rx="40" ry="12.5" fill="${p.danger}" fill-opacity="0.32" filter="url(#mist)"/>
      <ellipse cx="44" cy="17" rx="35" ry="10" fill="url(#pit)"/>
      <ellipse cx="44" cy="17" rx="35" ry="10" fill="none" stroke="${p.danger}" stroke-opacity="0.65" stroke-width="1" filter="url(#edge)"/>
      <ellipse cx="44" cy="15.4" rx="32" ry="8" fill="none" stroke="#000" stroke-opacity="0.7" stroke-width="1.2"/>`,
    ),
};

/** Nail — a steel spike, pointing left (rotate for other directions). */
export const nail: SpriteSource = {
  w: 28,
  h: 14,
  ax: 28,
  ay: 7,
  svg: (p) =>
    svg(
      28,
      14,
      `<defs>
        <linearGradient id="tip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f8ecc7"/>
          <stop offset="0.48" stop-color="${p.gold}"/>
          <stop offset="0.52" stop-color="${p.goldDim}"/>
          <stop offset="1" stop-color="${p.goldDeep}"/>
        </linearGradient>
        ${metal("base", p, "v")}
      </defs>
      <path d="M1.5 7L25 2.6V11.4Z" fill="url(#tip)"/>
      <path d="M1.5 7L25 2.6V7Z" fill="#fff" fill-opacity="0.14"/>
      <rect x="23.5" y="1" width="4.5" height="12" rx="1" fill="url(#base)"/>`,
    ),
};

/** Trampoline post — small brass stanchion. Anchor is the band attach point. */
export const trampolinePost: SpriteSource = {
  w: 10,
  h: 18,
  ax: 5,
  ay: 4,
  svg: (p) =>
    svg(
      10,
      18,
      `<defs>${metal("m", p)}</defs>
      <rect x="3" y="4" width="4" height="14" rx="1" fill="url(#m)"/>
      <circle cx="5" cy="4" r="3" fill="${p.gold}"/>
      <circle cx="5" cy="4" r="3" fill="none" stroke="${p.goldDeep}" stroke-opacity="0.8" stroke-width="0.6"/>
      <circle cx="4.2" cy="3.2" r="0.9" fill="#fff8dd" fill-opacity="0.85"/>`,
    ),
};

/** Fan housing — a round vent set into the rail. */
export const fanHousing: SpriteSource = {
  w: 40,
  h: 40,
  ax: 20,
  ay: 20,
  svg: (p) =>
    svg(
      40,
      40,
      `<defs>
        <radialGradient id="in" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#050609"/>
          <stop offset="0.72" stop-color="#0b0d13"/>
          <stop offset="1" stop-color="#181a20"/>
        </radialGradient>
        ${metal("ring", p)}
        ${blur("b", 1.6)}
      </defs>
      <circle cx="20" cy="21.5" r="17" fill="#000" fill-opacity="0.55" filter="url(#b)"/>
      <circle cx="20" cy="20" r="17" fill="url(#in)"/>
      <circle cx="20" cy="20" r="17" fill="none" stroke="url(#ring)" stroke-width="2.6"/>
      <circle cx="20" cy="20" r="14.2" fill="none" stroke="${p.goldDim}" stroke-opacity="0.45" stroke-width="0.6"/>
      <circle cx="20" cy="20" r="17" fill="none" stroke="#fff6d8" stroke-opacity="0.18" stroke-width="0.6"/>`,
    ),
};

/** Fan blades — four gold petals around a hub. Rotated by the renderer. */
export const fanBlades: SpriteSource = {
  w: 30,
  h: 30,
  ax: 15,
  ay: 15,
  svg: (p) => {
    const blade = `<path d="M15 15C16.5 9.5 21 6.5 26.5 3.5C21 5.2 14 9 15 15Z" fill="url(#bl)"/>`;
    return svg(
      30,
      30,
      `<defs>
        <linearGradient id="bl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.goldBright}"/>
          <stop offset="1" stop-color="${p.goldDim}"/>
        </linearGradient>
      </defs>
      ${blade}
      <g transform="rotate(90 15 15)">${blade}</g>
      <g transform="rotate(180 15 15)">${blade}</g>
      <g transform="rotate(270 15 15)">${blade}</g>
      <circle cx="15" cy="15" r="2.8" fill="${p.goldBright}"/>
      <circle cx="15" cy="15" r="2.8" fill="none" stroke="${p.goldDeep}" stroke-opacity="0.8" stroke-width="0.6"/>`,
    );
  },
};

/** Portal ring — segmented gold ring. Two rings counter-rotate in the renderer. */
export const portalRing: SpriteSource = {
  w: 52,
  h: 52,
  ax: 26,
  ay: 26,
  svg: (p) =>
    svg(
      52,
      52,
      `<defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.goldBright}"/>
          <stop offset="0.5" stop-color="${p.gold}"/>
          <stop offset="1" stop-color="${p.goldDim}"/>
        </linearGradient>
        ${blur("b", 1.4)}
      </defs>
      <circle cx="26" cy="26" r="22" fill="none" stroke="${p.gold}" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="10 6" filter="url(#b)"/>
      <circle cx="26" cy="26" r="22" fill="none" stroke="url(#g)" stroke-width="2.2" stroke-dasharray="10 6" stroke-linecap="round"/>`,
    ),
};

/** Portal core — the dark eye that looks like an exit and is not. */
export const portalCore: SpriteSource = {
  w: 40,
  h: 40,
  ax: 20,
  ay: 20,
  svg: (p) =>
    svg(
      40,
      40,
      `<defs>
        <radialGradient id="eye" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#03040a"/>
          <stop offset="0.55" stop-color="#090b14"/>
          <stop offset="0.86" stop-color="${p.goldDeep}"/>
          <stop offset="1" stop-color="${p.gold}" stop-opacity="0.4"/>
        </radialGradient>
        ${blur("b", 1)}
      </defs>
      <circle cx="20" cy="20" r="16" fill="url(#eye)"/>
      <circle cx="20" cy="20" r="11" fill="none" stroke="${p.gold}" stroke-opacity="0.4" stroke-width="0.8" stroke-dasharray="3 5"/>
      <circle cx="20" cy="20" r="5" fill="#000"/>
      <circle cx="20" cy="20" r="6" fill="none" stroke="${p.goldBright}" stroke-opacity="0.35" stroke-width="0.8" filter="url(#b)"/>`,
    ),
};

/** Hopper — the brass funnel that releases the ball. Anchor is the slot exit. */
export const hopper: SpriteSource = {
  w: 64,
  h: 30,
  ax: 32,
  ay: 30,
  svg: (p) =>
    svg(
      64,
      30,
      `<defs>
        <linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.goldDim}"/>
          <stop offset="1" stop-color="${shade(p.goldDim, 0.45)}"/>
        </linearGradient>
        ${metal("lip", p)}
        ${blur("b", 2)}
      </defs>
      <path d="M6 4H58L40 24H24Z" fill="#000" fill-opacity="0.5" filter="url(#b)" transform="translate(0 2)"/>
      <path d="M6 3H58L40 23H24Z" fill="url(#f)"/>
      <path d="M6 3H58L40 23H24Z" fill="none" stroke="${p.goldDeep}" stroke-opacity="0.9" stroke-width="0.8"/>
      <rect x="4" y="1" width="56" height="4" rx="1.5" fill="url(#lip)"/>
      <rect x="4" y="1" width="56" height="1" fill="#fff6d8" fill-opacity="0.35"/>
      <rect x="23" y="22" width="18" height="8" rx="2" fill="#000"/>
      <rect x="23" y="22" width="18" height="8" rx="2" fill="none" stroke="${p.gold}" stroke-opacity="0.6" stroke-width="0.8"/>`,
    ),
};

/** Coin — loot particle when the chest opens. */
export const coin: SpriteSource = {
  w: 12,
  h: 12,
  ax: 6,
  ay: 6,
  svg: (p) =>
    svg(
      12,
      12,
      `<defs>${sphere("s", p)}</defs>
      <circle cx="6" cy="6" r="5" fill="url(#s)"/>
      <circle cx="6" cy="6" r="3.2" fill="none" stroke="${p.goldDeep}" stroke-opacity="0.7" stroke-width="0.6"/>`,
    ),
};

export const SPRITES = {
  peg,
  ball,
  chestBase,
  chestLid,
  voidPit,
  nail,
  trampolinePost,
  fanHousing,
  fanBlades,
  portalRing,
  portalCore,
  hopper,
  coin,
} as const;

export type SpriteName = keyof typeof SPRITES;

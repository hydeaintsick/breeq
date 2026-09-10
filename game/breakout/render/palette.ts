/**
 * Neon palette for the breakout renderer, read from the shared design tokens
 * in `app/globals.css`. Falls back to the same literals the stylesheet declares.
 */
import type { BrickColor, PaddleModKind, ZoneKind } from "../engine/types";

export interface NeonPalette {
  ink: string;
  surface: string;
  neon: Record<BrickColor, string>;
  steel: string;
  danger: string;
}

const FALLBACK: NeonPalette = {
  ink: "#0f1117",
  surface: "#ffffff",
  neon: {
    blue: "#4f7cff",
    violet: "#8b5cf6",
    pink: "#ff4fa3",
    cyan: "#22d3ee",
    lime: "#a3e635",
    amber: "#ffb020",
  },
  steel: "#c9d2e3",
  danger: "#ff5a5f",
};

export function readNeonPalette(root?: Element | null): NeonPalette {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") {
    return FALLBACK;
  }
  const styles = getComputedStyle(root ?? document.documentElement);
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;

  return {
    ink: read("--ink", FALLBACK.ink),
    surface: read("--surface", FALLBACK.surface),
    neon: {
      blue: read("--neon-blue", FALLBACK.neon.blue),
      violet: read("--neon-violet", FALLBACK.neon.violet),
      pink: read("--neon-pink", FALLBACK.neon.pink),
      cyan: read("--neon-cyan", FALLBACK.neon.cyan),
      lime: read("--neon-lime", FALLBACK.neon.lime),
      amber: read("--neon-amber", FALLBACK.neon.amber),
    },
    steel: read("--steel", FALLBACK.steel),
    danger: read("--danger", FALLBACK.danger),
  };
}

export type Tint = BrickColor | "steel" | "white" | "danger";

/** Resolve a catalog tint against the palette. */
export function tintOf(p: NeonPalette, tint: Tint): string {
  if (tint === "white") return "#ffffff";
  if (tint === "steel") return p.steel;
  if (tint === "danger") return p.danger;
  return p.neon[tint];
}

/** Which color each zone kind glows in. */
export const ZONE_TINT: Record<ZoneKind, Tint> = {
  slow: "cyan",
  fast2: "amber",
  fast3: "pink",
  antigrav: "lime",
  gravity: "violet",
  portal: "blue",
  fakePortal: "blue",
  mirror: "cyan",
  fog: "white",
  split: "pink",
  shrink: "danger",
  grow: "lime",
  invert: "amber",
  ice: "cyan",
  sticky: "violet",
};

/** Text labels for zones that read best as type. Others are drawn as shapes. */
export const ZONE_LABEL: Partial<Record<ZoneKind, string>> = {
  slow: "½",
  fast2: "×2",
  fast3: "×3",
  antigrav: "↑",
  gravity: "↓",
  split: "+1",
  shrink: "−",
  grow: "+",
  invert: "↔",
};

export const MOD_TINT: Record<PaddleModKind, Tint> = {
  shrink: "danger",
  grow: "lime",
  invert: "amber",
  ice: "cyan",
  sticky: "violet",
};

/**
 * Skins: how the paddle and the ball look. Pure data the renderer reads; the
 * catalog, the prices and who owns what live in `lib/cosmetics.ts`. A skin
 * never changes the game — same level, seed and inputs play the same — it
 * only picks colors, a trail style and a pattern on the glass.
 *
 * Colors are either a palette token (a neon name, "white", "steel",
 * "danger"), "speed" (follow the ball's speed color, the default look) or a
 * literal CSS color. The renderer resolves them once per frame.
 */
import { tintOf, type NeonPalette, type Tint } from "./palette";

export type SkinColor = Tint | "speed" | (string & {});

export type TrailStyle = "comet" | "ribbon" | "sparks" | "embers" | "none";

export interface PaddleLook {
  /** Top and bottom of the glass body: literal colors (rgba allowed). */
  top: string;
  bottom: string;
  /** The hairline around the body. */
  rim: string;
  /** The underglow and the hit flash. */
  glow: SkinColor;
  /** Diagonal bands across the glass, cycling through these colors. */
  stripes?: readonly string[];
}

export interface BallLook {
  /** The center of the core. */
  core: string;
  /** The core's edge and the countdown ring on clones. */
  edge: SkinColor;
  /** The soft light around the ball. */
  aura: SkinColor;
  /** How much bigger than the default the aura is (1 = default). */
  auraScale?: number;
  trail: TrailStyle;
  trailTint: SkinColor;
}

export interface SkinSet {
  paddle: PaddleLook;
  ball: BallLook;
}

/** The free look every player starts with: white glass, a comet that follows the speed color. */
export const DEFAULT_PADDLE_LOOK: PaddleLook = {
  top: "rgba(255, 255, 255, 0.96)",
  bottom: "rgba(225, 230, 245, 0.88)",
  rim: "rgba(255, 255, 255, 0.7)",
  glow: "speed",
};

export const DEFAULT_BALL_LOOK: BallLook = {
  core: "#ffffff",
  edge: "speed",
  aura: "speed",
  trail: "comet",
  trailTint: "speed",
};

export const DEFAULT_SKIN_SET: SkinSet = { paddle: DEFAULT_PADDLE_LOOK, ball: DEFAULT_BALL_LOOK };

const TINTS: ReadonlySet<string> = new Set(["blue", "violet", "pink", "cyan", "lime", "amber", "steel", "white", "danger"]);

/** Resolve a skin color against the palette; `speed` is what the board is doing right now. */
export function skinColor(color: SkinColor, palette: NeonPalette, speed: string): string {
  if (color === "speed") return speed;
  if (TINTS.has(color)) return tintOf(palette, color as Tint);
  return color;
}

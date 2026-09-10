/**
 * The piece catalog — what the level editor shows the player, and what the
 * validator uses to price a level. Data only.
 */
import type { BrickColor, BrickKind, ObstacleKind, ZoneKind } from "./types";

export type PieceFamily = "brick" | "zone" | "obstacle" | "rule";
export type PieceTint = BrickColor | "steel" | "white" | "danger";

export interface CatalogEntry {
  id: string;
  family: PieceFamily;
  name: string;
  blurb: string;
  /** Short mono glyph used on the field and in the editor. */
  glyph: string;
  /** Budget points. A level may not exceed `LEVEL_BUDGET`. */
  cost: number;
  tint: PieceTint;
}

/** Total budget per level, in catalog points. */
export const LEVEL_BUDGET = 600;

export const BRICKS: Record<BrickKind, CatalogEntry> = {
  glass: { id: "glass", family: "brick", name: "Glass", blurb: "One hit. The body of the wall.", glyph: "", cost: 1, tint: "pink" },
  hard: { id: "hard", family: "brick", name: "Hard", blurb: "Two hits, cracks in between.", glyph: "", cost: 2, tint: "violet" },
  steel: { id: "steel", family: "brick", name: "Steel", blurb: "Never breaks. Shapes the path.", glyph: "", cost: 3, tint: "steel" },
  explosive: { id: "explosive", family: "brick", name: "Explosive", blurb: "Takes its neighbors with it. Chains.", glyph: "✸", cost: 6, tint: "amber" },
  ghost: { id: "ghost", family: "brick", name: "Ghost", blurb: "Fades out; the ball passes while it is open.", glyph: "◌", cost: 3, tint: "cyan" },
  regen: { id: "regen", family: "brick", name: "Regen", blurb: "Comes back six seconds later. Scores again, never blocks the clear.", glyph: "↻", cost: 5, tint: "lime" },
  magnet: { id: "magnet", family: "brick", name: "Magnet", blurb: "Bends the ball toward it.", glyph: "∪", cost: 5, tint: "blue" },
  rotor: { id: "rotor", family: "brick", name: "Rotor", blurb: "A slow blade. Unpredictable angles.", glyph: "✕", cost: 6, tint: "amber" },
  key: { id: "key", family: "brick", name: "Key", blurb: "Break every key to open the locks.", glyph: "⚿", cost: 4, tint: "amber" },
  lock: { id: "lock", family: "brick", name: "Lock", blurb: "Unbreakable until the keys are gone.", glyph: "⚿", cost: 4, tint: "steel" },
};

export const ZONES: Record<ZoneKind, CatalogEntry> = {
  slow: { id: "slow", family: "zone", name: "Slow", blurb: "Half speed for five seconds.", glyph: "½", cost: 8, tint: "cyan" },
  fast2: { id: "fast2", family: "zone", name: "Fast ×2", blurb: "Double speed for four seconds.", glyph: "×2", cost: 10, tint: "amber" },
  fast3: { id: "fast3", family: "zone", name: "Fast ×3", blurb: "Triple speed for three seconds.", glyph: "×3", cost: 14, tint: "pink" },
  antigrav: { id: "antigrav", family: "zone", name: "Anti-gravity", blurb: "The ball curves up while inside.", glyph: "↑", cost: 12, tint: "lime" },
  gravity: { id: "gravity", family: "zone", name: "Gravity", blurb: "The ball curves down while inside.", glyph: "↓", cost: 12, tint: "violet" },
  portal: { id: "portal", family: "zone", name: "Portal", blurb: "Exits at its twin, heading kept.", glyph: "◎", cost: 18, tint: "blue" },
  fakePortal: { id: "fakePortal", family: "zone", name: "Fake portal", blurb: "Looks like a portal. Is not.", glyph: "◎", cost: 8, tint: "blue" },
  mirror: { id: "mirror", family: "zone", name: "Mirror", blurb: "Flips the ball left-to-right on entry.", glyph: "⇋", cost: 10, tint: "cyan" },
  fog: { id: "fog", family: "zone", name: "Fog", blurb: "Hides the ball. Only the trail escapes.", glyph: "", cost: 14, tint: "white" },
  split: { id: "split", family: "zone", name: "Split", blurb: "A second ball for six seconds.", glyph: "+1", cost: 24, tint: "pink" },
  shrink: { id: "shrink", family: "zone", name: "Shrink", blurb: "Paddle at 60% for eight seconds.", glyph: "−", cost: 12, tint: "danger" },
  grow: { id: "grow", family: "zone", name: "Grow", blurb: "Paddle at 150% for eight seconds.", glyph: "+", cost: 6, tint: "lime" },
  invert: { id: "invert", family: "zone", name: "Invert", blurb: "Controls reversed for five seconds.", glyph: "↔", cost: 14, tint: "amber" },
  ice: { id: "ice", family: "zone", name: "Ice", blurb: "The paddle slides for six seconds.", glyph: "❄", cost: 12, tint: "cyan" },
  sticky: { id: "sticky", family: "zone", name: "Sticky", blurb: "The paddle catches the ball. Tap to release.", glyph: "∩", cost: 8, tint: "violet" },
};

export const OBSTACLES: Record<ObstacleKind, CatalogEntry> = {
  bumper: { id: "bumper", family: "obstacle", name: "Bumper", blurb: "Pinball post. Hard rebound, speed kick.", glyph: "●", cost: 10, tint: "amber" },
  rail: { id: "rail", family: "obstacle", name: "Rail", blurb: "The ball rolls along it and drops off the end.", glyph: "—", cost: 8, tint: "white" },
  fan: { id: "fan", family: "obstacle", name: "Fan", blurb: "Sideways wind in a corridor.", glyph: "≋", cost: 12, tint: "cyan" },
  guard: { id: "guard", family: "obstacle", name: "Guard", blurb: "A steel bar sweeping back and forth.", glyph: "▬", cost: 16, tint: "steel" },
  trampoline: { id: "trampoline", family: "obstacle", name: "Trampoline", blurb: "Fires the ball back up, faster.", glyph: "⌒", cost: 10, tint: "lime" },
  blackhole: { id: "blackhole", family: "obstacle", name: "Black hole", blurb: "Pulls balls in. Swallows what it catches.", glyph: "◉", cost: 30, tint: "violet" },
};

export const RULES_CATALOG: CatalogEntry[] = [
  { id: "lives", family: "rule", name: "Lives", blurb: "One to five.", glyph: "♥", cost: 0, tint: "danger" },
  { id: "timer", family: "rule", name: "Timer", blurb: "Clear the wall before the clock runs out.", glyph: "◷", cost: 0, tint: "amber" },
  { id: "descend", family: "rule", name: "Descend", blurb: "The wall drops a row every N paddle hits.", glyph: "⇣", cost: 0, tint: "violet" },
  { id: "order", family: "rule", name: "Order", blurb: "One color must fall before the rest can.", glyph: "①", cost: 0, tint: "blue" },
];

export const CATALOG: CatalogEntry[] = [
  ...Object.values(BRICKS),
  ...Object.values(ZONES),
  ...Object.values(OBSTACLES),
  ...RULES_CATALOG,
];

/**
 * Breakout engine types. Pure data — no DOM, no rendering.
 *
 * A `Level` is what a player builds: a wall of bricks, bonus zones, a
 * background. A `Game` plays one level: paddle, ball, lives, score.
 *
 * Units: world units. The default level is 360 x 640 (portrait, phone-first).
 */

export interface Vec2 {
  x: number;
  y: number;
}

/** Index into the neon palette. Bricks carry a color, not a hex value. */
export type BrickColor = "blue" | "violet" | "pink" | "cyan" | "lime" | "amber";

export type BrickKind =
  /** One hit. */
  | "glass"
  /** Two hits; shows a crack after the first. */
  | "hard"
  /** Cannot break. A wall the author places to shape the path. */
  | "steel";

export interface Brick {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: BrickKind;
  color: BrickColor;
  /** Hits left. `Infinity` for steel. */
  hp: number;
}

/**
 * Bonus zones are placed by the author and stay on the field. The ball
 * triggers them by passing through.
 */
export type BonusKind =
  /** Ball runs at half speed for a while. */
  | "slow"
  /** Ball runs at double speed. */
  | "fast2"
  /** Ball runs at triple speed. */
  | "fast3";

export interface Bonus {
  id: number;
  kind: BonusKind;
  x: number;
  y: number;
  r: number;
}

export interface LevelBackground {
  /** Only photos for now. */
  type: "photo";
  /** URL of the image, e.g. `/backgrounds/bokeh-rain.jpg` or a blob URL. */
  src: string;
  /** 0..1 darkening applied over the photo so bricks stay readable. */
  dim: number;
  /** Blur radius in world units applied to the photo. */
  blur: number;
}

export interface Level {
  id: string;
  name: string;
  /** Author handle, shown in the HUD. */
  author: string;
  width: number;
  height: number;
  /** Inner play field. Walls are its edges. */
  field: { left: number; right: number; top: number; bottom: number };
  paddle: { width: number; height: number; y: number };
  ball: { r: number; speed: number };
  lives: number;
  background: LevelBackground;
  bricks: Brick[];
  bonuses: Bonus[];
}

export type GamePhase =
  /** Ball rests on the paddle, waiting for launch. */
  | "serve"
  | "play"
  /** Ball just lost; brief pause before the next serve. */
  | "lost"
  | "cleared"
  | "over";

export interface SpeedState {
  /** Bonus multiplier currently applied (1 when none). */
  bonusMul: number;
  /** Seconds left on the bonus. */
  bonusLeft: number;
  bonusKind: BonusKind | null;
  /** Classic ramp from paddle hits: 1 + steps. */
  rampMul: number;
  /** Heat from rapid rebounds, 0..HEAT_MAX. */
  heat: number;
  /** Effective multiplier this step. */
  total: number;
}

export interface GameState {
  phase: GamePhase;
  time: number;
  lives: number;
  score: number;
  paddleX: number;
  ball: Vec2;
  /** Unit direction of travel. */
  dir: Vec2;
  speed: SpeedState;
  /** Consecutive paddle hits this life. */
  paddleHits: number;
  /** Remaining breakable bricks. */
  remaining: number;
  /** Seconds left in `serve` / `lost` / end phases before auto-advance. */
  phaseLeft: number;
}

export type GameEvent =
  | { t: number; type: "launch" }
  | { t: number; type: "wall"; side: "left" | "right" | "top"; x: number; y: number }
  | { t: number; type: "paddle"; x: number; y: number; offset: number }
  | { t: number; type: "brick"; brick: Brick; broken: boolean; x: number; y: number }
  | { t: number; type: "bonus"; bonus: Bonus }
  | { t: number; type: "bonusEnd"; kind: BonusKind }
  | { t: number; type: "heat"; heat: number }
  | { t: number; type: "life"; lives: number; x: number }
  | { t: number; type: "cleared"; score: number }
  | { t: number; type: "over"; score: number };

export interface GameInput {
  /** Desired paddle center x; the paddle moves toward it at its max speed. */
  targetX: number;
  /** Request launch during `serve`. */
  launch: boolean;
}

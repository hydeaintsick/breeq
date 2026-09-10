/**
 * Breakout engine types. Pure data — no DOM, no rendering.
 *
 * A `Level` is what a player builds: bricks, zones, obstacles, rules, and a
 * background. A `Game` plays one level: paddle, balls, lives, score.
 *
 * Units: world units. The default level is 360 x 640 (portrait, phone-first).
 */

export interface Vec2 {
  x: number;
  y: number;
}

/** Index into the neon palette. Pieces carry a color name, not a hex value. */
export type BrickColor = "blue" | "violet" | "pink" | "cyan" | "lime" | "amber";

// -----------------------------------------------------------------------------
// Bricks — what you break
// -----------------------------------------------------------------------------

export type BrickKind =
  /** One hit. */
  | "glass"
  /** Two hits; shows a crack after the first. */
  | "hard"
  /** Cannot break. A wall the author places to shape the path. */
  | "steel"
  /** Breaks its neighbors when it breaks; chains through other explosives. */
  | "explosive"
  /** Fades in and out; the ball passes through while it is open. */
  | "ghost"
  /** Comes back a few seconds after breaking, unless the wall is already clear. */
  | "regen"
  /** Pulls the ball toward it while it stands. */
  | "magnet"
  /** A slowly rotating blade; two hits. */
  | "rotor"
  /** Breaking every key unlocks the locks. */
  | "key"
  /** Unbreakable until every key is gone. */
  | "lock";

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
  /** Runtime only: a regen brick that already came back. Scores, but no longer counts toward clearing. */
  respawned?: boolean;
}

// -----------------------------------------------------------------------------
// Zones — what the ball passes through
// -----------------------------------------------------------------------------

export type SpeedZoneKind = "slow" | "fast2" | "fast3";
export type PaddleModKind = "shrink" | "grow" | "invert" | "ice" | "sticky";

export type ZoneKind =
  | SpeedZoneKind
  /** The ball curves upward while inside. */
  | "antigrav"
  /** The ball curves downward while inside. */
  | "gravity"
  /** Exits at the linked portal, heading kept. */
  | "portal"
  /** Looks like a portal. Does nothing. */
  | "fakePortal"
  /** Flips the horizontal heading on entry. */
  | "mirror"
  /** Hides the ball while inside. */
  | "fog"
  /** Adds a second ball for a few seconds. */
  | "split"
  | PaddleModKind;

export interface Zone {
  id: number;
  kind: ZoneKind;
  x: number;
  y: number;
  r: number;
  /** For `portal`: id of the paired portal. */
  link?: number;
}

// -----------------------------------------------------------------------------
// Obstacles — what sits on the field and is not part of the wall
// -----------------------------------------------------------------------------

export type Obstacle =
  /** Pinball post: hard rebound with a speed kick. */
  | { id: number; kind: "bumper"; x: number; y: number; r: number }
  /** A smooth bar the ball rolls along, then drops off the end. */
  | { id: number; kind: "rail"; x: number; y: number; w: number }
  /** Sideways wind inside a corridor. `dir` is -1 (left) or 1 (right). */
  | { id: number; kind: "fan"; x: number; y: number; dir: -1 | 1; reach: number; spread: number; force: number }
  /** A steel bar sweeping left and right. */
  | { id: number; kind: "guard"; x: number; y: number; w: number; h: number; range: number; speed: number }
  /** A band that fires the ball back up with a speed kick. */
  | { id: number; kind: "trampoline"; x: number; y: number; w: number }
  /** Pulls nearby balls in; swallows what it catches. */
  | { id: number; kind: "blackhole"; x: number; y: number; r: number };

export type ObstacleKind = Obstacle["kind"];

// -----------------------------------------------------------------------------
// Level
// -----------------------------------------------------------------------------

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

export interface LevelRules {
  /** Seconds to clear the wall. 0 = no timer. */
  timer: number;
  /** Paddle hits between wall drops (Space Invaders style). 0 = off. */
  descend: number;
  /** Color that must be cleared before any other brick can break. */
  order: BrickColor | null;
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
  rules: LevelRules;
  bricks: Brick[];
  zones: Zone[];
  obstacles: Obstacle[];
}

// -----------------------------------------------------------------------------
// Game state
// -----------------------------------------------------------------------------

export type GamePhase =
  /** Ball rests on the paddle, waiting for launch. */
  | "serve"
  | "play"
  /** Ball just lost; brief pause before the next serve. */
  | "lost"
  | "cleared"
  | "over";

export interface Ball {
  id: number;
  x: number;
  y: number;
  /** Unit direction of travel. */
  dx: number;
  dy: number;
  /** Seconds left for a split clone; `null` for a real ball. */
  ttl: number | null;
  /** Offset from the paddle center while caught by a sticky paddle. */
  stuck: number | null;
  /** Seconds spent stuck (auto-release for demos). */
  stuckFor: number;
  /** Rail being rolled along, if any. */
  rolling: number | null;
}

export interface SpeedState {
  /** Speed-zone multiplier currently applied (1 when none). */
  bonusMul: number;
  /** Seconds left on the speed zone effect. */
  bonusLeft: number;
  bonusKind: SpeedZoneKind | null;
  /** Classic ramp from paddle hits: 1 + steps. */
  rampMul: number;
  /** Heat from rapid rebounds, 0..HEAT_MAX. */
  heat: number;
  /** Effective multiplier this step. */
  total: number;
}

export interface PaddleMod {
  kind: PaddleModKind;
  left: number;
}

export interface GameState {
  phase: GamePhase;
  time: number;
  lives: number;
  score: number;
  paddleX: number;
  /** Paddle velocity, used while the paddle is iced. */
  paddleVel: number;
  /** Effective paddle width after mods. */
  paddleWidth: number;
  paddleMod: PaddleMod | null;
  balls: Ball[];
  speed: SpeedState;
  /** Consecutive paddle hits this life. */
  paddleHits: number;
  /** Total paddle hits this game (drives the descend rule). */
  totalPaddleHits: number;
  /** Remaining breakable bricks. */
  remaining: number;
  /** Keys still standing; locks open at 0. */
  keysLeft: number;
  /** True once the ordered color is cleared (or there is no order rule). */
  orderDone: boolean;
  /** Seconds left on the timer rule; `null` without a timer. */
  timeLeft: number | null;
  /** Seconds left in `serve` / `lost` / end phases before auto-advance. */
  phaseLeft: number;
  /** Why the game ended. */
  ending: "cleared" | "lives" | "timeout" | "crushed" | null;
}

export type GameEvent =
  | { t: number; type: "launch" }
  | { t: number; type: "wall"; side: "left" | "right" | "top"; x: number; y: number }
  | { t: number; type: "paddle"; x: number; y: number; offset: number; caught: boolean }
  | { t: number; type: "brick"; brick: Brick; broken: boolean; x: number; y: number }
  | { t: number; type: "explode"; x: number; y: number; color: BrickColor }
  | { t: number; type: "regen"; brick: Brick }
  | { t: number; type: "unlock" }
  | { t: number; type: "orderDone" }
  | { t: number; type: "zone"; zone: Zone }
  | { t: number; type: "teleport"; from: Zone; to: Zone }
  | { t: number; type: "split"; x: number; y: number }
  | { t: number; type: "mod"; kind: PaddleModKind }
  | { t: number; type: "modEnd"; kind: PaddleModKind }
  | { t: number; type: "bonusEnd"; kind: SpeedZoneKind }
  | { t: number; type: "obstacle"; obstacle: Obstacle; x: number; y: number }
  | { t: number; type: "swallow"; x: number; y: number }
  | { t: number; type: "heat"; heat: number }
  | { t: number; type: "descend"; rows: number }
  | { t: number; type: "life"; lives: number; x: number }
  | { t: number; type: "cleared"; score: number }
  | { t: number; type: "over"; score: number; reason: "lives" | "timeout" | "crushed" };

export interface GameInput {
  /** Desired paddle center x; the paddle moves toward it at its max speed. */
  targetX: number;
  /** Request launch during `serve`, or release a stuck ball. */
  launch: boolean;
}

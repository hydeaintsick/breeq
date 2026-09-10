/**
 * Engine types. Pure data — no DOM, no rendering. A `Board` is the map a
 * player builds; a `Replay` is one deterministic drop through it.
 *
 * Units: world units. The showcase board is 300 x 540; a unit is roughly one
 * CSS pixel at the smallest supported layout.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export type Side = "left" | "right";

export interface PegPiece {
  kind: "peg";
  x: number;
  y: number;
  r: number;
}

/** A cluster of nails mounted on a rail. Touching a tip destroys the ball. */
export interface NailPiece {
  kind: "nail";
  /** Mount point on the rail (the base of the cluster). */
  x: number;
  y: number;
  /** Direction the tips point to. */
  dir: Side;
  /** Number of nails, stacked vertically around `y`. */
  count: number;
  /** Vertical distance between nails. */
  pitch: number;
  /** Tip length from the base. */
  length: number;
}

/** A horizontal elastic band. Returns height to a falling ball. */
export interface TrampolinePiece {
  kind: "trampoline";
  x: number;
  y: number;
  width: number;
  /** 1 = default bounce. */
  power: number;
}

/** A vent in a rail that shoves the ball sideways while it crosses the stream. */
export interface FanPiece {
  kind: "fan";
  /** Mount point on the rail. */
  x: number;
  y: number;
  /** Direction the air blows to. */
  dir: Side;
  /** How far into the board the stream reaches. */
  reach: number;
  /** Vertical thickness of the stream. */
  spread: number;
  /** Horizontal acceleration applied inside the stream. */
  force: number;
}

/**
 * A portal. With no `exit` it is a fake: it looks like a way out and does
 * nothing. With an `exit` it teleports the ball there and keeps its velocity.
 */
export interface PortalPiece {
  kind: "portal";
  x: number;
  y: number;
  r: number;
  exit?: Vec2;
}

/** A hole in the floor. The ball is lost, the defender keeps the stake. */
export interface VoidPiece {
  kind: "void";
  x: number;
  width: number;
}

/** The chest. Landing on it loots the defender's reserve. Exactly one per board. */
export interface ChestPiece {
  kind: "chest";
  x: number;
  width: number;
  height: number;
}

/** A short post rising from the floor that separates two bins. */
export interface DividerPiece {
  kind: "divider";
  x: number;
  height: number;
}

export type Piece =
  | PegPiece
  | NailPiece
  | TrampolinePiece
  | FanPiece
  | PortalPiece
  | VoidPiece
  | ChestPiece
  | DividerPiece;

export type PieceKind = Piece["kind"];

export interface Board {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Inner faces of the two rails and the ceiling. */
  rails: { left: number; right: number; top: number };
  /** Top of the floor slab. Bins sit on it. */
  floorY: number;
  spawn: Vec2;
  ballRadius: number;
  pieces: Piece[];
}

export type Outcome = "chest" | "void" | "nail" | "stuck";

export type SimEvent =
  | { t: number; type: "peg"; index: number; speed: number }
  | { t: number; type: "wall"; side: Side | "top"; speed: number }
  | { t: number; type: "divider"; index: number; speed: number }
  | { t: number; type: "trampoline"; index: number; speed: number }
  | { t: number; type: "fan"; index: number; phase: "enter" | "exit" }
  | { t: number; type: "portal"; index: number; teleported: boolean }
  | { t: number; type: "nail"; index: number }
  | { t: number; type: "void"; index: number }
  | { t: number; type: "chest"; index: number }
  | { t: number; type: "stuck" };

export interface Replay {
  boardId: string;
  seed: number;
  outcome: Outcome;
  /** Seconds from release to the terminal event. */
  duration: number;
  /** Samples per second in `xs` / `ys`. */
  fps: number;
  xs: Float32Array;
  ys: Float32Array;
  events: SimEvent[];
  /** Ball position at the terminal event. */
  end: Vec2;
}

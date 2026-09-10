/**
 * Scene state — everything the renderer needs to draw one frame, owned and
 * mutated by whoever drives the board (the preview director today, the game
 * loop tomorrow). Plain mutable data; no allocation per frame in the hot path.
 */
import { indexPieces, type Board, type PieceIndex } from "../engine";

export type ParticleKind = "spark" | "coin" | "shard" | "air" | "dust";

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds left. */
  life: number;
  maxLife: number;
  size: number;
  /** Per-particle phase (spin, flicker). */
  phase: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

export interface SceneState {
  /** Global clock in seconds. */
  time: number;
  ball: {
    x: number;
    y: number;
    alpha: number;
    scale: number;
    visible: boolean;
    /** Impact glow 0..1. */
    flash: number;
  };
  trail: TrailPoint[];
  /** Per-peg impact glow 0..1. */
  pegFlash: Float32Array;
  dividerFlash: Float32Array;
  fanSpin: Float32Array;
  /** Per-fan stream intensity 0..1. */
  fanActive: Float32Array;
  /** Per-trampoline flex amplitude and time since hit. */
  trampFlex: { amp: number; t: number }[];
  portalSpin: number;
  portalPulse: Float32Array;
  chest: { open: number; glow: number };
  voidGlow: Float32Array;
  nailFlash: Float32Array;
  hopperGlow: number;
  particles: Particle[];
}

export function createScene(board: Board, index: PieceIndex = indexPieces(board)): SceneState {
  return {
    time: 0,
    ball: { x: board.spawn.x, y: board.spawn.y, alpha: 0, scale: 1, visible: false, flash: 0 },
    trail: [],
    pegFlash: new Float32Array(index.pegs.length),
    dividerFlash: new Float32Array(index.dividers.length),
    fanSpin: new Float32Array(index.fans.length),
    fanActive: new Float32Array(index.fans.length),
    trampFlex: index.trampolines.map(() => ({ amp: 0, t: 10 })),
    portalSpin: 0,
    portalPulse: new Float32Array(index.portals.length),
    chest: { open: 0, glow: 0 },
    voidGlow: new Float32Array(index.voids.length),
    nailFlash: new Float32Array(index.nails.length),
    hopperGlow: 0,
    particles: [],
  };
}

/** Exponential decay toward zero with a time constant in seconds. */
export function decay(value: number, dt: number, tau: number): number {
  return value * Math.exp(-dt / tau);
}

export function decayArray(values: Float32Array, dt: number, tau: number): void {
  const k = Math.exp(-dt / tau);
  for (let i = 0; i < values.length; i++) {
    values[i] *= k;
  }
}

export function easeOutCubic(t: number): number {
  const u = Math.max(0, Math.min(1, t));
  return 1 - (1 - u) ** 3;
}

export function easeInCubic(t: number): number {
  const u = Math.max(0, Math.min(1, t));
  return u * u * u;
}

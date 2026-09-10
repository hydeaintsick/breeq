/**
 * Autopilot — plays a level like a decent human: predicts where the most
 * urgent ball lands, aims toward the remaining bricks, compensates for
 * inverted controls, and misses sometimes, more often when the ball is fast.
 * Seeded, so a demo loop is reproducible.
 *
 * `proveClearable` runs it at full skill to check a level can be beaten —
 * the publish rule.
 */
import { createRng, type Rng } from "../../shared/random";
import { Game, predictX } from "./game";
import type { Ball, Brick, GameInput, GameState, Level } from "./types";

export interface AutopilotOptions {
  seed?: number;
  /** 0..1. Higher = fewer misses. 1 never fumbles on purpose. */
  skill?: number;
}

export class Autopilot {
  private readonly rng: Rng;
  private readonly skill: number;
  /** Decision taken for the current approach, kept until the ball turns. */
  private approach: { ballId: number; offset: number } | null = null;
  private lastApproachT = 0;

  constructor(
    private readonly level: Level,
    options: AutopilotOptions = {},
  ) {
    this.rng = createRng(options.seed ?? 7);
    this.skill = options.skill ?? 0.96;
  }

  input(state: GameState, bricks: Brick[]): GameInput {
    const { level } = this;
    const half = state.paddleWidth / 2;
    const center = (level.field.left + level.field.right) / 2;
    const stuck = state.balls.some((b) => b.stuck !== null);

    const target = state.phase === "play" ? this.mostUrgent(state) : null;
    if (!target) {
      this.approach = null;
      // Drift under the lowest ball while everything climbs, slightly toward the center.
      const lowest = state.balls.reduce<Ball | null>((acc, b) => (acc === null || b.y > acc.y ? b : acc), null);
      const x = lowest ? lowest.x * 0.6 + center * 0.4 : center;
      return this.finish(state, x, state.phase === "serve" || stuck);
    }

    // The landing point is re-predicted every step (bricks deflect the ball on
    // the way down); the *decision* — where on the paddle to take it, and
    // whether this is the approach we fumble — is made once per descent.
    const landing = predictX(level, target, { x: target.dx, y: target.dy }, level.paddle.y - level.ball.r);

    if (!this.approach || this.approach.ballId !== target.id) {
      const aim = this.aimOffset(landing, bricks);
      let offset = -aim * half + this.rng.range(-half * 0.25, half * 0.25);

      // Lapses: a rate per second of play rather than per approach, so a wall
      // that returns the ball quickly does not make the pilot look clumsy.
      // Faster balls raise the rate.
      const since = Math.min(6, state.time - this.lastApproachT);
      this.lastApproachT = state.time;
      const speedFactor = 0.5 + Math.min(1, Math.max(0, (state.speed.total - 0.5) / 2.5));
      const pMiss = (1 - this.skill) * 0.6 * since * speedFactor;
      if (this.skill < 1 && this.rng.chance(pMiss)) {
        const side = this.rng.chance(0.5) ? 1 : -1;
        offset = side * half * this.rng.range(1.4, 2.2);
      }
      this.approach = { ballId: target.id, offset };
    }

    return this.finish(state, landing + this.approach.offset, stuck);
  }

  /** Undo the invert mod so the paddle still goes where we mean. */
  private finish(state: GameState, targetX: number, launch: boolean): GameInput {
    const center = (this.level.field.left + this.level.field.right) / 2;
    const x = state.paddleMod?.kind === "invert" ? center * 2 - targetX : targetX;
    return { targetX: x, launch };
  }

  /** The descending ball that reaches the paddle first. */
  private mostUrgent(state: GameState): Ball | null {
    let best: Ball | null = null;
    let bestT = Number.POSITIVE_INFINITY;
    for (const b of state.balls) {
      if (b.stuck !== null || b.dy <= 0) continue;
      const t = (this.level.paddle.y - b.y) / b.dy;
      if (t < bestT) {
        bestT = t;
        best = b;
      }
    }
    return best;
  }

  /** −1..1: negative sends the ball left, positive right. */
  private aimOffset(landingX: number, bricks: Brick[]): number {
    const live = bricks.filter((b) => b.kind !== "steel");
    if (live.length === 0) return 0;
    let sum = 0;
    for (const b of live) sum += b.x + b.w / 2;
    const centroid = sum / live.length;
    const toward = Math.max(-1, Math.min(1, (centroid - landingX) / 140));
    // Offset > 0 on the paddle sends the ball right, so aim = toward.
    return toward * 0.7;
  }
}

export interface ProofOptions {
  /** Seeds to try, in order. */
  seeds?: number[];
  /** Give up on a seed after this much game time. */
  maxSeconds?: number;
}

export interface Proof {
  seed: number;
  seconds: number;
  score: number;
  livesLeft: number;
}

/**
 * The publish rule, automated: can a flawless autopilot clear this level?
 * Returns the first winning run, or null.
 */
export function proveClearable(level: Level, options: ProofOptions = {}): Proof | null {
  const seeds = options.seeds ?? [1, 2, 3, 4, 5, 6];
  const maxSteps = Math.round((options.maxSeconds ?? 300) * 240);
  for (const seed of seeds) {
    const game = new Game(level, { seed });
    const pilot = new Autopilot(level, { seed: seed * 13, skill: 1 });
    for (let i = 0; i < maxSteps; i++) {
      game.step(pilot.input(game.state, game.bricks));
      if (game.state.phase === "cleared") {
        return { seed, seconds: game.state.time, score: game.state.score, livesLeft: game.state.lives };
      }
      if (game.state.phase === "over") break;
    }
  }
  return null;
}

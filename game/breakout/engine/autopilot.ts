/**
 * Autopilot — plays a level like a decent human: predicts where the ball
 * lands, aims toward the remaining bricks, and misses sometimes, more often
 * when the ball is fast. Seeded, so a demo loop is reproducible.
 */
import { createRng, type Rng } from "../../shared/random";
import { predictX } from "./game";
import type { Brick, GameInput, GameState, Level } from "./types";

export interface AutopilotOptions {
  seed?: number;
  /** 0..1. Higher = fewer misses. */
  skill?: number;
}

export class Autopilot {
  private readonly rng: Rng;
  private readonly skill: number;
  /** Decision taken for the current approach, kept until the ball turns. */
  private approach: { offset: number } | null = null;
  private wasDescending = false;

  constructor(
    private readonly level: Level,
    options: AutopilotOptions = {},
  ) {
    this.rng = createRng(options.seed ?? 7);
    this.skill = options.skill ?? 0.93;
  }

  input(state: GameState, bricks: Brick[]): GameInput {
    const { level } = this;
    const half = level.paddle.width / 2;
    const descending = state.dir.y > 0 && state.phase === "play";

    if (!descending) {
      this.approach = null;
      this.wasDescending = false;
      // Drift under the ball while it climbs, slightly toward the center.
      const center = (level.field.left + level.field.right) / 2;
      return { targetX: state.ball.x * 0.6 + center * 0.4, launch: state.phase === "serve" };
    }

    // The landing point is re-predicted every step (bricks deflect the ball on
    // the way down); the *decision* — where on the paddle to take it, and
    // whether this is the approach we fumble — is made once per descent.
    const landing = predictX(level, state.ball, state.dir, level.paddle.y - level.ball.r);

    if (!this.wasDescending || !this.approach) {
      this.wasDescending = true;
      const aim = this.aimOffset(landing, bricks);
      let offset = -aim * half + this.rng.range(-half * 0.25, half * 0.25);

      // Lapses: the faster the ball, the likelier a miss.
      const pMiss = (1 - this.skill) * (0.35 + 0.65 * Math.min(1, (state.speed.total - 0.5) / 2.5));
      if (this.rng.chance(pMiss)) {
        const side = this.rng.chance(0.5) ? 1 : -1;
        offset = side * half * this.rng.range(1.4, 2.2);
      }
      this.approach = { offset };
    }

    return { targetX: landing + this.approach.offset, launch: false };
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

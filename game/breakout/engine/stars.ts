/**
 * Star grades — how clean a clear was, 1–3, read off the wall itself.
 *
 * A wall always pays at least one star (you broke it). Two is the expected
 * human clear: miss, recover, even drop a life. Three is a no-death run that
 * returns the ball about as often as a hot chain would — harder, a bit of luck.
 *
 * Bands are paddle hits, not the board score. The score climbs with ramp and
 * heat, so a long messy game can out-score a clean one; hits track the "many
 * shots / monstrous" split the grade is for. Same level + same hits + same
 * lives left = same stars, on the client and on the server.
 */
import { BRICK_HP } from "./level";
import type { Level } from "./types";

export const STARS_PER_CLEAR = 3;

export type StarCount = 1 | 2 | 3;

export type StarBands = {
  /** Paddle hits at or below this, with every life still in hand, earn 3 stars. */
  three: number;
  /** Paddle hits at or below this earn 2 stars. Anything slower is 1. */
  two: number;
};

export type ClearRun = {
  paddleHits: number;
  livesLeft: number;
};

/** Hits the wall asks for: HP of every brick that can break. Steel is ignored. */
export function brickWork(level: Pick<Level, "bricks">): number {
  let n = 0;
  for (const brick of level.bricks) {
    if (brick.kind === "steel") continue;
    const hp = BRICK_HP[brick.kind];
    if (!Number.isFinite(hp)) continue;
    n += hp;
  }
  return n;
}

export function starBands(level: Pick<Level, "bricks">): StarBands {
  const work = Math.max(1, brickWork(level));
  // Paddle hits, not brick HP: a return often breaks one brick, sometimes a
  // chain. 3★ is a clean no-death run; 2★ is the human clear with misses.
  const three = Math.max(8, Math.round(work * 1.1 + 6));
  const two = Math.max(three + 12, Math.round(work * 2.15 + 14));
  return { three, two };
}

export function clampStar(value: number): StarCount {
  if (value >= 3) return 3;
  if (value >= 2) return 2;
  return 1;
}

export function starsForClear(level: Pick<Level, "bricks" | "lives">, run: ClearRun): StarCount {
  const hits = Math.max(0, Math.floor(run.paddleHits));
  const { three, two } = starBands(level);
  const noDeath = run.livesLeft >= level.lives;
  if (hits <= three && noDeath) return 3;
  if (hits <= two) return 2;
  return 1;
}

export function starsPossible(chapterCount: number): number {
  return Math.max(0, Math.floor(chapterCount)) * STARS_PER_CLEAR;
}

/** 0..3 fill of a three-star glyph, from earned / possible over a whole episode. */
export function starFill(earned: number, possible: number): number {
  if (possible <= 0) return 0;
  return Math.max(0, Math.min(STARS_PER_CLEAR, (earned / possible) * STARS_PER_CLEAR));
}

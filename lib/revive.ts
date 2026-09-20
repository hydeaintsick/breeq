/**
 * Revive: a second chance after the last ball in a Story run. The wall stays
 * as it stands, the score is kept, one heart comes back on the paddle — for
 * gems. Pure rules, shared by the server action, the game over screen and
 * the revive sheet. Story only: Earn runs are wagers and the tutorial is
 * free, neither sells a heart.
 */

/** Gems one heart costs. Cheaper than a skip (50), a little more than a Spark recharge (20): progress is worth something. */
export const REVIVE_GEMS = 25;

/** Hearts a single run can buy back. Past this the game over screen offers a new run only. */
export const REVIVE_MAX_PER_RUN = 2;

/** Lives a revive puts back on the paddle. */
export const REVIVE_LIVES = 1;

/** True when the game over screen may offer a heart: the run ended on lives and has revives left. */
export function canOfferRevive(reason: "lives" | "timeout" | "crushed", revivesUsed: number): boolean {
  return reason === "lives" && revivesUsed < REVIVE_MAX_PER_RUN;
}

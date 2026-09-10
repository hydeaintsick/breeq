import type { Role } from "@/lib/auth/paths";

/** XP granted each time the player clears a Story wall. */
export const XP_PER_STORY_CLEAR = 100;

/** Earn unlocks at this player level (admins bypass). */
export const EARN_UNLOCK_LEVEL = 5;

/**
 * XP to go from `level` → `level + 1`.
 * The first four steps sum to 1,500 — fifteen Story clears to reach level 5.
 * After that each rung is 1.5× the last.
 */
const EARLY_STEPS = [180, 270, 400, 650] as const;

export function xpToNext(level: number): number {
  if (level < 1) {
    return EARLY_STEPS[0];
  }
  if (level <= EARLY_STEPS.length) {
    return EARLY_STEPS[level - 1];
  }
  return Math.round(EARLY_STEPS[EARLY_STEPS.length - 1] * 1.5 ** (level - EARLY_STEPS.length));
}

export function xpToReach(level: number): number {
  let total = 0;
  for (let current = 1; current < level; current += 1) {
    total += xpToNext(current);
  }
  return total;
}

export type Progress = {
  xp: number;
  level: number;
  into: number;
  next: number;
  ratio: number;
};

export function progressFromXp(xp: number): Progress {
  const safe = Math.max(0, Math.floor(xp));
  let level = 1;
  let remaining = safe;
  const cap = 99;

  while (level < cap) {
    const need = xpToNext(level);
    if (remaining < need) {
      return {
        xp: safe,
        level,
        into: remaining,
        next: need,
        ratio: need === 0 ? 1 : remaining / need,
      };
    }
    remaining -= need;
    level += 1;
  }

  const need = xpToNext(cap);
  return { xp: safe, level: cap, into: need, next: need, ratio: 1 };
}

export function canPlayEarn(role: Role | string | undefined, level: number) {
  return role === "ADMIN" || level >= EARN_UNLOCK_LEVEL;
}

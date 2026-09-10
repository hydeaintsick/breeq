/**
 * Haptic feedback for the breakout game, built on `navigator.vibrate`.
 *
 * Same philosophy as the sound design: a light touch that never tires.
 * - Only what the hand should feel: the paddle, a brick giving way, the big
 *   moments. Wall bounces and continuous effects stay silent.
 * - Short pulses (8–15 ms) for contact, short patterns for events, and
 *   nothing more often than every 50 ms. A weightier pattern (a lost life,
 *   the wall cleared) is never cut short by a small one.
 * - Follows the page-wide preference (`setHapticsEnabled`) and the mount's
 *   active state: paused, off-screen, or hidden means no vibration.
 *
 * Support is Android Chrome and friends; iOS Safari has no vibration API, so
 * `isHapticsSupported()` lets the UI hide the toggle where it would do nothing.
 */
import type { GameEvent } from "../engine/types";

type Pattern = number | readonly number[];

/** Minimum gap between two pulses, ms. */
const MIN_GAP = 50;

let wanted = true;

export function isHapticsSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function setHapticsEnabled(on: boolean): void {
  wanted = on;
  if (!on && isHapticsSupported()) navigator.vibrate(0);
}

export function isHapticsEnabled(): boolean {
  return wanted;
}

/** A short double tap, played when the player turns haptics on. */
export function playHapticCheck(): void {
  if (!wanted || !isHapticsSupported()) return;
  navigator.vibrate([12, 60, 18]);
}

function total(pattern: Pattern): number {
  return typeof pattern === "number" ? pattern : pattern.reduce((sum, n) => sum + n, 0);
}

/** Contact: barely there. */
const TAP = 8;
const BRICK = 12;
const KNOCK = 5;
/** A moment: felt, still short. */
const HEAVY: Record<string, readonly number[]> = {
  explode: [25, 30, 45],
  unlock: [10, 40, 10, 40, 20],
  orderDone: [10, 30, 20],
  teleport: [8, 25, 15],
  split: [8, 30, 8],
  swallow: [20, 40, 40],
  descend: [30, 40, 30],
  life: [40, 60, 40],
  cleared: [15, 40, 15, 40, 15, 40, 60],
  over: [70, 80, 90],
};

export class BreakoutHaptics {
  private active = true;
  private lastAt = -Infinity;
  private busyUntil = -Infinity;

  setActive(on: boolean): void {
    this.active = on;
    if (!on && isHapticsSupported()) navigator.vibrate(0);
  }

  destroy(): void {
    this.setActive(false);
  }

  apply(e: GameEvent): void {
    if (!this.active || !wanted || !isHapticsSupported()) return;
    const pattern = patternFor(e);
    if (pattern === null) return;
    const now = performance.now();
    const heavy = typeof pattern !== "number";
    // Small pulses wait their turn; a moment always lands.
    if (!heavy && (now < this.busyUntil || now - this.lastAt < MIN_GAP)) return;
    navigator.vibrate(pattern as number | number[]);
    this.lastAt = now;
    this.busyUntil = heavy ? now + total(pattern) : now;
  }
}

function patternFor(e: GameEvent): Pattern | null {
  switch (e.type) {
    case "launch":
      return 10;
    case "paddle":
      return e.caught ? 15 : TAP;
    case "brick":
      return e.broken ? BRICK : KNOCK;
    case "explode":
      return HEAVY.explode;
    case "unlock":
      return HEAVY.unlock;
    case "orderDone":
      return HEAVY.orderDone;
    case "zone":
      switch (e.zone.kind) {
        case "slow":
          return 30;
        case "fast2":
          return [8, 30, 8];
        case "fast3":
          return [8, 30, 8, 30, 8];
        case "mirror":
          return [6, 40, 6];
        default:
          // portal → teleport, split → split, paddle mods → mod, fake portal → nothing.
          return null;
      }
    case "teleport":
      return HEAVY.teleport;
    case "split":
      return HEAVY.split;
    case "mod":
      return 18;
    case "obstacle":
      switch (e.obstacle.kind) {
        case "bumper":
        case "trampoline":
          return 15;
        case "guard":
          return 10;
        case "blackhole":
          return 25;
        default:
          // Rails and fans are continuous; a buzz there would be noise.
          return null;
      }
    case "swallow":
      return HEAVY.swallow;
    case "descend":
      return HEAVY.descend;
    case "life":
      // The last life is told by `over`.
      return e.lives > 0 ? HEAVY.life : null;
    case "cleared":
      return HEAVY.cleared;
    case "over":
      return HEAVY.over;
    default:
      // wall, regen, modEnd, bonusEnd, heat: felt through sound and sight only.
      return null;
  }
}

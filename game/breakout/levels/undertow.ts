/**
 * Undertow — by nyx.
 *
 * A wall that leaks: ghost bricks blink open, two magnets bend the ball, and
 * the bottom row (pink) has to fall first. Below it, a portal pair, a decoy
 * portal, a gravity well, a mirror, two bumpers, a rail to ride and a fan
 * that shoves everything left. Every 24 paddle hits the wall drops a row.
 */
import { createLevel, type BrickCell } from "../engine/level";
import type { BrickColor } from "../engine/types";

const ROW_COLORS: BrickColor[] = ["blue", "cyan", "cyan", "violet", "pink"];

function pattern(row: number, col: number): BrickCell {
  const color = ROW_COLORS[row];
  if (row === 0) return { color, kind: "hard" };
  if (row === 2 && col % 2 === 1) return { color, kind: "ghost" };
  if (row === 3 && (col === 2 || col === 5)) return { color: "blue", kind: "magnet" };
  return { color };
}

export const UNDERTOW = createLevel({ id: "undertow", name: "Undertow", author: "nyx" })
  .background("/backgrounds/deep-current.jpg", { dim: 0.52 })
  .brickRows({ top: 84, rows: 5, cols: 8, pattern })
  .portal(60, 300, 300, 250)
  .zone("fakePortal", 300, 330)
  .zone("gravity", 180, 300)
  .zone("mirror", 180, 400)
  .zone("sticky", 60, 420)
  .bumper(110, 360)
  .bumper(250, 360)
  .rail(120, 440, 120)
  .fan(340, 460, -1, { reach: 120, spread: 36, force: 2.2 })
  .rules({ descend: 24, order: "pink" })
  .build();

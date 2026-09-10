/**
 * Lockdown — by ferro.
 *
 * Two keys in the heart of the wall, locks above and below them. Explosives in the
 * corners, a regen row on top, two rotors and a sweeping guard under the
 * wall. Below: a split zone, shrink and ice traps, an anti-gravity well, a
 * fog bank, a grow pickup, a trampoline — and a black hole in the corner.
 * Four minutes on the clock.
 */
import { createLevel, type BrickCell } from "../engine/level";
import type { BrickColor } from "../engine/types";

const ROW_COLORS: BrickColor[] = ["lime", "amber", "violet", "violet", "violet", "pink", "pink"];

function pattern(row: number, col: number): BrickCell {
  const color = ROW_COLORS[row];
  if (row === 0) return col % 2 === 0 ? { color, kind: "regen" } : { color };
  if ((row === 1 || row === 5) && (col === 0 || col === 7)) return { color: "amber", kind: "explosive" };
  if (row === 3 && (col === 3 || col === 4)) return { color: "amber", kind: "key" };
  if ((row === 2 || row === 4) && (col === 3 || col === 4)) return { color, kind: "lock" };
  if (row === 1) return { color, kind: "hard" };
  return { color };
}

export const LOCKDOWN = createLevel({ id: "lockdown", name: "Lockdown", author: "ferro", lives: 3 })
  .background("/backgrounds/aurora-steel.jpg", { dim: 0.55 })
  .brickRows({ top: 84, rows: 7, cols: 8, pattern })
  .brick(40, 270, "amber", "rotor")
  .brick(282, 270, "amber", "rotor")
  .guard(180, 250, { w: 48, h: 8, range: 70, speed: 1.3 })
  .zone("shrink", 120, 330)
  .zone("ice", 240, 330)
  .zone("split", 180, 380)
  .zone("fog", 60, 420, 22)
  .zone("grow", 300, 420)
  .zone("antigrav", 240, 450)
  .trampoline(100, 480, 70)
  .blackhole(32, 64)
  .rules({ timer: 300 })
  .build();

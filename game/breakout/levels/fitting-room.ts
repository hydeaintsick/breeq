/**
 * Fitting Room — the shop's try-on wall.
 *
 * A calm five-row wall with an open middle and no zones, so the ball crosses
 * the field often and the paddle is in view: the point is the skin, not the
 * wall. The autopilot loops it while the player picks a look.
 */
import { createLevel, type BrickCell } from "../engine/level";
import type { BrickColor } from "../engine/types";

const ROW_COLORS: BrickColor[] = ["violet", "blue", "cyan", "lime", "amber"];

function pattern(row: number, col: number): BrickCell {
  // An open window in the middle rows: the ball comes and goes.
  if (row >= 1 && row <= 3 && col >= 3 && col <= 4) return null;
  return { color: ROW_COLORS[row] };
}

export const FITTING_ROOM = createLevel({ id: "fitting-room", name: "Fitting Room", author: "breeq", lives: 3 })
  .background("/backgrounds/aurora-steel.jpg", { dim: 0.55 })
  .brickRows({ top: 96, rows: 5, cols: 8, pattern })
  .build();

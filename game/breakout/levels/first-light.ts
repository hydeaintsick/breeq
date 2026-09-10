/**
 * First Light — the showcase level.
 *
 * A player-made wall: seven rows with a hollow center, hard bricks guarding
 * the middle, two steel posts, and three bonus zones under the wall — a slow
 * zone on the left, ×2 on the right, ×3 dead center where the ball loves to go.
 */
import { createLevel, type BrickCell } from "../engine/level";
import type { BrickColor } from "../engine/types";

const ROW_COLORS: BrickColor[] = ["pink", "violet", "blue", "cyan", "lime", "amber", "pink"];

function pattern(row: number, col: number): BrickCell {
  const color = ROW_COLORS[row];
  // Hollow diamond in the middle rows.
  const centerDist = Math.abs(col - 3.5);
  if (row >= 2 && row <= 4 && centerDist < 1.5 - Math.abs(row - 3)) {
    return null;
  }
  // Steel posts at the wall's shoulders.
  if (row === 3 && (col === 0 || col === 7)) {
    return { color, kind: "steel" };
  }
  // Hard bricks ring the hollow.
  if (row >= 1 && row <= 5 && centerDist <= 2.5 && centerDist >= 1.5) {
    return { color, kind: "hard" };
  }
  return { color };
}

export const FIRST_LIGHT = createLevel({ id: "first-light", name: "First Light", author: "marlow" })
  .background("/backgrounds/bokeh-rain.jpg", { dim: 0.5 })
  .brickRows({ top: 84, rows: 7, cols: 8, pattern })
  .bonus("slow", 84, 332)
  .bonus("fast2", 276, 332)
  .bonus("fast3", 180, 420)
  .build();

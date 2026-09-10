/**
 * Quiet Start — a three-row glass wall. The Story picker preview.
 */
import { createLevel } from "../engine/level";
import type { BrickColor } from "../engine/types";

const ROW_COLORS: BrickColor[] = ["pink", "violet", "cyan"];

export const QUIET_START = createLevel({
  id: "quiet-start",
  name: "Quiet Start",
  author: "marlow",
})
  .background("/backgrounds/bokeh-rain.jpg", { dim: 0.5 })
  .brickRows({
    top: 96,
    rows: 3,
    cols: 6,
    pattern: (row) => ({ color: ROW_COLORS[row] }),
  })
  .bonus("slow", 180, 280)
  .build();

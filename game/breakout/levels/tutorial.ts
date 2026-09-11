/**
 * How to Play — the guided first wall.
 *
 * Two rows only: glass on the bottom (the ball meets it first, one hit) and a
 * shorter row of hard bricks above (crack, then break). One slow zone in the
 * open field so the ball is likely to cross it. Five lives and a slightly
 * slower ball: the run is a lesson, not a test.
 */
import { createLevel } from "../engine/level";

export const TUTORIAL = createLevel({
  id: "tutorial",
  name: "How to Play",
  author: "Breeq",
  lives: 5,
  ballSpeed: 290,
})
  .background("/backgrounds/bokeh-rain.jpg", { dim: 0.5 })
  .brickRows({
    top: 120,
    rows: 2,
    cols: 6,
    pattern: (row, col) => {
      if (row === 0) {
        return col === 0 || col === 5 ? null : { kind: "hard", color: "violet" };
      }
      return { color: "cyan" };
    },
  })
  .bonus("slow", 180, 300)
  .build();

/**
 * ASCII walls for the Story. A level's wall is drawn as rows of characters and
 * a legend that says which brick each character is; `wall()` turns that into
 * `brickRows` options the builder understands.
 *
 *   .brickRows(wall(["..ppp..", ".pVVVp.", "..ppp.."], { p: glass("pink"), V: hard("violet") }, 84))
 *
 * The brick width follows the number of columns so the wall always spans the
 * field: 8 columns are the classic 38px bricks, 9 → 32px, 10 → 30px,
 * 11 → 26px. A `.` (or a space) leaves the cell empty.
 */
import { LEVEL_DEFAULTS, type BrickCell, type BrickRowsOptions } from "../../engine/level";
import type { BrickColor, BrickKind } from "../../engine/types";

export type Legend = Record<string, BrickCell>;

const FIELD_WIDTH = LEVEL_DEFAULTS.width - LEVEL_DEFAULTS.inset * 2;

export function glass(color: BrickColor): BrickCell {
  return { color };
}

export function hard(color: BrickColor): BrickCell {
  return { color, kind: "hard" };
}

/** Steel carries a color for the palette even though it never breaks. */
export function steel(color: BrickColor = "blue"): BrickCell {
  return { color, kind: "steel" };
}

export function piece(kind: BrickKind, color: BrickColor): BrickCell {
  return { color, kind };
}

/** Brick width for `cols` columns so the wall fills the field, in whole even pixels. */
export function brickWidthFor(cols: number, gap = LEVEL_DEFAULTS.brick.gap): number {
  let w = Math.min(LEVEL_DEFAULTS.brick.w, Math.floor((FIELD_WIDTH - (cols - 1) * gap) / cols));
  if ((cols * w + (cols - 1) * gap) % 2 !== 0) w -= 1;
  return w;
}

export function wall(map: readonly string[], legend: Legend, top: number): BrickRowsOptions {
  const cols = Math.max(...map.map((row) => row.length));
  for (const row of map) {
    if (row.length !== cols) {
      throw new Error(`Wall rows must share a width (${row.length} vs ${cols}): "${row}"`);
    }
    for (const char of row) {
      if (char !== "." && char !== " " && !(char in legend)) {
        throw new Error(`Wall uses "${char}" but the legend does not define it.`);
      }
    }
  }
  return {
    top,
    rows: map.length,
    cols,
    w: brickWidthFor(cols),
    pattern: (row, col) => {
      const char = map[row][col];
      if (char === "." || char === " ") return null;
      return legend[char];
    },
  };
}

/** Where a wall row's top edge sits, for placing pieces relative to the wall. */
export function rowTop(top: number, row: number): number {
  return top + row * (LEVEL_DEFAULTS.brick.h + LEVEL_DEFAULTS.brick.gap);
}

/**
 * Map builder — the API a level editor (or a designer in code) uses to lay a
 * board out. Fluent, validates on `build()`, throws on structural errors.
 *
 *   const board = createBoard({ id: "vault-04", name: "Vault 04" })
 *     .pegLattice({ top: 112, rows: 8, pitchY: 34, even: [...], odd: [...] })
 *     .fan({ y: 178, dir: "left", reach: 110, spread: 36, force: 3000 })
 *     .clearPegsIn({ x: 216, y: 160, w: 60, h: 40 })
 *     .chest({ x: 150, width: 64, height: 34 })
 *     .build();
 */
import { BoardValidationError, validateBoard, type ValidationIssue } from "./board";
import type { Rect } from "./geometry";
import type { Board, FanPiece, NailPiece, Piece, PortalPiece, TrampolinePiece, Vec2 } from "./types";

export interface BoardOptions {
  id: string;
  name: string;
  width?: number;
  height?: number;
  /** Rail thickness measured from the outer edge. */
  railInset?: number;
  /** Ceiling (inner face) y. Leaves room for a HUD strip above. */
  top?: number;
  /** Floor slab top y. */
  floorY?: number;
  ballRadius?: number;
  spawn?: Vec2;
}

export const DEFAULT_BOARD = {
  width: 300,
  height: 540,
  railInset: 24,
  top: 44,
  floorY: 500,
  ballRadius: 7,
  pegRadius: 5,
  dividerHeight: 44,
} as const;

export interface LatticeOptions {
  /** y of the first row. */
  top: number;
  rows: number;
  pitchY: number;
  /** x positions for rows 0, 2, 4, … */
  even: readonly number[];
  /** x positions for rows 1, 3, 5, … */
  odd: readonly number[];
  r?: number;
}

export class BoardBuilder {
  private readonly pieces: Piece[] = [];
  private readonly board: Omit<Board, "pieces">;

  constructor(options: BoardOptions) {
    const width = options.width ?? DEFAULT_BOARD.width;
    const height = options.height ?? DEFAULT_BOARD.height;
    const inset = options.railInset ?? DEFAULT_BOARD.railInset;
    const top = options.top ?? DEFAULT_BOARD.top;

    this.board = {
      id: options.id,
      name: options.name,
      width,
      height,
      rails: { left: inset, right: width - inset, top },
      floorY: options.floorY ?? DEFAULT_BOARD.floorY,
      ballRadius: options.ballRadius ?? DEFAULT_BOARD.ballRadius,
      spawn: options.spawn ?? { x: width / 2, y: top + 30 },
    };
  }

  get rails() {
    return this.board.rails;
  }

  peg(x: number, y: number, r: number = DEFAULT_BOARD.pegRadius): this {
    this.pieces.push({ kind: "peg", x, y, r });
    return this;
  }

  /** Staggered rows of pegs — the Plinko backbone. */
  pegLattice({ top, rows, pitchY, even, odd, r }: LatticeOptions): this {
    for (let row = 0; row < rows; row++) {
      const xs = row % 2 === 0 ? even : odd;
      for (const x of xs) {
        this.peg(x, top + row * pitchY, r);
      }
    }
    return this;
  }

  /** Remove every peg whose center falls inside `rect`. Use it to make room for traps. */
  clearPegsIn(rect: Rect): this {
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i];
      if (
        piece.kind === "peg" &&
        piece.x >= rect.x &&
        piece.x <= rect.x + rect.w &&
        piece.y >= rect.y &&
        piece.y <= rect.y + rect.h
      ) {
        this.pieces.splice(i, 1);
      }
    }
    return this;
  }

  /** Nails mounted on a rail, tips pointing into the board. */
  nails(options: Omit<NailPiece, "kind" | "x"> & { x?: number }): this {
    const x = options.x ?? (options.dir === "left" ? this.board.rails.right : this.board.rails.left);
    this.pieces.push({ kind: "nail", ...options, x });
    return this;
  }

  trampoline(options: Omit<TrampolinePiece, "kind" | "power"> & { power?: number }): this {
    this.pieces.push({ kind: "trampoline", power: 1, ...options });
    return this;
  }

  /** Fan mounted on a rail, blowing across the board. */
  fan(options: Omit<FanPiece, "kind" | "x"> & { x?: number }): this {
    const x = options.x ?? (options.dir === "left" ? this.board.rails.right : this.board.rails.left);
    this.pieces.push({ kind: "fan", ...options, x });
    return this;
  }

  /** A portal. Omit `exit` for a fake one. */
  portal(options: Omit<PortalPiece, "kind">): this {
    this.pieces.push({ kind: "portal", ...options });
    return this;
  }

  void(x: number, width: number): this {
    this.pieces.push({ kind: "void", x, width });
    return this;
  }

  chest(options: { x: number; width: number; height: number }): this {
    this.pieces.push({ kind: "chest", ...options });
    return this;
  }

  divider(x: number, height = DEFAULT_BOARD.dividerHeight): this {
    this.pieces.push({ kind: "divider", x, height });
    return this;
  }

  /**
   * Classic bottom: bins separated by dividers, with the chest in one of them
   * and voids in the others. `layout` is read left to right.
   */
  bins(layout: readonly ("void" | "chest")[], chestHeight = 52): this {
    const { left, right } = this.board.rails;
    const binWidth = (right - left) / layout.length;
    layout.forEach((kind, i) => {
      const x0 = left + i * binWidth;
      const center = x0 + binWidth / 2;
      if (i > 0) {
        this.divider(x0);
      }
      if (kind === "chest") {
        this.chest({ x: center, width: binWidth - 16, height: chestHeight });
      } else {
        this.void(center, binWidth - 12);
      }
    });
    return this;
  }

  /** Validate without building. */
  check(): ValidationIssue[] {
    return validateBoard({ ...this.board, pieces: [...this.pieces] });
  }

  /** Build the board. Throws `BoardValidationError` on structural errors. */
  build(): Board {
    const board: Board = { ...this.board, pieces: [...this.pieces] };
    const errors = validateBoard(board).filter((issue) => issue.level === "error");
    if (errors.length > 0) {
      throw new BoardValidationError(errors);
    }
    return board;
  }
}

export function createBoard(options: BoardOptions): BoardBuilder {
  return new BoardBuilder(options);
}

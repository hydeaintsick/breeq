/**
 * Board helpers: typed piece indexes and validation.
 *
 * Event indexes in a `Replay` refer to positions inside these per-kind lists,
 * so the simulator and the renderer must both go through `indexPieces`.
 */
import { circleIntersectsRect, fanStream, nailHitbox, trampolineSpan } from "./geometry";
import type {
  Board,
  ChestPiece,
  DividerPiece,
  FanPiece,
  NailPiece,
  PegPiece,
  Piece,
  PortalPiece,
  TrampolinePiece,
  VoidPiece,
} from "./types";

export interface PieceIndex {
  pegs: PegPiece[];
  nails: NailPiece[];
  trampolines: TrampolinePiece[];
  fans: FanPiece[];
  portals: PortalPiece[];
  voids: VoidPiece[];
  chests: ChestPiece[];
  dividers: DividerPiece[];
}

export function indexPieces(board: Board): PieceIndex {
  const index: PieceIndex = {
    pegs: [],
    nails: [],
    trampolines: [],
    fans: [],
    portals: [],
    voids: [],
    chests: [],
    dividers: [],
  };

  for (const piece of board.pieces) {
    switch (piece.kind) {
      case "peg":
        index.pegs.push(piece);
        break;
      case "nail":
        index.nails.push(piece);
        break;
      case "trampoline":
        index.trampolines.push(piece);
        break;
      case "fan":
        index.fans.push(piece);
        break;
      case "portal":
        index.portals.push(piece);
        break;
      case "void":
        index.voids.push(piece);
        break;
      case "chest":
        index.chests.push(piece);
        break;
      case "divider":
        index.dividers.push(piece);
        break;
    }
  }

  return index;
}

export interface ValidationIssue {
  level: "error" | "warning";
  message: string;
  piece?: Piece;
}

/** Radius of the round cap on top of a divider post. */
export const DIVIDER_CAP_RADIUS = 3;

/**
 * Structural checks a board must pass before it can be simulated. This is the
 * cheap half of the golden rule; `proveBeatable` in `simulate.ts` is the other.
 */
export function validateBoard(board: Board): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const index = indexPieces(board);
  const r = board.ballRadius;
  const { left, right, top } = board.rails;

  if (right - left < r * 4) {
    issues.push({ level: "error", message: "Rails are too close for the ball to fall." });
  }
  if (board.floorY <= top || board.floorY > board.height) {
    issues.push({ level: "error", message: "Floor must sit between the ceiling and the bottom edge." });
  }
  if (board.spawn.x - r < left || board.spawn.x + r > right || board.spawn.y - r < top) {
    issues.push({ level: "error", message: "Spawn point is outside the play field." });
  }

  if (index.chests.length !== 1) {
    issues.push({ level: "error", message: `A board needs exactly one chest (found ${index.chests.length}).` });
  }
  if (index.voids.length === 0) {
    issues.push({ level: "warning", message: "No void: every drop that reaches the floor is a win." });
  }

  for (const peg of index.pegs) {
    if (peg.x - peg.r < left || peg.x + peg.r > right || peg.y - peg.r < top || peg.y + peg.r > board.floorY) {
      issues.push({ level: "error", message: "Peg outside the play field.", piece: peg });
    }
  }

  for (let i = 0; i < index.pegs.length; i++) {
    for (let j = i + 1; j < index.pegs.length; j++) {
      const a = index.pegs[i];
      const b = index.pegs[j];
      const min = a.r + b.r + r * 2;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (dx * dx + dy * dy < min * min) {
        issues.push({
          level: "warning",
          message: "Two pegs are closer than one ball width; the ball can wedge between them.",
          piece: b,
        });
      }
    }
  }

  for (const nail of index.nails) {
    const isOnRail = nail.dir === "left" ? Math.abs(nail.x - right) < 0.5 : Math.abs(nail.x - left) < 0.5;
    if (!isOnRail) {
      issues.push({ level: "error", message: "Nails must be mounted on a rail.", piece: nail });
    }
    const box = nailHitbox(nail);
    for (const peg of index.pegs) {
      if (circleIntersectsRect(peg.x, peg.y, peg.r + r, box)) {
        issues.push({ level: "warning", message: "A peg sits inside a nail cluster's reach.", piece: peg });
      }
    }
  }

  for (const fan of index.fans) {
    const isOnRail = fan.dir === "left" ? Math.abs(fan.x - right) < 0.5 : Math.abs(fan.x - left) < 0.5;
    if (!isOnRail) {
      issues.push({ level: "error", message: "Fans must be mounted on a rail.", piece: fan });
    }
    const stream = fanStream(fan);
    if (stream.x < left || stream.x + stream.w > right) {
      issues.push({ level: "error", message: "Fan stream reaches past the opposite rail.", piece: fan });
    }
  }

  for (const t of index.trampolines) {
    const span = trampolineSpan(t);
    if (span.x0 < left || span.x1 > right || t.y < top || t.y > board.floorY) {
      issues.push({ level: "error", message: "Trampoline outside the play field.", piece: t });
    }
  }

  for (const portal of index.portals) {
    if (portal.x - portal.r < left || portal.x + portal.r > right) {
      issues.push({ level: "error", message: "Portal outside the play field.", piece: portal });
    }
    if (portal.exit) {
      const e = portal.exit;
      if (e.x - r < left || e.x + r > right || e.y - r < top || e.y + r > board.floorY) {
        issues.push({ level: "error", message: "Portal exit outside the play field.", piece: portal });
      }
    }
  }

  const bins = [
    ...index.voids.map((v) => ({ x0: v.x - v.width / 2, x1: v.x + v.width / 2, piece: v as Piece })),
    ...index.chests.map((c) => ({ x0: c.x - c.width / 2, x1: c.x + c.width / 2, piece: c as Piece })),
  ].sort((a, b) => a.x0 - b.x0);

  for (let i = 1; i < bins.length; i++) {
    if (bins[i].x0 < bins[i - 1].x1) {
      issues.push({ level: "error", message: "Two bins overlap on the floor.", piece: bins[i].piece });
    }
  }
  for (const bin of bins) {
    if (bin.x0 < left || bin.x1 > right) {
      issues.push({ level: "error", message: "Bin extends past a rail.", piece: bin.piece });
    }
  }

  return issues;
}

export class BoardValidationError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super(`Invalid board:\n${issues.map((i) => `- [${i.level}] ${i.message}`).join("\n")}`);
    this.name = "BoardValidationError";
  }
}

export * from "./types";
export { createRng, type Rng } from "./random";
export { indexPieces, validateBoard, BoardValidationError, DIVIDER_CAP_RADIUS } from "./board";
export type { PieceIndex, ValidationIssue } from "./board";
export { createBoard, BoardBuilder, DEFAULT_BOARD } from "./builder";
export type { BoardOptions, LatticeOptions } from "./builder";
export {
  PHYSICS,
  simulateDrop,
  sampleReplay,
  findReplayWithOutcome,
  proveBeatable,
  outcomeStats,
} from "./simulate";
export type { PhysicsConfig, SeedSearchOptions } from "./simulate";
export * from "./geometry";

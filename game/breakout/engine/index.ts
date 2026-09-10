export * from "./types";
export { Game, RULES, predictX, type GameOptions } from "./game";
export { Autopilot, type AutopilotOptions } from "./autopilot";
export {
  createLevel,
  validateLevel,
  LevelBuilder,
  LevelValidationError,
  LEVEL_DEFAULTS,
  BRICK_HP,
  BRICK_COLORS,
  type LevelOptions,
  type BrickCell,
  type BrickRowsOptions,
  type ValidationIssue,
} from "./level";

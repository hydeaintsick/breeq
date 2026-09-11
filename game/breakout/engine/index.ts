export * from "./types";
export { Game, RULES, predictX, serveDirection, type GameOptions, type PendingBrick } from "./game";
export { Autopilot, proveClearable, type AutopilotOptions, type Proof, type ProofOptions } from "./autopilot";
export {
  rateDifficulty,
  difficultyTier,
  sampleSkill,
  DIFFICULTY_DEFAULTS,
  type Difficulty,
  type DifficultyOptions,
  type DifficultyTier,
  type DifficultyLabel,
  type SkillSample,
} from "./difficulty";
export {
  createLevel,
  validateLevel,
  levelCost,
  obstacleBox,
  LevelBuilder,
  LevelValidationError,
  LEVEL_DEFAULTS,
  BRICK_HP,
  BRICK_COLORS,
  ROW_STEP,
  PADDLE_CLEARANCE,
  paddleZoneTop,
  type LevelOptions,
  type BrickCell,
  type BrickRowsOptions,
  type ValidationIssue,
} from "./level";
export { CATALOG, BRICKS, ZONES, OBSTACLES, RULES_CATALOG, LEVEL_BUDGET, type CatalogEntry, type PieceFamily, type PieceTint } from "./catalog";
export {
  createDraftLevel,
  cloneLevel,
  applyStroke,
  parseStoredLevel,
  applyBackgroundPhoto,
  serializeLevel,
  brickColorFromTint,
  type EditorTool,
  type Hit,
} from "./draft";
export {
  brickWork,
  starBands,
  starsForClear,
  clampStar,
  starFill,
  starsPossible,
  STARS_PER_CLEAR,
  type StarCount,
  type StarBands,
  type ClearRun,
} from "./stars";

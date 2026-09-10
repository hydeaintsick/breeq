/**
 * Level builder — what the in-game editor will call. Fluent, validates on
 * `build()`, throws on structural errors.
 *
 *   const level = createLevel({ id: "neon-01", name: "First Light", author: "marlow" })
 *     .background("/backgrounds/bokeh-rain.jpg")
 *     .brickRows({ top: 84, rows: 6, cols: 8, pattern: (r, c) => ... })
 *     .bonus("slow", 180, 360)
 *     .build();
 */
import type { Bonus, BonusKind, Brick, BrickColor, BrickKind, Level, LevelBackground } from "./types";

export const LEVEL_DEFAULTS = {
  width: 360,
  height: 640,
  /** Field inset from the level edges. */
  inset: 12,
  /** Room above the field for the HUD. */
  top: 44,
  paddle: { width: 76, height: 10, y: 596 },
  ball: { r: 6, speed: 300 },
  lives: 3,
  brick: { w: 38, h: 16, gap: 4 },
  bonusRadius: 16,
  background: { type: "photo", src: "", dim: 0.55, blur: 0 } satisfies LevelBackground,
} as const;

export const BRICK_HP: Record<BrickKind, number> = {
  glass: 1,
  hard: 2,
  steel: Number.POSITIVE_INFINITY,
};

export const BRICK_COLORS: readonly BrickColor[] = ["blue", "violet", "pink", "cyan", "lime", "amber"];

export interface LevelOptions {
  id: string;
  name: string;
  author: string;
  width?: number;
  height?: number;
  lives?: number;
  paddleWidth?: number;
  ballSpeed?: number;
}

/** A cell decision for `brickRows`. `null` leaves the cell empty. */
export type BrickCell = { kind?: BrickKind; color: BrickColor } | null;

export interface BrickRowsOptions {
  /** y of the first row's top edge. */
  top: number;
  rows: number;
  cols: number;
  w?: number;
  h?: number;
  gap?: number;
  /** Decide what goes in each cell. Defaults to a glass brick cycling colors by row. */
  pattern?: (row: number, col: number) => BrickCell;
}

export interface ValidationIssue {
  level: "error" | "warning";
  message: string;
}

export class LevelValidationError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super(`Invalid level:\n${issues.map((i) => `- [${i.level}] ${i.message}`).join("\n")}`);
    this.name = "LevelValidationError";
  }
}

export class LevelBuilder {
  private readonly bricks: Brick[] = [];
  private readonly bonuses: Bonus[] = [];
  private bg: LevelBackground = { ...LEVEL_DEFAULTS.background };
  private nextId = 1;
  private readonly base: Omit<Level, "bricks" | "bonuses" | "background">;

  constructor(options: LevelOptions) {
    const width = options.width ?? LEVEL_DEFAULTS.width;
    const height = options.height ?? LEVEL_DEFAULTS.height;
    const inset = LEVEL_DEFAULTS.inset;
    this.base = {
      id: options.id,
      name: options.name,
      author: options.author,
      width,
      height,
      field: { left: inset, right: width - inset, top: LEVEL_DEFAULTS.top, bottom: height - inset },
      paddle: {
        width: options.paddleWidth ?? LEVEL_DEFAULTS.paddle.width,
        height: LEVEL_DEFAULTS.paddle.height,
        y: height - 44,
      },
      ball: { r: LEVEL_DEFAULTS.ball.r, speed: options.ballSpeed ?? LEVEL_DEFAULTS.ball.speed },
      lives: options.lives ?? LEVEL_DEFAULTS.lives,
    };
  }

  get field() {
    return this.base.field;
  }

  /** The author's photo. Any same-origin URL or blob URL works. */
  background(src: string, options: Partial<Omit<LevelBackground, "type" | "src">> = {}): this {
    this.bg = { ...LEVEL_DEFAULTS.background, ...options, type: "photo", src };
    return this;
  }

  brick(x: number, y: number, color: BrickColor, kind: BrickKind = "glass", w?: number, h?: number): this {
    this.bricks.push({
      id: this.nextId++,
      x,
      y,
      w: w ?? LEVEL_DEFAULTS.brick.w,
      h: h ?? LEVEL_DEFAULTS.brick.h,
      kind,
      color,
      hp: BRICK_HP[kind],
    });
    return this;
  }

  /** A centered grid of bricks. The classic wall. */
  brickRows({ top, rows, cols, w, h, gap, pattern }: BrickRowsOptions): this {
    const bw = w ?? LEVEL_DEFAULTS.brick.w;
    const bh = h ?? LEVEL_DEFAULTS.brick.h;
    const g = gap ?? LEVEL_DEFAULTS.brick.gap;
    const totalW = cols * bw + (cols - 1) * g;
    const x0 = (this.base.field.left + this.base.field.right) / 2 - totalW / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = pattern ? pattern(r, c) : { color: BRICK_COLORS[r % BRICK_COLORS.length] };
        if (!cell) continue;
        this.brick(x0 + c * (bw + g), top + r * (bh + g), cell.color, cell.kind ?? "glass", bw, bh);
      }
    }
    return this;
  }

  bonus(kind: BonusKind, x: number, y: number, r: number = LEVEL_DEFAULTS.bonusRadius): this {
    this.bonuses.push({ id: this.nextId++, kind, x, y, r });
    return this;
  }

  check(): ValidationIssue[] {
    return validateLevel(this.snapshot());
  }

  build(): Level {
    const level = this.snapshot();
    const errors = validateLevel(level).filter((i) => i.level === "error");
    if (errors.length > 0) {
      throw new LevelValidationError(errors);
    }
    return level;
  }

  private snapshot(): Level {
    return {
      ...this.base,
      background: { ...this.bg },
      bricks: this.bricks.map((b) => ({ ...b })),
      bonuses: this.bonuses.map((b) => ({ ...b })),
    };
  }
}

export function createLevel(options: LevelOptions): LevelBuilder {
  return new LevelBuilder(options);
}

/** Structural checks a level must pass before it can be played or published. */
export function validateLevel(level: Level): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const f = level.field;
  const r = level.ball.r;

  if (f.right - f.left < level.paddle.width * 2) {
    issues.push({ level: "error", message: "Field is too narrow for the paddle to move." });
  }
  if (level.paddle.y + level.paddle.height > f.bottom || level.paddle.y < f.top + 100) {
    issues.push({ level: "error", message: "Paddle must sit near the bottom of the field." });
  }
  if (level.lives < 1) {
    issues.push({ level: "error", message: "A level needs at least one life." });
  }
  if (!level.background.src) {
    issues.push({ level: "warning", message: "No background photo; the field will be plain." });
  }

  const breakable = level.bricks.filter((b) => b.kind !== "steel");
  if (breakable.length === 0) {
    issues.push({ level: "error", message: "A level needs at least one breakable brick." });
  }

  const paddleZoneTop = level.paddle.y - 90;
  for (const b of level.bricks) {
    if (b.x < f.left || b.x + b.w > f.right || b.y < f.top || b.y + b.h > f.bottom) {
      issues.push({ level: "error", message: `Brick #${b.id} is outside the field.` });
    }
    if (b.y + b.h > paddleZoneTop) {
      issues.push({ level: "error", message: `Brick #${b.id} sits in the paddle zone.` });
    }
  }

  for (let i = 0; i < level.bricks.length; i++) {
    for (let j = i + 1; j < level.bricks.length; j++) {
      const a = level.bricks[i];
      const b = level.bricks[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        issues.push({ level: "error", message: `Bricks #${a.id} and #${b.id} overlap.` });
      }
    }
  }

  for (const z of level.bonuses) {
    if (z.x - z.r < f.left || z.x + z.r > f.right || z.y - z.r < f.top || z.y + z.r > paddleZoneTop) {
      issues.push({ level: "error", message: `Bonus #${z.id} is outside the playable area.` });
    }
    for (const b of level.bricks) {
      const nx = Math.max(b.x, Math.min(z.x, b.x + b.w));
      const ny = Math.max(b.y, Math.min(z.y, b.y + b.h));
      if ((z.x - nx) ** 2 + (z.y - ny) ** 2 < (z.r + r) ** 2) {
        issues.push({ level: "warning", message: `Bonus #${z.id} overlaps brick #${b.id}; the ball may never reach it.` });
        break;
      }
    }
  }

  return issues;
}

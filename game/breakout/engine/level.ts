/**
 * Level builder — what the in-game editor will call. Fluent, validates on
 * `build()`, throws on structural errors.
 *
 *   const level = createLevel({ id: "neon-01", name: "First Light", author: "marlow" })
 *     .background("/backgrounds/bokeh-rain.jpg")
 *     .brickRows({ top: 84, rows: 6, cols: 8, pattern: (r, c) => ... })
 *     .zone("slow", 180, 360)
 *     .portal(60, 300, 300, 200)
 *     .bumper(180, 420)
 *     .rules({ timer: 120 })
 *     .build();
 */
import { BRICKS, LEVEL_BUDGET, OBSTACLES, ZONES } from "./catalog";
import type {
  Brick,
  BrickColor,
  BrickKind,
  Level,
  LevelBackground,
  LevelRules,
  Obstacle,
  Zone,
  ZoneKind,
} from "./types";

export const LEVEL_DEFAULTS = {
  width: 360,
  height: 640,
  /** Field inset from the level edges. */
  inset: 12,
  /** Room above the field for the HUD. */
  top: 44,
  paddle: { width: 76, height: 10, y: 596 },
  ball: { r: 6, speed: 330 },
  lives: 3,
  brick: { w: 38, h: 16, gap: 4 },
  zoneRadius: 16,
  bumperRadius: 11,
  blackholeRadius: 9,
  background: { type: "photo", src: "", dim: 0.55, blur: 0 } satisfies LevelBackground,
  rules: { timer: 0, descend: 0, order: null } satisfies LevelRules,
} as const;

export const BRICK_HP: Record<BrickKind, number> = {
  glass: 1,
  hard: 2,
  steel: Number.POSITIVE_INFINITY,
  explosive: 1,
  ghost: 1,
  regen: 1,
  magnet: 1,
  rotor: 2,
  key: 1,
  lock: 1,
};

export const BRICK_COLORS: readonly BrickColor[] = ["blue", "violet", "pink", "cyan", "lime", "amber"];

/** How far the wall moves per drop under the descend rule. */
export const ROW_STEP = LEVEL_DEFAULTS.brick.h + LEVEL_DEFAULTS.brick.gap;

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
  private readonly zones: Zone[] = [];
  private readonly obstacles: Obstacle[] = [];
  private bg: LevelBackground = { ...LEVEL_DEFAULTS.background };
  private ruleSet: LevelRules = { ...LEVEL_DEFAULTS.rules };
  private nextId = 1;
  private readonly base: Omit<Level, "bricks" | "zones" | "obstacles" | "background" | "rules">;

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

  rules(rules: Partial<LevelRules>): this {
    this.ruleSet = { ...this.ruleSet, ...rules };
    return this;
  }

  // --- bricks ------------------------------------------------------------------

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

  // --- zones -------------------------------------------------------------------

  zone(kind: Exclude<ZoneKind, "portal">, x: number, y: number, r: number = LEVEL_DEFAULTS.zoneRadius): this {
    this.zones.push({ id: this.nextId++, kind, x, y, r });
    return this;
  }

  /** Alias kept for the speed zones. */
  bonus(kind: "slow" | "fast2" | "fast3", x: number, y: number, r?: number): this {
    return this.zone(kind, x, y, r);
  }

  /** A linked pair of portals. */
  portal(x1: number, y1: number, x2: number, y2: number, r: number = LEVEL_DEFAULTS.zoneRadius): this {
    const a = this.nextId++;
    const b = this.nextId++;
    this.zones.push({ id: a, kind: "portal", x: x1, y: y1, r, link: b });
    this.zones.push({ id: b, kind: "portal", x: x2, y: y2, r, link: a });
    return this;
  }

  // --- obstacles ---------------------------------------------------------------

  bumper(x: number, y: number, r: number = LEVEL_DEFAULTS.bumperRadius): this {
    this.obstacles.push({ id: this.nextId++, kind: "bumper", x, y, r });
    return this;
  }

  rail(x: number, y: number, w: number): this {
    this.obstacles.push({ id: this.nextId++, kind: "rail", x, y, w });
    return this;
  }

  fan(x: number, y: number, dir: -1 | 1, { reach = 110, spread = 36, force = 2.2 } = {}): this {
    this.obstacles.push({ id: this.nextId++, kind: "fan", x, y, dir, reach, spread, force });
    return this;
  }

  guard(x: number, y: number, { w = 48, h = 8, range = 60, speed = 1.4 } = {}): this {
    this.obstacles.push({ id: this.nextId++, kind: "guard", x, y, w, h, range, speed });
    return this;
  }

  trampoline(x: number, y: number, w: number): this {
    this.obstacles.push({ id: this.nextId++, kind: "trampoline", x, y, w });
    return this;
  }

  blackhole(x: number, y: number, r: number = LEVEL_DEFAULTS.blackholeRadius): this {
    this.obstacles.push({ id: this.nextId++, kind: "blackhole", x, y, r });
    return this;
  }

  // --- output ------------------------------------------------------------------

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
      rules: { ...this.ruleSet },
      bricks: this.bricks.map((b) => ({ ...b })),
      zones: this.zones.map((z) => ({ ...z })),
      obstacles: this.obstacles.map((o) => ({ ...o })),
    };
  }
}

export function createLevel(options: LevelOptions): LevelBuilder {
  return new LevelBuilder(options);
}

/** Axis-aligned box of any obstacle, for bounds and overlap checks. */
export function obstacleBox(o: Obstacle, time = 0): { x: number; y: number; w: number; h: number } {
  switch (o.kind) {
    case "bumper":
    case "blackhole":
      return { x: o.x - o.r, y: o.y - o.r, w: o.r * 2, h: o.r * 2 };
    case "rail":
      return { x: o.x, y: o.y - 2, w: o.w, h: 4 };
    case "trampoline":
      return { x: o.x, y: o.y - 3, w: o.w, h: 6 };
    case "fan": {
      const x0 = o.dir > 0 ? o.x : o.x - o.reach;
      return { x: x0, y: o.y - o.spread / 2, w: o.reach, h: o.spread };
    }
    case "guard": {
      const cx = o.x + Math.sin(time * o.speed) * o.range;
      return { x: cx - o.w / 2, y: o.y - o.h / 2, w: o.w, h: o.h };
    }
  }
}

/** Total sweep of a guard, for validation. */
function guardSweep(o: Extract<Obstacle, { kind: "guard" }>) {
  return { x: o.x - o.range - o.w / 2, y: o.y - o.h / 2, w: o.range * 2 + o.w, h: o.h };
}

/** Budget cost of a level in catalog points. */
export function levelCost(level: Level): number {
  let cost = 0;
  for (const b of level.bricks) cost += BRICKS[b.kind].cost;
  for (const z of level.zones) cost += ZONES[z.kind].cost;
  for (const o of level.obstacles) cost += OBSTACLES[o.kind].cost;
  return cost;
}

/** Structural checks a level must pass before it can be played or published. */
export function validateLevel(level: Level): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (message: string) => issues.push({ level: "error", message });
  const warn = (message: string) => issues.push({ level: "warning", message });
  const f = level.field;
  const r = level.ball.r;
  const paddleZoneTop = level.paddle.y - 90;

  if (f.right - f.left < level.paddle.width * 2) err("Field is too narrow for the paddle to move.");
  if (level.paddle.y + level.paddle.height > f.bottom || level.paddle.y < f.top + 100) {
    err("Paddle must sit near the bottom of the field.");
  }
  if (level.lives < 1 || level.lives > 5) err("Lives must be between 1 and 5.");
  if (!level.background.src) warn("No background photo; the field will be plain.");
  if (level.rules.timer < 0 || level.rules.descend < 0) err("Rules cannot be negative.");
  if (level.rules.timer > 0 && level.rules.timer < 30) warn("A timer under 30 seconds is rarely clearable.");

  const cost = levelCost(level);
  if (cost > LEVEL_BUDGET) err(`Level exceeds the piece budget (${cost}/${LEVEL_BUDGET}).`);

  // Bricks.
  const breakable = level.bricks.filter((b) => b.kind !== "steel");
  if (breakable.length === 0) err("A level needs at least one breakable brick.");
  const inField = (x: number, y: number, w: number, h: number) =>
    x >= f.left && x + w <= f.right && y >= f.top && y + h <= f.bottom;
  for (const b of level.bricks) {
    if (!inField(b.x, b.y, b.w, b.h)) err(`Brick #${b.id} is outside the field.`);
    if (b.y + b.h > paddleZoneTop) err(`Brick #${b.id} sits in the paddle zone.`);
  }
  for (let i = 0; i < level.bricks.length; i++) {
    for (let j = i + 1; j < level.bricks.length; j++) {
      const a = level.bricks[i];
      const b = level.bricks[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        err(`Bricks #${a.id} and #${b.id} overlap.`);
      }
    }
  }
  const keys = level.bricks.filter((b) => b.kind === "key").length;
  const locks = level.bricks.filter((b) => b.kind === "lock").length;
  if (locks > 0 && keys === 0) err("Locks need at least one key.");
  if (keys > 0 && locks === 0) warn("Keys without locks do nothing special.");
  // A key walled in on all four sides by armor can never be reached.
  for (const k of level.bricks) {
    if (k.kind !== "key") continue;
    const armored = (x: number, y: number) =>
      level.bricks.some(
        (b) =>
          (b.kind === "steel" || b.kind === "lock") &&
          x >= b.x - 1 && x <= b.x + b.w + 1 && y >= b.y - 1 && y <= b.y + b.h + 1,
      );
    const gap = LEVEL_DEFAULTS.brick.gap + 1;
    const cx = k.x + k.w / 2;
    const cy = k.y + k.h / 2;
    if (armored(cx, k.y - gap) && armored(cx, k.y + k.h + gap) && armored(k.x - gap, cy) && armored(k.x + k.w + gap, cy)) {
      err(`Key #${k.id} is sealed in by locks or steel; the ball can never reach it.`);
    }
  }
  if (level.rules.order) {
    const ordered = level.bricks.filter((b) => b.color === level.rules.order && b.kind !== "steel");
    if (ordered.length === 0) err(`Order rule names a color (${level.rules.order}) with no breakable brick.`);
    if (ordered.length === breakable.length) warn("Order rule covers every brick; it has no effect.");
  }
  if (level.rules.descend > 0) {
    const lowest = Math.max(...level.bricks.map((b) => b.y + b.h));
    if (paddleZoneTop - lowest < ROW_STEP * 2) warn("Descend rule with a low wall: the wall crushes the paddle after two drops.");
  }

  // Zones.
  for (const z of level.zones) {
    if (z.x - z.r < f.left || z.x + z.r > f.right || z.y - z.r < f.top || z.y + z.r > paddleZoneTop) {
      err(`Zone #${z.id} (${z.kind}) is outside the playable area.`);
    }
    for (const b of level.bricks) {
      const nx = Math.max(b.x, Math.min(z.x, b.x + b.w));
      const ny = Math.max(b.y, Math.min(z.y, b.y + b.h));
      if ((z.x - nx) ** 2 + (z.y - ny) ** 2 < (z.r + r) ** 2) {
        warn(`Zone #${z.id} overlaps brick #${b.id}; the ball may never reach it.`);
        break;
      }
    }
    if (z.kind === "portal") {
      const twin = level.zones.find((o) => o.id === z.link);
      if (!twin || twin.kind !== "portal" || twin.link !== z.id) err(`Portal #${z.id} has no paired twin.`);
    }
  }
  for (let i = 0; i < level.zones.length; i++) {
    for (let j = i + 1; j < level.zones.length; j++) {
      const a = level.zones[i];
      const b = level.zones[j];
      if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (a.r + b.r) ** 2) {
        err(`Zones #${a.id} and #${b.id} overlap.`);
      }
    }
  }
  const splits = level.zones.filter((z) => z.kind === "split").length;
  if (splits > 1) err("Only one split zone per level.");

  // Obstacles.
  for (const o of level.obstacles) {
    const box = o.kind === "guard" ? guardSweep(o) : obstacleBox(o);
    if (!inField(box.x, box.y, box.w, box.h)) err(`Obstacle #${o.id} (${o.kind}) is outside the field.`);
    if (box.y + box.h > paddleZoneTop && o.kind !== "fan") err(`Obstacle #${o.id} (${o.kind}) sits in the paddle zone.`);
    if (o.kind === "fan") continue; // wind may blow over anything
    for (const b of level.bricks) {
      if (box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y) {
        err(`Obstacle #${o.id} (${o.kind}) overlaps brick #${b.id}.`);
      }
    }
    for (const z of level.zones) {
      const nx = Math.max(box.x, Math.min(z.x, box.x + box.w));
      const ny = Math.max(box.y, Math.min(z.y, box.y + box.h));
      if ((z.x - nx) ** 2 + (z.y - ny) ** 2 < z.r * z.r) err(`Obstacle #${o.id} (${o.kind}) overlaps zone #${z.id}.`);
    }
    if (o.kind === "blackhole") {
      const lowestBrick = Math.max(0, ...level.bricks.map((b) => b.y + b.h));
      if (o.y > lowestBrick && o.y < lowestBrick + o.r * 4) warn(`Black hole #${o.id} sits under the wall; falling balls will feed it.`);
    }
  }
  const holes = level.obstacles.filter((o) => o.kind === "blackhole").length;
  if (holes > 2) err("At most two black holes per level.");

  return issues;
}

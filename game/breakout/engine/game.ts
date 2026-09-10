/**
 * Breakout game loop — deterministic, fixed step, seeded.
 *
 * Speed model (the part the design asks for):
 *   total = bonus × ramp × heat
 *   - bonus: zones the author placed. slow ×0.5, fast2 ×2, fast3 ×3, timed.
 *   - ramp:  the classic Breakout rule — every few paddle hits the ball gets a
 *            notch faster, reset when a life is lost.
 *   - heat:  rapid rebounds (wall/brick/paddle hits close together) build heat
 *            that adds speed and cools down when the ball travels freely.
 */
import { createRng, type Rng } from "../../shared/random";
import type { Bonus, BonusKind, Brick, GameEvent, GameInput, GameState, Level, Vec2 } from "./types";

export const RULES = {
  stepsPerSecond: 240,
  paddleSpeed: 980,
  serveDelay: 1.1,
  lostDelay: 1.0,
  endDelay: 2.6,
  bonusDuration: { slow: 5, fast2: 4, fast3: 3 } as Record<BonusKind, number>,
  bonusMul: { slow: 0.5, fast2: 2, fast3: 3 } as Record<BonusKind, number>,
  bonusCooldown: 3,
  /** Paddle hits per ramp notch, notch size, and cap. */
  rampHits: 4,
  rampStep: 0.06,
  rampMax: 1.4,
  /** A rebound within this window of the previous one adds heat. */
  heatWindow: 0.32,
  heatMax: 8,
  heatPerUnit: 0.03,
  /** Heat lost per second while the ball travels freely. */
  heatCooling: 1.6,
  minSpeedMul: 0.4,
  maxSpeedMul: 3.2,
  /** Keep the ball from going nearly horizontal. */
  minDirY: 0.32,
  /** Max launch/paddle angle from vertical, radians (~62°). */
  maxAngle: 1.08,
  scorePerBrick: 10,
} as const;

export interface GameOptions {
  seed?: number;
  /** Launch automatically after `serveDelay`. Off for human play. */
  autoLaunch?: boolean;
}

export class Game {
  readonly level: Level;
  readonly dt = 1 / RULES.stepsPerSecond;
  state: GameState;
  /** Live bricks (mutable copies of the level's). */
  bricks: Brick[] = [];
  readonly bonuses: Bonus[];
  private rng: Rng;
  private readonly seed: number;
  private readonly autoLaunch: boolean;
  private events: GameEvent[] = [];
  private bonusCooldown = new Map<number, number>();
  private lastBounceT = -10;

  constructor(level: Level, options: GameOptions = {}) {
    this.level = level;
    this.seed = options.seed ?? 1;
    this.autoLaunch = options.autoLaunch ?? true;
    this.bonuses = level.bonuses;
    this.rng = createRng(this.seed);
    this.state = this.initialState();
    this.reset();
  }

  /** Back to the first serve with full lives and the whole wall. */
  reset(seed = this.seed): void {
    this.rng = createRng(seed);
    this.bricks = this.level.bricks.map((b) => ({ ...b }));
    this.bonusCooldown.clear();
    this.lastBounceT = -10;
    this.state = this.initialState();
    this.placeOnPaddle();
  }

  /** Advance one fixed step. Returns the events it produced. */
  step(input: GameInput): GameEvent[] {
    this.events = [];
    const s = this.state;
    const dt = this.dt;
    s.time += dt;

    this.movePaddle(input.targetX, dt);
    this.tickBonus(dt);
    this.coolHeat(dt);

    switch (s.phase) {
      case "serve":
        this.placeOnPaddle();
        s.phaseLeft -= dt;
        if (input.launch || (this.autoLaunch && s.phaseLeft <= 0)) {
          this.launch();
        }
        break;
      case "play":
        this.moveBall(dt);
        break;
      case "lost":
        s.phaseLeft -= dt;
        if (s.phaseLeft <= 0) {
          s.phase = "serve";
          s.phaseLeft = RULES.serveDelay;
          this.placeOnPaddle();
        }
        break;
      case "cleared":
      case "over":
        s.phaseLeft = Math.max(0, s.phaseLeft - dt);
        break;
    }

    s.speed.total = this.totalMul();
    return this.events;
  }

  /** Effective ball speed in world units per second. */
  get ballSpeed(): number {
    return this.level.ball.speed * this.state.speed.total;
  }

  /** True once an end phase has waited out its delay. */
  get finished(): boolean {
    return (this.state.phase === "cleared" || this.state.phase === "over") && this.state.phaseLeft <= 0;
  }

  // ---------------------------------------------------------------------------

  private initialState(): GameState {
    const { level } = this;
    return {
      phase: "serve",
      time: 0,
      lives: level.lives,
      score: 0,
      paddleX: (level.field.left + level.field.right) / 2,
      ball: { x: 0, y: 0 },
      dir: { x: 0, y: -1 },
      speed: { bonusMul: 1, bonusLeft: 0, bonusKind: null, rampMul: 1, heat: 0, total: 1 },
      paddleHits: 0,
      remaining: level.bricks.filter((b) => b.kind !== "steel").length,
      phaseLeft: RULES.serveDelay,
    };
  }

  private emit(event: GameEvent): void {
    this.events.push(event);
  }

  private totalMul(): number {
    const sp = this.state.speed;
    const raw = sp.bonusMul * sp.rampMul * (1 + sp.heat * RULES.heatPerUnit);
    return Math.max(RULES.minSpeedMul, Math.min(RULES.maxSpeedMul, raw));
  }

  private movePaddle(targetX: number, dt: number): void {
    const s = this.state;
    const half = this.level.paddle.width / 2;
    const { left, right } = this.level.field;
    const target = Math.max(left + half, Math.min(right - half, targetX));
    const maxStep = RULES.paddleSpeed * dt;
    const delta = target - s.paddleX;
    s.paddleX += Math.abs(delta) <= maxStep ? delta : Math.sign(delta) * maxStep;
  }

  private placeOnPaddle(): void {
    const s = this.state;
    s.ball.x = s.paddleX;
    s.ball.y = this.level.paddle.y - this.level.ball.r - 0.5;
  }

  private launch(): void {
    const s = this.state;
    const angle = this.rng.range(0.3, 0.6) * (this.rng.chance(0.5) ? 1 : -1);
    s.dir = { x: Math.sin(angle), y: -Math.cos(angle) };
    s.phase = "play";
    this.emit({ t: s.time, type: "launch" });
  }

  private tickBonus(dt: number): void {
    const sp = this.state.speed;
    if (sp.bonusKind) {
      sp.bonusLeft -= dt;
      if (sp.bonusLeft <= 0) {
        const kind = sp.bonusKind;
        sp.bonusKind = null;
        sp.bonusMul = 1;
        sp.bonusLeft = 0;
        this.emit({ t: this.state.time, type: "bonusEnd", kind });
      }
    }
    for (const [id, left] of this.bonusCooldown) {
      const next = left - dt;
      if (next <= 0) this.bonusCooldown.delete(id);
      else this.bonusCooldown.set(id, next);
    }
  }

  private coolHeat(dt: number): void {
    const sp = this.state.speed;
    if (sp.heat > 0 && this.state.time - this.lastBounceT > RULES.heatWindow) {
      const before = Math.floor(sp.heat);
      sp.heat = Math.max(0, sp.heat - RULES.heatCooling * dt);
      if (Math.floor(sp.heat) !== before) {
        this.emit({ t: this.state.time, type: "heat", heat: sp.heat });
      }
    }
  }

  private registerBounce(): void {
    const s = this.state;
    if (s.time - this.lastBounceT < RULES.heatWindow) {
      const before = Math.floor(s.speed.heat);
      s.speed.heat = Math.min(RULES.heatMax, s.speed.heat + 1);
      if (Math.floor(s.speed.heat) !== before) {
        this.emit({ t: s.time, type: "heat", heat: s.speed.heat });
      }
    }
    this.lastBounceT = s.time;
  }

  private moveBall(dt: number): void {
    const s = this.state;
    const r = this.level.ball.r;
    const v = this.ballSpeed;
    const travel = v * dt;
    // Sub-step so a ×3 ball never tunnels through a brick.
    const steps = Math.max(1, Math.ceil(travel / (r * 0.75)));
    const sub = dt / steps;

    for (let i = 0; i < steps && s.phase === "play"; i++) {
      const prevY = s.ball.y;
      s.ball.x += s.dir.x * v * sub;
      s.ball.y += s.dir.y * v * sub;
      this.collideWalls();
      if (s.phase !== "play") return;
      this.collidePaddle(prevY);
      this.collideBricks();
      this.checkBonuses();
    }
  }

  private collideWalls(): void {
    const s = this.state;
    const r = this.level.ball.r;
    const f = this.level.field;

    if (s.ball.x - r < f.left) {
      s.ball.x = f.left + r;
      if (s.dir.x < 0) {
        s.dir.x = -s.dir.x;
        this.registerBounce();
        this.emit({ t: s.time, type: "wall", side: "left", x: f.left, y: s.ball.y });
      }
    } else if (s.ball.x + r > f.right) {
      s.ball.x = f.right - r;
      if (s.dir.x > 0) {
        s.dir.x = -s.dir.x;
        this.registerBounce();
        this.emit({ t: s.time, type: "wall", side: "right", x: f.right, y: s.ball.y });
      }
    }
    if (s.ball.y - r < f.top) {
      s.ball.y = f.top + r;
      if (s.dir.y < 0) {
        s.dir.y = -s.dir.y;
        this.registerBounce();
        this.emit({ t: s.time, type: "wall", side: "top", x: s.ball.x, y: f.top });
      }
    }
    if (s.ball.y - r > f.bottom) {
      this.loseLife();
    }
  }

  private collidePaddle(prevY: number): void {
    const s = this.state;
    const r = this.level.ball.r;
    const p = this.level.paddle;
    if (s.dir.y <= 0) return;
    const top = p.y;
    if (prevY + r > top || s.ball.y + r < top) return;
    const half = p.width / 2;
    if (s.ball.x < s.paddleX - half - r || s.ball.x > s.paddleX + half + r) return;

    const offset = Math.max(-1, Math.min(1, (s.ball.x - s.paddleX) / half));
    const angle = offset * RULES.maxAngle;
    s.dir = { x: Math.sin(angle), y: -Math.cos(angle) };
    this.clampDir();
    s.ball.y = top - r;
    s.paddleHits += 1;

    const notches = Math.min(Math.floor(s.paddleHits / RULES.rampHits) * RULES.rampStep, RULES.rampMax - 1);
    s.speed.rampMul = 1 + notches;

    this.registerBounce();
    this.emit({ t: s.time, type: "paddle", x: s.ball.x, y: top, offset });
  }

  private collideBricks(): void {
    const s = this.state;
    const r = this.level.ball.r;

    for (let i = 0; i < this.bricks.length; i++) {
      const b = this.bricks[i];
      const nx = Math.max(b.x, Math.min(s.ball.x, b.x + b.w));
      const ny = Math.max(b.y, Math.min(s.ball.y, b.y + b.h));
      const dx = s.ball.x - nx;
      const dy = s.ball.y - ny;
      if (dx * dx + dy * dy >= r * r) continue;

      // Resolve on the axis of least penetration.
      const penX = r - Math.abs(dx);
      const penY = r - Math.abs(dy);
      const insideX = dx === 0;
      const insideY = dy === 0;
      if ((insideX && !insideY) || (!insideX && !insideY && penY < penX)) {
        // Horizontal face.
        const sign = s.ball.y < b.y + b.h / 2 ? -1 : 1;
        s.ball.y = sign < 0 ? b.y - r : b.y + b.h + r;
        if (Math.sign(s.dir.y) !== sign) s.dir.y = -s.dir.y;
      } else {
        // Vertical face.
        const sign = s.ball.x < b.x + b.w / 2 ? -1 : 1;
        s.ball.x = sign < 0 ? b.x - r : b.x + b.w + r;
        if (Math.sign(s.dir.x) !== sign) s.dir.x = -s.dir.x;
      }
      this.clampDir();
      this.registerBounce();

      let broken = false;
      if (b.kind !== "steel") {
        b.hp -= 1;
        if (b.hp <= 0) {
          broken = true;
          this.bricks.splice(i, 1);
          s.remaining -= 1;
          s.score += Math.round(RULES.scorePerBrick * s.speed.total);
        }
      }
      this.emit({ t: s.time, type: "brick", brick: { ...b }, broken, x: nx, y: ny });

      if (s.remaining === 0) {
        s.phase = "cleared";
        s.phaseLeft = RULES.endDelay;
        this.emit({ t: s.time, type: "cleared", score: s.score });
      }
      return; // one brick per sub-step
    }
  }

  private checkBonuses(): void {
    const s = this.state;
    const r = this.level.ball.r;
    for (const z of this.bonuses) {
      if (this.bonusCooldown.has(z.id)) continue;
      const dx = s.ball.x - z.x;
      const dy = s.ball.y - z.y;
      const reach = z.r + r * 0.5;
      if (dx * dx + dy * dy > reach * reach) continue;

      s.speed.bonusKind = z.kind;
      s.speed.bonusMul = RULES.bonusMul[z.kind];
      s.speed.bonusLeft = RULES.bonusDuration[z.kind];
      this.bonusCooldown.set(z.id, RULES.bonusCooldown);
      this.emit({ t: s.time, type: "bonus", bonus: z });
    }
  }

  private loseLife(): void {
    const s = this.state;
    s.lives -= 1;
    s.paddleHits = 0;
    s.speed = { bonusMul: 1, bonusLeft: 0, bonusKind: null, rampMul: 1, heat: 0, total: 1 };
    this.bonusCooldown.clear();
    this.emit({ t: s.time, type: "life", lives: s.lives, x: s.ball.x });

    if (s.lives <= 0) {
      s.phase = "over";
      s.phaseLeft = RULES.endDelay;
      this.emit({ t: s.time, type: "over", score: s.score });
    } else {
      s.phase = "lost";
      s.phaseLeft = RULES.lostDelay;
    }
  }

  private clampDir(): void {
    const d = this.state.dir;
    if (Math.abs(d.y) < RULES.minDirY) {
      d.y = Math.sign(d.y || -1) * RULES.minDirY;
      d.x = Math.sign(d.x || 1) * Math.sqrt(1 - d.y * d.y);
    }
    const len = Math.hypot(d.x, d.y) || 1;
    d.x /= len;
    d.y /= len;
  }
}

/** Where the ball will cross `y` if it keeps its heading, folding on the side walls. */
export function predictX(level: Level, ball: Vec2, dir: Vec2, y: number): number {
  if (dir.y <= 0) return ball.x;
  const t = (y - ball.y) / dir.y;
  let x = ball.x + dir.x * t;
  const r = level.ball.r;
  const left = level.field.left + r;
  const right = level.field.right - r;
  const span = right - left;
  if (span <= 0) return ball.x;
  // Fold into [left, right] (mirror on each wall).
  let u = (x - left) % (2 * span);
  if (u < 0) u += 2 * span;
  x = u <= span ? left + u : left + 2 * span - u;
  return x;
}

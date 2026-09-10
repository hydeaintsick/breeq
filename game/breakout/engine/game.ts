/**
 * Breakout game loop — deterministic, fixed step, seeded.
 *
 * Speed model:
 *   total = bonus × ramp × heat
 *   - bonus: speed zones the author placed. slow ×0.5, fast2 ×2, fast3 ×3, timed.
 *   - ramp:  the classic Breakout rule — every few paddle hits the ball gets a
 *            notch faster, reset when a life is lost.
 *   - heat:  rapid rebounds (wall/brick/paddle hits close together) build heat
 *            that adds speed and cools down when the ball travels freely.
 *            Bumpers and trampolines add heat directly.
 *
 * Everything else the catalog offers — brick kinds, zones, obstacles, rules —
 * lives here too, so a level plays the same on every device.
 */
import { createRng, type Rng } from "../../shared/random";
import { BRICK_HP, ROW_STEP } from "./level";
import type {
  Ball,
  Brick,
  GameEvent,
  GameInput,
  GameState,
  Level,
  Obstacle,
  PaddleModKind,
  SpeedZoneKind,
  Zone,
} from "./types";

export const RULES = {
  stepsPerSecond: 240,
  paddleSpeed: 1050,
  serveDelay: 1.1,
  lostDelay: 1.0,
  endDelay: 2.6,
  bonusDuration: { slow: 5, fast2: 4, fast3: 3 } as Record<SpeedZoneKind, number>,
  bonusMul: { slow: 0.5, fast2: 2, fast3: 3 } as Record<SpeedZoneKind, number>,
  /** Seconds before a zone can trigger again. */
  zoneCooldown: { speed: 3, portal: 1.2, mirror: 1.5, split: 8, mod: 3 },
  modDuration: { shrink: 8, grow: 8, invert: 5, ice: 6, sticky: 6 } as Record<PaddleModKind, number>,
  modWidth: { shrink: 0.6, grow: 1.5 } as Partial<Record<PaddleModKind, number>>,
  splitDuration: 6,
  maxBalls: 3,
  /** Auto-release for sticky balls when the game launches on its own. */
  stickyAutoRelease: 1.0,
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
  /** Seconds before the same brick can take another hit. */
  brickHitGap: 0.08,
  /** Piece behavior. */
  ghostPeriod: 4,
  ghostOpenFraction: 0.4,
  regenDelay: 6,
  explosionReach: 1.15,
  magnetRadius: 72,
  magnetPull: 3.2,
  rotorSpeed: 1.1,
  gravityPull: 2.6,
  fanForce: 1,
  bumperHeat: 2,
  trampolineHeat: 3,
  blackholeReach: 2.5,
  blackholePull: 1.5,
} as const;

export interface GameOptions {
  seed?: number;
  /** Launch automatically after `serveDelay`; release sticky balls on their own. Off for human play. */
  autoLaunch?: boolean;
}

export interface PendingBrick {
  brick: Brick;
  /** Game time at which it comes back. */
  at: number;
}

export class Game {
  readonly level: Level;
  readonly dt = 1 / RULES.stepsPerSecond;
  state: GameState;
  /** Live bricks (mutable copies of the level's). */
  bricks: Brick[] = [];
  /** Regen bricks waiting to come back. */
  pending: PendingBrick[] = [];
  readonly zones: Zone[];
  readonly obstacles: Obstacle[];
  private rng: Rng;
  private readonly seed: number;
  private readonly autoLaunch: boolean;
  private events: GameEvent[] = [];
  private zoneCooldown = new Map<number, number>();
  private brickHitAt = new Map<number, number>();
  private lastBounceT = -10;
  private nextBallId = 1;

  constructor(level: Level, options: GameOptions = {}) {
    this.level = level;
    this.seed = options.seed ?? 1;
    this.autoLaunch = options.autoLaunch ?? true;
    this.zones = level.zones;
    this.obstacles = level.obstacles;
    this.rng = createRng(this.seed);
    this.state = this.initialState();
    this.reset();
  }

  /** Back to the first serve with full lives and the whole wall. */
  reset(seed = this.seed): void {
    this.rng = createRng(seed);
    this.bricks = this.level.bricks.map((b) => ({ ...b }));
    this.pending = [];
    this.zoneCooldown.clear();
    this.brickHitAt.clear();
    this.lastBounceT = -10;
    this.nextBallId = 1;
    this.state = this.initialState();
    this.serveBall();
  }

  /** Advance one fixed step. Returns the events it produced. */
  step(input: GameInput): GameEvent[] {
    this.events = [];
    const s = this.state;
    const dt = this.dt;
    s.time += dt;

    this.tickMods(dt);
    this.movePaddle(input.targetX, dt);
    this.tickBonus(dt);
    this.coolHeat(dt);

    switch (s.phase) {
      case "serve":
        this.followPaddle(s.balls[0]);
        s.phaseLeft -= dt;
        if (input.launch || (this.autoLaunch && s.phaseLeft <= 0)) {
          this.launch(s.balls[0]);
          s.phase = "play";
        }
        break;
      case "play":
        this.tickTimer(dt);
        if (s.phase !== "play") break;
        this.moveBalls(dt, input);
        this.tickRegen();
        break;
      case "lost":
        s.phaseLeft -= dt;
        if (s.phaseLeft <= 0) {
          s.phase = "serve";
          s.phaseLeft = RULES.serveDelay;
          this.serveBall();
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

  /** Ghost bricks are passable while open. */
  ghostOpen(brick: Brick, time = this.state.time): boolean {
    const phase = (time / RULES.ghostPeriod + brick.id * 0.173) % 1;
    return phase > 1 - RULES.ghostOpenFraction;
  }

  /** Current angle of a rotor brick. */
  rotorAngle(brick: Brick, time = this.state.time): number {
    return time * RULES.rotorSpeed * (brick.id % 2 === 0 ? 1 : -1) + brick.id;
  }

  /** Current center x of a guard. */
  guardX(o: Extract<Obstacle, { kind: "guard" }>, time = this.state.time): number {
    return o.x + Math.sin(time * o.speed) * o.range;
  }

  /** Bricks that bounce but cannot be damaged right now. */
  isArmored(brick: Brick): boolean {
    if (brick.kind === "steel") return true;
    if (brick.kind === "lock" && this.state.keysLeft > 0) return true;
    const order = this.level.rules.order;
    if (order && !this.state.orderDone && brick.color !== order) return true;
    return false;
  }

  /** True if a point is inside a fog zone (renderer hides balls there). */
  inFog(x: number, y: number): boolean {
    for (const z of this.zones) {
      if (z.kind === "fog" && (x - z.x) ** 2 + (y - z.y) ** 2 < z.r * z.r) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  private initialState(): GameState {
    const { level } = this;
    return {
      phase: "serve",
      time: 0,
      lives: level.lives,
      score: 0,
      paddleX: (level.field.left + level.field.right) / 2,
      paddleVel: 0,
      paddleWidth: level.paddle.width,
      paddleMod: null,
      balls: [],
      speed: { bonusMul: 1, bonusLeft: 0, bonusKind: null, rampMul: 1, heat: 0, total: 1 },
      paddleHits: 0,
      totalPaddleHits: 0,
      remaining: level.bricks.filter((b) => b.kind !== "steel").length,
      keysLeft: level.bricks.filter((b) => b.kind === "key").length,
      orderDone: level.rules.order === null,
      timeLeft: level.rules.timer > 0 ? level.rules.timer : null,
      phaseLeft: RULES.serveDelay,
      ending: null,
    };
  }

  private newBall(x: number, y: number, dx: number, dy: number, ttl: number | null = null): Ball {
    return { id: this.nextBallId++, x, y, dx, dy, ttl, stuck: null, stuckFor: 0, rolling: null };
  }

  private serveBall(): void {
    const s = this.state;
    s.balls = [this.newBall(s.paddleX, this.level.paddle.y - this.level.ball.r - 0.5, 0, -1)];
  }

  private followPaddle(ball: Ball): void {
    ball.x = this.state.paddleX + (ball.stuck ?? 0);
    ball.y = this.level.paddle.y - this.level.ball.r - 0.5;
  }

  private launch(ball: Ball): void {
    const angle = this.rng.range(0.3, 0.6) * (this.rng.chance(0.5) ? 1 : -1);
    ball.dx = Math.sin(angle);
    ball.dy = -Math.cos(angle);
    ball.stuck = null;
    ball.stuckFor = 0;
    this.emit({ t: this.state.time, type: "launch" });
  }

  private emit(event: GameEvent): void {
    this.events.push(event);
  }

  // ---------------------------------------------------------------------------
  // Speed model
  // ---------------------------------------------------------------------------

  private totalMul(): number {
    const sp = this.state.speed;
    const raw = sp.bonusMul * sp.rampMul * (1 + sp.heat * RULES.heatPerUnit);
    return Math.max(RULES.minSpeedMul, Math.min(RULES.maxSpeedMul, raw));
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
    for (const [id, left] of this.zoneCooldown) {
      const next = left - dt;
      if (next <= 0) this.zoneCooldown.delete(id);
      else this.zoneCooldown.set(id, next);
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

  private addHeat(amount: number): void {
    const s = this.state;
    const before = Math.floor(s.speed.heat);
    s.speed.heat = Math.min(RULES.heatMax, s.speed.heat + amount);
    if (Math.floor(s.speed.heat) !== before) {
      this.emit({ t: s.time, type: "heat", heat: s.speed.heat });
    }
  }

  private registerBounce(): void {
    const s = this.state;
    if (s.time - this.lastBounceT < RULES.heatWindow) this.addHeat(1);
    this.lastBounceT = s.time;
  }

  // ---------------------------------------------------------------------------
  // Paddle
  // ---------------------------------------------------------------------------

  private tickMods(dt: number): void {
    const s = this.state;
    if (s.paddleMod) {
      s.paddleMod.left -= dt;
      if (s.paddleMod.left <= 0) {
        const kind = s.paddleMod.kind;
        s.paddleMod = null;
        this.emit({ t: s.time, type: "modEnd", kind });
        if (kind === "sticky") {
          for (const b of s.balls) if (b.stuck !== null && s.phase === "play") this.releaseStuck(b);
        }
      }
    }
    const scale = s.paddleMod ? (RULES.modWidth[s.paddleMod.kind] ?? 1) : 1;
    s.paddleWidth = this.level.paddle.width * scale;
  }

  private applyMod(kind: PaddleModKind): void {
    const s = this.state;
    if (s.paddleMod && s.paddleMod.kind !== kind) {
      this.emit({ t: s.time, type: "modEnd", kind: s.paddleMod.kind });
    }
    s.paddleMod = { kind, left: RULES.modDuration[kind] };
    this.emit({ t: s.time, type: "mod", kind });
  }

  private movePaddle(targetX: number, dt: number): void {
    const s = this.state;
    const half = s.paddleWidth / 2;
    const { left, right } = this.level.field;
    const center = (left + right) / 2;
    let target = targetX;
    if (s.paddleMod?.kind === "invert") target = center * 2 - target;
    target = Math.max(left + half, Math.min(right - half, target));

    if (s.paddleMod?.kind === "ice") {
      // Under-damped spring: the paddle overshoots and slides back.
      s.paddleVel += (target - s.paddleX) * 24 * dt;
      s.paddleVel *= Math.max(0, 1 - 6 * dt);
      s.paddleX += s.paddleVel * dt;
    } else {
      const maxStep = RULES.paddleSpeed * dt;
      const delta = target - s.paddleX;
      const step = Math.abs(delta) <= maxStep ? delta : Math.sign(delta) * maxStep;
      s.paddleX += step;
      s.paddleVel = step / dt;
    }
    const clamped = Math.max(left + half, Math.min(right - half, s.paddleX));
    if (clamped !== s.paddleX) {
      s.paddleX = clamped;
      s.paddleVel = 0;
    }
  }

  private releaseStuck(ball: Ball): void {
    const half = this.state.paddleWidth / 2;
    const offset = Math.max(-1, Math.min(1, (ball.stuck ?? 0) / half));
    const angle = offset * RULES.maxAngle;
    ball.dx = Math.sin(angle);
    ball.dy = -Math.cos(angle);
    ball.stuck = null;
    ball.stuckFor = 0;
    ball.y = this.level.paddle.y - this.level.ball.r - 0.5;
    this.emit({ t: this.state.time, type: "launch" });
  }

  // ---------------------------------------------------------------------------
  // Rules
  // ---------------------------------------------------------------------------

  private tickTimer(dt: number): void {
    const s = this.state;
    if (s.timeLeft === null) return;
    s.timeLeft = Math.max(0, s.timeLeft - dt);
    if (s.timeLeft <= 0) this.endGame("timeout");
  }

  private tickRegen(): void {
    const s = this.state;
    const r = this.level.ball.r;
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      if (p.at > s.time) continue;
      const b = p.brick;
      const blocked = s.balls.some(
        (ball) => ball.x + r > b.x && ball.x - r < b.x + b.w && ball.y + r > b.y && ball.y - r < b.y + b.h,
      );
      if (blocked) {
        p.at = s.time + 0.25;
        continue;
      }
      this.pending.splice(i, 1);
      this.bricks.push({ ...b, hp: BRICK_HP.regen, respawned: true });
      this.emit({ t: s.time, type: "regen", brick: b });
    }
  }

  private descend(): void {
    const s = this.state;
    const crushLine = this.level.paddle.y - ROW_STEP;
    let crushed = false;
    for (const b of this.bricks) {
      b.y += ROW_STEP;
      if (b.y + b.h >= crushLine) crushed = true;
    }
    for (const p of this.pending) p.brick.y += ROW_STEP;
    this.emit({ t: s.time, type: "descend", rows: 1 });
    if (crushed) this.endGame("crushed");
  }

  private endGame(reason: "lives" | "timeout" | "crushed"): void {
    const s = this.state;
    if (s.phase === "over" || s.phase === "cleared") return;
    s.phase = "over";
    s.ending = reason;
    s.phaseLeft = RULES.endDelay;
    this.emit({ t: s.time, type: "over", score: s.score, reason });
  }

  private loseLife(): void {
    const s = this.state;
    s.lives -= 1;
    s.paddleHits = 0;
    s.speed = { bonusMul: 1, bonusLeft: 0, bonusKind: null, rampMul: 1, heat: 0, total: 1 };
    if (s.paddleMod) {
      this.emit({ t: s.time, type: "modEnd", kind: s.paddleMod.kind });
      s.paddleMod = null;
    }
    this.zoneCooldown.clear();
    this.emit({ t: s.time, type: "life", lives: s.lives, x: s.paddleX });

    if (s.lives <= 0) {
      s.ending = "lives";
      this.endGame("lives");
    } else {
      s.phase = "lost";
      s.phaseLeft = RULES.lostDelay;
    }
  }

  // ---------------------------------------------------------------------------
  // Balls
  // ---------------------------------------------------------------------------

  private moveBalls(dt: number, input: GameInput): void {
    const s = this.state;
    const v = this.ballSpeed;
    const r = this.level.ball.r;
    const travel = v * dt;
    // Sub-step so a ×3 ball never tunnels through a brick.
    const steps = Math.max(1, Math.ceil(travel / (r * 0.75)));
    const sub = dt / steps;
    const dead: Ball[] = [];

    for (const ball of [...s.balls]) {
      if (ball.ttl !== null) {
        ball.ttl -= dt;
        if (ball.ttl <= 0) {
          if (s.balls.length > 1) {
            dead.push(ball);
            continue;
          }
          ball.ttl = null;
        }
      }
      if (ball.stuck !== null) {
        this.followPaddle(ball);
        ball.stuckFor += dt;
        if (input.launch || (this.autoLaunch && ball.stuckFor >= RULES.stickyAutoRelease)) {
          this.releaseStuck(ball);
        }
        continue;
      }
      for (let i = 0; i < steps; i++) {
        if (!this.moveBall(ball, v, sub)) {
          dead.push(ball);
          break;
        }
        if (s.phase !== "play") return;
      }
    }

    if (dead.length > 0) {
      s.balls = s.balls.filter((b) => !dead.includes(b));
      if (s.balls.length === 0 && s.phase === "play") this.loseLife();
    }
  }

  /** One sub-step for one ball. Returns false when the ball is gone. */
  private moveBall(ball: Ball, v: number, sub: number): boolean {
    const r = this.level.ball.r;
    const prevY = ball.y;
    const prev = { x: ball.x, y: ball.y };

    if (ball.rolling !== null) {
      const rail = this.obstacles.find((o) => o.id === ball.rolling);
      if (rail && rail.kind === "rail") {
        ball.x += ball.dx * v * sub;
        ball.y = rail.y - r;
        if (ball.x < rail.x - r * 0.5 || ball.x > rail.x + rail.w + r * 0.5) {
          ball.rolling = null;
          this.setDir(ball, ball.dx, 0.7);
        }
      } else {
        ball.rolling = null;
      }
    } else {
      this.applyForces(ball, sub);
      ball.x += ball.dx * v * sub;
      ball.y += ball.dy * v * sub;
    }

    if (!this.collideWalls(ball)) return false;
    this.collidePaddle(ball, prevY);
    if (ball.stuck !== null) return true;
    this.collideBricks(ball, prev);
    if (!this.collideObstacles(ball, prev)) return false;
    this.triggerZones(ball);
    return true;
  }

  private setDir(ball: Ball, dx: number, dy: number): void {
    const len = Math.hypot(dx, dy) || 1;
    ball.dx = dx / len;
    ball.dy = dy / len;
    this.clampDir(ball);
  }

  private clampDir(ball: Ball): void {
    if (Math.abs(ball.dy) < RULES.minDirY) {
      ball.dy = Math.sign(ball.dy || -1) * RULES.minDirY;
      ball.dx = Math.sign(ball.dx || 1) * Math.sqrt(1 - ball.dy * ball.dy);
    }
    const len = Math.hypot(ball.dx, ball.dy) || 1;
    ball.dx /= len;
    ball.dy /= len;
  }

  /** Continuous influences: gravity zones, fans, magnets, black holes. */
  private applyForces(ball: Ball, sub: number): void {
    let fx = 0;
    let fy = 0;

    for (const z of this.zones) {
      if (z.kind !== "gravity" && z.kind !== "antigrav") continue;
      if ((ball.x - z.x) ** 2 + (ball.y - z.y) ** 2 > z.r * z.r) continue;
      fy += z.kind === "gravity" ? RULES.gravityPull : -RULES.gravityPull;
    }

    for (const o of this.obstacles) {
      if (o.kind === "fan") {
        const x0 = o.dir > 0 ? o.x : o.x - o.reach;
        if (ball.x >= x0 && ball.x <= x0 + o.reach && Math.abs(ball.y - o.y) <= o.spread / 2) {
          fx += o.dir * o.force * RULES.fanForce;
        }
      } else if (o.kind === "blackhole") {
        const dx = o.x - ball.x;
        const dy = o.y - ball.y;
        const d = Math.hypot(dx, dy);
        const reach = o.r * RULES.blackholeReach;
        if (d < reach && d > 0) {
          const k = RULES.blackholePull * (1 - d / reach);
          fx += (dx / d) * k;
          fy += (dy / d) * k;
        }
      }
    }

    for (const b of this.bricks) {
      if (b.kind !== "magnet") continue;
      const dx = b.x + b.w / 2 - ball.x;
      const dy = b.y + b.h / 2 - ball.y;
      const d = Math.hypot(dx, dy);
      if (d < RULES.magnetRadius && d > 0) {
        const k = RULES.magnetPull * (1 - d / RULES.magnetRadius);
        fx += (dx / d) * k;
        fy += (dy / d) * k;
      }
    }

    if (fx !== 0 || fy !== 0) {
      this.setDir(ball, ball.dx + fx * sub, ball.dy + fy * sub);
    }
  }

  /** Returns false if the ball fell out. */
  private collideWalls(ball: Ball): boolean {
    const s = this.state;
    const r = this.level.ball.r;
    const f = this.level.field;

    if (ball.x - r < f.left) {
      ball.x = f.left + r;
      if (ball.dx < 0) {
        ball.dx = -ball.dx;
        this.registerBounce();
        this.emit({ t: s.time, type: "wall", side: "left", x: f.left, y: ball.y });
      }
    } else if (ball.x + r > f.right) {
      ball.x = f.right - r;
      if (ball.dx > 0) {
        ball.dx = -ball.dx;
        this.registerBounce();
        this.emit({ t: s.time, type: "wall", side: "right", x: f.right, y: ball.y });
      }
    }
    if (ball.y - r < f.top) {
      ball.y = f.top + r;
      if (ball.dy < 0) {
        ball.dy = -ball.dy;
        ball.rolling = null;
        this.registerBounce();
        this.emit({ t: s.time, type: "wall", side: "top", x: ball.x, y: f.top });
      }
    }
    return ball.y - r <= f.bottom;
  }

  private collidePaddle(ball: Ball, prevY: number): void {
    const s = this.state;
    const r = this.level.ball.r;
    const p = this.level.paddle;
    if (ball.dy <= 0) return;
    const top = p.y;
    if (prevY + r > top || ball.y + r < top) return;
    const half = s.paddleWidth / 2;
    if (ball.x < s.paddleX - half - r || ball.x > s.paddleX + half + r) return;

    const offset = Math.max(-1, Math.min(1, (ball.x - s.paddleX) / half));
    ball.y = top - r;
    ball.rolling = null;
    s.paddleHits += 1;
    s.totalPaddleHits += 1;
    const notches = Math.min(Math.floor(s.paddleHits / RULES.rampHits) * RULES.rampStep, RULES.rampMax - 1);
    s.speed.rampMul = 1 + notches;
    this.registerBounce();

    const caught = s.paddleMod?.kind === "sticky";
    if (caught) {
      ball.stuck = ball.x - s.paddleX;
      ball.stuckFor = 0;
      ball.dx = 0;
      ball.dy = -1;
    } else {
      const angle = offset * RULES.maxAngle;
      this.setDir(ball, Math.sin(angle), -Math.cos(angle));
    }
    this.emit({ t: s.time, type: "paddle", x: ball.x, y: top, offset, caught });

    const { descend } = this.level.rules;
    if (descend > 0 && s.totalPaddleHits % descend === 0) this.descend();
  }

  /**
   * Push a ball out of an axis-aligned box and reflect it. Returns the hit
   * point or null.
   */
  private resolveBox(
    ball: Ball,
    x: number,
    y: number,
    w: number,
    h: number,
    prev?: { x: number; y: number },
  ): { x: number; y: number } | null {
    const r = this.level.ball.r;
    const nx = Math.max(x, Math.min(ball.x, x + w));
    const ny = Math.max(y, Math.min(ball.y, y + h));
    const dx = ball.x - nx;
    const dy = ball.y - ny;
    if (dx * dx + dy * dy >= r * r) return null;

    // Which face did we cross? The previous position decides when it can, so
    // a ball arriving from below never gets a sideways kick off a corner.
    let vertical: boolean;
    if (prev && (prev.y + r <= y || prev.y - r >= y + h)) vertical = true;
    else if (prev && (prev.x + r <= x || prev.x - r >= x + w)) vertical = false;
    else {
      const penX = r - Math.abs(dx);
      const penY = r - Math.abs(dy);
      const insideX = dx === 0;
      const insideY = dy === 0;
      vertical = (insideX && !insideY) || (!insideX && !insideY && penY < penX);
    }
    if (vertical) {
      const sign = ball.y < y + h / 2 ? -1 : 1;
      ball.y = sign < 0 ? y - r : y + h + r;
      if (Math.sign(ball.dy) !== sign) ball.dy = -ball.dy;
    } else {
      const sign = ball.x < x + w / 2 ? -1 : 1;
      ball.x = sign < 0 ? x - r : x + w + r;
      if (Math.sign(ball.dx) !== sign) ball.dx = -ball.dx;
    }
    ball.rolling = null;
    this.clampDir(ball);
    return { x: nx, y: ny };
  }

  /** Same for a rotated box (rotor bricks). */
  private resolveObb(
    ball: Ball,
    cx: number,
    cy: number,
    hw: number,
    hh: number,
    angle: number,
  ): { x: number; y: number } | null {
    const r = this.level.ball.r;
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const rx = ball.x - cx;
    const ry = ball.y - cy;
    const lx = rx * cos - ry * sin;
    const ly = rx * sin + ry * cos;
    const qx = Math.max(-hw, Math.min(lx, hw));
    const qy = Math.max(-hh, Math.min(ly, hh));
    const dx = lx - qx;
    const dy = ly - qy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= r * r) return null;

    // Local normal.
    let nxl: number;
    let nyl: number;
    if (d2 > 1e-6) {
      const d = Math.sqrt(d2);
      nxl = dx / d;
      nyl = dy / d;
    } else {
      // Center inside: pop out along the shallow axis.
      const penX = hw - Math.abs(lx);
      const penY = hh - Math.abs(ly);
      if (penX < penY) {
        nxl = Math.sign(lx || 1);
        nyl = 0;
      } else {
        nxl = 0;
        nyl = Math.sign(ly || 1);
      }
    }
    // Back to world.
    const c2 = Math.cos(angle);
    const s2 = Math.sin(angle);
    const nx = nxl * c2 - nyl * s2;
    const ny = nxl * s2 + nyl * c2;
    const hitX = cx + qx * c2 - qy * s2;
    const hitY = cy + qx * s2 + qy * c2;

    ball.x = hitX + nx * (r + 0.01);
    ball.y = hitY + ny * (r + 0.01);
    const dot = ball.dx * nx + ball.dy * ny;
    if (dot < 0) {
      ball.dx -= 2 * dot * nx;
      ball.dy -= 2 * dot * ny;
    }
    ball.rolling = null;
    this.clampDir(ball);
    return { x: hitX, y: hitY };
  }

  private collideBricks(ball: Ball, prev: { x: number; y: number }): void {
    const s = this.state;
    for (let i = 0; i < this.bricks.length; i++) {
      const b = this.bricks[i];
      if (b.kind === "ghost" && this.ghostOpen(b)) continue;

      const hit =
        b.kind === "rotor"
          ? this.resolveObb(ball, b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, this.rotorAngle(b))
          : this.resolveBox(ball, b.x, b.y, b.w, b.h, prev);
      if (!hit) continue;

      // A brick takes one hit per contact, even if the ball grazes it for a few sub-steps.
      const lastHit = this.brickHitAt.get(b.id) ?? -1;
      if (s.time - lastHit < RULES.brickHitGap) return;
      this.brickHitAt.set(b.id, s.time);

      this.registerBounce();
      if (this.isArmored(b)) {
        this.emit({ t: s.time, type: "brick", brick: { ...b }, broken: false, x: hit.x, y: hit.y });
        return;
      }
      b.hp -= 1;
      if (b.hp > 0) {
        this.emit({ t: s.time, type: "brick", brick: { ...b }, broken: false, x: hit.x, y: hit.y });
        return;
      }
      this.breakBrick(i, hit.x, hit.y);
      return; // one brick per sub-step
    }
  }

  private breakBrick(index: number, hitX: number, hitY: number): void {
    const s = this.state;
    const b = this.bricks[index];
    this.bricks.splice(index, 1);
    if (!b.respawned) s.remaining -= 1;
    s.score += Math.round(RULES.scorePerBrick * s.speed.total);
    this.emit({ t: s.time, type: "brick", brick: { ...b }, broken: true, x: hitX, y: hitY });

    if (b.kind === "key") {
      s.keysLeft -= 1;
      if (s.keysLeft === 0) this.emit({ t: s.time, type: "unlock" });
    }
    if (b.kind === "regen") {
      this.pending.push({ brick: { ...b }, at: s.time + RULES.regenDelay });
    }
    if (b.kind === "explosive") {
      this.explode(b);
    }

    const order = this.level.rules.order;
    if (order && !s.orderDone && !this.bricks.some((x) => x.color === order && x.kind !== "steel")) {
      s.orderDone = true;
      this.emit({ t: s.time, type: "orderDone" });
    }

    if (s.remaining <= 0 && s.phase === "play") {
      this.pending = [];
      s.phase = "cleared";
      s.ending = "cleared";
      s.phaseLeft = RULES.endDelay;
      this.emit({ t: s.time, type: "cleared", score: s.score });
    }
  }

  private explode(source: Brick): void {
    const s = this.state;
    const cx = source.x + source.w / 2;
    const cy = source.y + source.h / 2;
    const reachX = (source.w + 4) * RULES.explosionReach;
    const reachY = (source.h + 4) * RULES.explosionReach;
    this.emit({ t: s.time, type: "explode", x: cx, y: cy, color: source.color });

    const victims = this.bricks
      .filter((b) => !this.isArmored(b) && Math.abs(b.x + b.w / 2 - cx) <= reachX && Math.abs(b.y + b.h / 2 - cy) <= reachY)
      .map((b) => b.id);
    for (const id of victims) {
      const index = this.bricks.findIndex((b) => b.id === id);
      if (index === -1 || s.phase !== "play") continue;
      const b = this.bricks[index];
      this.breakBrick(index, b.x + b.w / 2, b.y + b.h / 2);
    }
  }

  /** Returns false if an obstacle swallowed the ball. */
  private collideObstacles(ball: Ball, prev: { x: number; y: number }): boolean {
    const s = this.state;
    const r = this.level.ball.r;
    const prevY = prev.y;

    for (const o of this.obstacles) {
      switch (o.kind) {
        case "bumper": {
          const dx = ball.x - o.x;
          const dy = ball.y - o.y;
          const d = Math.hypot(dx, dy);
          if (d >= o.r + r || d === 0) break;
          const nx = dx / d;
          const ny = dy / d;
          ball.x = o.x + nx * (o.r + r + 0.01);
          ball.y = o.y + ny * (o.r + r + 0.01);
          const dot = ball.dx * nx + ball.dy * ny;
          if (dot < 0) {
            ball.dx -= 2 * dot * nx;
            ball.dy -= 2 * dot * ny;
          }
          ball.rolling = null;
          this.clampDir(ball);
          this.registerBounce();
          this.addHeat(RULES.bumperHeat);
          this.emit({ t: s.time, type: "obstacle", obstacle: o, x: o.x + nx * o.r, y: o.y + ny * o.r });
          break;
        }
        case "rail": {
          if (ball.rolling === o.id) break;
          if (ball.dy > 0 && prevY + r <= o.y && ball.y + r >= o.y && ball.x >= o.x && ball.x <= o.x + o.w) {
            ball.rolling = o.id;
            ball.y = o.y - r;
            const dir = Math.sign(ball.dx) || (ball.x < o.x + o.w / 2 ? 1 : -1);
            ball.dx = dir;
            ball.dy = 0;
            this.emit({ t: s.time, type: "obstacle", obstacle: o, x: ball.x, y: o.y });
          }
          // From below the rail is a wire: the ball passes through.
          break;
        }
        case "trampoline": {
          if (ball.dy > 0 && prevY + r <= o.y && ball.y + r >= o.y && ball.x >= o.x - r && ball.x <= o.x + o.w + r) {
            ball.y = o.y - r;
            // A little scatter so a vertical ball cannot loop on the band forever.
            this.setDir(ball, ball.dx * 0.8 + this.rng.range(-0.4, 0.4), -1);
            this.registerBounce();
            this.addHeat(RULES.trampolineHeat);
            this.emit({ t: s.time, type: "obstacle", obstacle: o, x: ball.x, y: o.y });
          }
          break;
        }
        case "guard": {
          const gx = this.guardX(o);
          const hit = this.resolveBox(ball, gx - o.w / 2, o.y - o.h / 2, o.w, o.h, prev);
          if (hit) {
            this.registerBounce();
            this.emit({ t: s.time, type: "obstacle", obstacle: o, x: hit.x, y: hit.y });
          }
          break;
        }
        case "blackhole": {
          if ((ball.x - o.x) ** 2 + (ball.y - o.y) ** 2 < o.r * o.r) {
            this.emit({ t: s.time, type: "swallow", x: o.x, y: o.y });
            return false;
          }
          break;
        }
        case "fan":
          break;
      }
    }
    return true;
  }

  private triggerZones(ball: Ball): void {
    const s = this.state;
    const r = this.level.ball.r;
    for (const z of this.zones) {
      if (z.kind === "gravity" || z.kind === "antigrav" || z.kind === "fog") continue;
      if (this.zoneCooldown.has(z.id)) continue;
      const dx = ball.x - z.x;
      const dy = ball.y - z.y;
      const reach = z.r + r * 0.5;
      if (dx * dx + dy * dy > reach * reach) continue;

      switch (z.kind) {
        case "slow":
        case "fast2":
        case "fast3":
          s.speed.bonusKind = z.kind;
          s.speed.bonusMul = RULES.bonusMul[z.kind];
          s.speed.bonusLeft = RULES.bonusDuration[z.kind];
          this.zoneCooldown.set(z.id, RULES.zoneCooldown.speed);
          break;
        case "portal": {
          const twin = this.zones.find((o) => o.id === z.link);
          if (!twin) break;
          ball.x = twin.x + ball.dx * (twin.r + r + 1);
          ball.y = twin.y + ball.dy * (twin.r + r + 1);
          this.zoneCooldown.set(z.id, RULES.zoneCooldown.portal);
          this.zoneCooldown.set(twin.id, RULES.zoneCooldown.portal);
          this.emit({ t: s.time, type: "teleport", from: z, to: twin });
          break;
        }
        case "fakePortal":
          this.zoneCooldown.set(z.id, RULES.zoneCooldown.portal);
          break;
        case "mirror":
          ball.dx = -ball.dx;
          this.zoneCooldown.set(z.id, RULES.zoneCooldown.mirror);
          break;
        case "split": {
          this.zoneCooldown.set(z.id, RULES.zoneCooldown.split);
          if (s.balls.length >= RULES.maxBalls) break;
          const clone = this.newBall(ball.x, ball.y, -ball.dx, ball.dy, RULES.splitDuration);
          this.clampDir(clone);
          s.balls.push(clone);
          this.emit({ t: s.time, type: "split", x: ball.x, y: ball.y });
          break;
        }
        case "shrink":
        case "grow":
        case "invert":
        case "ice":
        case "sticky":
          this.applyMod(z.kind);
          this.zoneCooldown.set(z.id, RULES.zoneCooldown.mod);
          break;
      }
      this.emit({ t: s.time, type: "zone", zone: z });
    }
  }
}

/** Where a ball will cross `y` if it keeps its heading, folding on the side walls. */
export function predictX(level: Level, ball: { x: number; y: number }, dir: { x: number; y: number }, y: number): number {
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

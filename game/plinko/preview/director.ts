/**
 * Preview director — plays an infinite loop of drops on a board and turns
 * simulation events into scene state (flashes, particles, chest opening…).
 *
 * The loop tells the product story in three beats: a ball lost to the void,
 * a ball destroyed by nails, a ball that reaches the chest. Every run is a
 * real replay from the engine, chosen for readability (long enough, touches
 * the traps) rather than scripted.
 */
import {
  createRng,
  fanStream,
  indexPieces,
  nailHitbox,
  sampleReplay,
  simulateDrop,
  type Board,
  type Outcome,
  type PieceIndex,
  type Replay,
  type Rng,
  type SimEvent,
} from "../engine";
import { createScene, decay, decayArray, easeInCubic, easeOutCubic, type Particle, type SceneState } from "../render/scene";

export type PreviewPhase = "spawn" | "drop" | "result";

export interface HudState {
  boardName: string;
  reserve: number;
  stake: number;
  caption: string;
  outcome: Outcome | null;
  phase: PreviewPhase;
}

export interface DirectorOptions {
  onHud?: (hud: HudState) => void;
  /** Outcomes to cycle through, in order. Missing outcomes are skipped. */
  program?: readonly Outcome[];
  stake?: number;
  loot?: number;
  reserve?: number;
  /** Seeds scanned to pick readable replays. */
  seedScan?: number;
}

const SPAWN_DURATION = 0.8;
const RESULT_DURATION: Record<Outcome, number> = { void: 1.9, nail: 1.9, chest: 2.6, stuck: 1 };
const TRAIL_MAX_AGE = 0.2;

const CAPTIONS = {
  drop: (stake: number) => `Attacker drops. Stake: ${stake} gold.`,
  void: (stake: number) => `Into the void. The vault keeps ${stake}.`,
  nail: (stake: number) => `Nailed. The vault keeps ${stake}.`,
  chest: (loot: number) => `Chest looted. \u2212${loot} from the reserve.`,
  frozen: "The chest at the bottom. The void beside it.",
} as const;

export class PreviewDirector {
  readonly scene: SceneState;
  private readonly index: PieceIndex;
  private readonly replays: Replay[];
  private readonly fx: Rng = createRng(1337);
  private readonly stake: number;
  private readonly loot: number;
  private readonly onHud?: (hud: HudState) => void;

  private runIndex = -1;
  private replay: Replay | null = null;
  private phase: PreviewPhase = "spawn";
  private phaseT = 0;
  private eventCursor = 0;
  private fanTarget: Float32Array;
  private reserveTarget: number;
  private reserveShown: number;
  private hud: HudState;
  private frozen = false;
  private readonly cursor = { x: 0, y: 0 };

  constructor(
    private readonly board: Board,
    options: DirectorOptions = {},
  ) {
    this.index = indexPieces(board);
    this.scene = createScene(board, this.index);
    this.stake = options.stake ?? 25;
    this.loot = options.loot ?? 50;
    this.onHud = options.onHud;
    this.fanTarget = new Float32Array(this.index.fans.length);

    const reserve = options.reserve ?? 1240;
    this.reserveTarget = reserve;
    this.reserveShown = reserve;
    this.hud = {
      boardName: board.name,
      reserve,
      stake: this.stake,
      caption: CAPTIONS.drop(this.stake),
      outcome: null,
      phase: "spawn",
    };

    this.replays = pickProgram(board, options.program ?? ["void", "nail", "chest"], options.seedScan ?? 240);
    this.nextRun();
    this.emitHud();
  }

  get currentHud(): HudState {
    return this.hud;
  }

  /** Static end state for reduced-motion users: chest open, nothing moving. */
  freeze(): void {
    this.frozen = true;
    const s = this.scene;
    s.ball.visible = false;
    s.trail.length = 0;
    s.particles.length = 0;
    s.chest.open = 1;
    s.chest.glow = 0.55;
    s.hopperGlow = 0;
    s.fanActive.fill(0);
    s.pegFlash.fill(0);
    this.hud = { ...this.hud, caption: CAPTIONS.frozen, outcome: "chest", phase: "result" };
    this.emitHud();
  }

  update(dt: number): void {
    if (this.frozen) {
      return;
    }
    const s = this.scene;
    s.time += dt;
    this.phaseT += dt;

    // Ambient motion: portal rings drift, fans idle.
    s.portalSpin += dt * 0.6;
    for (let i = 0; i < s.fanSpin.length; i++) {
      s.fanActive[i] += (this.fanTarget[i] - s.fanActive[i]) * Math.min(1, dt * 8);
      s.fanSpin[i] += dt * (3 + s.fanActive[i] * 16);
    }
    for (const flex of s.trampFlex) {
      flex.t += dt;
    }

    switch (this.phase) {
      case "spawn":
        this.updateSpawn(dt);
        break;
      case "drop":
        this.updateDrop();
        break;
      case "result":
        this.updateResult(dt);
        break;
    }

    // Decays.
    decayArray(s.pegFlash, dt, 0.18);
    decayArray(s.dividerFlash, dt, 0.18);
    decayArray(s.portalPulse, dt, 0.35);
    decayArray(s.voidGlow, dt, 0.9);
    decayArray(s.nailFlash, dt, 0.7);
    s.ball.flash = decay(s.ball.flash, dt, 0.12);
    s.chest.glow = decay(s.chest.glow, dt, 1.4);

    // Trail pruning.
    while (s.trail.length > 0 && s.time - s.trail[0].t > TRAIL_MAX_AGE) {
      s.trail.shift();
    }

    this.updateParticles(dt);
    this.updateReserve(dt);
  }

  // ---------------------------------------------------------------------------

  private nextRun(): void {
    if (this.replays.length === 0) {
      return;
    }
    this.runIndex = (this.runIndex + 1) % this.replays.length;
    this.replay = this.replays[this.runIndex];
    this.eventCursor = 0;
    this.phase = "spawn";
    this.phaseT = 0;

    const s = this.scene;
    s.ball.x = this.replay.xs[0];
    s.ball.y = this.replay.ys[0];
    s.ball.alpha = 0;
    s.ball.scale = 1;
    s.ball.visible = true;
    s.trail.length = 0;
    this.fanTarget.fill(0);

    this.hud = { ...this.hud, caption: CAPTIONS.drop(this.stake), outcome: null, phase: "spawn" };
    this.emitHud();
  }

  private updateSpawn(dt: number): void {
    const s = this.scene;
    const k = Math.min(1, this.phaseT / SPAWN_DURATION);
    s.ball.alpha = easeOutCubic(k);
    s.hopperGlow = Math.sin(k * Math.PI);
    // The lid from the previous run closes while the next ball loads.
    s.chest.open = Math.max(0, s.chest.open - dt * (2 / SPAWN_DURATION));
    if (k >= 1) {
      s.hopperGlow = 0;
      s.chest.open = 0;
      this.phase = "drop";
      this.phaseT = 0;
      this.hud = { ...this.hud, phase: "drop" };
      this.emitHud();
    }
  }

  private updateDrop(): void {
    const s = this.scene;
    const replay = this.replay;
    if (!replay) return;

    const t = Math.min(this.phaseT, replay.duration);
    sampleReplay(replay, t, this.cursor);

    // A teleport must not draw a trail across the board.
    const events = replay.events;
    while (this.eventCursor < events.length && events[this.eventCursor].t <= t) {
      const event = events[this.eventCursor++];
      if (event.type === "portal" && event.teleported) {
        s.trail.length = 0;
      }
      this.applyEvent(event);
    }

    s.ball.x = this.cursor.x;
    s.ball.y = this.cursor.y;
    s.ball.alpha = 1;
    s.trail.push({ x: s.ball.x, y: s.ball.y, t: s.time });

    if (this.phaseT >= replay.duration) {
      this.beginResult(replay.outcome);
    }
  }

  private beginResult(outcome: Outcome): void {
    const s = this.scene;
    this.phase = "result";
    this.phaseT = 0;
    this.fanTarget.fill(0);

    let caption = this.hud.caption;
    switch (outcome) {
      case "void": {
        this.reserveTarget += this.stake;
        caption = CAPTIONS.void(this.stake);
        const i = this.nearestIndex(this.index.voids.map((v) => ({ x: v.x, y: this.board.floorY })));
        if (i >= 0) s.voidGlow[i] = 1;
        break;
      }
      case "nail": {
        this.reserveTarget += this.stake;
        caption = CAPTIONS.nail(this.stake);
        const i = this.nearestIndex(
          this.index.nails.map((n) => {
            const box = nailHitbox(n);
            return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
          }),
        );
        if (i >= 0) s.nailFlash[i] = 1;
        s.ball.visible = false;
        s.trail.length = 0;
        this.burst("shard", s.ball.x, s.ball.y, 9, 180, 360, 0.9, 3.2);
        this.burst("spark", s.ball.x, s.ball.y, 10, 120, 300, 0.5, 1.4);
        break;
      }
      case "chest": {
        this.reserveTarget -= this.loot;
        caption = CAPTIONS.chest(this.loot);
        s.chest.glow = 1;
        break;
      }
      case "stuck":
        break;
    }

    this.hud = { ...this.hud, caption, outcome, phase: "result" };
    this.emitHud();
  }

  private updateResult(dt: number): void {
    const s = this.scene;
    const replay = this.replay;
    if (!replay) return;
    const outcome = replay.outcome;
    const p = this.phaseT;

    switch (outcome) {
      case "void": {
        const k = Math.min(1, p / 0.55);
        s.ball.scale = 1 - easeInCubic(k);
        s.ball.y = replay.end.y + 12 * k;
        s.ball.alpha = 1 - k * 0.6;
        break;
      }
      case "chest": {
        s.chest.open = easeOutCubic(p / 0.45);
        const k = Math.min(1, Math.max(0, (p - 0.12) / 0.38));
        s.ball.scale = 1 - easeInCubic(k);
        s.ball.y = replay.end.y + 9 * k;
        if (p >= 0.16 && p - dt < 0.16) {
          const chest = this.index.chests[0];
          const top = this.board.floorY - chest.height;
          this.burst("coin", chest.x, top - 2, 8, 90, 230, 1.1, 5);
          this.burst("spark", chest.x, top - 4, 14, 60, 200, 0.7, 1.3);
        }
        break;
      }
      default:
        break;
    }

    if (p >= RESULT_DURATION[outcome]) {
      this.nextRun();
    }
  }

  // ---------------------------------------------------------------------------

  private applyEvent(event: SimEvent): void {
    const s = this.scene;
    switch (event.type) {
      case "peg": {
        s.pegFlash[event.index] = Math.min(1, 0.45 + event.speed / 600);
        s.ball.flash = Math.min(1, 0.35 + event.speed / 700);
        if (event.speed > 200) {
          this.burst("spark", s.ball.x, s.ball.y, 2 + Math.floor(event.speed / 220), 60, 190, 0.35, 1.1);
        }
        break;
      }
      case "wall": {
        s.ball.flash = 0.4;
        this.burst("spark", s.ball.x, s.ball.y, 2, 50, 140, 0.3, 1);
        break;
      }
      case "divider": {
        s.dividerFlash[event.index] = Math.min(1, 0.5 + event.speed / 500);
        s.ball.flash = 0.4;
        break;
      }
      case "trampoline": {
        s.trampFlex[event.index] = { amp: Math.min(1, event.speed / 650), t: 0 };
        s.ball.flash = 0.6;
        this.burst("dust", s.ball.x, s.ball.y + 4, 6, 40, 110, 0.45, 1.4);
        break;
      }
      case "fan": {
        this.fanTarget[event.index] = event.phase === "enter" ? 1 : 0;
        if (event.phase === "enter") {
          const stream = fanStream(this.index.fans[event.index]);
          const dir = this.index.fans[event.index].dir === "left" ? -1 : 1;
          for (let i = 0; i < 10; i++) {
            const x = dir < 0 ? stream.x + stream.w : stream.x;
            s.particles.push({
              kind: "air",
              x,
              y: stream.y + this.fx.range(2, stream.h - 2),
              vx: dir * this.fx.range(160, 320),
              vy: this.fx.range(-12, 12),
              life: 0.5,
              maxLife: 0.5,
              size: this.fx.range(0.6, 1.3),
              phase: 0,
            });
          }
        }
        break;
      }
      case "portal": {
        s.portalPulse[event.index] = 1;
        const portal = this.index.portals[event.index];
        this.burst("spark", portal.x, portal.y, 10, 40, 120, 0.5, 1);
        break;
      }
      default:
        break;
    }
  }

  private burst(
    kind: Particle["kind"],
    x: number,
    y: number,
    count: number,
    minSpeed: number,
    maxSpeed: number,
    life: number,
    size: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = kind === "coin" ? this.fx.range(-2.4, -0.7) : this.fx.range(0, Math.PI * 2);
      const speed = this.fx.range(minSpeed, maxSpeed);
      this.scene.particles.push({
        kind,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life * this.fx.range(0.7, 1.15),
        maxLife: life,
        size: size * this.fx.range(0.7, 1.2),
        phase: this.fx.range(0, Math.PI * 2),
      });
    }
  }

  private updateParticles(dt: number): void {
    const particles = this.scene.particles;
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      if (q.life <= 0) {
        particles[i] = particles[particles.length - 1];
        particles.pop();
        continue;
      }
      const gravity = q.kind === "coin" ? 900 : q.kind === "shard" ? 1100 : q.kind === "spark" ? 500 : 0;
      q.vy += gravity * dt;
      const dragK = q.kind === "air" ? 1.5 : 0.6;
      q.vx *= 1 - dragK * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    if (particles.length > 160) {
      particles.splice(0, particles.length - 160);
    }
  }

  private updateReserve(dt: number): void {
    if (this.reserveShown === this.reserveTarget) return;
    const diff = this.reserveTarget - this.reserveShown;
    const step = Math.sign(diff) * Math.max(1, Math.abs(diff) * Math.min(1, dt * 6));
    this.reserveShown = Math.abs(step) >= Math.abs(diff) ? this.reserveTarget : this.reserveShown + step;
    const rounded = Math.round(this.reserveShown);
    if (rounded !== this.hud.reserve) {
      this.hud = { ...this.hud, reserve: rounded };
      this.emitHud();
    }
  }

  private nearestIndex(points: { x: number; y: number }[]): number {
    const { x, y } = this.scene.ball;
    let best = -1;
    let bestD = Number.POSITIVE_INFINITY;
    points.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  private emitHud(): void {
    this.onHud?.(this.hud);
  }
}

/**
 * Pick one readable replay per requested outcome. "Readable" means the ball
 * spends enough time on the board and, when possible, meets a trap on the way.
 */
export function pickProgram(board: Board, program: readonly Outcome[], seedScan: number): Replay[] {
  const pool: Replay[] = [];
  for (let seed = 1; seed <= seedScan; seed++) {
    pool.push(simulateDrop(board, seed));
  }

  const picks: Replay[] = [];
  for (const outcome of program) {
    let best: Replay | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const replay of pool) {
      if (replay.outcome !== outcome) continue;
      const score = readability(replay);
      if (score > bestScore) {
        bestScore = score;
        best = replay;
      }
    }
    if (best) picks.push(best);
  }
  return picks;
}

function readability(replay: Replay): number {
  const inWindow = replay.duration >= 1.7 && replay.duration <= 4.6;
  const score = inWindow ? 3 : -Math.abs(replay.duration - 3);
  let pegs = 0;
  let trampoline = 0;
  let fan = 0;
  let portal = 0;
  for (const e of replay.events) {
    if (e.type === "peg") pegs += 1;
    else if (e.type === "trampoline") trampoline = 1;
    else if (e.type === "fan" && e.phase === "enter") fan = 1;
    else if (e.type === "portal") portal = 1;
  }
  return score + trampoline * 1.6 + fan * 1.1 + portal * 0.6 + Math.min(pegs, 12) / 12;
}

/**
 * Visual state layered on top of the game state: trails, flashes, particles.
 * Owned by whoever drives the loop; the renderer only reads it.
 */
import type { BrickColor, GameEvent } from "../engine/types";
import { createRng, type Rng } from "../../shared/random";

export type FxColor = BrickColor | "white" | "steel" | "danger";

export interface Particle {
  kind: "shard" | "spark" | "dust";
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  spin: number;
  color: FxColor;
}

export interface Ring {
  x: number;
  y: number;
  r0: number;
  r1: number;
  life: number;
  maxLife: number;
  color: FxColor;
  width?: number;
}

export interface BreakoutScene {
  time: number;
  trail: { x: number; y: number; t: number; id: number }[];
  particles: Particle[];
  rings: Ring[];
  /** 0..1 flashes. */
  paddleFlash: number;
  lifeFlash: number;
  clearFlash: number;
  unlockFlash: number;
  orderFlash: number;
  wallFlash: { left: number; right: number; top: number };
  /** Per-piece pulses, keyed by zone / obstacle id. */
  zonePulse: Map<number, number>;
  obstaclePulse: Map<number, number>;
  /** Screen shake amplitude in world units. */
  shake: number;
  /** World point a human serve will fly toward, or null. */
  aim: { x: number; y: number } | null;
}

export function createScene(): BreakoutScene {
  return {
    time: 0,
    trail: [],
    particles: [],
    rings: [],
    paddleFlash: 0,
    lifeFlash: 0,
    clearFlash: 0,
    unlockFlash: 0,
    orderFlash: 0,
    wallFlash: { left: 0, right: 0, top: 0 },
    zonePulse: new Map(),
    obstaclePulse: new Map(),
    shake: 0,
    aim: null,
  };
}

const TRAIL_AGE = 0.14;

export class SceneFx {
  private readonly rng: Rng = createRng(4242);

  constructor(readonly scene: BreakoutScene) {}

  /** Advance decays and particles. */
  update(dt: number, balls: { id: number; x: number; y: number }[]): void {
    const s = this.scene;
    s.time += dt;

    for (const b of balls) s.trail.push({ x: b.x, y: b.y, t: s.time, id: b.id });
    while (s.trail.length > 0 && s.time - s.trail[0].t > TRAIL_AGE) {
      s.trail.shift();
    }

    const k = (tau: number) => Math.exp(-dt / tau);
    s.paddleFlash *= k(0.16);
    s.lifeFlash *= k(0.5);
    s.clearFlash *= k(1.2);
    s.unlockFlash *= k(0.9);
    s.orderFlash *= k(0.9);
    s.wallFlash.left *= k(0.16);
    s.wallFlash.right *= k(0.16);
    s.wallFlash.top *= k(0.16);
    s.shake *= k(0.12);
    decayMap(s.zonePulse, k(0.35));
    decayMap(s.obstaclePulse, k(0.25));

    for (let i = s.particles.length - 1; i >= 0; i--) {
      const q = s.particles[i];
      q.life -= dt;
      if (q.life <= 0) {
        s.particles[i] = s.particles[s.particles.length - 1];
        s.particles.pop();
        continue;
      }
      q.vy += (q.kind === "shard" ? 900 : q.kind === "spark" ? 300 : 0) * dt;
      q.vx *= 1 - 1.2 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    if (s.particles.length > 260) s.particles.splice(0, s.particles.length - 260);

    for (let i = s.rings.length - 1; i >= 0; i--) {
      s.rings[i].life -= dt;
      if (s.rings[i].life <= 0) s.rings.splice(i, 1);
    }
  }

  /** Turn a game event into visuals. */
  apply(event: GameEvent): void {
    const s = this.scene;
    switch (event.type) {
      case "paddle":
        s.paddleFlash = 1;
        this.ring(event.x, event.y, 4, event.caught ? 16 : 26, 0.35, "white");
        break;
      case "wall":
        s.wallFlash[event.side] = 1;
        this.sparks(event.x, event.y, 3, "white");
        break;
      case "brick": {
        const { brick } = event;
        if (event.broken) {
          this.shards(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.w, brick.h, brick.color);
          this.ring(event.x, event.y, 2, 22, 0.3, brick.color);
          s.shake = Math.max(s.shake, 1.2);
        } else {
          this.sparks(event.x, event.y, 5, brick.kind === "steel" || brick.kind === "lock" ? "steel" : brick.color);
        }
        break;
      }
      case "explode":
        this.ring(event.x, event.y, 6, 70, 0.55, event.color, 3);
        this.ring(event.x, event.y, 2, 40, 0.4, "white", 1.5);
        this.sparks(event.x, event.y, 18, event.color, 320);
        s.shake = Math.max(s.shake, 5);
        break;
      case "regen":
        this.ring(event.brick.x + event.brick.w / 2, event.brick.y + event.brick.h / 2, 4, 24, 0.4, "lime");
        break;
      case "unlock":
        s.unlockFlash = 1;
        break;
      case "orderDone":
        s.orderFlash = 1;
        break;
      case "zone":
        s.zonePulse.set(event.zone.id, 1);
        this.ring(event.zone.x, event.zone.y, event.zone.r, event.zone.r * 2.6, 0.5, "white");
        break;
      case "teleport":
        s.zonePulse.set(event.to.id, 1);
        this.ring(event.to.x, event.to.y, 2, event.to.r * 2.2, 0.45, "blue");
        this.sparks(event.from.x, event.from.y, 8, "blue");
        break;
      case "split":
        this.ring(event.x, event.y, 4, 34, 0.45, "pink", 2);
        this.sparks(event.x, event.y, 10, "pink");
        break;
      case "obstacle":
        s.obstaclePulse.set(event.obstacle.id, 1);
        if (event.obstacle.kind === "bumper") {
          this.ring(event.x, event.y, 3, 30, 0.35, "amber", 2);
          this.sparks(event.x, event.y, 7, "amber");
        } else if (event.obstacle.kind === "trampoline") {
          this.sparks(event.x, event.y, 6, "lime");
        } else if (event.obstacle.kind === "guard") {
          this.sparks(event.x, event.y, 4, "steel");
        }
        break;
      case "swallow":
        this.ring(event.x, event.y, 30, 2, 0.5, "violet", 2);
        this.dust(event.x, event.y, 14, "violet");
        s.shake = Math.max(s.shake, 3);
        break;
      case "descend":
        s.shake = Math.max(s.shake, 3);
        break;
      case "life":
        s.lifeFlash = 1;
        s.shake = Math.max(s.shake, 4);
        s.trail.length = 0;
        break;
      case "cleared":
        s.clearFlash = 1;
        break;
      case "launch":
        s.trail.length = 0;
        break;
      default:
        break;
    }
  }

  private ring(x: number, y: number, r0: number, r1: number, life: number, color: FxColor, width = 1.5): void {
    this.scene.rings.push({ x, y, r0, r1, life, maxLife: life, color, width });
  }

  private sparks(x: number, y: number, count: number, color: FxColor, speed = 220): void {
    for (let i = 0; i < count; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(speed * 0.3, speed);
      this.scene.particles.push({
        kind: "spark",
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.3,
        maxLife: 0.3,
        size: this.rng.range(0.8, 1.6),
        spin: 0,
        color,
      });
    }
  }

  /** Slow motes pulled toward a point (black hole). */
  private dust(x: number, y: number, count: number, color: FxColor): void {
    for (let i = 0; i < count; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const d = this.rng.range(14, 34);
      this.scene.particles.push({
        kind: "dust",
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d,
        vx: -Math.cos(a) * d * 2.2,
        vy: -Math.sin(a) * d * 2.2,
        life: 0.45,
        maxLife: 0.45,
        size: this.rng.range(0.8, 1.8),
        spin: 0,
        color,
      });
    }
  }

  private shards(cx: number, cy: number, w: number, h: number, color: BrickColor): void {
    const count = 9;
    for (let i = 0; i < count; i++) {
      const x = cx + this.rng.range(-w / 2, w / 2);
      const y = cy + this.rng.range(-h / 2, h / 2);
      this.scene.particles.push({
        kind: "shard",
        x,
        y,
        vx: (x - cx) * 6 + this.rng.range(-60, 60),
        vy: (y - cy) * 6 + this.rng.range(-160, -40),
        life: this.rng.range(0.45, 0.8),
        maxLife: 0.8,
        size: this.rng.range(2.2, 4.5),
        spin: this.rng.range(-8, 8),
        color,
      });
    }
    this.sparks(cx, cy, 6, color);
  }
}

function decayMap(map: Map<number, number>, k: number): void {
  for (const [id, v] of map) {
    const next = v * k;
    if (next < 0.01) map.delete(id);
    else map.set(id, next);
  }
}

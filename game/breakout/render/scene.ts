/**
 * Visual state layered on top of the game state: trails, flashes, particles.
 * Owned by whoever drives the loop; the renderer only reads it.
 */
import type { BrickColor, GameEvent } from "../engine/types";
import { createRng, type Rng } from "../../shared/random";

export interface Particle {
  kind: "shard" | "spark";
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  spin: number;
  color: BrickColor | "white";
}

export interface Ring {
  x: number;
  y: number;
  r0: number;
  r1: number;
  life: number;
  maxLife: number;
  color: BrickColor | "white";
}

export interface BreakoutScene {
  time: number;
  trail: { x: number; y: number; t: number }[];
  particles: Particle[];
  rings: Ring[];
  /** 0..1 flashes. */
  paddleFlash: number;
  lifeFlash: number;
  clearFlash: number;
  wallFlash: { left: number; right: number; top: number };
  /** Per-bonus pulse, keyed by bonus id. */
  bonusPulse: Map<number, number>;
  /** Screen shake amplitude in world units. */
  shake: number;
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
    wallFlash: { left: 0, right: 0, top: 0 },
    bonusPulse: new Map(),
    shake: 0,
  };
}

const TRAIL_AGE = 0.14;

export class SceneFx {
  private readonly rng: Rng = createRng(4242);

  constructor(readonly scene: BreakoutScene) {}

  /** Advance decays and particles. */
  update(dt: number, ball: { x: number; y: number } | null): void {
    const s = this.scene;
    s.time += dt;

    if (ball) {
      s.trail.push({ x: ball.x, y: ball.y, t: s.time });
    }
    while (s.trail.length > 0 && s.time - s.trail[0].t > TRAIL_AGE) {
      s.trail.shift();
    }

    const k = (tau: number) => Math.exp(-dt / tau);
    s.paddleFlash *= k(0.16);
    s.lifeFlash *= k(0.5);
    s.clearFlash *= k(1.2);
    s.wallFlash.left *= k(0.16);
    s.wallFlash.right *= k(0.16);
    s.wallFlash.top *= k(0.16);
    s.shake *= k(0.12);
    for (const [id, v] of s.bonusPulse) {
      const next = v * k(0.35);
      if (next < 0.01) s.bonusPulse.delete(id);
      else s.bonusPulse.set(id, next);
    }

    for (let i = s.particles.length - 1; i >= 0; i--) {
      const q = s.particles[i];
      q.life -= dt;
      if (q.life <= 0) {
        s.particles[i] = s.particles[s.particles.length - 1];
        s.particles.pop();
        continue;
      }
      q.vy += (q.kind === "shard" ? 900 : 300) * dt;
      q.vx *= 1 - 1.2 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    if (s.particles.length > 220) s.particles.splice(0, s.particles.length - 220);

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
        this.ring(event.x, event.y, 4, 26, 0.35, "white");
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
          this.sparks(event.x, event.y, 5, brick.kind === "steel" ? "white" : brick.color);
        }
        break;
      }
      case "bonus":
        s.bonusPulse.set(event.bonus.id, 1);
        this.ring(event.bonus.x, event.bonus.y, event.bonus.r, event.bonus.r * 2.6, 0.5, "white");
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

  private ring(x: number, y: number, r0: number, r1: number, life: number, color: Ring["color"]): void {
    this.scene.rings.push({ x, y, r0, r1, life, maxLife: life, color });
  }

  private sparks(x: number, y: number, count: number, color: Particle["color"]): void {
    for (let i = 0; i < count; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(60, 220);
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

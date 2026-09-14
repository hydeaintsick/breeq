/**
 * Route scenery — what Kal passes on the way home.
 *
 * One set piece per zone, from the lore: the Grey Moon under its ringed blue
 * giant; the asteroid belt, the dead relay and the wormhole; the Lanterns'
 * gate under twin suns with a comet riding by; Vitra dark under its glass
 * dome, minded by Keepers; the reef planet lit from below with light-seeds
 * rising; the burned-out star and its embers; the wrecks, the eye of the Hush
 * and the Ember Fleet holding the line; Aurel's young sun, its flares and the
 * half-built dome. On top of that, visitors that belong to no zone: a saucer
 * that crosses the sky every so often, and shooting stars.
 *
 * Everything is seeded and cheap: spheres, suns and rings are cached sprites,
 * ships and particles are a handful of path ops. Props sit on their own
 * parallax so the sky has depth when the route is pulled.
 */
import type { NeonPalette } from "../breakout/render/palette";
import { alpha, shade, tint } from "../shared/color";
import { createRng, type Rng } from "../shared/random";
import type { JourneyHue, JourneyNode } from "./model";

const TAU = Math.PI * 2;

type Ctx = CanvasRenderingContext2D;
type SpriteFn = (key: string, w: number, h: number, paint: (ctx: Ctx) => void) => HTMLCanvasElement;

/** The renderer's frame, enough to place a prop relative to a node. */
export interface SceneFrame {
  w: number;
  h: number;
  cam: number;
  spacing: number;
  midline: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  drift: number;
}

interface Ship {
  x: number;
  y: number;
  size: number;
  phase: number;
}

interface Rock {
  x: number;
  y: number;
  size: number;
  shape: number;
  vx: number;
  spin: number;
  angle: number;
}

interface Cast {
  particles: Particle[];
  ships: Ship[];
  rocks: Rock[];
}

/** Saucer schedule: one crossing this often, lasting this long, seconds. */
const SAUCER_EVERY = 46;
const SAUCER_FLIGHT = 11;
/** Shooting stars. */
const STREAK_EVERY = 6.5;
const STREAK_LIFE = 0.7;

/** Sprite keys that scale with the stage; the renderer drops them on resize. */
export const SCENE_SIZED_PREFIX = "scene:";

/**
 * The Wall-walker: a gecko drawn in stars, seen from above, head to the right,
 * in a 2 × 1 box centred on the origin. Joints are the bright stars.
 */
export const GECKO_STARS: readonly (readonly [number, number])[] = [
  [0.96, 0], // 0 snout
  [0.8, -0.13], // 1 left eye
  [0.8, 0.13], // 2 right eye
  [0.66, 0], // 3 neck
  [0.42, 0], // 4 shoulders
  [0.14, 0], // 5 mid-back
  [-0.14, 0], // 6 hips
  [0.56, -0.28], // 7 front-left knee
  [0.7, -0.44], // 8 front-left toes
  [0.56, 0.28], // 9 front-right knee
  [0.7, 0.44], // 10 front-right toes
  [-0.26, -0.28], // 11 back-left knee
  [-0.36, -0.44], // 12 back-left toes
  [-0.26, 0.28], // 13 back-right knee
  [-0.36, 0.44], // 14 back-right toes
  [-0.4, 0.03], // 15 tail root
  [-0.62, 0.1], // 16 tail
  [-0.8, 0.22], // 17 tail
  [-0.9, 0.38], // 18 tail curl
  [-0.8, 0.49], // 19 tail curl
  [-0.66, 0.44], // 20 tail tip
];
export const GECKO_LINES: readonly (readonly number[])[] = [
  [0, 1, 3, 2, 0],
  [3, 4, 5, 6, 15, 16, 17, 18, 19, 20],
  [4, 7, 8],
  [4, 9, 10],
  [6, 11, 12],
  [6, 13, 14],
];
export const GECKO_MAJOR: ReadonlySet<number> = new Set([0, 3, 4, 6, 8, 10, 12, 14, 20]);

export class Scenery {
  private readonly casts = new Map<number, Cast>();
  private readonly saucerRng = createRng(0x0f0);

  constructor(
    private readonly palette: NeonPalette,
    private readonly sprite: SpriteFn,
  ) {}

  private hue(h: JourneyHue): string {
    return h === "steel" ? this.palette.steel : this.palette.neon[h];
  }

  /**
   * The size everything around a zone is measured in: the stage height, but
   * never much more than the node spacing, so a tall phone gets props in
   * proportion to the route rather than to its screen.
   */
  private unit(f: SceneFrame): number {
    // Set pieces scale with the stage but never past its short side: a phone
    // gets a planet that fills a corner, not the whole sky.
    return Math.min(f.h, f.w, f.spacing * 1.5) * 0.8;
  }

  /** Screen point for a prop at `par` parallax, `ox` spacings and `oy` units from its node. */
  private at(node: JourneyNode, f: SceneFrame, par: number, ox: number, oy: number): { x: number; y: number } {
    return {
      x: f.w / 2 + (node.x - f.cam * f.spacing) * par + ox * f.spacing,
      y: f.h * f.midline + node.y * par + oy * this.unit(f),
    };
  }

  private cast(node: JourneyNode, build: (rng: Rng) => Cast): Cast {
    let cast = this.casts.get(node.index);
    if (cast) return cast;
    cast = build(createRng(0x5ce0 + node.index * 977));
    this.casts.set(node.index, cast);
    return cast;
  }

  // ---------------------------------------------------------------------------
  // Per zone
  // ---------------------------------------------------------------------------

  /** Behind the route and the medallion. `k` is 0 shrouded … 1 open. */
  back(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number, k: number): void {
    const scene = node.scene ?? "moon";
    const a = 0.3 + 0.7 * k;
    ctx.save();
    ctx.globalAlpha = a;
    switch (scene) {
      case "drill":
        this.drillBack(ctx, node, f, t);
        break;
      case "moon":
        this.moonBack(ctx, node, f);
        break;
      case "orbit":
        this.orbitBack(ctx, node, f, t);
        break;
      case "gate":
        this.gateBack(ctx, node, f, t);
        break;
      case "city":
        this.cityBack(ctx, node, f, t);
        break;
      case "reef":
        this.reefBack(ctx, node, f, t);
        break;
      case "embers":
        this.embersBack(ctx, node, f);
        break;
      case "fleet":
        this.fleetBack(ctx, node, f, t);
        break;
      case "sun":
        this.sunBack(ctx, node, f, t);
        break;
      case "canopy":
        this.canopyBack(ctx, node, f, t);
        break;
      case "lab":
        this.labBack(ctx, node, f, t);
        break;
      case "tower":
        this.towerBack(ctx, node, f, t);
        break;
      case "roots":
        this.rootsBack(ctx, node, f, t);
        break;
      case "constellation":
        this.constellationBack(ctx, node, f, t);
        break;
      case "garden":
        this.gardenBack(ctx, node, f, t);
        break;
    }
    ctx.restore();
  }

  /** In front of the medallion: ships, drones, embers, seeds. */
  front(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number, k: number): void {
    const scene = node.scene ?? "moon";
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.75 * k;
    switch (scene) {
      case "drill":
        this.beacon(ctx, node, f, t);
        break;
      case "moon":
        break;
      case "orbit":
        this.relay(ctx, node, f, t);
        break;
      case "gate":
        this.sentinels(ctx, node, f, t);
        break;
      case "city":
        this.keepers(ctx, node, f, t);
        break;
      case "reef":
        this.seeds(ctx, node, f, t);
        break;
      case "embers":
        this.embers(ctx, node, f, t);
        break;
      case "fleet":
        this.emberFleet(ctx, node, f, t);
        break;
      case "sun":
        this.landers(ctx, node, f, t);
        break;
      case "canopy":
        this.fireflies(ctx, node, f, t);
        break;
      case "lab":
        this.bubbles(ctx, node, f, t);
        break;
      case "tower":
        this.shards(ctx, node, f, t);
        break;
      case "roots":
        this.sapMotes(ctx, node, f, t);
        break;
      case "constellation":
        break;
      case "garden":
        this.pollen(ctx, node, f, t);
        break;
    }
    ctx.restore();
  }

  // --- drill: the training ground ------------------------------------------

  private drillBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const p = this.at(node, f, 1, 0, 0);
    ctx.strokeStyle = alpha(this.palette.steel, 0.1);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 10]);
    for (let i = 1; i <= 3; i++) {
      ctx.lineDashOffset = t * (i % 2 ? 6 : -6);
      ctx.beginPath();
      ctx.arc(p.x, p.y, f.spacing * (0.22 + i * 0.11), 0, TAU);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }

  private beacon(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const p = this.at(node, f, 1.15, 0.34, -0.2 + Math.sin(t * 0.4) * 0.008);
    this.satellite(ctx, p.x, p.y, 10, t * 0.15, this.palette.steel);
    const blink = (Math.sin(t * 3) + 1) / 2;
    ctx.fillStyle = alpha(this.palette.neon.cyan, 0.25 + 0.75 * (blink > 0.85 ? 1 : 0));
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8, 1.6, 0, TAU);
    ctx.fill();
  }

  // --- moon: the Grey Moon under a ringed blue giant -----------------------

  private moonBack(ctx: Ctx, node: JourneyNode, f: SceneFrame): void {
    const giantR = Math.round(this.unit(f) * 0.28);
    const g = this.at(node, f, 0.34, 0.46, -0.58);
    ctx.drawImage(this.giantSprite(giantR), g.x - giantR * 1.7, g.y - giantR * 1.1, giantR * 3.4, giantR * 2.2);
    const moonR = Math.round(this.unit(f) * 0.1);
    const m = this.at(node, f, 0.6, -0.4, 0.46);
    ctx.drawImage(this.moonSprite(moonR), m.x - moonR - 4, m.y - moonR - 4, moonR * 2 + 8, moonR * 2 + 8);
  }

  private giantSprite(R: number): HTMLCanvasElement {
    const W = Math.round(R * 3.4);
    const H = Math.round(R * 2.2);
    const blue = this.palette.neon.blue;
    return this.sprite(`scene:giant|${R}`, W, H, (c) => {
      const cx = W / 2;
      const cy = H / 2;
      const ring = (front: boolean) => {
        c.save();
        c.translate(cx, cy);
        c.rotate(-0.22);
        c.beginPath();
        c.ellipse(0, 0, R * 1.62, R * 0.36, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
        c.strokeStyle = alpha(blue, 0.22);
        c.lineWidth = R * 0.22;
        c.stroke();
        c.beginPath();
        c.ellipse(0, 0, R * 1.36, R * 0.3, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
        c.strokeStyle = "rgba(201, 210, 227, 0.16)";
        c.lineWidth = R * 0.08;
        c.stroke();
        c.restore();
      };
      ring(false);
      const body = c.createRadialGradient(cx - R * 0.45, cy - R * 0.5, R * 0.1, cx, cy, R);
      body.addColorStop(0, tint(blue, 0.15));
      body.addColorStop(0.55, shade(blue, 0.5));
      body.addColorStop(1, "#05060c");
      c.fillStyle = body;
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.fill();
      // Bands.
      c.save();
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.clip();
      for (let i = -3; i <= 3; i++) {
        c.fillStyle = `rgba(255, 255, 255, ${i % 2 ? 0.05 : 0.02})`;
        c.fillRect(0, cy + i * R * 0.24 - R * 0.06, W, R * 0.12);
      }
      c.restore();
      ring(true);
    });
  }

  private moonSprite(R: number): HTMLCanvasElement {
    const S = R * 2 + 8;
    return this.sprite(`scene:moon|${R}`, S, S, (c) => {
      const cx = S / 2;
      const cy = S / 2;
      const body = c.createRadialGradient(cx + R * 0.4, cy - R * 0.4, R * 0.15, cx, cy, R);
      body.addColorStop(0, "#8e96a8");
      body.addColorStop(0.6, "#4a5063");
      body.addColorStop(1, "#141826");
      c.fillStyle = body;
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.fill();
      const rng = createRng(0x300);
      c.save();
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.clip();
      for (let i = 0; i < 9; i++) {
        const a = rng.range(0, TAU);
        const d = rng.range(0, R * 0.8);
        const r = rng.range(R * 0.06, R * 0.18);
        const x = cx + Math.cos(a) * d;
        const y = cy + Math.sin(a) * d;
        c.fillStyle = "rgba(0, 0, 0, 0.28)";
        c.beginPath();
        c.arc(x, y, r, 0, TAU);
        c.fill();
        c.strokeStyle = "rgba(255, 255, 255, 0.08)";
        c.lineWidth = 1;
        c.beginPath();
        c.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9);
        c.stroke();
      }
      c.restore();
    });
  }

  // --- orbit: the belt, the relay, the wormhole ----------------------------

  private orbitBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const cast = this.cast(node, (rng) => ({
      particles: [],
      ships: [],
      rocks: Array.from({ length: 16 }, () => ({
        x: rng.range(-0.7, 0.7),
        y: rng.range(-0.05, 0.05),
        size: rng.range(2, 7),
        shape: rng.int(0, 3),
        vx: rng.range(0.004, 0.011),
        spin: rng.range(-0.6, 0.6),
        angle: rng.range(0, TAU),
      })),
    }));
    // A wavy belt across the zone.
    const hue = this.hue(node.hue);
    for (const r of cast.rocks) {
      const nx = wrap(r.x + r.vx * t, -0.7, 0.7);
      const p = this.at(node, f, 0.8, nx, -0.3 + r.y + Math.sin(nx * 5) * 0.03);
      if (p.x < -20 || p.x > f.w + 20) continue;
      const s = r.size * 2.4;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(r.angle + r.spin * t);
      ctx.drawImage(this.rockSprite(r.shape, hue), -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    // The wormhole.
    const wr = Math.round(this.unit(f) * 0.07);
    const wp = this.at(node, f, 0.5, 0.42, -0.02);
    ctx.drawImage(this.wormholeSprite(wr), wp.x - wr * 1.5, wp.y - wr * 1.5, wr * 3, wr * 3);
    ctx.save();
    ctx.translate(wp.x, wp.y);
    ctx.rotate(-t * 0.6);
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = alpha(this.palette.neon.cyan, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, wr * 0.72, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  private wormholeSprite(R: number): HTMLCanvasElement {
    const S = R * 3;
    const cyan = this.palette.neon.cyan;
    return this.sprite(`scene:wormhole|${R}`, S, S, (c) => {
      const cx = S / 2;
      const cy = S / 2;
      const halo = c.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.5);
      halo.addColorStop(0, alpha(cyan, 0.35));
      halo.addColorStop(0.4, alpha(cyan, 0.1));
      halo.addColorStop(1, alpha(cyan, 0));
      c.fillStyle = halo;
      c.fillRect(0, 0, S, S);
      c.strokeStyle = tint(cyan, 0.4);
      c.lineWidth = R * 0.12;
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.stroke();
      const eye = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
      eye.addColorStop(0, "#000000");
      eye.addColorStop(0.7, "#02030a");
      eye.addColorStop(1, alpha(cyan, 0.25));
      c.fillStyle = eye;
      c.beginPath();
      c.arc(cx, cy, R * 0.9, 0, TAU);
      c.fill();
    });
  }

  private relay(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const p = this.at(node, f, 1.1, -0.36, -0.18 + Math.sin(t * 0.3) * 0.01);
    this.satellite(ctx, p.x, p.y, 13, 0.6 + t * 0.05, this.palette.steel);
  }

  // --- gate: twin suns, a comet, the Sentinels -----------------------------

  private gateBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const sr = Math.round(this.unit(f) * 0.045);
    const s1 = this.at(node, f, 0.22, 0.3, 0.42);
    const s2 = this.at(node, f, 0.22, 0.38, 0.45);
    const sun = this.sunSprite(sr, this.palette.neon.amber);
    const sun2 = this.sunSprite(sr, "#ffffff");
    ctx.drawImage(sun, s1.x - sr * 3, s1.y - sr * 3, sr * 6, sr * 6);
    ctx.drawImage(sun2, s2.x - sr * 2.4, s2.y - sr * 2.4, sr * 4.8, sr * 4.8);
    // The comet: a slow diagonal pass over the zone every 40 s.
    const u = ((t * 0.025 + node.index * 0.37) % 1 + 1) % 1;
    const c = this.at(node, f, 0.7, -0.6 + u * 1.3, 0.3 - u * 0.62);
    const len = f.spacing * 0.42;
    const dir = Math.atan2(-0.62 * f.h, 1.3 * f.spacing);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(dir);
    const g = ctx.createLinearGradient(0, 0, -len, 0);
    g.addColorStop(0, "rgba(255, 255, 255, 0.55)");
    g.addColorStop(0.3, alpha(this.palette.neon.cyan, 0.2));
    g.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(-len, -len * 0.12);
    ctx.lineTo(-len, len * 0.12);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  private sentinels(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const hue = this.palette.neon.blue;
    for (let i = 0; i < 5; i++) {
      const row = Math.abs(i - 2);
      const p = this.at(node, f, 1.15, 0.3 + row * 0.055, -0.27 + (i - 2) * 0.05 + Math.sin(t * 0.9 + i) * 0.006);
      this.ship(ctx, p.x, p.y, 9, Math.PI, hue, 0.8);
    }
  }

  // --- city: Vitra dark under its dome, the Keepers ------------------------

  private cityBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const R = Math.round(this.unit(f) * 0.3);
    const p = this.at(node, f, 0.55, 0.22, -0.55);
    const lit = node.state === "cleared";
    ctx.drawImage(this.vitraSprite(R, lit), p.x - R * 1.2, p.y - R * 1.2, R * 2.4, R * 2.4);
    // The dome's specular glint drifts.
    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.18 + 0.1 * Math.sin(t * 0.5)).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, R * 1.08, -Math.PI * 0.72, -Math.PI * 0.58);
    ctx.stroke();
  }

  private vitraSprite(R: number, lit: boolean): HTMLCanvasElement {
    const S = Math.round(R * 2.4);
    const violet = this.palette.neon.violet;
    return this.sprite(`scene:vitra|${R}|${lit ? "lit" : "dark"}`, S, S, (c) => {
      const cx = S / 2;
      const cy = S / 2;
      // The dome: a glass shell a little wider than the world.
      const dome = c.createRadialGradient(cx, cy, R, cx, cy, R * 1.1);
      dome.addColorStop(0, alpha(violet, 0.14));
      dome.addColorStop(1, alpha(violet, 0));
      c.fillStyle = dome;
      c.beginPath();
      c.arc(cx, cy, R * 1.1, 0, TAU);
      c.fill();
      c.strokeStyle = "rgba(255, 255, 255, 0.16)";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(cx, cy, R * 1.08, 0, TAU);
      c.stroke();
      // The world, dark.
      const body = c.createRadialGradient(cx - R * 0.3, cy - R * 0.5, R * 0.1, cx, cy, R);
      body.addColorStop(0, "#1c1f33");
      body.addColorStop(0.7, "#0a0c18");
      body.addColorStop(1, "#04050a");
      c.fillStyle = body;
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.fill();
      // A skyline on the upper face, a few windows lit — many once the Keepers turn the lights on.
      c.save();
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.clip();
      const rng = createRng(0xc17);
      const baseY = cy - R * 0.1;
      for (let i = 0; i < 18; i++) {
        const x = cx - R * 0.85 + i * (R * 0.095);
        const h = R * rng.range(0.12, 0.42);
        const w = R * 0.07;
        c.fillStyle = "#070812";
        c.fillRect(x, baseY - h, w, h + R);
        const windows = lit ? rng.int(2, 5) : rng.chance(0.2) ? 1 : 0;
        for (let k = 0; k < windows; k++) {
          c.fillStyle = alpha(lit ? this.palette.neon.amber : violet, lit ? 0.85 : 0.5);
          c.fillRect(x + w * 0.3, baseY - h + rng.range(0.1, 0.9) * h, w * 0.4, 1.4);
        }
      }
      c.restore();
      c.strokeStyle = alpha(violet, 0.45);
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(cx, cy, R, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
    });
  }

  private keepers(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const violet = this.palette.neon.violet;
    for (let i = 0; i < 3; i++) {
      const a = t * 0.25 + (i / 3) * TAU;
      const p = this.at(node, f, 1.2, 0.3 + Math.cos(a) * 0.09, -0.16 + Math.sin(a) * 0.05);
      ctx.fillStyle = "#1b2033";
      ctx.strokeStyle = alpha(this.palette.steel, 0.5);
      ctx.lineWidth = 1;
      roundRect(ctx, p.x - 5, p.y - 3.5, 10, 7, 2.5);
      ctx.fill();
      ctx.stroke();
      const on = Math.sin(t * 2.4 + i * 2.1) > 0.6;
      ctx.fillStyle = alpha(violet, on ? 1 : 0.3);
      ctx.beginPath();
      ctx.arc(p.x + 2.5, p.y, 1.2, 0, TAU);
      ctx.fill();
    }
  }

  // --- reef: an ocean lit from below, light-seeds --------------------------

  private reefBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const R = Math.round(this.unit(f) * 0.34);
    const p = this.at(node, f, 0.4, -0.34, 0.56);
    ctx.drawImage(this.reefSprite(R), p.x - R * 1.4, p.y - R * 1.4, R * 2.8, R * 2.8);
    // Bioluminescent shimmer along the limb.
    const lime = this.palette.neon.lime;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.9 + (i / 6) * Math.PI * 0.8;
      const k = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 1.7);
      ctx.fillStyle = alpha(lime, 0.15 + 0.5 * k);
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * R * 0.98, p.y + Math.sin(a) * R * 0.98, 1.2 + k, 0, TAU);
      ctx.fill();
    }
  }

  private reefSprite(R: number): HTMLCanvasElement {
    const S = Math.round(R * 2.8);
    const lime = this.palette.neon.lime;
    const cyan = this.palette.neon.cyan;
    return this.sprite(`scene:reef|${R}`, S, S, (c) => {
      const cx = S / 2;
      const cy = S / 2;
      const glow = c.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.4);
      glow.addColorStop(0, alpha(lime, 0.22));
      glow.addColorStop(1, alpha(lime, 0));
      c.fillStyle = glow;
      c.fillRect(0, 0, S, S);
      const body = c.createRadialGradient(cx, cy + R * 0.9, R * 0.1, cx, cy, R);
      body.addColorStop(0, tint(cyan, 0.2));
      body.addColorStop(0.4, shade(cyan, 0.45));
      body.addColorStop(1, "#04070c");
      c.fillStyle = body;
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.fill();
      // Reef veins glowing through the shallows.
      c.save();
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.clip();
      const rng = createRng(0x2eef);
      c.strokeStyle = alpha(lime, 0.35);
      c.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        const x = cx + rng.range(-R, R);
        const y = cy + rng.range(-R * 0.6, R * 0.2);
        c.beginPath();
        c.moveTo(x, y);
        c.bezierCurveTo(x + rng.range(-20, 20), y - 10, x + rng.range(-20, 20), y - 20, x + rng.range(-10, 10), y - R * 0.3);
        c.stroke();
      }
      c.restore();
      c.strokeStyle = alpha(lime, 0.6);
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(cx, cy, R, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
    });
  }

  private seeds(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const cast = this.cast(node, (rng) => ({
      particles: Array.from({ length: 16 }, () => ({
        x: rng.range(-0.5, 0.5),
        y: rng.range(0, 1),
        size: rng.range(1, 2.4),
        speed: rng.range(0.02, 0.05),
        phase: rng.range(0, TAU),
        drift: rng.range(0.01, 0.03),
      })),
      ships: [],
      rocks: [],
    }));
    const lime = this.palette.neon.lime;
    for (const s of cast.particles) {
      const life = ((s.y - t * s.speed) % 1 + 1) % 1;
      const p = this.at(node, f, 0.9, s.x + Math.sin(t * 0.7 + s.phase) * s.drift, 0.36 - life * 0.7);
      if (p.x < -4 || p.x > f.w + 4) continue;
      ctx.fillStyle = alpha(lime, 0.85 * Math.sin(life * Math.PI));
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.size, 0, TAU);
      ctx.fill();
    }
  }

  // --- embers: the dead star, embers rising --------------------------------

  private embersBack(ctx: Ctx, node: JourneyNode, f: SceneFrame): void {
    const R = Math.round(this.unit(f) * 0.22);
    const p = this.at(node, f, 0.38, 0.45, -0.25);
    ctx.drawImage(this.cinderSprite(R), p.x - R * 1.5, p.y - R * 1.5, R * 3, R * 3);
  }

  private cinderSprite(R: number): HTMLCanvasElement {
    const S = R * 3;
    const amber = this.palette.neon.amber;
    return this.sprite(`scene:cinder|${R}`, S, S, (c) => {
      const cx = S / 2;
      const cy = S / 2;
      const heat = c.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.5);
      heat.addColorStop(0, alpha(amber, 0.16));
      heat.addColorStop(1, alpha(amber, 0));
      c.fillStyle = heat;
      c.fillRect(0, 0, S, S);
      const body = c.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
      body.addColorStop(0, "#0b0a0c");
      body.addColorStop(0.85, "#16110f");
      body.addColorStop(1, shade(amber, 0.5));
      c.fillStyle = body;
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.fill();
      // Cracks of heat.
      c.save();
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.clip();
      const rng = createRng(0xa5b);
      c.strokeStyle = alpha(amber, 0.55);
      c.lineWidth = 1;
      for (let i = 0; i < 9; i++) {
        let x = cx + rng.range(-R * 0.7, R * 0.7);
        let y = cy + rng.range(-R * 0.7, R * 0.7);
        c.beginPath();
        c.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += rng.range(-R * 0.25, R * 0.25);
          y += rng.range(-R * 0.25, R * 0.25);
          c.lineTo(x, y);
        }
        c.stroke();
      }
      c.restore();
    });
  }

  private embers(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const cast = this.cast(node, (rng) => ({
      particles: Array.from({ length: 22 }, () => ({
        x: rng.range(-0.55, 0.55),
        y: rng.range(0, 1),
        size: rng.range(0.8, 2),
        speed: rng.range(0.03, 0.07),
        phase: rng.range(0, TAU),
        drift: rng.range(0.015, 0.04),
      })),
      ships: [],
      rocks: [],
    }));
    const amber = this.palette.neon.amber;
    for (const s of cast.particles) {
      const life = ((s.y - t * s.speed) % 1 + 1) % 1;
      const flicker = 0.6 + 0.4 * Math.sin(t * 7 + s.phase);
      const p = this.at(node, f, 1, s.x + Math.sin(t * 0.9 + s.phase) * s.drift, 0.4 - life * 0.85);
      if (p.x < -4 || p.x > f.w + 4) continue;
      ctx.fillStyle = alpha(life < 0.5 ? tint(amber, 0.3) : amber, flicker * (1 - life) * 0.9);
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.size * (1 - life * 0.5), 0, TAU);
      ctx.fill();
    }
  }

  // --- fleet: wrecks, the eye, the Ember Fleet -----------------------------

  private fleetBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    // The eye of the Hush, far back.
    const R = Math.round(this.unit(f) * 0.09);
    const e = this.at(node, f, 0.3, -0.36, 0.4);
    ctx.drawImage(this.eyeSprite(R), e.x - R * 2, e.y - R * 2, R * 4, R * 4);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(t * 0.2);
    ctx.setLineDash([2, 9]);
    ctx.strokeStyle = alpha(this.palette.neon.pink, 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 1.7, R * 0.6, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
    // Wrecks drifting.
    const cast = this.cast(node, (rng) => ({
      particles: [],
      ships: [],
      rocks: Array.from({ length: 7 }, () => ({
        x: rng.range(-0.6, 0.6),
        y: rng.range(-0.3, 0.3),
        size: rng.range(6, 13),
        shape: rng.int(0, 3),
        vx: rng.range(-0.003, 0.003),
        spin: rng.range(-0.12, 0.12),
        angle: rng.range(0, TAU),
      })),
    }));
    for (const r of cast.rocks) {
      const p = this.at(node, f, 0.9, wrap(r.x + r.vx * t, -0.6, 0.6), r.y);
      if (p.x < -30 || p.x > f.w + 30) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(r.angle + r.spin * t);
      ctx.drawImage(this.wreckSprite(r.shape), -r.size * 1.6, -r.size * 0.6, r.size * 3.2, r.size * 1.2);
      ctx.restore();
    }
  }

  private eyeSprite(R: number): HTMLCanvasElement {
    const S = R * 4;
    const pink = this.palette.neon.pink;
    return this.sprite(`scene:eye|${R}`, S, S, (c) => {
      const cx = S / 2;
      const cy = S / 2;
      c.save();
      c.translate(cx, cy);
      const disk = c.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.9);
      disk.addColorStop(0, alpha(pink, 0.5));
      disk.addColorStop(0.35, alpha(pink, 0.12));
      disk.addColorStop(1, alpha(pink, 0));
      c.fillStyle = disk;
      c.beginPath();
      c.ellipse(0, 0, R * 1.9, R * 0.75, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = "#000000";
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.fill();
      c.strokeStyle = alpha(pink, 0.7);
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.stroke();
    });
  }

  private wreckSprite(shape: number): HTMLCanvasElement {
    return this.sprite(`wreck|${shape}`, 64, 24, (c) => {
      const rng = createRng(0x3ec + shape * 31);
      c.translate(32, 12);
      c.beginPath();
      c.moveTo(-30, rng.range(-3, 3));
      c.lineTo(-10, -10 * rng.range(0.5, 1));
      c.lineTo(14, -6 * rng.range(0.4, 1));
      c.lineTo(30, rng.range(-2, 2));
      c.lineTo(10, 9 * rng.range(0.5, 1));
      c.lineTo(-14, 7 * rng.range(0.4, 1));
      c.closePath();
      const body = c.createLinearGradient(-30, -10, 30, 10);
      body.addColorStop(0, "#2a3044");
      body.addColorStop(1, "#0b0d18");
      c.fillStyle = body;
      c.fill();
      c.strokeStyle = alpha(this.palette.steel, 0.4);
      c.lineWidth = 1;
      c.stroke();
    });
  }

  private emberFleet(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const amber = this.palette.neon.amber;
    for (let i = 0; i < 6; i++) {
      const p = this.at(node, f, 1.15, 0.22 + (i % 3) * 0.07, 0.12 + Math.floor(i / 3) * 0.07 + Math.sin(t * 0.8 + i * 0.9) * 0.005);
      this.ship(ctx, p.x, p.y, 11, Math.PI, amber, 0.95);
      const on = ((t * 2 + i * 0.35) % 2) < 0.12;
      if (on) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x - 6, p.y, 1.2, 0, TAU);
        ctx.fill();
      }
    }
  }

  // --- sun: Aurel's young sun, flares, the dome, ships landing -------------

  private sunBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const R = Math.round(this.unit(f) * 0.16);
    const s = this.at(node, f, 0.32, 0.5, -0.42);
    ctx.drawImage(this.sunSprite(R, this.palette.neon.amber), s.x - R * 3, s.y - R * 3, R * 6, R * 6);
    // Flares: three prominences that swell and fade in turn.
    const amber = this.palette.neon.amber;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const cycle = (t * 0.18 + i / 3) % 1;
      const k = Math.sin(cycle * Math.PI);
      const a0 = Math.PI * (0.55 + i * 0.32);
      const a1 = a0 + 0.55;
      const lift = R * (0.25 + 0.55 * k);
      const p0 = { x: s.x + Math.cos(a0) * R, y: s.y + Math.sin(a0) * R };
      const p1 = { x: s.x + Math.cos(a1) * R, y: s.y + Math.sin(a1) * R };
      const mid = (a0 + a1) / 2;
      const c = { x: s.x + Math.cos(mid) * (R + lift), y: s.y + Math.sin(mid) * (R + lift) };
      ctx.strokeStyle = alpha(tint(amber, 0.4), 0.7 * k);
      ctx.lineWidth = 1.5 + 2 * k;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(c.x, c.y, p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
    // Aurel and the half-built dome.
    const ar = Math.round(this.unit(f) * 0.15);
    const a = this.at(node, f, 0.55, -0.3, 0.5);
    ctx.drawImage(this.aurelSprite(ar), a.x - ar * 1.3, a.y - ar * 1.3, ar * 2.6, ar * 2.6);
  }

  private aurelSprite(R: number): HTMLCanvasElement {
    const S = Math.round(R * 2.6);
    const amber = this.palette.neon.amber;
    const lime = this.palette.neon.lime;
    return this.sprite(`scene:aurel|${R}`, S, S, (c) => {
      const cx = S / 2;
      const cy = S / 2;
      const body = c.createRadialGradient(cx + R * 0.5, cy - R * 0.5, R * 0.1, cx, cy, R);
      body.addColorStop(0, tint(amber, 0.5));
      body.addColorStop(0.5, shade(lime, 0.45));
      body.addColorStop(1, "#05060c");
      c.fillStyle = body;
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.fill();
      // Ribs of the dome going up, panes set on the right half.
      c.strokeStyle = alpha(this.palette.steel, 0.55);
      c.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        c.lineTo(cx + Math.cos(a) * R * 1.2, cy + Math.sin(a) * R * 1.2);
        c.stroke();
      }
      c.setLineDash([4, 5]);
      c.beginPath();
      c.arc(cx, cy, R * 1.2, Math.PI, Math.PI * 1.5);
      c.stroke();
      c.setLineDash([]);
      c.strokeStyle = alpha(amber, 0.7);
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(cx, cy, R * 1.2, Math.PI * 1.5, TAU);
      c.stroke();
      const glass = c.createRadialGradient(cx, cy, R, cx, cy, R * 1.2);
      glass.addColorStop(0, alpha(amber, 0.16));
      glass.addColorStop(1, alpha(amber, 0));
      c.fillStyle = glass;
      c.beginPath();
      c.arc(cx, cy, R * 1.2, Math.PI * 1.5, TAU);
      c.lineTo(cx, cy);
      c.closePath();
      c.fill();
    });
  }

  private landers(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const amber = this.palette.neon.amber;
    for (let i = 0; i < 3; i++) {
      const u = ((t * 0.05 + i / 3) % 1 + 1) % 1;
      const p = this.at(node, f, 1.1, -0.42 + u * 0.16 + i * 0.05, -0.4 + u * 0.68);
      ctx.strokeStyle = alpha(amber, 0.35 * (1 - u));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 8, p.y - 30);
      ctx.stroke();
      this.ship(ctx, p.x, p.y, 8, Math.PI * 0.62, amber, 0.9);
    }
  }


  // ---------------------------------------------------------------------------
  // Season 2 — The Borrowed Egg
  // ---------------------------------------------------------------------------

  // --- canopy: Vireo's jungle under a glass roof ----------------------------

  private canopyBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const lime = this.palette.neon.lime;
    const cyan = this.palette.neon.cyan;
    // The roof: an arc of panes high over the zone, cyan hairlines.
    const roof = this.at(node, f, 0.35, 0.1, -0.95);
    const R = this.unit(f) * 1.1;
    ctx.strokeStyle = alpha(cyan, 0.16);
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(roof.x, roof.y, R * (0.72 + i * 0.1), Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (1.12 + (i / 8) * 0.76);
      ctx.beginPath();
      ctx.moveTo(roof.x + Math.cos(a) * R * 0.72, roof.y + Math.sin(a) * R * 0.72);
      ctx.lineTo(roof.x + Math.cos(a) * R * 0.92, roof.y + Math.sin(a) * R * 0.92);
      ctx.stroke();
    }
    // Leaves: a cluster low on the left and a single frond high on the right.
    const L = Math.round(this.unit(f) * 0.42);
    const p = this.at(node, f, 0.55, -0.42, 0.5);
    const sway = Math.sin(t * 0.5 + node.index) * 0.02;
    ctx.drawImage(this.frondSprite(L, false), p.x - L * 0.2, p.y - L * 1.1, L * 1.6, L * 1.4);
    ctx.save();
    ctx.translate(p.x + L * 0.5, p.y - L * 0.2);
    ctx.rotate(0.6 + sway);
    ctx.drawImage(this.frondSprite(L, true), -L * 0.2, -L * 1.1, L * 1.6, L * 1.4);
    ctx.restore();
    const q = this.at(node, f, 0.7, 0.44, -0.3);
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(2.6 - sway);
    ctx.drawImage(this.frondSprite(Math.round(L * 0.7), false), -L * 0.14, -L * 0.77, L * 1.12, L * 0.98);
    ctx.restore();
    // A warm glow where the sap lights the undergrowth.
    const g = ctx.createRadialGradient(p.x, p.y + L * 0.2, 0, p.x, p.y + L * 0.2, L * 1.2);
    g.addColorStop(0, alpha(lime, 0.14));
    g.addColorStop(1, alpha(lime, 0));
    ctx.fillStyle = g;
    ctx.fillRect(p.x - L * 1.2, p.y - L, L * 2.4, L * 2.4);
  }

  /** A fern frond: a dark leaf with lime veins, drawn once per size. */
  private frondSprite(L: number, flipped: boolean): HTMLCanvasElement {
    const W = Math.round(L * 1.6);
    const H = Math.round(L * 1.4);
    const lime = this.palette.neon.lime;
    return this.sprite(`scene:frond|${L}|${flipped ? 1 : 0}`, W, H, (c) => {
      if (flipped) {
        c.translate(W, 0);
        c.scale(-1, 1);
      }
      const base = { x: L * 0.2, y: H };
      const tip = { x: W * 0.9, y: L * 0.1 };
      // Stem.
      c.strokeStyle = shade(lime, 0.35);
      c.lineWidth = Math.max(1.5, L * 0.03);
      c.beginPath();
      c.moveTo(base.x, base.y);
      c.quadraticCurveTo(W * 0.35, H * 0.35, tip.x, tip.y);
      c.stroke();
      // Leaflets along the stem.
      const n = 11;
      for (let i = 1; i < n; i++) {
        const u = i / n;
        const x = (1 - u) * (1 - u) * base.x + 2 * (1 - u) * u * W * 0.35 + u * u * tip.x;
        const y = (1 - u) * (1 - u) * base.y + 2 * (1 - u) * u * H * 0.35 + u * u * tip.y;
        const len = L * 0.42 * Math.sin(u * Math.PI) + L * 0.06;
        for (const side of [-1, 1]) {
          const ang = -0.9 + side * 1.1;
          const ex = x + Math.cos(ang) * len;
          const ey = y + Math.sin(ang) * len;
          c.fillStyle = side < 0 ? shade(lime, 0.68) : shade(lime, 0.58);
          c.beginPath();
          c.moveTo(x, y);
          c.quadraticCurveTo(x + Math.cos(ang - 0.5) * len * 0.7, y + Math.sin(ang - 0.5) * len * 0.7, ex, ey);
          c.quadraticCurveTo(x + Math.cos(ang + 0.5) * len * 0.7, y + Math.sin(ang + 0.5) * len * 0.7, x, y);
          c.fill();
          c.strokeStyle = alpha(lime, 0.35);
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(ex, ey);
          c.stroke();
        }
      }
    });
  }

  private fireflies(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const cast = this.cast(node, (rng) => ({
      particles: Array.from({ length: 18 }, () => ({
        x: rng.range(-0.55, 0.55),
        y: rng.range(-0.5, 0.6),
        size: rng.range(1, 2),
        speed: rng.range(0.4, 1.1),
        phase: rng.range(0, TAU),
        drift: rng.range(0.02, 0.05),
      })),
      ships: [],
      rocks: [],
    }));
    const lime = this.palette.neon.lime;
    for (const s of cast.particles) {
      const p = this.at(node, f, 1, s.x + Math.sin(t * 0.3 + s.phase) * s.drift, s.y + Math.cos(t * 0.23 + s.phase) * 0.04);
      if (p.x < -4 || p.x > f.w + 4) continue;
      // Kal's rhythm: a double pulse, then a rest.
      const beat = (t * s.speed + s.phase) % 3;
      const k = beat < 0.3 ? Math.sin((beat / 0.3) * Math.PI) : beat > 0.5 && beat < 0.8 ? Math.sin(((beat - 0.5) / 0.3) * Math.PI) : 0;
      if (k <= 0.02) continue;
      ctx.fillStyle = alpha(lime, 0.9 * k);
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.size + k, 0, TAU);
      ctx.fill();
      ctx.fillStyle = alpha(lime, 0.18 * k);
      ctx.beginPath();
      ctx.arc(p.x, p.y, (s.size + k) * 3, 0, TAU);
      ctx.fill();
    }
  }

  // --- lab: tanks in cold light ---------------------------------------------

  private labBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const cyan = this.palette.neon.cyan;
    const violet = this.palette.neon.violet;
    const H = Math.round(this.unit(f) * 0.5);
    const W = Math.round(H * 0.42);
    // Cold light bars along the ceiling.
    const bar = this.at(node, f, 0.35, -0.2, -0.92);
    ctx.fillStyle = alpha(cyan, 0.25);
    for (let i = 0; i < 3; i++) {
      const x = bar.x + i * f.spacing * 0.34;
      ctx.fillRect(x, bar.y, f.spacing * 0.22, 2);
      const g = ctx.createLinearGradient(0, bar.y, 0, bar.y + H * 0.9);
      g.addColorStop(0, alpha(cyan, 0.08));
      g.addColorStop(1, alpha(cyan, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, bar.y);
      ctx.lineTo(x + f.spacing * 0.22, bar.y);
      ctx.lineTo(x + f.spacing * 0.3, bar.y + H * 0.9);
      ctx.lineTo(x - f.spacing * 0.08, bar.y + H * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = alpha(cyan, 0.25);
    }
    // Three tanks low on the right, each with something half there inside.
    const base = this.at(node, f, 0.55, 0.16, 0.58);
    for (let i = 0; i < 3; i++) {
      const x = base.x + i * W * 1.5;
      const y = base.y - H;
      ctx.drawImage(this.tankSprite(W, H), x, y, W, H);
      // The specimen drifts.
      const bob = Math.sin(t * 0.6 + i * 2.1) * H * 0.03;
      ctx.save();
      ctx.translate(x + W / 2, y + H * 0.55 + bob);
      ctx.globalAlpha *= i === 1 ? 0.55 : 0.32;
      ctx.fillStyle = shade(violet, 0.3);
      ctx.beginPath();
      ctx.ellipse(0, 0, W * 0.16, H * 0.16, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = shade(violet, 0.3);
      ctx.lineWidth = Math.max(1.2, W * 0.05);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.14);
      ctx.quadraticCurveTo(W * 0.2, H * 0.3, -W * 0.05, H * 0.36);
      ctx.stroke();
      ctx.restore();
    }
  }

  private tankSprite(W: number, H: number): HTMLCanvasElement {
    const cyan = this.palette.neon.cyan;
    return this.sprite(`scene:tank|${W}|${H}`, W, H, (c) => {
      const r = W * 0.35;
      const fill = c.createLinearGradient(0, 0, W, 0);
      fill.addColorStop(0, alpha(cyan, 0.05));
      fill.addColorStop(0.3, alpha(cyan, 0.16));
      fill.addColorStop(0.6, alpha(cyan, 0.06));
      fill.addColorStop(1, alpha(cyan, 0.12));
      c.fillStyle = fill;
      c.beginPath();
      c.moveTo(0, r);
      c.arcTo(0, 0, r, 0, r);
      c.lineTo(W - r, 0);
      c.arcTo(W, 0, W, r, r);
      c.lineTo(W, H - r);
      c.arcTo(W, H, W - r, H, r);
      c.lineTo(r, H);
      c.arcTo(0, H, 0, H - r, r);
      c.closePath();
      c.fill();
      c.strokeStyle = alpha(cyan, 0.45);
      c.lineWidth = 1;
      c.stroke();
      // Water line and a base of steel.
      c.strokeStyle = alpha("#ffffff", 0.35);
      c.beginPath();
      c.moveTo(2, H * 0.12);
      c.lineTo(W - 2, H * 0.12);
      c.stroke();
      c.fillStyle = "rgba(201, 210, 227, 0.35)";
      c.fillRect(-1, H - Math.max(2, H * 0.05), W + 2, Math.max(2, H * 0.05));
    });
  }

  private bubbles(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const cast = this.cast(node, (rng) => ({
      particles: Array.from({ length: 14 }, () => ({
        x: rng.range(0.2, 0.42),
        y: rng.range(0, 1),
        size: rng.range(0.6, 1.4),
        speed: rng.range(0.05, 0.1),
        phase: rng.range(0, TAU),
        drift: rng.range(0.004, 0.01),
      })),
      ships: [],
      rocks: [],
    }));
    const cyan = this.palette.neon.cyan;
    const H = this.unit(f) * 0.5;
    for (const s of cast.particles) {
      const life = ((s.y - t * s.speed) % 1 + 1) % 1;
      const p = this.at(node, f, 0.55, s.x + Math.sin(t * 2 + s.phase) * s.drift, 0.58 - (life * 0.82 * H) / this.unit(f));
      if (p.x < -4 || p.x > f.w + 4) continue;
      ctx.strokeStyle = alpha(cyan, 0.5 * Math.sin(life * Math.PI));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.size, 0, TAU);
      ctx.stroke();
    }
  }

  // --- tower: the Curator's glasshouse --------------------------------------

  private towerBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const amber = this.palette.neon.amber;
    const H = Math.round(this.unit(f) * 0.95);
    const W = Math.round(H * 0.34);
    const p = this.at(node, f, 0.45, 0.4, 0.62);
    ctx.drawImage(this.spireSprite(W, H), p.x - W / 2, p.y - H, W, H);
    // The lamp at the tip, breathing.
    const k = 0.5 + 0.5 * Math.sin(t * 1.1);
    const g = ctx.createRadialGradient(p.x, p.y - H, 0, p.x, p.y - H, W * 0.6);
    g.addColorStop(0, alpha(amber, 0.5 + 0.3 * k));
    g.addColorStop(1, alpha(amber, 0));
    ctx.fillStyle = g;
    ctx.fillRect(p.x - W, p.y - H - W, W * 2, W * 2);
    // A canopy line the spire rises out of.
    const lime = this.palette.neon.lime;
    ctx.fillStyle = alpha(shade(lime, 0.7), 0.6);
    ctx.beginPath();
    ctx.moveTo(p.x - W * 2.2, p.y + 4);
    for (let i = 0; i <= 10; i++) {
      const x = p.x - W * 2.2 + (i / 10) * W * 4.4;
      ctx.lineTo(x, p.y - Math.abs(Math.sin(i * 1.7 + node.index)) * W * 0.28);
    }
    ctx.lineTo(p.x + W * 2.2, p.y + 4);
    ctx.closePath();
    ctx.fill();
  }

  private spireSprite(W: number, H: number): HTMLCanvasElement {
    const amber = this.palette.neon.amber;
    return this.sprite(`scene:spire|${W}|${H}`, W, H, (c) => {
      // Glass body.
      const fill = c.createLinearGradient(0, 0, W, 0);
      fill.addColorStop(0, alpha(amber, 0.08));
      fill.addColorStop(0.45, alpha(amber, 0.3));
      fill.addColorStop(1, alpha(amber, 0.06));
      c.fillStyle = fill;
      c.beginPath();
      c.moveTo(W / 2, 0);
      c.lineTo(W, H);
      c.lineTo(0, H);
      c.closePath();
      c.fill();
      c.strokeStyle = alpha(amber, 0.5);
      c.lineWidth = 1;
      c.stroke();
      // Steel spine and floors.
      c.strokeStyle = "rgba(201, 210, 227, 0.45)";
      c.beginPath();
      c.moveTo(W / 2, 0);
      c.lineTo(W / 2, H);
      c.stroke();
      c.strokeStyle = alpha(amber, 0.35);
      for (let i = 1; i < 7; i++) {
        const y = (i / 7) * H;
        const half = (y / H) * (W / 2);
        c.beginPath();
        c.moveTo(W / 2 - half, y);
        c.lineTo(W / 2 + half, y);
        c.stroke();
      }
      // Lit windows.
      const rng = createRng(0x70e);
      for (let i = 0; i < 12; i++) {
        const y = rng.range(H * 0.25, H * 0.95);
        const half = (y / H) * (W / 2) - 3;
        const x = W / 2 + rng.range(-half, half);
        c.fillStyle = alpha(tint(amber, 0.3), rng.range(0.4, 0.9));
        c.fillRect(x - 1, y - 2, 2, 3);
      }
    });
  }

  private shards(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const cast = this.cast(node, (rng) => ({
      particles: [],
      ships: [],
      rocks: Array.from({ length: 12 }, () => ({
        x: rng.range(0.1, 0.7),
        y: rng.range(-0.7, 0.4),
        size: rng.range(2, 5),
        shape: 0,
        vx: rng.range(-0.004, 0.004),
        spin: rng.range(-0.6, 0.6),
        angle: rng.range(0, TAU),
      })),
    }));
    const amber = this.palette.neon.amber;
    for (const r of cast.rocks) {
      const p = this.at(node, f, 0.8, r.x + Math.sin(t * 0.2 + r.angle) * 0.02, r.y + Math.cos(t * 0.17 + r.angle) * 0.03);
      if (p.x < -8 || p.x > f.w + 8) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(r.angle + t * r.spin);
      ctx.fillStyle = alpha(amber, 0.35);
      ctx.strokeStyle = alpha(amber, 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-r.size, 0);
      ctx.lineTo(0, -r.size * 0.5);
      ctx.lineTo(r.size, 0);
      ctx.lineTo(0, r.size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // --- roots: the Rootway ---------------------------------------------------

  private rootsBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const violet = this.palette.neon.violet;
    const lime = this.palette.neon.lime;
    const u = this.unit(f);
    const arcs = [
      { par: 0.4, ox: -0.5, oy: -0.7, w: u * 0.09, sag: -0.35 },
      { par: 0.55, ox: 0.1, oy: 0.55, w: u * 0.12, sag: 0.3 },
      { par: 0.7, ox: -0.3, oy: 0.15, w: u * 0.05, sag: 0.5 },
    ];
    for (const [i, a] of arcs.entries()) {
      const p = this.at(node, f, a.par, a.ox, a.oy);
      const span = f.spacing * 1.4;
      const x0 = p.x - span / 2;
      const x1 = p.x + span / 2;
      const cy = p.y + a.sag * u;
      ctx.lineCap = "round";
      // Wood.
      ctx.strokeStyle = shade(violet, 0.62);
      ctx.lineWidth = a.w;
      ctx.beginPath();
      ctx.moveTo(x0, p.y - a.sag * u * 0.4);
      ctx.quadraticCurveTo(p.x, cy, x1, p.y + a.sag * u * 0.3);
      ctx.stroke();
      // Bark highlight.
      ctx.strokeStyle = alpha(tint(violet, 0.1), 0.25);
      ctx.lineWidth = Math.max(1, a.w * 0.18);
      ctx.beginPath();
      ctx.moveTo(x0, p.y - a.sag * u * 0.4 - a.w * 0.3);
      ctx.quadraticCurveTo(p.x, cy - a.w * 0.3, x1, p.y + a.sag * u * 0.3 - a.w * 0.3);
      ctx.stroke();
      // Sap pulses running along the root.
      ctx.strokeStyle = alpha(lime, 0.6);
      ctx.lineWidth = Math.max(1, a.w * 0.14);
      ctx.setLineDash([a.w * 0.6, a.w * 4]);
      ctx.lineDashOffset = -t * (18 + i * 6);
      ctx.beginPath();
      ctx.moveTo(x0, p.y - a.sag * u * 0.4);
      ctx.quadraticCurveTo(p.x, cy, x1, p.y + a.sag * u * 0.3);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }
  }

  private sapMotes(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const cast = this.cast(node, (rng) => ({
      particles: Array.from({ length: 14 }, () => ({
        x: rng.range(-0.6, 0.6),
        y: rng.range(-0.6, 0.6),
        size: rng.range(0.8, 1.8),
        speed: rng.range(0.3, 0.8),
        phase: rng.range(0, TAU),
        drift: rng.range(0.02, 0.05),
      })),
      ships: [],
      rocks: [],
    }));
    const lime = this.palette.neon.lime;
    for (const s of cast.particles) {
      const k = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const p = this.at(node, f, 1, s.x + Math.sin(t * 0.25 + s.phase) * s.drift, s.y + Math.cos(t * 0.2 + s.phase) * 0.03);
      if (p.x < -4 || p.x > f.w + 4) continue;
      ctx.fillStyle = alpha(lime, 0.2 + 0.6 * k);
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.size, 0, TAU);
      ctx.fill();
    }
  }

  // --- constellation: the Wall-walker ---------------------------------------

  private constellationBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const u = this.unit(f);
    // The Wall-walker itself, large, over the zone.
    const c = this.at(node, f, 0.5, 0.02, -0.42);
    this.gecko(ctx, c.x, c.y, u * 0.62, t, 1, 0.1);
    // Smaller sky-stories further back: from here the whole sky tells it.
    const a = this.at(node, f, 0.3, -0.48, 0.5);
    this.gecko(ctx, a.x, a.y, u * 0.24, t, 0.45, -0.5);
    const b = this.at(node, f, 0.36, 0.5, 0.58);
    this.gecko(ctx, b.x, b.y, u * 0.18, t, 0.4, 2.4);
  }

  /** A gecko drawn in stars at `scale` (half its length), lines then joints. */
  private gecko(ctx: Ctx, cx: number, cy: number, scale: number, t: number, strength: number, angle: number): void {
    const amber = this.palette.neon.amber;
    const blue = this.palette.neon.blue;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.globalAlpha *= strength;
    ctx.strokeStyle = alpha(blue, 0.32);
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    for (const line of GECKO_LINES) {
      ctx.beginPath();
      line.forEach((i, k) => {
        const q = GECKO_STARS[i];
        if (k === 0) ctx.moveTo(q[0] * scale, q[1] * scale);
        else ctx.lineTo(q[0] * scale, q[1] * scale);
      });
      ctx.stroke();
    }
    GECKO_STARS.forEach((q, i) => {
      const x = q[0] * scale;
      const y = q[1] * scale;
      const major = GECKO_MAJOR.has(i);
      const k = 0.5 + 0.5 * Math.sin(t * (0.8 + (i % 5) * 0.23) + i * 1.3 + angle);
      const r = ((major ? 2.2 : 1.3) + k * 0.8) * Math.min(1, 0.5 + scale / 160);
      if (major) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
        g.addColorStop(0, alpha(amber, 0.35 + 0.25 * k));
        g.addColorStop(1, alpha(amber, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
      }
      ctx.fillStyle = major ? tint(amber, 0.35) : "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  }

  // --- garden: Meridian's seed-pods -----------------------------------------

  private gardenBack(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const u = this.unit(f);
    const pods = [
      { par: 0.4, ox: 0.42, oy: -0.62, r: u * 0.2 },
      { par: 0.55, ox: -0.44, oy: 0.5, r: u * 0.26 },
      { par: 0.75, ox: 0.3, oy: 0.62, r: u * 0.12 },
    ];
    for (const [i, pod] of pods.entries()) {
      const bob = Math.sin(t * 0.35 + i * 2) * u * 0.015;
      const p = this.at(node, f, pod.par, pod.ox, pod.oy);
      const R = Math.round(pod.r);
      ctx.drawImage(this.podSprite(R), p.x - R * 1.6, p.y + bob - R * 1.9, R * 3.2, R * 3.2);
    }
    // The Wall-walker still overhead, small and faint: they carry it with them.
    const c = this.at(node, f, 0.3, -0.05, -0.95);
    this.gecko(ctx, c.x, c.y, u * 0.3, t, 0.45, 0.15);
  }

  private podSprite(R: number): HTMLCanvasElement {
    const S = Math.round(R * 3.2);
    const lime = this.palette.neon.lime;
    const pink = this.palette.neon.pink;
    return this.sprite(`scene:pod|${R}`, S, S, (c) => {
      const cx = S / 2;
      const cy = S / 2 + R * 0.3;
      const glow = c.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.5);
      glow.addColorStop(0, alpha(lime, 0.2));
      glow.addColorStop(1, alpha(lime, 0));
      c.fillStyle = glow;
      c.fillRect(0, 0, S, S);
      // Stem and a seed-leaf pair on top.
      c.strokeStyle = shade(lime, 0.4);
      c.lineWidth = Math.max(1.2, R * 0.08);
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(cx, cy - R * 0.9);
      c.quadraticCurveTo(cx + R * 0.15, cy - R * 1.3, cx, cy - R * 1.55);
      c.stroke();
      c.fillStyle = alpha(pink, 0.7);
      for (const side of [-1, 1]) {
        c.beginPath();
        c.ellipse(cx + side * R * 0.28, cy - R * 1.5, R * 0.3, R * 0.14, side * 0.5, 0, TAU);
        c.fill();
      }
      // The pod: a translucent globe with a bright seed inside.
      const body = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, alpha(tint(lime, 0.4), 0.55));
      body.addColorStop(0.6, alpha(lime, 0.22));
      body.addColorStop(1, alpha(shade(lime, 0.5), 0.6));
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(cx, cy, R * 0.85, R, 0, 0, TAU);
      c.fill();
      c.strokeStyle = alpha("#ffffff", 0.35);
      c.lineWidth = 1;
      c.stroke();
      const seed = c.createRadialGradient(cx, cy + R * 0.1, 0, cx, cy + R * 0.1, R * 0.4);
      seed.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      seed.addColorStop(0.4, alpha(lime, 0.6));
      seed.addColorStop(1, alpha(lime, 0));
      c.fillStyle = seed;
      c.beginPath();
      c.arc(cx, cy + R * 0.1, R * 0.4, 0, TAU);
      c.fill();
    });
  }

  private pollen(ctx: Ctx, node: JourneyNode, f: SceneFrame, t: number): void {
    const cast = this.cast(node, (rng) => ({
      particles: Array.from({ length: 16 }, () => ({
        x: rng.range(-0.6, 0.6),
        y: rng.range(0, 1),
        size: rng.range(0.8, 1.8),
        speed: rng.range(0.015, 0.035),
        phase: rng.range(0, TAU),
        drift: rng.range(0.02, 0.05),
      })),
      ships: [],
      rocks: [],
    }));
    const pink = this.palette.neon.pink;
    for (const s of cast.particles) {
      const life = ((s.y + t * s.speed) % 1 + 1) % 1;
      const p = this.at(node, f, 0.9, s.x + Math.sin(t * 0.5 + s.phase) * s.drift, -0.5 + life * 1.1);
      if (p.x < -4 || p.x > f.w + 4) continue;
      ctx.fillStyle = alpha(pink, 0.7 * Math.sin(life * Math.PI));
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.size, 0, TAU);
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------------------
  // Visitors: a saucer on a schedule, shooting stars
  // ---------------------------------------------------------------------------

  visitors(ctx: Ctx, w: number, h: number, t: number): void {
    this.streak(ctx, w, h, t);
    this.saucer(ctx, w, h, t);
  }

  private streak(ctx: Ctx, w: number, h: number, t: number): void {
    const n = Math.floor(t / STREAK_EVERY);
    const u = (t - n * STREAK_EVERY) / STREAK_LIFE;
    if (u > 1) return;
    const rng = createRng(0x57a2 + n * 7919);
    if (rng.chance(0.35)) return;
    const x0 = rng.range(0.1, 0.9) * w;
    const y0 = rng.range(0.05, 0.5) * h;
    const dir = rng.range(Math.PI * 0.6, Math.PI * 0.95);
    const len = rng.range(50, 120);
    const head = u * len * 1.6;
    const fade = Math.sin(u * Math.PI);
    const x = x0 + Math.cos(dir) * head;
    const y = y0 + Math.sin(dir) * head;
    const g = ctx.createLinearGradient(x, y, x - Math.cos(dir) * len, y - Math.sin(dir) * len);
    g.addColorStop(0, `rgba(255, 255, 255, ${(0.85 * fade).toFixed(3)})`);
    g.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(dir) * len, y - Math.sin(dir) * len);
    ctx.stroke();
  }

  private saucer(ctx: Ctx, w: number, h: number, t: number): void {
    const n = Math.floor(t / SAUCER_EVERY);
    const local = t - n * SAUCER_EVERY;
    // The first visit comes early so a new player meets it; after that, on schedule.
    const start = n === 0 ? 14 : SAUCER_EVERY * 0.45;
    const u = (local - start) / SAUCER_FLIGHT;
    if (u < 0 || u > 1) return;
    const rng = createRng(0x0f0 + n * 131);
    const ltr = rng.chance(0.5);
    const yBase = rng.range(0.14, 0.4) * h;
    const wobble = rng.range(18, 40);
    const x = ltr ? -40 + u * (w + 80) : w + 40 - u * (w + 80);
    const y = yBase + Math.sin(u * Math.PI * 2.5) * wobble;
    const tilt = Math.cos(u * Math.PI * 2.5) * 0.12 * (ltr ? 1 : -1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.drawImage(this.saucerSprite(), -30, -16, 60, 32);
    // Rim lights chase around the hull in the brick neons.
    const colors = [this.palette.neon.pink, this.palette.neon.violet, this.palette.neon.blue, this.palette.neon.cyan, this.palette.neon.lime, this.palette.neon.amber];
    for (let i = 0; i < 6; i++) {
      const on = Math.floor(t * 6) % 6 === i;
      const px = -22 + i * 8.8;
      ctx.fillStyle = alpha(colors[i], on ? 1 : 0.3);
      ctx.beginPath();
      ctx.arc(px, 3.5, on ? 1.8 : 1.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    // A soft glow under it.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(x, y + 6, 0, x, y + 6, 26);
    g.addColorStop(0, alpha(this.palette.neon.cyan, 0.22));
    g.addColorStop(1, alpha(this.palette.neon.cyan, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - 26, y - 20, 52, 52);
    ctx.restore();
  }

  private saucerSprite(): HTMLCanvasElement {
    return this.sprite("saucer|", 60, 32, (c) => {
      c.translate(30, 16);
      // Dome.
      const dome = c.createRadialGradient(-3, -6, 1, 0, -4, 11);
      dome.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      dome.addColorStop(0.4, alpha(this.palette.neon.cyan, 0.35));
      dome.addColorStop(1, alpha(this.palette.neon.cyan, 0.05));
      c.fillStyle = dome;
      c.beginPath();
      c.arc(0, -3, 10, Math.PI, 0);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(255, 255, 255, 0.45)";
      c.lineWidth = 0.8;
      c.stroke();
      // Hull.
      const hull = c.createLinearGradient(0, -4, 0, 8);
      hull.addColorStop(0, tint(this.palette.steel, 0.35));
      hull.addColorStop(0.5, this.palette.steel);
      hull.addColorStop(1, "#2a3044");
      c.fillStyle = hull;
      c.beginPath();
      c.ellipse(0, 2, 28, 7, 0, 0, TAU);
      c.fill();
      c.strokeStyle = "rgba(255, 255, 255, 0.5)";
      c.lineWidth = 0.8;
      c.beginPath();
      c.ellipse(0, 2, 28, 7, 0, Math.PI, TAU);
      c.stroke();
      c.strokeStyle = "rgba(0, 0, 0, 0.35)";
      c.beginPath();
      c.ellipse(0, 2, 28, 7, 0, 0, Math.PI);
      c.stroke();
    });
  }

  // ---------------------------------------------------------------------------
  // Shared props
  // ---------------------------------------------------------------------------

  /** A sun: white heart, colored corona, long soft halo. Sprite spans 6R. */
  private sunSprite(R: number, color: string): HTMLCanvasElement {
    const S = R * 6;
    return this.sprite(`scene:sun|${R}|${color}`, S, S, (c) => {
      const cx = S / 2;
      const cy = S / 2;
      const halo = c.createRadialGradient(cx, cy, R, cx, cy, R * 3);
      halo.addColorStop(0, alpha(color, 0.35));
      halo.addColorStop(0.3, alpha(color, 0.1));
      halo.addColorStop(1, alpha(color, 0));
      c.fillStyle = halo;
      c.fillRect(0, 0, S, S);
      const core = c.createRadialGradient(cx, cy, 0, cx, cy, R);
      core.addColorStop(0, "#ffffff");
      core.addColorStop(0.55, tint(color, 0.6));
      core.addColorStop(1, alpha(color, 0.6));
      c.fillStyle = core;
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.fill();
      // Rays.
      c.strokeStyle = alpha(tint(color, 0.5), 0.35);
      c.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + 0.2;
        const len = R * (i % 2 ? 1.9 : 2.5);
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * R * 1.1, cy + Math.sin(a) * R * 1.1);
        c.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        c.stroke();
      }
    });
  }

  /** A ship of light: a slim hull pointing along `heading`, engine glow behind. */
  private ship(ctx: Ctx, x: number, y: number, size: number, heading: number, color: string, a: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    ctx.globalAlpha *= a;
    const glow = ctx.createRadialGradient(-size * 0.7, 0, 0, -size * 0.7, 0, size * 0.9);
    glow.addColorStop(0, alpha(color, 0.6));
    glow.addColorStop(1, alpha(color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(-size * 1.6, -size, size * 1.8, size * 2);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, -size * 0.32);
    ctx.lineTo(-size * 0.5, 0);
    ctx.lineTo(-size * 0.7, size * 0.32);
    ctx.closePath();
    ctx.fillStyle = tint(color, 0.55);
    ctx.fill();
    ctx.strokeStyle = alpha(color, 0.9);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  /** A satellite: a body, two panels, a dish. */
  private satellite(ctx: Ctx, x: number, y: number, size: number, angle: number, color: string): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = shade(color, 0.3);
    ctx.strokeStyle = alpha(color, 0.55);
    ctx.lineWidth = 1;
    ctx.fillRect(-size * 1.8, -size * 0.28, size * 1.2, size * 0.56);
    ctx.strokeRect(-size * 1.8, -size * 0.28, size * 1.2, size * 0.56);
    ctx.fillRect(size * 0.6, -size * 0.28, size * 1.2, size * 0.56);
    ctx.strokeRect(size * 0.6, -size * 0.28, size * 1.2, size * 0.56);
    ctx.fillStyle = shade(color, 0.45);
    roundRect(ctx, -size * 0.45, -size * 0.45, size * 0.9, size * 0.9, 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -size * 0.9, size * 0.5, Math.PI * 0.15, Math.PI * 0.85, true);
    ctx.stroke();
    ctx.restore();
  }

  private rockSprite(shape: number, hue: string): HTMLCanvasElement {
    return this.sprite(`scenerock|${shape}|${hue}`, 40, 40, (c) => {
      const rng = createRng(0x60c4 + shape * 23);
      const n = 6 + shape;
      c.translate(20, 20);
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const r = 12 * rng.range(0.62, 1);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * rng.range(0.7, 1);
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      const body = c.createLinearGradient(-10, -10, 10, 10);
      body.addColorStop(0, "#3a4158");
      body.addColorStop(1, "#0d1020");
      c.fillStyle = body;
      c.fill();
      c.strokeStyle = alpha(hue, 0.4);
      c.lineWidth = 1;
      c.stroke();
    });
  }
}

function wrap(v: number, lo: number, hi: number): number {
  const span = hi - lo;
  return ((((v - lo) % span) + span) % span) + lo;
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

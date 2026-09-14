/**
 * Journey renderer — Canvas 2D, deep space in the game's neons.
 *
 * Layers, back to front: a static plate (gradient + vignette, once per
 * resize), two seeded starfield tiles on slow parallax, one bloom per zone,
 * the route (a sampled curve, lit as far as Kal has come), the debris that
 * shrouds locked zones, the nodes themselves (cached medallions), Kal orbiting
 * the frontier, and a sparse near layer of dust for depth. Every gradient that
 * does not move is a cached sprite; nothing uses `shadowBlur` or `filter`, so
 * a phone draws the frame with a few dozen `drawImage` calls.
 */
import { readNeonPalette, type NeonPalette } from "../breakout/render/palette";
import { alpha, tint } from "../shared/color";
import { createRng } from "../shared/random";
import type { JourneyHue, JourneyLayout, JourneyNode } from "./model";

const TAU = Math.PI * 2;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
/** Starfield tile width, CSS px. */
const TILE = 1024;
/** Parallax factors: 0 is pinned to the screen, 1 moves with the nodes. */
const PAR_FAR = 0.1;
const PAR_MID = 0.28;
const PAR_BLOOM = 0.55;
const PAR_ROCK = 1.1;
const PAR_DUST = 0.92;
const PAR_NEAR = 1.5;
/** Route samples per segment. */
const SAMPLES = 22;
/** Seconds for a shroud to lift once a zone opens. */
export const REVEAL_SECONDS = 1.4;

type Ctx = CanvasRenderingContext2D;

export interface CssRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface JourneyView {
  width: number;
  height: number;
  dpr: number;
}

interface Rock {
  bx: number;
  by: number;
  size: number;
  shape: number;
  vx: number;
  vy: number;
  spin: number;
  angle: number;
}

interface Dust {
  bx: number;
  by: number;
  size: number;
  a: number;
  vx: number;
  vy: number;
}

interface Debris {
  rocks: Rock[];
  dust: Dust[];
}

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  bright: boolean;
}

export class JourneyRenderer {
  private readonly ctx: Ctx;
  private readonly palette: NeonPalette;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private plate: HTMLCanvasElement | null = null;
  private farTile: HTMLCanvasElement | null = null;
  private midTile: HTMLCanvasElement | null = null;
  private readonly sprites = new Map<string, HTMLCanvasElement>();
  private readonly covers = new Map<string, HTMLImageElement>();
  private readonly debris = new Map<number, Debris>();
  private readonly near: Dust[];
  private readonly twinkle: { x: number; y: number; phase: number }[];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private layout: JourneyLayout,
    private readonly onCover?: () => void,
  ) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.ctx = ctx;
    this.palette = readNeonPalette();
    const rng = createRng(0x5ea);
    this.near = Array.from({ length: 26 }, () => ({
      bx: rng.range(0, 1),
      by: rng.range(0, 1),
      size: rng.range(1.4, 3.2),
      a: rng.range(0.05, 0.16),
      vx: rng.range(-0.004, 0.004),
      vy: rng.range(-0.003, 0.003),
    }));
    this.twinkle = Array.from({ length: 14 }, () => ({
      x: rng.range(0, 1),
      y: rng.range(0, 1),
      phase: rng.range(0, TAU),
    }));
    this.loadCovers();
  }

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  setLayout(layout: JourneyLayout): void {
    const spacingChanged = layout.spacing !== this.layout.spacing || layout.radius !== this.layout.radius;
    const before = new Map(this.layout.nodes.map((n) => [n.id, n]));
    this.layout = layout;
    if (spacingChanged) this.sprites.clear();
    // Sprites carry the state in their key; only covers need a fresh look-up.
    for (const node of layout.nodes) {
      const old = before.get(node.id);
      if (!old || old.cover !== node.cover) this.loadCover(node);
    }
  }

  view(v: JourneyView): void {
    const cw = Math.round(v.width * v.dpr);
    const ch = Math.round(v.height * v.dpr);
    if (cw === this.canvas.width && ch === this.canvas.height && v.dpr === this.dpr && this.plate) return;
    if (v.dpr !== this.dpr) this.sprites.clear();
    this.width = v.width;
    this.height = v.height;
    this.dpr = v.dpr;
    this.canvas.width = cw;
    this.canvas.height = ch;
    this.plate = this.paintPlate();
    this.farTile = this.paintStars(0x51a7, 150, 0.6, 1.4, 0.35, 0.8);
    this.midTile = this.paintStars(0x7b3d, 70, 0.9, 2, 0.5, 1);
    // Bloom and shroud sizes follow the stage height.
    for (const key of [...this.sprites.keys()]) {
      if (key.startsWith("bloom|") || key.startsWith("shroud|")) this.sprites.delete(key);
    }
  }

  /** Screen centre of node `i` for camera `cam` (a fractional index). */
  nodeCenter(i: number, cam: number): { x: number; y: number } {
    const node = this.layout.nodes[i];
    return {
      x: this.width / 2 + (node.x - cam * this.layout.spacing),
      y: this.height * this.layout.midline + node.y,
    };
  }

  /** A node's box in CSS px relative to the canvas, for DOM overlays. */
  nodeRect(i: number, cam: number): CssRect {
    const { x, y } = this.nodeCenter(i, cam);
    const r = this.layout.radius;
    return { x: x - r, y: y - r, width: r * 2, height: r * 2 };
  }

  /** The node under a canvas-relative CSS point, or -1. */
  hitNode(px: number, py: number, cam: number): number {
    const reach = this.layout.radius + 14;
    for (let i = 0; i < this.layout.nodes.length; i++) {
      const c = this.nodeCenter(i, cam);
      if (Math.hypot(px - c.x, py - c.y) <= reach) return i;
    }
    return -1;
  }

  // ---------------------------------------------------------------------------
  // Frame
  // ---------------------------------------------------------------------------

  /**
   * @param cam camera, fractional node index
   * @param t seconds, frozen under reduced motion
   * @param reveal per node, 0 (shrouded) .. 1 (open), animating after an unlock
   */
  render(cam: number, t: number, reveal: readonly number[]): void {
    const { ctx, width: w, height: h, dpr } = this;
    if (!this.plate || w === 0) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.plate, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { nodes, spacing } = this.layout;
    const shift = -cam * spacing;

    this.tiles(ctx, this.farTile, shift * PAR_FAR);
    this.tiles(ctx, this.midTile, shift * PAR_MID);
    this.twinkles(ctx, t);

    // Which nodes are anywhere near the screen.
    const first = Math.max(0, Math.floor(cam - w / spacing - 1));
    const last = Math.min(nodes.length - 1, Math.ceil(cam + w / spacing + 1));

    for (let i = first; i <= last; i++) this.bloom(ctx, nodes[i], cam, reveal[i] ?? 1);

    this.route(ctx, cam, t, first, last);

    for (let i = first; i <= last; i++) {
      const node = nodes[i];
      const k = reveal[i] ?? (node.state === "locked" ? 0 : 1);
      const c = this.nodeCenter(i, cam);
      this.node(ctx, node, c.x, c.y, t, k);
      if (k < 1) this.shroud(ctx, c.x, c.y, 1 - k);
      if (k < 1) this.debrisLayer(ctx, node, cam, t, 1 - k);
      if (node.state === "current" && k >= 1) this.kal(ctx, node, c.x, c.y, t);
    }

    this.nearDust(ctx, shift * PAR_NEAR, t);

    // Frame hairline: the map is the one dark object on the page.
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  // ---------------------------------------------------------------------------
  // Backdrop
  // ---------------------------------------------------------------------------

  private paintPlate(): HTMLCanvasElement {
    const { width: w, height: h, dpr } = this;
    const layer = offscreen(w * dpr, h * dpr);
    const ctx = layer.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#080a14");
    sky.addColorStop(0.5, "#0b0d1a");
    sky.addColorStop(1, "#04050a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    // A faint band of the galaxy across the midline.
    const band = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.8);
    band.addColorStop(0, "rgba(139, 92, 246, 0)");
    band.addColorStop(0.5, "rgba(139, 92, 246, 0.07)");
    band.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, w, h);
    const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.62);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    return layer;
  }

  private paintStars(seed: number, count: number, rMin: number, rMax: number, aMin: number, aMax: number): HTMLCanvasElement {
    const { height: h, dpr } = this;
    const tile = offscreen(TILE * dpr, h * dpr);
    const ctx = tile.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rng = createRng(seed);
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: rng.range(0, TILE),
      y: rng.range(0, h),
      r: rng.range(rMin, rMax),
      a: rng.range(aMin, aMax),
      bright: rng.chance(0.08),
    }));
    for (const s of stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.5, 0, TAU);
      ctx.fill();
      if (s.bright) {
        // A four-point glint on the few brighter stars.
        ctx.strokeStyle = `rgba(255, 255, 255, ${(s.a * 0.35).toFixed(3)})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r * 3, s.y);
        ctx.lineTo(s.x + s.r * 3, s.y);
        ctx.moveTo(s.x, s.y - s.r * 3);
        ctx.lineTo(s.x, s.y + s.r * 3);
        ctx.stroke();
      }
    }
    return tile;
  }

  private tiles(ctx: Ctx, tile: HTMLCanvasElement | null, offset: number): void {
    if (!tile) return;
    const { width: w, height: h } = this;
    let x = ((offset % TILE) + TILE) % TILE - TILE;
    for (; x < w; x += TILE) ctx.drawImage(tile, x, 0, TILE, h);
  }

  private twinkles(ctx: Ctx, t: number): void {
    const { width: w, height: h } = this;
    ctx.fillStyle = "#ffffff";
    for (const s of this.twinkle) {
      const k = 0.5 + 0.5 * Math.sin(t * 1.3 + s.phase);
      ctx.globalAlpha = 0.12 + 0.5 * k * k;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, 0.8 + 0.7 * k, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private nearDust(ctx: Ctx, offset: number, t: number): void {
    const { width: w, height: h } = this;
    const span = w + 200;
    ctx.fillStyle = "#c9d2e3";
    for (const d of this.near) {
      const x = wrap(d.bx * span + offset + d.vx * t * span, -100, w + 100);
      const y = wrap(d.by * h + d.vy * t * h, -10, h + 10);
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.arc(x, y, d.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------------------
  // Zones
  // ---------------------------------------------------------------------------

  private hue(hue: JourneyHue): string {
    return hue === "steel" ? this.palette.steel : this.palette.neon[hue];
  }

  private bloom(ctx: Ctx, node: JourneyNode, cam: number, reveal: number): void {
    const { spacing, midline } = this.layout;
    const { width: w, height: h } = this;
    const bw = spacing * 2.1;
    const bh = h * 1.15;
    const x = w / 2 + (node.x - cam * spacing) * PAR_BLOOM;
    const y = h * midline + node.y * 0.5;
    if (x + bw / 2 < 0 || x - bw / 2 > w) return;
    const sprite = this.sprite(`bloom|${node.hue}`, 256, 256, (c) => {
      const color = this.hue(node.hue);
      const g = c.createRadialGradient(128, 128, 4, 128, 128, 128);
      g.addColorStop(0, alpha(color, 0.5));
      g.addColorStop(0.35, alpha(color, 0.18));
      g.addColorStop(1, alpha(color, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, 256, 256);
    });
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.28 + 0.42 * reveal;
    ctx.drawImage(sprite, x - bw / 2, y - bh / 2, bw, bh);
    // A tighter, warmer core so the zone has a heart.
    ctx.globalAlpha = 0.18 + 0.22 * reveal;
    ctx.drawImage(sprite, x - bw * 0.22, y - bh * 0.18, bw * 0.44, bh * 0.36);
    ctx.restore();
  }

  private shroud(ctx: Ctx, x: number, y: number, k: number): void {
    const { spacing } = this.layout;
    const sw = spacing * 1.25;
    const sh = this.height * 0.8;
    const sprite = this.sprite("shroud|", 256, 256, (c) => {
      const g = c.createRadialGradient(128, 128, 10, 128, 128, 128);
      g.addColorStop(0, "rgba(5, 6, 12, 0.82)");
      g.addColorStop(0.45, "rgba(5, 6, 12, 0.5)");
      g.addColorStop(1, "rgba(5, 6, 12, 0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 256, 256);
    });
    ctx.globalAlpha = k;
    ctx.drawImage(sprite, x - sw / 2, y - sh / 2, sw, sh);
    ctx.globalAlpha = 1;
  }

  private debrisFor(node: JourneyNode): Debris {
    let set = this.debris.get(node.index);
    if (set) return set;
    const rng = createRng(0xdeb0 + node.index * 131);
    const rocks: Rock[] = Array.from({ length: 24 }, () => ({
      bx: rng.range(-1, 1),
      by: rng.range(-1, 1),
      size: rng.range(2.5, 10),
      shape: rng.int(0, 3),
      vx: rng.range(-0.02, 0.02),
      vy: rng.range(-0.012, 0.012),
      spin: rng.range(-0.5, 0.5),
      angle: rng.range(0, TAU),
    }));
    const dust: Dust[] = Array.from({ length: 64 }, () => ({
      bx: rng.range(-1, 1),
      by: rng.range(-1, 1),
      size: rng.range(0.5, 1.5),
      a: rng.range(0.18, 0.6),
      vx: rng.range(-0.014, 0.014),
      vy: rng.range(-0.01, 0.01),
    }));
    set = { rocks, dust };
    this.debris.set(node.index, set);
    return set;
  }

  private debrisLayer(ctx: Ctx, node: JourneyNode, cam: number, t: number, k: number): void {
    const { spacing, midline } = this.layout;
    const { width: w, height: h } = this;
    const set = this.debrisFor(node);
    const hw = spacing * 0.56;
    const hh = h * 0.34;
    const cy = h * midline + node.y;
    const scatter = (1 - k) * 0.9;
    const base = node.x - cam * spacing;

    ctx.fillStyle = "#e6ebf5";
    for (const d of set.dust) {
      const nx = wrap(d.bx + d.vx * t, -1, 1);
      const ny = wrap(d.by + d.vy * t, -1, 1);
      const push = 1 + scatter;
      const x = w / 2 + base * PAR_DUST + nx * hw * push;
      const y = cy + ny * hh * push;
      if (x < -4 || x > w + 4) continue;
      ctx.globalAlpha = d.a * k;
      ctx.beginPath();
      ctx.arc(x, y, d.size, 0, TAU);
      ctx.fill();
    }

    const hue = this.hue(node.hue);
    for (const r of set.rocks) {
      const nx = wrap(r.bx + r.vx * t, -1, 1);
      const ny = wrap(r.by + r.vy * t, -1, 1);
      const push = 1 + scatter * 1.4;
      const x = w / 2 + base * PAR_ROCK + nx * hw * push;
      const y = cy + ny * hh * push;
      if (x < -20 || x > w + 20) continue;
      const sprite = this.rockSprite(r.shape, hue);
      const s = r.size * 2.6;
      ctx.save();
      ctx.globalAlpha = k;
      ctx.translate(x, y);
      ctx.rotate(r.angle + r.spin * t);
      ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private rockSprite(shape: number, hue: string): HTMLCanvasElement {
    return this.sprite(`rock|${shape}|${hue}`, 48, 48, (c) => {
      const rng = createRng(0x70c4 + shape * 17);
      const n = 6 + shape;
      c.translate(24, 24);
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const r = 14 * rng.range(0.62, 1);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * rng.range(0.7, 1);
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      const body = c.createLinearGradient(-12, -12, 12, 12);
      body.addColorStop(0, "#3a4158");
      body.addColorStop(0.55, "#1b2033");
      body.addColorStop(1, "#0d1020");
      c.fillStyle = body;
      c.fill();
      // A rim lit by the zone.
      c.strokeStyle = alpha(hue, 0.5);
      c.lineWidth = 1.2;
      c.stroke();
    });
  }

  // ---------------------------------------------------------------------------
  // Route
  // ---------------------------------------------------------------------------

  private route(ctx: Ctx, cam: number, t: number, first: number, last: number): void {
    const { nodes, spacing } = this.layout;
    const pts: { x: number; y: number }[] = new Array(SAMPLES + 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = Math.max(0, first - 1); i < Math.min(nodes.length - 1, last + 1); i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      const p0 = this.nodeCenter(i, cam);
      const p3 = this.nodeCenter(i + 1, cam);
      const c1 = { x: p0.x + spacing * 0.5, y: p0.y };
      const c2 = { x: p3.x - spacing * 0.5, y: p3.y };
      for (let s = 0; s <= SAMPLES; s++) {
        const u = s / SAMPLES;
        pts[s] = bezier(p0, c1, c2, p3, u);
      }
      // Base: a faint dotted thread the whole way.
      ctx.setLineDash([2, 7]);
      ctx.lineDashOffset = 0;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.11)";
      ctx.lineWidth = 1.2;
      polyline(ctx, pts, SAMPLES + 1);
      ctx.stroke();

      // Lit as far as Kal has come.
      const lit = a.state === "cleared" ? 1 : a.state === "current" ? a.progress : a.state === "open" ? 1 : 0;
      if (lit <= 0.001) continue;
      const count = Math.max(2, Math.round(lit * SAMPLES) + 1);
      const ha = this.hue(a.hue);
      const hb = this.hue(b.hue);
      const g = ctx.createLinearGradient(p0.x, 0, p3.x, 0);
      g.addColorStop(0, ha);
      g.addColorStop(1, lit >= 1 ? hb : ha);
      ctx.setLineDash([]);
      ctx.strokeStyle = g;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 7;
      polyline(ctx, pts, count);
      ctx.stroke();
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 6]);
      ctx.lineDashOffset = -t * 22;
      polyline(ctx, pts, count);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      if (lit < 1) {
        // The head of the lit thread: where the next wall is.
        const tip = pts[count - 1];
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 2.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = alpha(ha, 0.35);
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 6, 0, TAU);
        ctx.fill();
      }
    }
    ctx.lineDashOffset = 0;
  }

  // ---------------------------------------------------------------------------
  // Nodes
  // ---------------------------------------------------------------------------

  private node(ctx: Ctx, node: JourneyNode, x: number, y: number, t: number, reveal: number): void {
    const R = this.layout.radius;
    const hue = this.hue(node.hue);
    const lit = node.state !== "locked" || reveal > 0;
    const glowKey = `glow|${node.hue}|${lit ? "lit" : "dim"}`;
    const glow = this.sprite(glowKey, 128, 128, (c) => {
      const g = c.createRadialGradient(64, 64, 8, 64, 64, 64);
      g.addColorStop(0, alpha(hue, lit ? 0.55 : 0.14));
      g.addColorStop(0.45, alpha(hue, lit ? 0.16 : 0.05));
      g.addColorStop(1, alpha(hue, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, 128, 128);
    });
    const pulse = node.state === "current" ? 0.85 + 0.15 * Math.sin(t * 2.1) : 1;
    const gr = R * 2.4 * pulse;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = node.state === "locked" ? 0.35 + 0.65 * reveal : 1;
    ctx.drawImage(glow, x - gr, y - gr, gr * 2, gr * 2);
    ctx.restore();

    // The rotating dashed ring around the frontier, the game's bonus-ring motif.
    if (node.state === "current") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 0.35);
      ctx.setLineDash([3, 8]);
      ctx.strokeStyle = alpha(hue, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, R + 11, 0, TAU);
      ctx.stroke();
      ctx.restore();
      const k = 0.5 + 0.5 * Math.sin(t * 2.1);
      ctx.strokeStyle = alpha(hue, 0.12 + 0.2 * (1 - k));
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, R + 4 + 9 * k, 0, TAU);
      ctx.stroke();
    }

    const disc = this.discSprite(node);
    const pad = 6;
    ctx.drawImage(disc, x - R - pad, y - R - pad, (R + pad) * 2, (R + pad) * 2);

    // Progress arc on a started episode.
    if (node.state !== "locked" && node.progress > 0 && node.progress < 1) {
      ctx.strokeStyle = tint(hue, 0.15);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(x, y, R - 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * node.progress);
      ctx.stroke();
    }
  }

  private discSprite(node: JourneyNode): HTMLCanvasElement {
    const R = this.layout.radius;
    const pad = 6;
    const S = (R + pad) * 2;
    const cover = node.cover ? this.covers.get(node.cover) : undefined;
    const ready = Boolean(cover?.complete && cover.naturalWidth > 0);
    const key = `disc|${node.id}|${node.state}|${node.hue}|${ready ? "photo" : "plain"}|${node.cover ? "" : node.kicker}`;
    const hue = this.hue(node.hue);
    return this.sprite(key, S, S, (c) => {
      const cx = S / 2;
      const cy = S / 2;
      const locked = node.state === "locked";
      // Glass body.
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.fillStyle = "#0b0d1a";
      c.fill();
      if (ready && cover) {
        c.save();
        c.beginPath();
        c.arc(cx, cy, R - 1, 0, TAU);
        c.clip();
        c.drawImage(cover, cx - R, cy - R, R * 2, R * 2);
        c.fillStyle = `rgba(5, 6, 12, ${locked ? 0.72 : node.state === "cleared" ? 0.22 : 0.34})`;
        c.fillRect(0, 0, S, S);
        c.restore();
      } else {
        const g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R);
        g.addColorStop(0, alpha(hue, locked ? 0.16 : 0.5));
        g.addColorStop(1, alpha(hue, locked ? 0.04 : 0.12));
        c.fillStyle = g;
        c.beginPath();
        c.arc(cx, cy, R, 0, TAU);
        c.fill();
      }
      // Specular cap.
      const spec = c.createLinearGradient(0, cy - R, 0, cy);
      spec.addColorStop(0, `rgba(255, 255, 255, ${locked ? 0.1 : 0.22})`);
      spec.addColorStop(1, "rgba(255, 255, 255, 0)");
      c.fillStyle = spec;
      c.beginPath();
      c.arc(cx, cy, R - 1.5, Math.PI, 0);
      c.fill();
      // Ring.
      c.lineWidth = locked ? 1.4 : 2.4;
      c.strokeStyle = locked ? alpha(this.palette.steel, 0.45) : hue;
      if (locked) c.setLineDash([4, 6]);
      c.beginPath();
      c.arc(cx, cy, R, 0, TAU);
      c.stroke();
      c.setLineDash([]);
      c.strokeStyle = `rgba(255, 255, 255, ${locked ? 0.18 : 0.6})`;
      c.lineWidth = 0.8;
      c.beginPath();
      c.arc(cx, cy, R - 2.2, 0, TAU);
      c.stroke();
      // Glyph: a padlock on a locked zone, the number when there is no photo.
      if (locked) {
        c.strokeStyle = "rgba(255, 255, 255, 0.7)";
        c.fillStyle = "rgba(255, 255, 255, 0.7)";
        c.lineWidth = 1.8;
        c.lineCap = "round";
        const s = R * 0.34;
        c.beginPath();
        c.arc(cx, cy - s * 0.35, s * 0.55, Math.PI, 0);
        c.stroke();
        roundRect(c, cx - s * 0.75, cy - s * 0.35, s * 1.5, s * 1.15, s * 0.22);
        c.fill();
      } else if (!ready) {
        c.fillStyle = "rgba(255, 255, 255, 0.92)";
        c.font = `600 ${Math.round(R * 0.7)}px ${MONO}`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(node.kicker, cx, cy + 1);
      }
    });
  }

  /** Kal: the game's glowing ball, orbiting the zone he stands in, trail behind. */
  private kal(ctx: Ctx, node: JourneyNode, x: number, y: number, t: number): void {
    const R = this.layout.radius;
    const hue = this.hue(node.hue);
    const orbit = R + 20;
    const a0 = -Math.PI / 2 + t * 0.7;
    const aura = this.sprite(`kal|${node.hue}`, 64, 64, (c) => {
      const g = c.createRadialGradient(32, 32, 2, 32, 32, 32);
      g.addColorStop(0, alpha(hue, 0.6));
      g.addColorStop(1, alpha(hue, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    });
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 9; i >= 1; i--) {
      const a = a0 - i * 0.09;
      const k = 1 - i / 10;
      ctx.globalAlpha = 0.28 * k * k;
      ctx.fillStyle = hue;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * orbit, y + Math.sin(a) * orbit, 4.5 * (0.3 + 0.7 * k), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const bx = x + Math.cos(a0) * orbit;
    const by = y + Math.sin(a0) * orbit;
    ctx.drawImage(aura, bx - 16, by - 16, 32, 32);
    ctx.restore();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(bx, by, 4.5, 0, TAU);
    ctx.fill();
  }

  // ---------------------------------------------------------------------------
  // Covers
  // ---------------------------------------------------------------------------

  private loadCovers(): void {
    for (const node of this.layout.nodes) this.loadCover(node);
  }

  private loadCover(node: JourneyNode): void {
    const src = node.cover;
    if (!src || this.covers.has(src)) return;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      // The medallion was drawn plain; draw it again with the photo.
      for (const key of [...this.sprites.keys()]) {
        if (key.startsWith(`disc|${node.id}|`)) this.sprites.delete(key);
      }
      this.onCover?.();
    };
    image.onerror = () => {
      this.covers.delete(src);
    };
    this.covers.set(src, image);
    image.src = src;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** A cached offscreen drawing of `w × h` CSS px at the current DPR. */
  private sprite(key: string, w: number, h: number, paint: (ctx: Ctx) => void): HTMLCanvasElement {
    const cached = this.sprites.get(key);
    if (cached) return cached;
    const dpr = this.dpr;
    const canvas = offscreen(w * dpr, h * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(ctx);
    this.sprites.set(key, canvas);
    return canvas;
  }
}

function offscreen(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
}

function wrap(v: number, lo: number, hi: number): number {
  const span = hi - lo;
  return ((((v - lo) % span) + span) % span) + lo;
}

function bezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  u: number,
): { x: number; y: number } {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const c = 3 * v * u * u;
  const d = u * u * u;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

function polyline(ctx: Ctx, pts: { x: number; y: number }[], count: number): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < count; i++) ctx.lineTo(pts[i].x, pts[i].y);
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

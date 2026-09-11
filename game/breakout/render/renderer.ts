/**
 * Breakout renderer — Canvas 2D, neon glass on a photo.
 *
 * Static layer: the author's photo (cover-fit, heavily blurred, dimmed,
 * vignetted) and the field frame, painted once per resize / photo load.
 * Dynamic pass: zones, obstacles, bricks (cached glow sprites), paddle, balls,
 * trails, particles. World units everywhere; the context transform does the
 * scaling.
 */
import { alpha, tint } from "../../shared/color";
import { Game, serveDirection } from "../engine/game";
import { LEVEL_DEFAULTS, paddleZoneTop } from "../engine/level";
import type { Ball, Brick, Level, Obstacle, Zone } from "../engine/types";
import { MOD_TINT, ZONE_LABEL, ZONE_TINT, tintOf, type NeonPalette, type Tint } from "./palette";
import type { BreakoutScene, FxColor, Particle } from "./scene";

const TAU = Math.PI * 2;
const BRICK_RADIUS = 4;
/** Padding around cached brick sprites so the glow is not clipped. */
const GLOW_PAD = 14;
/** Heavy photo blur, as a fraction of the shorter canvas side. */
const PHOTO_BLUR = 0.12;
/** Extra ink wash so neon bricks stay readable on a bright photo. */
const PHOTO_DIM_MIN = 0.22;
const PHOTO_DIM_MAX = 0.36;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

type Ctx = CanvasRenderingContext2D;

/** A rectangle in CSS pixels, relative to the canvas. */
export interface CssRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * How the canvas is laid out. The world is contain-fitted and centered inside
 * `fit` (default: the whole canvas); the photo, wash, and vignette cover the
 * whole canvas so a full-screen board reads as one image with the field in it.
 */
export interface Viewport {
  width: number;
  height: number;
  dpr: number;
  fit?: CssRect;
}

export class BreakoutRenderer {
  private readonly ctx: Ctx;
  private staticLayer: HTMLCanvasElement | null = null;
  private photo: HTMLImageElement | null = null;
  private photoSrc = "";
  private scale = 1;
  private dpr = 1;
  /** Where the world's origin sits on the canvas, device px. */
  private ox = 0;
  private oy = 0;
  private readonly brickCache = new Map<string, HTMLCanvasElement>();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly level: Level,
    private palette: NeonPalette,
    private readonly onPhoto?: () => void,
    private readonly guides = false,
  ) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Canvas 2D is not available");
    }
    this.ctx = ctx;
    this.loadPhoto(level.background.src);
  }

  get ready(): boolean {
    return this.staticLayer !== null;
  }

  /** Size to `cssWidth` CSS pixels at `dpr`; height follows the level ratio. */
  resize(cssWidth: number, dpr: number): void {
    this.view({ width: cssWidth, height: (cssWidth * this.level.height) / this.level.width, dpr });
  }

  /** Lay the world out inside a canvas of any size (see `Viewport`). */
  view(v: Viewport): void {
    const { level } = this;
    const fit = v.fit ?? { x: 0, y: 0, width: v.width, height: v.height };
    const scale = Math.min((fit.width * v.dpr) / level.width, (fit.height * v.dpr) / level.height);
    if (!(scale > 0)) return;
    const cw = Math.round(v.width * v.dpr);
    const ch = Math.round(v.height * v.dpr);
    const ox = Math.round(fit.x * v.dpr + (fit.width * v.dpr - level.width * scale) / 2);
    const oy = Math.round(fit.y * v.dpr + (fit.height * v.dpr - level.height * scale) / 2);
    if (
      this.staticLayer &&
      scale === this.scale &&
      cw === this.canvas.width &&
      ch === this.canvas.height &&
      ox === this.ox &&
      oy === this.oy
    ) {
      return;
    }
    if (scale !== this.scale) this.brickCache.clear();
    this.scale = scale;
    this.dpr = v.dpr;
    this.ox = ox;
    this.oy = oy;
    this.canvas.width = cw;
    this.canvas.height = ch;
    this.staticLayer = this.paintStatic();
  }

  /** World x for a CSS-pixel x measured from the canvas's left edge. */
  worldX(cssX: number): number {
    return (cssX * this.dpr - this.ox) / this.scale;
  }

  /** World y for a CSS-pixel y measured from the canvas's top edge. */
  worldY(cssY: number): number {
    return (cssY * this.dpr - this.oy) / this.scale;
  }

  /**
   * A world rectangle in CSS pixels, relative to the canvas's top-left. The
   * inverse of `worldX` for both axes: DOM overlays (a tutorial spotlight, an
   * editor handle) can sit on a brick, a zone, or the paddle.
   */
  cssRect(x: number, y: number, w: number, h: number): CssRect {
    const k = this.scale / this.dpr;
    return {
      x: (x * this.scale + this.ox) / this.dpr,
      y: (y * this.scale + this.oy) / this.dpr,
      width: w * k,
      height: h * k,
    };
  }

  /** Swap the author's photo at runtime (editor use). */
  setBackground(src: string): void {
    this.loadPhoto(src);
  }

  private loadPhoto(src: string): void {
    this.photoSrc = src;
    this.photo = null;
    if (!src) return;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (this.photoSrc !== src) return;
      this.photo = image;
      if (this.scale > 0) this.staticLayer = this.paintStatic();
      this.onPhoto?.();
    };
    image.onerror = () => {
      console.warn(`[breeq] background photo failed to load: ${src}`);
    };
    image.src = src;
  }

  // ---------------------------------------------------------------------------
  // Static layer
  // ---------------------------------------------------------------------------

  private paintStatic(): HTMLCanvasElement {
    const { level, palette: p, scale, ox, oy } = this;
    const layer = document.createElement("canvas");
    layer.width = this.canvas.width;
    layer.height = this.canvas.height;
    const ctx = layer.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");

    const { width, height, field: f, background: bg } = level;
    const cw = layer.width;
    const ch = layer.height;
    // The whole canvas, in world units (extends past the world when letterboxed).
    const all = { x: -ox / scale, y: -oy / scale, w: cw / scale, h: ch / scale };

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0b0d1a";
    ctx.fillRect(0, 0, cw, ch);

    if (this.photo) {
      const blurPx = Math.max(24, Math.round(Math.min(cw, ch) * PHOTO_BLUR) + bg.blur * scale);
      const wash = photoWash(this.photo, cw, ch, blurPx);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(wash, 0, 0, cw, ch);
    } else {
      ctx.setTransform(scale, 0, 0, scale, ox, oy);
      const g = ctx.createRadialGradient(width * 0.5, height * 0.35, 20, width * 0.5, height * 0.35, height * 0.8);
      g.addColorStop(0, alpha(p.neon.violet, 0.35));
      g.addColorStop(0.5, alpha(p.neon.blue, 0.12));
      g.addColorStop(1, "rgba(11, 13, 26, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(all.x, all.y, all.w, all.h);
    }

    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    const dim = Number.isFinite(bg.dim) ? Math.min(PHOTO_DIM_MAX, Math.max(PHOTO_DIM_MIN, bg.dim * 0.5)) : PHOTO_DIM_MIN;
    ctx.fillStyle = `rgba(6, 8, 18, ${dim})`;
    ctx.fillRect(all.x, all.y, all.w, all.h);
    const reach = Math.max(height * 0.82, Math.hypot(all.w, all.h) / 2);
    const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.34, width / 2, height / 2, reach);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.28)");
    ctx.fillStyle = vignette;
    ctx.fillRect(all.x, all.y, all.w, all.h);

    this.roundRect(ctx, f.left - 1, f.top - 1, f.right - f.left + 2, f.bottom - f.top + 2, 10);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(0, f.top - 7, width, 1);

    const danger = ctx.createLinearGradient(f.left, 0, f.right, 0);
    danger.addColorStop(0, alpha(p.danger, 0));
    danger.addColorStop(0.5, alpha(p.danger, 0.55));
    danger.addColorStop(1, alpha(p.danger, 0));
    ctx.fillStyle = danger;
    ctx.fillRect(f.left, f.bottom - 1, f.right - f.left, 1);

    return layer;
  }

  // ---------------------------------------------------------------------------
  // Dynamic pass
  // ---------------------------------------------------------------------------

  render(game: Game, scene: BreakoutScene): void {
    const { ctx, staticLayer, scale, level, palette: p, ox, oy } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!staticLayer) {
      ctx.fillStyle = "#0b0d1a";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    ctx.drawImage(staticLayer, 0, 0);

    const shakeX = scene.shake > 0.05 ? Math.sin(scene.time * 71) * scene.shake : 0;
    const shakeY = scene.shake > 0.05 ? Math.cos(scene.time * 53) * scene.shake * 0.6 : 0;
    ctx.setTransform(scale, 0, 0, scale, ox + shakeX * scale, oy + shakeY * scale);

    const state = game.state;
    const f = level.field;
    const t = scene.time;

    this.wallFlash(ctx, scene.wallFlash.left, f.left, f.top, 0, f.bottom - f.top, "v");
    this.wallFlash(ctx, scene.wallFlash.right, f.right, f.top, 0, f.bottom - f.top, "v");
    this.wallFlash(ctx, scene.wallFlash.top, f.left, f.top, f.right - f.left, 0, "h");

    if (this.guides) {
      this.paintEditorGuides(ctx);
    }

    for (const zone of game.zones) {
      this.zone(ctx, zone, scene.zonePulse.get(zone.id) ?? 0, t, state);
    }
    for (const o of game.obstacles) {
      this.obstacle(ctx, o, game, scene.obstaclePulse.get(o.id) ?? 0, t);
    }

    for (const pending of game.pending) {
      this.pendingBrick(ctx, pending.brick, Math.max(0, Math.min(1, 1 - (pending.at - state.time) / 6)));
    }
    for (const brick of game.bricks) {
      this.brick(ctx, brick, game, scene, t);
    }

    for (const ring of scene.rings) {
      const k = 1 - ring.life / ring.maxLife;
      const r = ring.r0 + (ring.r1 - ring.r0) * easeOut(k);
      ctx.strokeStyle = alpha(this.fx(ring.color), (1 - k) * 0.75);
      ctx.lineWidth = (ring.width ?? 1.5) * (1 - k) + 0.4;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, Math.max(0.5, r), 0, TAU);
      ctx.stroke();
    }

    this.paddle(ctx, game, scene);

    if (state.phase === "play" || state.phase === "serve") {
      for (const ball of state.balls) {
        if (game.inFog(ball.x, ball.y)) continue;
        this.ball(ctx, ball, game, scene);
      }
    }

    if (state.phase === "serve") this.serveAim(ctx, game, scene);

    this.particles(ctx, scene.particles);

    if (scene.lifeFlash > 0.02) {
      const g = ctx.createLinearGradient(0, f.bottom, 0, f.bottom - 160);
      g.addColorStop(0, alpha(p.danger, 0.55 * scene.lifeFlash));
      g.addColorStop(1, alpha(p.danger, 0));
      ctx.fillStyle = g;
      ctx.fillRect(f.left, f.bottom - 160, f.right - f.left, 160);
    }
    if (scene.clearFlash > 0.02) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * scene.clearFlash})`;
      ctx.fillRect(f.left, f.top, f.right - f.left, f.bottom - f.top);
    }
    if (scene.unlockFlash > 0.02 || scene.orderFlash > 0.02) {
      const k = Math.max(scene.unlockFlash, scene.orderFlash);
      ctx.fillStyle = alpha(p.neon.amber, 0.18 * k);
      ctx.fillRect(f.left, f.top, f.right - f.left, f.bottom - f.top);
    }
    // Timer running out: the frame breathes red.
    if (state.timeLeft !== null && state.timeLeft < 15 && state.phase === "play") {
      const k = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.strokeStyle = alpha(p.danger, 0.25 + 0.45 * k);
      ctx.lineWidth = 2;
      this.roundRect(ctx, f.left, f.top, f.right - f.left, f.bottom - f.top, 10);
      ctx.stroke();
    }
  }

  private wallFlash(ctx: Ctx, k: number, x: number, y: number, w: number, h: number, dir: "v" | "h"): void {
    if (k < 0.02) return;
    const size = 26;
    const g = dir === "v" ? ctx.createLinearGradient(x - size, 0, x + size, 0) : ctx.createLinearGradient(0, y - size, 0, y + size);
    g.addColorStop(0, "rgba(255, 255, 255, 0)");
    g.addColorStop(0.5, `rgba(255, 255, 255, ${0.28 * k})`);
    g.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    if (dir === "v") ctx.fillRect(x - size, y, size * 2, h);
    else ctx.fillRect(x, y - size, w, size * 2);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Zones
  // ---------------------------------------------------------------------------

  private zone(ctx: Ctx, zone: Zone, pulse: number, time: number, state: Game["state"]): void {
    const color = tintOf(this.palette, ZONE_TINT[zone.kind]);
    const breathe = 0.7 + 0.3 * Math.sin(time * 2.2 + zone.id);
    const r = zone.r * (1 + pulse * 0.25);
    const active =
      (state.speed.bonusKind !== null && state.speed.bonusKind === zone.kind) ||
      (state.paddleMod !== null && state.paddleMod.kind === zone.kind);

    if (zone.kind === "fog") {
      this.fog(ctx, zone, time);
      return;
    }

    ctx.save();
    const halo = ctx.createRadialGradient(zone.x, zone.y, r * 0.3, zone.x, zone.y, r * 2.2);
    halo.addColorStop(0, alpha(color, (active ? 0.4 : 0.22) * breathe + pulse * 0.4));
    halo.addColorStop(1, alpha(color, 0));
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = halo;
    ctx.fillRect(zone.x - r * 2.2, zone.y - r * 2.2, r * 4.4, r * 4.4);
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = alpha(color, 0.12 + pulse * 0.2);
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, r, 0, TAU);
    ctx.fill();

    this.neonShadow(ctx, alpha(color, 0.9), 10);
    ctx.strokeStyle = alpha(color, active ? 1 : 0.85);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, r, 0, TAU);
    ctx.stroke();
    this.clearShadow(ctx);

    // Rotating dashed outer ring; speed hints at the effect.
    const spin =
      zone.kind === "slow" ? 0.4 : zone.kind === "fast3" ? 2.4 : zone.kind === "fast2" ? 1.4 : zone.kind === "gravity" || zone.kind === "antigrav" ? 0.8 : 1;
    ctx.save();
    ctx.translate(zone.x, zone.y);
    ctx.rotate(time * spin * (zone.kind === "mirror" || zone.kind === "invert" ? -1 : 1));
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = alpha(color, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r + 5, 0, TAU);
    ctx.stroke();
    ctx.restore();

    const label = ZONE_LABEL[zone.kind];
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (label) {
      ctx.font = `600 ${Math.round(zone.r * 0.8)}px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, zone.x, zone.y + 0.5);
    } else {
      this.zoneGlyph(ctx, zone, color, time);
    }
    ctx.restore();
  }

  /** Vector glyphs for the zones that fonts render unreliably. */
  private zoneGlyph(ctx: Ctx, zone: Zone, color: string, time: number): void {
    const { x, y } = zone;
    const s = zone.r * 0.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 1.6;
    switch (zone.kind) {
      case "portal":
      case "fakePortal": {
        // Concentric rings, the inner one spinning.
        ctx.beginPath();
        ctx.arc(x, y, s * 0.9, 0, TAU);
        ctx.stroke();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 1.6);
        ctx.setLineDash([s * 0.5, s * 0.35]);
        ctx.strokeStyle = alpha(color, 1);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.45, 0, TAU);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case "mirror": {
        // Two opposed arrows.
        ctx.beginPath();
        ctx.moveTo(x - s, y - s * 0.35);
        ctx.lineTo(x + s * 0.6, y - s * 0.35);
        ctx.moveTo(x + s * 0.2, y - s * 0.8);
        ctx.lineTo(x + s * 0.6, y - s * 0.35);
        ctx.lineTo(x + s * 0.2, y + s * 0.1);
        ctx.moveTo(x + s, y + s * 0.4);
        ctx.lineTo(x - s * 0.6, y + s * 0.4);
        ctx.moveTo(x - s * 0.2, y - s * 0.05);
        ctx.lineTo(x - s * 0.6, y + s * 0.4);
        ctx.lineTo(x - s * 0.2, y + s * 0.85);
        ctx.stroke();
        break;
      }
      case "ice": {
        // Six-armed flake.
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (Math.PI / 3) * i;
          ctx.moveTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
          ctx.lineTo(x - Math.cos(a) * s, y - Math.sin(a) * s);
        }
        ctx.stroke();
        break;
      }
      case "sticky": {
        // A cup catching a dot.
        ctx.beginPath();
        ctx.arc(x, y + s * 0.1, s * 0.85, Math.PI * 0.1, Math.PI * 0.9, false);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.arc(x, y - s * 0.35, s * 0.28, 0, TAU);
        ctx.fill();
        break;
      }
      default:
        break;
    }
  }

  private fog(ctx: Ctx, zone: Zone, time: number): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i++) {
      const a = time * 0.35 + i * 2.1;
      const ox = Math.cos(a) * zone.r * 0.25;
      const oy = Math.sin(a * 1.3) * zone.r * 0.2;
      const g = ctx.createRadialGradient(zone.x + ox, zone.y + oy, 0, zone.x + ox, zone.y + oy, zone.r * 1.1);
      g.addColorStop(0, "rgba(255, 255, 255, 0.22)");
      g.addColorStop(0.6, "rgba(255, 255, 255, 0.08)");
      g.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(zone.x - zone.r * 1.4, zone.y - zone.r * 1.4, zone.r * 2.8, zone.r * 2.8);
    }
    ctx.restore();
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.r, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Obstacles
  // ---------------------------------------------------------------------------

  private obstacle(ctx: Ctx, o: Obstacle, game: Game, pulse: number, time: number): void {
    const p = this.palette;
    ctx.save();
    ctx.lineCap = "round";
    switch (o.kind) {
      case "bumper": {
        const color = p.neon.amber;
        const r = o.r * (1 + pulse * 0.18);
        const halo = ctx.createRadialGradient(o.x, o.y, r * 0.4, o.x, o.y, r * 2.4);
        halo.addColorStop(0, alpha(color, 0.3 + pulse * 0.5));
        halo.addColorStop(1, alpha(color, 0));
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = halo;
        ctx.fillRect(o.x - r * 2.4, o.y - r * 2.4, r * 4.8, r * 4.8);
        ctx.globalCompositeOperation = "source-over";
        const body = ctx.createRadialGradient(o.x - r * 0.3, o.y - r * 0.3, r * 0.1, o.x, o.y, r);
        body.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        body.addColorStop(0.5, alpha(tint(color, 0.3), 0.9));
        body.addColorStop(1, alpha(color, 0.85));
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(o.x, o.y, r, 0, TAU);
        ctx.fill();
        this.neonShadow(ctx, alpha(color, 0.9), 10);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        this.clearShadow(ctx);
        break;
      }
      case "rail": {
        this.neonShadow(ctx, "rgba(255, 255, 255, 0.7)", 8);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 + pulse * 0.15})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(o.x + o.w, o.y);
        ctx.stroke();
        this.clearShadow(ctx);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        for (const ex of [o.x, o.x + o.w]) {
          ctx.beginPath();
          ctx.arc(ex, o.y, 2.6, 0, TAU);
          ctx.fill();
        }
        break;
      }
      case "trampoline": {
        const color = p.neon.lime;
        const sag = 1 + pulse * 3;
        this.neonShadow(ctx, alpha(color, 0.9), 12);
        ctx.strokeStyle = alpha(tint(color, 0.2), 0.95);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.quadraticCurveTo(o.x + o.w / 2, o.y + sag * 2, o.x + o.w, o.y);
        ctx.stroke();
        this.clearShadow(ctx);
        // Springs.
        ctx.strokeStyle = alpha(color, 0.55);
        ctx.lineWidth = 1;
        const n = Math.max(3, Math.round(o.w / 22));
        for (let i = 0; i <= n; i++) {
          const x = o.x + (o.w / n) * i;
          ctx.beginPath();
          ctx.moveTo(x, o.y + 1);
          ctx.lineTo(x - 1.5, o.y + 4);
          ctx.lineTo(x + 1.5, o.y + 7);
          ctx.lineTo(x, o.y + 9);
          ctx.stroke();
        }
        break;
      }
      case "guard": {
        const gx = game.guardX(o, time);
        const x = gx - o.w / 2;
        const y = o.y - o.h / 2;
        this.neonShadow(ctx, alpha(p.steel, 0.6 + pulse * 0.4), 8);
        const g = ctx.createLinearGradient(0, y, 0, y + o.h);
        g.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        g.addColorStop(1, alpha(p.steel, 0.8));
        ctx.fillStyle = g;
        this.roundRect(ctx, x, y, o.w, o.h, o.h / 2);
        ctx.fill();
        this.clearShadow(ctx);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 0.8;
        for (let i = 1; i < 4; i++) {
          const lx = x + (o.w / 4) * i;
          ctx.beginPath();
          ctx.moveTo(lx, y + 2);
          ctx.lineTo(lx, y + o.h - 2);
          ctx.stroke();
        }
        // Track.
        ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(o.x - o.range - o.w / 2, o.y);
        ctx.lineTo(o.x + o.range + o.w / 2, o.y);
        ctx.stroke();
        break;
      }
      case "fan": {
        const color = p.neon.cyan;
        const x0 = o.dir > 0 ? o.x : o.x - o.reach;
        const y0 = o.y - o.spread / 2;
        // Corridor.
        const g = o.dir > 0 ? ctx.createLinearGradient(x0, 0, x0 + o.reach, 0) : ctx.createLinearGradient(x0 + o.reach, 0, x0, 0);
        g.addColorStop(0, alpha(color, 0.16));
        g.addColorStop(1, alpha(color, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x0, y0, o.reach, o.spread);
        // Streaks.
        ctx.strokeStyle = alpha(color, 0.5);
        ctx.lineWidth = 1;
        const lanes = 4;
        for (let i = 0; i < lanes; i++) {
          const ly = y0 + (o.spread / (lanes + 1)) * (i + 1);
          const phase = ((time * 90 + i * 37) % o.reach) / o.reach;
          const len = 14;
          const sx = o.dir > 0 ? x0 + phase * (o.reach - len) : x0 + o.reach - phase * (o.reach - len) - len;
          ctx.globalAlpha = 0.25 + 0.75 * (1 - phase);
          ctx.beginPath();
          ctx.moveTo(sx, ly);
          ctx.lineTo(sx + len, ly);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Housing with spinning blades.
        const hx = o.x;
        const hr = o.spread * 0.42;
        ctx.fillStyle = "rgba(20, 24, 40, 0.9)";
        ctx.beginPath();
        ctx.arc(hx, o.y, hr, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = alpha(color, 0.9);
        this.neonShadow(ctx, alpha(color, 0.8), 8);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        this.clearShadow(ctx);
        ctx.save();
        ctx.translate(hx, o.y);
        ctx.rotate(time * 9 * o.dir);
        ctx.fillStyle = alpha(tint(color, 0.4), 0.9);
        for (let i = 0; i < 3; i++) {
          ctx.rotate(TAU / 3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(hr * 0.6, -hr * 0.5, hr * 0.8, 0);
          ctx.quadraticCurveTo(hr * 0.4, hr * 0.25, 0, 0);
          ctx.fill();
        }
        ctx.restore();
        break;
      }
      case "blackhole": {
        const color = p.neon.violet;
        const reach = o.r * 2.5;
        const pull = ctx.createRadialGradient(o.x, o.y, o.r * 0.6, o.x, o.y, reach);
        pull.addColorStop(0, "rgba(0, 0, 0, 0.85)");
        pull.addColorStop(0.5, alpha(color, 0.18));
        pull.addColorStop(1, alpha(color, 0));
        ctx.fillStyle = pull;
        ctx.fillRect(o.x - reach, o.y - reach, reach * 2, reach * 2);
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, TAU);
        ctx.fill();
        // Accretion ring.
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(-time * 2.2);
        this.neonShadow(ctx, alpha(color, 0.9), 10);
        ctx.strokeStyle = alpha(tint(color, 0.25), 0.9 + pulse * 0.1);
        ctx.lineWidth = 1.6;
        ctx.setLineDash([o.r * 1.4, o.r * 0.6]);
        ctx.beginPath();
        ctx.ellipse(0, 0, o.r * 1.35, o.r * 1.05, 0, 0, TAU);
        ctx.stroke();
        this.clearShadow(ctx);
        ctx.restore();
        break;
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Bricks
  // ---------------------------------------------------------------------------

  private brick(ctx: Ctx, brick: Brick, game: Game, scene: BreakoutScene, time: number): void {
    const armored = game.isArmored(brick);
    const sprite = this.brickSprite(brick, armored);
    const cx = brick.x + brick.w / 2;
    const cy = brick.y + brick.h / 2;
    const p = this.palette;

    ctx.save();
    if (brick.kind === "ghost") {
      const open = game.ghostOpen(brick, time);
      const phase = (time / 4 + brick.id * 0.173) % 1;
      // Ease toward the edges of the open window so it fades, not pops.
      const edge = Math.min(Math.abs(phase - 0.6), Math.abs(phase - 1), Math.abs(phase)) / 0.08;
      const fade = Math.min(1, edge);
      ctx.globalAlpha = open ? 0.18 + 0.1 * (1 - fade) : 0.55 + 0.45 * fade;
    }
    if (brick.kind === "rotor") {
      ctx.translate(cx, cy);
      ctx.rotate(game.rotorAngle(brick, time));
      ctx.drawImage(sprite, -brick.w / 2 - GLOW_PAD, -brick.h / 2 - GLOW_PAD, brick.w + GLOW_PAD * 2, brick.h + GLOW_PAD * 2);
      ctx.restore();
      return;
    }
    ctx.drawImage(sprite, brick.x - GLOW_PAD, brick.y - GLOW_PAD, brick.w + GLOW_PAD * 2, brick.h + GLOW_PAD * 2);
    ctx.restore();

    // Dynamic extras.
    if (brick.kind === "explosive") {
      const k = 0.5 + 0.5 * Math.sin(time * 5 + brick.id);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, brick.h * 1.4);
      g.addColorStop(0, alpha(p.neon.amber, 0.35 * k));
      g.addColorStop(1, alpha(p.neon.amber, 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - brick.h * 1.4, cy - brick.h * 1.4, brick.h * 2.8, brick.h * 2.8);
      ctx.restore();
    } else if (brick.kind === "magnet") {
      ctx.save();
      ctx.strokeStyle = alpha(p.neon.blue, 0.22);
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const r = ((time * 18 + i * 24) % 72) + 8;
        ctx.globalAlpha = 1 - r / 80;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    } else if (brick.kind === "lock" && scene.unlockFlash > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = alpha(p.neon.amber, 0.6 * scene.unlockFlash);
      this.roundRect(ctx, brick.x, brick.y, brick.w, brick.h, BRICK_RADIUS);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Outline of a regen brick on its way back, with a progress arc. */
  private pendingBrick(ctx: Ctx, brick: Brick, progress: number): void {
    const color = this.palette.neon[brick.color];
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = alpha(color, 0.35);
    ctx.lineWidth = 1;
    this.roundRect(ctx, brick.x + 0.5, brick.y + 0.5, brick.w - 1, brick.h - 1, BRICK_RADIUS);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = alpha(color, 0.8);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.h * 0.32, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
    ctx.stroke();
    ctx.restore();
  }

  /** A glowing glass tile, cached per look at the current scale. */
  private brickSprite(brick: Brick, armored: boolean): HTMLCanvasElement {
    const cracked = (brick.kind === "hard" || brick.kind === "rotor") && brick.hp === 1;
    const key = `${brick.color}|${brick.kind}|${cracked ? "c" : "f"}|${armored ? "a" : "o"}|${brick.w}x${brick.h}`;
    const cached = this.brickCache.get(key);
    if (cached) return cached;

    const { scale, palette: p } = this;
    const w = brick.w + GLOW_PAD * 2;
    const h = brick.h + GLOW_PAD * 2;
    const sprite = document.createElement("canvas");
    sprite.width = Math.ceil(w * scale);
    sprite.height = Math.ceil(h * scale);
    const ctx = sprite.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const x = GLOW_PAD;
    const y = GLOW_PAD;
    const steelLook = brick.kind === "steel" || (brick.kind === "lock" && armored);
    const dim = armored && !steelLook; // order rule: colored but locked
    const color = steelLook ? p.steel : p.neon[brick.color];
    const bodyAlpha = dim ? 0.3 : 1;

    // Glow: the tile's own silhouette, softened, laid under the body. Only the
    // falloff shows past the edge, so the glass stays crisp and readable —
    // ambient light behind the brick, not a brighter brick.
    const glowWorld = steelLook ? 6 : dim ? 4 : 12;
    const peak = steelLook ? 0.35 : dim ? 0.18 : 0.62;
    const silhouette = smoothCanvas(sprite.width, sprite.height);
    const sctx = silhouette.getContext("2d")!;
    sctx.setTransform(scale, 0, 0, scale, 0, 0);
    sctx.fillStyle = alpha(color, peak);
    this.roundRect(sctx, x - 1.5, y - 1.5, brick.w + 3, brick.h + 3, BRICK_RADIUS + 1.5);
    sctx.fill();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bloom(silhouette, glowWorld * scale), 0, 0, sprite.width, sprite.height);
    ctx.restore();

    // Glass body.
    const g = ctx.createLinearGradient(0, y, 0, y + brick.h);
    if (steelLook) {
      g.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      g.addColorStop(1, alpha(color, 0.35));
    } else {
      g.addColorStop(0, alpha(tint(color, 0.45), bodyAlpha));
      g.addColorStop(0.55, alpha(color, bodyAlpha));
      g.addColorStop(1, alpha(color, 0.85 * bodyAlpha));
    }
    ctx.fillStyle = g;
    this.roundRect(ctx, x, y, brick.w, brick.h, BRICK_RADIUS);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 255, 255, ${dim ? 0.3 : 0.55})`;
    ctx.lineWidth = 0.8;
    this.roundRect(ctx, x + 0.5, y + 0.5, brick.w - 1, brick.h - 1, BRICK_RADIUS - 0.5);
    ctx.stroke();
    const hl = ctx.createLinearGradient(0, y, 0, y + brick.h * 0.5);
    hl.addColorStop(0, `rgba(255, 255, 255, ${dim ? 0.2 : 0.45})`);
    hl.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = hl;
    this.roundRect(ctx, x + 1.5, y + 1, brick.w - 3, brick.h * 0.5, BRICK_RADIUS - 1);
    ctx.fill();

    const cx = x + brick.w / 2;
    const cy = y + brick.h / 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const ink = "rgba(255, 255, 255, 0.92)";
    const dark = "rgba(10, 12, 26, 0.6)";

    switch (brick.kind) {
      case "hard":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 1;
        this.roundRect(ctx, x + 3.5, y + 3.5, brick.w - 7, brick.h - 7, 2);
        ctx.stroke();
        break;
      case "steel":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 0.8;
        for (let i = 1; i < 4; i++) {
          const lx = x + (brick.w / 4) * i;
          ctx.beginPath();
          ctx.moveTo(lx, y + 3);
          ctx.lineTo(lx, y + brick.h - 3);
          ctx.stroke();
        }
        break;
      case "explosive": {
        // Eight-point star.
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI / 4) * i;
          const r = i % 2 === 0 ? 5.5 : 3.2;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.6, 0, TAU);
        ctx.fill();
        break;
      }
      case "ghost":
        ctx.setLineDash([2, 2.5]);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x + 3.5, y + 3.5, brick.w - 7, brick.h - 7, 2);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case "regen": {
        // Circular arrow.
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(cx, cy, 4.2, -Math.PI * 0.1, Math.PI * 1.55);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 5.2, cy - 3.6);
        ctx.lineTo(cx + 4.4, cy - 0.4);
        ctx.lineTo(cx + 1.3, cy - 1.8);
        ctx.stroke();
        break;
      }
      case "magnet": {
        // Horseshoe.
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(cx, cy - 1, 4.2, Math.PI, 0, false);
        ctx.moveTo(cx - 4.2, cy - 1);
        ctx.lineTo(cx - 4.2, cy + 3.5);
        ctx.moveTo(cx + 4.2, cy - 1);
        ctx.lineTo(cx + 4.2, cy + 3.5);
        ctx.stroke();
        ctx.strokeStyle = dark;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx - 4.2, cy + 2.2);
        ctx.lineTo(cx - 4.2, cy + 3.5);
        ctx.moveTo(cx + 4.2, cy + 2.2);
        ctx.lineTo(cx + 4.2, cy + 3.5);
        ctx.stroke();
        break;
      }
      case "rotor": {
        // Hub and pivot marks.
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.arc(cx, cy, 3.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.4, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 5, cy);
        ctx.lineTo(cx - 5, cy);
        ctx.moveTo(cx + 5, cy);
        ctx.lineTo(x + brick.w - 5, cy);
        ctx.stroke();
        break;
      }
      case "key": {
        // Ring + shaft with two teeth.
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx - 5, cy, 3, 0, TAU);
        ctx.moveTo(cx - 2, cy);
        ctx.lineTo(cx + 7, cy);
        ctx.moveTo(cx + 4, cy);
        ctx.lineTo(cx + 4, cy + 3);
        ctx.moveTo(cx + 7, cy);
        ctx.lineTo(cx + 7, cy + 3);
        ctx.stroke();
        break;
      }
      case "lock": {
        // Padlock: shackle + body.
        ctx.strokeStyle = armored ? dark : ink;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx, cy - 1.5, 3, Math.PI, 0, false);
        ctx.stroke();
        ctx.fillStyle = armored ? dark : ink;
        this.roundRect(ctx, cx - 4.5, cy - 1.5, 9, 6, 1.2);
        ctx.fill();
        if (!armored) {
          ctx.fillStyle = dark;
          ctx.beginPath();
          ctx.arc(cx, cy + 1.5, 1.1, 0, TAU);
          ctx.fill();
        }
        break;
      }
      default:
        break;
    }

    if (cracked) {
      ctx.strokeStyle = dark;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(x + brick.w * 0.34, y + 1);
      ctx.lineTo(x + brick.w * 0.47, y + brick.h * 0.5);
      ctx.lineTo(x + brick.w * 0.58, y + brick.h - 1);
      ctx.moveTo(x + brick.w * 0.47, y + brick.h * 0.5);
      ctx.lineTo(x + brick.w * 0.7, y + brick.h * 0.38);
      ctx.stroke();
    }

    this.brickCache.set(key, sprite);
    return sprite;
  }

  // ---------------------------------------------------------------------------
  // Paddle, balls, particles
  // ---------------------------------------------------------------------------

  private paddle(ctx: Ctx, game: Game, scene: BreakoutScene): void {
    const { level } = this;
    const s = game.state;
    const width = s.paddleWidth;
    const pd = level.paddle;
    const x = s.paddleX - width / 2;
    const y = pd.y;
    const accent = s.paddleMod ? tintOf(this.palette, MOD_TINT[s.paddleMod.kind]) : this.speedColor(game);
    const iced = s.paddleMod?.kind === "ice";

    ctx.save();
    this.neonShadow(ctx, alpha(accent, 0.9), 14 + scene.paddleFlash * 18);
    ctx.fillStyle = alpha(accent, 0.9);
    this.roundRect(ctx, x + 3, y + pd.height - 3, width - 6, 3, 1.5);
    ctx.fill();
    this.clearShadow(ctx);

    const g = ctx.createLinearGradient(0, y, 0, y + pd.height);
    g.addColorStop(0, iced ? "rgba(225, 250, 255, 0.98)" : "rgba(255, 255, 255, 0.96)");
    g.addColorStop(1, iced ? alpha(this.palette.neon.cyan, 0.6) : "rgba(225, 230, 245, 0.88)");
    ctx.fillStyle = g;
    this.roundRect(ctx, x, y, width, pd.height, pd.height / 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    if (s.paddleMod?.kind === "sticky") {
      ctx.fillStyle = alpha(accent, 0.55);
      for (let i = 0; i < 5; i++) {
        const px = x + width * (0.15 + 0.175 * i);
        ctx.beginPath();
        ctx.arc(px, y + 1.5, 1.2, 0, TAU);
        ctx.fill();
      }
    }
    if (scene.paddleFlash > 0.02) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = alpha(accent, 0.5 * scene.paddleFlash);
      this.roundRect(ctx, x, y, width, pd.height, pd.height / 2);
      ctx.fill();
    }
    // Mod timer: a thin arc of time left under the paddle.
    if (s.paddleMod) {
      const total = { shrink: 8, grow: 8, invert: 5, ice: 6, sticky: 6 }[s.paddleMod.kind];
      const k = Math.max(0, Math.min(1, s.paddleMod.left / total));
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = alpha(accent, 0.8);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + pd.height + 5);
      ctx.lineTo(x + 4 + (width - 8) * k, y + pd.height + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  private ball(ctx: Ctx, ball: Ball, game: Game, scene: BreakoutScene): void {
    const s = game.state;
    const r = this.level.ball.r * (ball.ttl !== null ? 0.85 : 1);
    const accent = ball.ttl !== null ? this.palette.neon.pink : this.speedColor(game);
    const mul = s.speed.total;

    if (s.phase === "play" && ball.stuck === null) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const pt of scene.trail) {
        if (pt.id !== ball.id) continue;
        const age = scene.time - pt.t;
        const k = 1 - Math.min(1, age / 0.14);
        if (k <= 0 || game.inFog(pt.x, pt.y)) continue;
        ctx.fillStyle = alpha(accent, 0.35 * k * k * Math.min(1.6, 0.6 + mul * 0.4));
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r * (0.25 + 0.75 * k), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    const ar = r * (2.6 + mul * 0.5);
    const aura = ctx.createRadialGradient(ball.x, ball.y, r * 0.4, ball.x, ball.y, ar);
    aura.addColorStop(0, alpha(accent, 0.55));
    aura.addColorStop(1, alpha(accent, 0));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = aura;
    ctx.fillRect(ball.x - ar, ball.y - ar, ar * 2, ar * 2);
    ctx.restore();

    const core = ctx.createRadialGradient(ball.x - r * 0.3, ball.y - r * 0.3, r * 0.1, ball.x, ball.y, r);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(0.7, "#f4f6ff");
    core.addColorStop(1, tint(accent, 0.35));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r, 0, TAU);
    ctx.fill();

    // Clone: countdown ring.
    if (ball.ttl !== null) {
      ctx.strokeStyle = alpha(accent, 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, r + 2.5, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, ball.ttl / 6));
      ctx.stroke();
    }
  }

  /** Dotted serve ray: where the ball will fly if the player launches now. */
  private serveAim(ctx: Ctx, game: Game, scene: BreakoutScene): void {
    const aim = scene.aim;
    if (!aim) return;
    const ball = game.state.balls[0];
    if (!ball) return;
    const { dx, dy } = serveDirection(ball.x, ball.y, aim.x, aim.y);
    const r = this.level.ball.r;
    const f = this.level.field;
    const ox = ball.x + dx * (r + 4);
    const oy = ball.y + dy * (r + 4);
    let maxT = 108;
    if (dx > 0.001) maxT = Math.min(maxT, (f.right - 6 - ox) / dx);
    if (dx < -0.001) maxT = Math.min(maxT, (f.left + 6 - ox) / dx);
    if (dy > 0.001) maxT = Math.min(maxT, (f.bottom - 6 - oy) / dy);
    if (dy < -0.001) maxT = Math.min(maxT, (f.top + 6 - oy) / dy);
    if (maxT < 8) return;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const n = 8;
    for (let i = 0; i < n; i++) {
      const u = (i + 1) / (n + 1);
      const k = 1 - i / n;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.18 + 0.5 * k})`;
      ctx.beginPath();
      ctx.arc(ox + dx * maxT * u, oy + dy * maxT * u, 1.05 + 0.55 * k, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  private particles(ctx: Ctx, particles: Particle[]): void {
    ctx.save();
    for (const q of particles) {
      const k = Math.max(0, q.life / q.maxLife);
      const color = this.fx(q.color);
      if (q.kind === "spark" || q.kind === "dust") {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = alpha(color, 0.9 * k);
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (0.4 + 0.6 * k), 0, TAU);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.spin * (1 - k));
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = alpha(color, 0.35 * k);
        this.roundRect(ctx, -q.size * 0.8, -q.size * 0.55, q.size * 1.6, q.size * 1.1, 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = alpha(tint(color, 0.25), Math.min(1, k * 1.6));
        this.roundRect(ctx, -q.size / 2, -q.size / 3, q.size, q.size * 0.66, 1);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  private paintEditorGuides(ctx: Ctx): void {
    const { level, palette: p } = this;
    const f = level.field;
    const keepOut = paddleZoneTop(level);
    const { w, h, gap } = LEVEL_DEFAULTS.brick;
    const stepX = w + gap;
    const stepY = h + gap;
    const cols = Math.floor((f.right - f.left + gap) / stepX);
    const rows = Math.floor((keepOut - f.top + gap) / stepY);

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.6;
    const gridBottom = f.top + rows * stepY;
    const gridRight = f.left + cols * stepX;
    ctx.beginPath();
    for (let col = 0; col <= cols; col += 1) {
      const x = f.left + col * stepX;
      ctx.moveTo(x, f.top);
      ctx.lineTo(x, gridBottom);
    }
    for (let row = 0; row <= rows; row += 1) {
      const y = f.top + row * stepY;
      ctx.moveTo(f.left, y);
      ctx.lineTo(gridRight, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 0.5;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        this.roundRect(ctx, f.left + col * stepX, f.top + row * stepY, w, h, 2);
        ctx.stroke();
      }
    }

    const zoneH = f.bottom - keepOut;
    if (zoneH > 0) {
      const wash = ctx.createLinearGradient(0, keepOut, 0, f.bottom);
      wash.addColorStop(0, alpha(p.danger, 0.22));
      wash.addColorStop(1, alpha(p.danger, 0.08));
      ctx.fillStyle = wash;
      ctx.fillRect(f.left, keepOut, f.right - f.left, zoneH);
      ctx.strokeStyle = alpha(p.danger, 0.7);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(f.left, keepOut);
      ctx.lineTo(f.right, keepOut);
      ctx.stroke();
      ctx.fillStyle = alpha(p.danger, 0.85);
      ctx.font = `600 9px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Paddle zone", (f.left + f.right) / 2, keepOut + Math.min(18, zoneH / 2));
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private speedColor(game: Game): string {
    const { neon } = this.palette;
    const sp = game.state.speed;
    if (sp.bonusKind) return tintOf(this.palette, ZONE_TINT[sp.bonusKind]);
    if (sp.heat >= 5) return neon.amber;
    if (sp.total > 1.15) return neon.violet;
    return neon.cyan;
  }

  private fx(c: FxColor): string {
    return tintOf(this.palette, c as Tint);
  }

  /**
   * A glow of `blurWorld` world units. Both engines blur in device space and
   * ignore the transform, so the radius carries the scale; the hairline
   * offset is there for older WebKit, which skips a shadow sitting exactly
   * under its shape.
   */
  private neonShadow(ctx: Ctx, color: string, blurWorld: number): void {
    ctx.shadowColor = color;
    ctx.shadowBlur = blurWorld * this.scale;
    ctx.shadowOffsetX = 0.01;
    ctx.shadowOffsetY = 0.01;
  }

  private clearShadow(ctx: Ctx): void {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  private roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
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
}

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

function smoothCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return canvas;
}

/**
 * A translucent canvas blurred by roughly `radius` device pixels, same size
 * as the source. The same trick as the photo wash, for sprites: average down
 * in halves to about one sample per `radius`, then let bilinear interpolation
 * carry it back up in doublings. Reads like a gaussian, runs on every engine
 * (WebKit has no canvas `filter`, and `shadowBlur` scales with the transform),
 * and keeps the alpha falloff smooth all the way to zero.
 */
function bloom(src: HTMLCanvasElement, radius: number): HTMLCanvasElement {
  const factor = Math.max(2, radius);
  const tw = Math.max(2, Math.round(src.width / factor));
  const th = Math.max(2, Math.round(src.height / factor));

  let stage = src;
  while (stage.width > tw * 2 && stage.height > th * 2) {
    const next = smoothCanvas(Math.max(tw, stage.width / 2), Math.max(th, stage.height / 2));
    next.getContext("2d")!.drawImage(stage, 0, 0, next.width, next.height);
    stage = next;
  }
  const thumb = smoothCanvas(tw, th);
  thumb.getContext("2d")!.drawImage(stage, 0, 0, tw, th);

  let up = thumb;
  while (up.width * 2 <= src.width && up.height * 2 <= src.height) {
    const next = smoothCanvas(up.width * 2, up.height * 2);
    next.getContext("2d")!.drawImage(up, 0, 0, next.width, next.height);
    up = next;
  }
  const out = smoothCanvas(src.width, src.height);
  out.getContext("2d")!.drawImage(up, 0, 0, out.width, out.height);
  return out;
}

/**
 * The author's photo, cover-cropped to `cw × ch` and blurred by roughly
 * `radius` device pixels. Returned small: the caller stretches it over the
 * whole canvas, which is the last step of the blur.
 *
 * `ctx.filter = "blur()"` cannot do this: WebKit has never shipped canvas
 * filters, so every iPhone fell through to the sharp photo at full
 * brightness, edge to edge, with the neon lost on top of it. Averaging the
 * image down in halves and letting the browser interpolate on the way back
 * up blurs on every engine — and asks a phone for far less work than a
 * 100px gaussian over a full-screen canvas.
 */
function photoWash(img: HTMLImageElement, cw: number, ch: number, radius: number): HTMLCanvasElement {
  // A bilinear stretch reads like a gaussian of about half the scale factor.
  const factor = Math.max(2, radius * 2);
  const tw = Math.max(3, Math.round(cw / factor));
  const th = Math.max(3, Math.round(ch / factor));

  const cover = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const sw = Math.min(img.naturalWidth, cw / cover);
  const sh = Math.min(img.naturalHeight, ch / cover);
  let stage = smoothCanvas(Math.min(cw, tw * 8), Math.min(ch, th * 8));
  stage
    .getContext("2d")!
    .drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, stage.width, stage.height);

  // Halving averages; one giant downscale aliases into speckles instead.
  while (stage.width > tw * 2 && stage.height > th * 2) {
    const next = smoothCanvas(Math.max(tw, stage.width / 2), Math.max(th, stage.height / 2));
    next.getContext("2d")!.drawImage(stage, 0, 0, next.width, next.height);
    stage = next;
  }
  const thumb = smoothCanvas(tw, th);
  thumb.getContext("2d")!.drawImage(stage, 0, 0, tw, th);

  // Back up once here, once in the caller: a single huge stretch creases.
  const wash = smoothCanvas(Math.min(cw, tw * 8), Math.min(ch, th * 8));
  wash.getContext("2d")!.drawImage(thumb, 0, 0, wash.width, wash.height);
  return wash;
}

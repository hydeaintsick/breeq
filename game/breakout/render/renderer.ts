/**
 * Breakout renderer — Canvas 2D, neon glass on a photo.
 *
 * Static layer: the author's photo (cover-fit, dimmed, vignetted) and the
 * field frame, painted once per resize / photo load. Dynamic pass: bricks
 * (cached glow sprites), bonus zones, paddle, ball, trail, particles.
 * World units everywhere; the context transform does the scaling.
 */
import { alpha, tint } from "../../shared/color";
import type { Game } from "../engine/game";
import type { Bonus, Brick, BrickColor, Level } from "../engine/types";
import { BONUS_COLOR, BONUS_LABEL, type NeonPalette } from "./palette";
import type { BreakoutScene, Particle } from "./scene";

const TAU = Math.PI * 2;
const BRICK_RADIUS = 4;
/** Padding around cached brick sprites so the glow is not clipped. */
const GLOW_PAD = 14;

export class BreakoutRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private staticLayer: HTMLCanvasElement | null = null;
  private photo: HTMLImageElement | null = null;
  private photoSrc = "";
  private scale = 1;
  private readonly brickCache = new Map<string, HTMLCanvasElement>();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly level: Level,
    private palette: NeonPalette,
    private readonly onPhoto?: () => void,
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
    const scale = (cssWidth * dpr) / this.level.width;
    if (scale === this.scale && this.staticLayer) return;
    this.scale = scale;
    this.canvas.width = Math.round(this.level.width * scale);
    this.canvas.height = Math.round(this.level.height * scale);
    this.brickCache.clear();
    this.staticLayer = this.paintStatic();
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
      console.warn(`[kot] background photo failed to load: ${src}`);
    };
    image.src = src;
  }

  // ---------------------------------------------------------------------------
  // Static layer
  // ---------------------------------------------------------------------------

  private paintStatic(): HTMLCanvasElement {
    const { level, palette: p, scale } = this;
    const layer = document.createElement("canvas");
    layer.width = this.canvas.width;
    layer.height = this.canvas.height;
    const ctx = layer.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const { width, height, field: f, background: bg } = level;

    // Base: deep navy so the photo's dark areas never go to pure black.
    ctx.fillStyle = "#0b0d1a";
    ctx.fillRect(0, 0, width, height);

    if (this.photo) {
      const img = this.photo;
      const s = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.save();
      if (bg.blur > 0 && "filter" in ctx) ctx.filter = `blur(${bg.blur}px)`;
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      ctx.restore();
    } else {
      // Placeholder while the photo loads: soft color bloom.
      const g = ctx.createRadialGradient(width * 0.5, height * 0.35, 20, width * 0.5, height * 0.35, height * 0.8);
      g.addColorStop(0, alpha(p.neon.violet, 0.35));
      g.addColorStop(0.5, alpha(p.neon.blue, 0.12));
      g.addColorStop(1, "rgba(11, 13, 26, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }

    // Dim so bricks read on top; keep the top a touch lighter for the HUD.
    ctx.fillStyle = `rgba(6, 8, 18, ${bg.dim})`;
    ctx.fillRect(0, 0, width, height);
    const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, height * 0.78);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Field frame: a glass hairline.
    this.roundRect(ctx, f.left - 1, f.top - 1, f.right - f.left + 2, f.bottom - f.top + 2, 10);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // HUD hairline.
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(0, f.top - 7, width, 1);

    // Danger line above the bottom edge.
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
    const { ctx, staticLayer, scale, level, palette: p } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!staticLayer) {
      ctx.fillStyle = "#0b0d1a";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    ctx.drawImage(staticLayer, 0, 0);

    // Screen shake.
    const shakeX = scene.shake > 0.05 ? Math.sin(scene.time * 71) * scene.shake : 0;
    const shakeY = scene.shake > 0.05 ? Math.cos(scene.time * 53) * scene.shake * 0.6 : 0;
    ctx.setTransform(scale, 0, 0, scale, shakeX * scale, shakeY * scale);

    const state = game.state;
    const f = level.field;

    // Wall flashes.
    this.wallFlash(ctx, scene.wallFlash.left, f.left, f.top, 0, f.bottom - f.top, "v");
    this.wallFlash(ctx, scene.wallFlash.right, f.right, f.top, 0, f.bottom - f.top, "v");
    this.wallFlash(ctx, scene.wallFlash.top, f.left, f.top, f.right - f.left, 0, "h");

    // Bonus zones.
    for (const zone of game.bonuses) {
      this.bonus(ctx, zone, scene.bonusPulse.get(zone.id) ?? 0, scene.time, state.speed.bonusKind === zone.kind);
    }

    // Bricks.
    for (const brick of game.bricks) {
      const sprite = this.brickSprite(brick);
      ctx.drawImage(
        sprite,
        brick.x - GLOW_PAD,
        brick.y - GLOW_PAD,
        brick.w + GLOW_PAD * 2,
        brick.h + GLOW_PAD * 2,
      );
    }

    // Rings (impacts).
    for (const ring of scene.rings) {
      const k = 1 - ring.life / ring.maxLife;
      const r = ring.r0 + (ring.r1 - ring.r0) * easeOut(k);
      ctx.strokeStyle = alpha(this.color(ring.color), (1 - k) * 0.7);
      ctx.lineWidth = 1.5 * (1 - k) + 0.4;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, r, 0, TAU);
      ctx.stroke();
    }

    // Paddle.
    this.paddle(ctx, game, scene);

    // Trail + ball.
    if (state.phase === "play" || state.phase === "serve") {
      this.ball(ctx, game, scene);
    }

    // Particles.
    this.particles(ctx, scene.particles);

    // Life lost: red wash from the bottom.
    if (scene.lifeFlash > 0.02) {
      const g = ctx.createLinearGradient(0, f.bottom, 0, f.bottom - 160);
      g.addColorStop(0, alpha(p.danger, 0.55 * scene.lifeFlash));
      g.addColorStop(1, alpha(p.danger, 0));
      ctx.fillStyle = g;
      ctx.fillRect(f.left, f.bottom - 160, f.right - f.left, 160);
    }
    // Cleared: white bloom.
    if (scene.clearFlash > 0.02) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * scene.clearFlash})`;
      ctx.fillRect(f.left, f.top, f.right - f.left, f.bottom - f.top);
    }
  }

  private wallFlash(
    ctx: CanvasRenderingContext2D,
    k: number,
    x: number,
    y: number,
    w: number,
    h: number,
    dir: "v" | "h",
  ): void {
    if (k < 0.02) return;
    const size = 26;
    const g =
      dir === "v"
        ? ctx.createLinearGradient(x - size, 0, x + size, 0)
        : ctx.createLinearGradient(0, y - size, 0, y + size);
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

  private bonus(ctx: CanvasRenderingContext2D, zone: Bonus, pulse: number, time: number, active: boolean): void {
    const color = this.palette.neon[BONUS_COLOR[zone.kind]];
    const breathe = 0.7 + 0.3 * Math.sin(time * 2.2 + zone.id);
    const r = zone.r * (1 + pulse * 0.25);

    ctx.save();
    // Soft halo.
    const halo = ctx.createRadialGradient(zone.x, zone.y, r * 0.3, zone.x, zone.y, r * 2.2);
    halo.addColorStop(0, alpha(color, (active ? 0.4 : 0.22) * breathe + pulse * 0.4));
    halo.addColorStop(1, alpha(color, 0));
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = halo;
    ctx.fillRect(zone.x - r * 2.2, zone.y - r * 2.2, r * 4.4, r * 4.4);
    ctx.globalCompositeOperation = "source-over";

    // Glass disc.
    ctx.fillStyle = alpha(color, 0.12 + pulse * 0.2);
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, r, 0, TAU);
    ctx.fill();

    // Neon ring.
    ctx.shadowColor = alpha(color, 0.9);
    ctx.shadowBlur = 10 * this.scale;
    ctx.strokeStyle = alpha(color, active ? 1 : 0.85);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, r, 0, TAU);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rotating dashed outer ring.
    ctx.save();
    ctx.translate(zone.x, zone.y);
    ctx.rotate(time * (zone.kind === "slow" ? 0.4 : zone.kind === "fast2" ? 1.4 : 2.4));
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = alpha(color, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r + 5, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // Label.
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.font = `600 ${Math.round(zone.r * 0.8)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(BONUS_LABEL[zone.kind], zone.x, zone.y + 0.5);
    ctx.restore();
  }

  private paddle(ctx: CanvasRenderingContext2D, game: Game, scene: BreakoutScene): void {
    const { level } = this;
    const s = game.state;
    const pd = level.paddle;
    const x = s.paddleX - pd.width / 2;
    const y = pd.y;
    const accent = this.speedColor(game);

    ctx.save();
    // Neon underglow.
    ctx.shadowColor = alpha(accent, 0.9);
    ctx.shadowBlur = (14 + scene.paddleFlash * 18) * this.scale;
    ctx.fillStyle = alpha(accent, 0.9);
    this.roundRect(ctx, x + 3, y + pd.height - 3, pd.width - 6, 3, 1.5);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glass body.
    const g = ctx.createLinearGradient(0, y, 0, y + pd.height);
    g.addColorStop(0, "rgba(255, 255, 255, 0.96)");
    g.addColorStop(1, "rgba(225, 230, 245, 0.88)");
    ctx.fillStyle = g;
    this.roundRect(ctx, x, y, pd.width, pd.height, pd.height / 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Hit flash.
    if (scene.paddleFlash > 0.02) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = alpha(accent, 0.5 * scene.paddleFlash);
      this.roundRect(ctx, x, y, pd.width, pd.height, pd.height / 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private ball(ctx: CanvasRenderingContext2D, game: Game, scene: BreakoutScene): void {
    const s = game.state;
    const r = this.level.ball.r;
    const accent = this.speedColor(game);
    const mul = s.speed.total;

    // Trail, wider and longer when fast.
    if (scene.trail.length > 1 && s.phase === "play") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const pt of scene.trail) {
        const age = scene.time - pt.t;
        const k = 1 - Math.min(1, age / 0.14);
        if (k <= 0) continue;
        ctx.fillStyle = alpha(accent, 0.35 * k * k * Math.min(1.6, 0.6 + mul * 0.4));
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r * (0.25 + 0.75 * k), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    // Aura.
    const aura = ctx.createRadialGradient(s.ball.x, s.ball.y, r * 0.4, s.ball.x, s.ball.y, r * (2.6 + mul * 0.5));
    aura.addColorStop(0, alpha(accent, 0.55));
    aura.addColorStop(1, alpha(accent, 0));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = aura;
    const ar = r * (2.6 + mul * 0.5);
    ctx.fillRect(s.ball.x - ar, s.ball.y - ar, ar * 2, ar * 2);
    ctx.restore();

    // Core.
    const core = ctx.createRadialGradient(s.ball.x - r * 0.3, s.ball.y - r * 0.3, r * 0.1, s.ball.x, s.ball.y, r);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(0.7, "#f4f6ff");
    core.addColorStop(1, tint(accent, 0.35));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, r, 0, TAU);
    ctx.fill();
  }

  private particles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
    ctx.save();
    for (const q of particles) {
      const k = Math.max(0, q.life / q.maxLife);
      const color = this.color(q.color);
      if (q.kind === "spark") {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = alpha(color, 0.9 * k);
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (0.4 + 0.6 * k), 0, TAU);
        ctx.fill();
      } else {
        // Shards: no shadowBlur (too costly per particle on phones); a
        // slightly larger additive pass underneath reads as glow.
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

  // ---------------------------------------------------------------------------
  // Sprites and helpers
  // ---------------------------------------------------------------------------

  /** A glowing glass tile, cached per look at the current scale. */
  private brickSprite(brick: Brick): HTMLCanvasElement {
    const cracked = brick.kind === "hard" && brick.hp === 1;
    const key = `${brick.color}|${brick.kind}|${cracked ? "c" : "f"}|${brick.w}x${brick.h}`;
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
    const steel = brick.kind === "steel";
    const color = steel ? p.steel : p.neon[brick.color];

    // Glow.
    ctx.save();
    ctx.shadowColor = alpha(color, steel ? 0.35 : 0.85);
    ctx.shadowBlur = (steel ? 6 : 12) * scale;
    ctx.fillStyle = alpha(color, steel ? 0.5 : 0.95);
    this.roundRect(ctx, x, y, brick.w, brick.h, BRICK_RADIUS);
    ctx.fill();
    ctx.restore();

    // Glass body.
    const g = ctx.createLinearGradient(0, y, 0, y + brick.h);
    if (steel) {
      g.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      g.addColorStop(1, alpha(color, 0.35));
    } else {
      g.addColorStop(0, tint(color, 0.45));
      g.addColorStop(0.55, color);
      g.addColorStop(1, alpha(color, 0.85));
    }
    ctx.fillStyle = g;
    this.roundRect(ctx, x, y, brick.w, brick.h, BRICK_RADIUS);
    ctx.fill();

    // Top highlight and edge.
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 0.8;
    this.roundRect(ctx, x + 0.5, y + 0.5, brick.w - 1, brick.h - 1, BRICK_RADIUS - 0.5);
    ctx.stroke();
    const hl = ctx.createLinearGradient(0, y, 0, y + brick.h * 0.5);
    hl.addColorStop(0, "rgba(255, 255, 255, 0.45)");
    hl.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = hl;
    this.roundRect(ctx, x + 1.5, y + 1, brick.w - 3, brick.h * 0.5, BRICK_RADIUS - 1);
    ctx.fill();

    // Hard: inner frame. Cracked: a fracture line.
    if (brick.kind === "hard") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1;
      this.roundRect(ctx, x + 3.5, y + 3.5, brick.w - 7, brick.h - 7, 2);
      ctx.stroke();
      if (cracked) {
        ctx.strokeStyle = "rgba(10, 12, 26, 0.6)";
        ctx.lineWidth = 0.9;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x + brick.w * 0.34, y + 1);
        ctx.lineTo(x + brick.w * 0.47, y + brick.h * 0.5);
        ctx.lineTo(x + brick.w * 0.58, y + brick.h - 1);
        ctx.moveTo(x + brick.w * 0.47, y + brick.h * 0.5);
        ctx.lineTo(x + brick.w * 0.7, y + brick.h * 0.38);
        ctx.stroke();
      }
    }
    if (steel) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 0.8;
      for (let i = 1; i < 4; i++) {
        const lx = x + (brick.w / 4) * i;
        ctx.beginPath();
        ctx.moveTo(lx, y + 3);
        ctx.lineTo(lx, y + brick.h - 3);
        ctx.stroke();
      }
    }

    this.brickCache.set(key, sprite);
    return sprite;
  }

  private speedColor(game: Game): string {
    const { neon } = this.palette;
    const sp = game.state.speed;
    if (sp.bonusKind) return neon[BONUS_COLOR[sp.bonusKind]];
    if (sp.heat >= 5) return neon.amber;
    if (sp.total > 1.15) return neon.violet;
    return neon.cyan;
  }

  private color(c: BrickColor | "white"): string {
    return c === "white" ? "#ffffff" : this.palette.neon[c];
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const rr = Math.min(r, w / 2, h / 2);
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

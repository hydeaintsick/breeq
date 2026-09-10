/**
 * Canvas 2D board renderer.
 *
 * Two layers: a static bitmap (background, rails, pegs, trap bodies, bins)
 * rebuilt only on resize, and a dynamic pass every frame (ball, trail,
 * impacts, moving trap parts, particles). All drawing happens in world units;
 * the context transform maps them to device pixels, and sprites are
 * rasterized at that same scale so nothing is ever resampled.
 */
import { buildAtlas, type Atlas, type Sprite } from "../assets/atlas";
import { alpha, shade, type Palette } from "../assets/palette";
import {
  DIVIDER_CAP_RADIUS,
  createRng,
  fanCenter,
  fanStream,
  indexPieces,
  nailCenters,
  trampolineSpan,
  type Board,
  type PieceIndex,
} from "../engine";
import type { Particle, SceneState } from "./scene";

const TAU = Math.PI * 2;
const RAIL_WIDTH = 8;
/** Sprite body proportions used to fit sprites to piece dimensions. */
const CHEST_BODY_WIDTH = 64;
const CHEST_BODY_HEIGHT = 30;
const VOID_PIT_RX = 35;
const NAIL_SPRITE_LENGTH = 26.5;

export class BoardRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly index: PieceIndex;
  private atlas: Atlas | null = null;
  private staticLayer: HTMLCanvasElement | null = null;
  /** Device pixels per world unit. */
  private scale = 1;
  private buildId = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly board: Board,
    private palette: Palette,
  ) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Canvas 2D is not available");
    }
    this.ctx = ctx;
    this.index = indexPieces(board);
  }

  get ready(): boolean {
    return this.atlas !== null && this.staticLayer !== null;
  }

  setPalette(palette: Palette): void {
    this.palette = palette;
  }

  /**
   * Size the canvas to `cssWidth` CSS pixels (height follows the board's
   * aspect ratio) at `dpr`, then rebuild sprites and the static layer.
   */
  async resize(cssWidth: number, dpr: number): Promise<void> {
    const { width, height } = this.board;
    const scale = (cssWidth * dpr) / width;
    if (scale === this.scale && this.ready) {
      return;
    }

    const id = ++this.buildId;
    const atlas = await buildAtlas(this.palette, scale);
    if (id !== this.buildId) {
      return; // superseded by a newer resize
    }

    this.scale = scale;
    this.canvas.width = Math.round(width * scale);
    this.canvas.height = Math.round(height * scale);
    this.atlas = atlas;
    try {
      this.staticLayer = this.paintStatic(atlas);
    } catch (error) {
      this.staticLayer = null;
      throw new Error("Static board layer failed to paint", { cause: error });
    }
  }

  // ---------------------------------------------------------------------------
  // Static layer
  // ---------------------------------------------------------------------------

  private paintStatic(atlas: Atlas): HTMLCanvasElement {
    const { board, palette: p, index, scale } = this;
    const layer = document.createElement("canvas");
    layer.width = this.canvas.width;
    layer.height = this.canvas.height;
    const ctx = layer.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D is not available");
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const { width, height, floorY } = board;
    const { left, right, top } = board.rails;

    // Vault wall: near-black slate with a warm glow bleeding from the top.
    ctx.fillStyle = p.vaultMid;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width / 2, top, 10, width / 2, top, height * 0.62);
    glow.addColorStop(0, alpha(p.gold, 0.2));
    glow.addColorStop(0.5, alpha(p.gold, 0.05));
    glow.addColorStop(1, alpha(p.gold, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Grain, so the wall never reads as flat digital black.
    const rng = createRng(7);
    ctx.fillStyle = alpha(p.ink, 0.035);
    for (let i = 0; i < 1400; i++) {
      ctx.fillRect(rng.range(0, width), rng.range(0, height), 0.8, 0.8);
    }

    // Play field: a recessed slab, darker, with an inner shadow on every edge.
    ctx.fillStyle = alpha("#000000", 0.28);
    ctx.fillRect(left, top, right - left, floorY - top);
    this.innerShadow(ctx, left, top, right - left, floorY - top, 16, 0.5);

    // Vignette over the whole board.
    const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.25, width / 2, height / 2, height * 0.72);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Floor slab.
    const floor = ctx.createLinearGradient(0, floorY, 0, height);
    floor.addColorStop(0, shade(p.vaultMid, 1.35));
    floor.addColorStop(1, p.vault);
    ctx.fillStyle = floor;
    ctx.fillRect(left - RAIL_WIDTH, floorY, right - left + RAIL_WIDTH * 2, height - floorY);
    ctx.fillStyle = alpha(p.gold, 0.4);
    ctx.fillRect(left - RAIL_WIDTH, floorY, right - left + RAIL_WIDTH * 2, 1);

    // Voids are holes in the floor: draw them before anything stands on it.
    for (const pit of index.voids) {
      const s = pit.width / 2 / VOID_PIT_RX;
      this.sprite(ctx, atlas.voidPit, pit.x, floorY + 3, s);
    }

    // Rails.
    this.rail(ctx, left - RAIL_WIDTH, top - 4, floorY + 4);
    this.rail(ctx, right, top - 4, floorY + 4);
    // Ceiling.
    const ceiling = ctx.createLinearGradient(0, top - 4, 0, top);
    ceiling.addColorStop(0, shade(p.goldDim, 0.6));
    ceiling.addColorStop(1, p.goldDim);
    ctx.fillStyle = ceiling;
    ctx.fillRect(left - RAIL_WIDTH, top - 4, right - left + RAIL_WIDTH * 2, 4);
    ctx.fillStyle = alpha(p.goldBright, 0.35);
    ctx.fillRect(left - RAIL_WIDTH, top - 4, right - left + RAIL_WIDTH * 2, 0.8);

    // HUD hairline above the ceiling.
    ctx.fillStyle = alpha(p.gold, 0.16);
    ctx.fillRect(0, top - 8, width, 0.8);

    // Hopper hangs from the ceiling; its slot releases the ball at the spawn.
    this.sprite(ctx, atlas.hopper, board.spawn.x, board.spawn.y);

    // Dividers.
    for (const divider of index.dividers) {
      this.divider(ctx, divider.x, floorY - divider.height, floorY);
    }

    // Chest body (the lid is dynamic).
    for (const chest of index.chests) {
      const s = chest.width / CHEST_BODY_WIDTH;
      this.sprite(ctx, atlas.chestBase, chest.x, floorY, s);
    }

    // Trampoline posts.
    for (const t of index.trampolines) {
      const span = trampolineSpan(t);
      this.sprite(ctx, atlas.trampolinePost, span.x0, t.y);
      this.sprite(ctx, atlas.trampolinePost, span.x1, t.y);
    }

    // Fan housings, recessed into the rail.
    for (const fan of index.fans) {
      const c = fanCenter(fan);
      this.sprite(ctx, atlas.fanHousing, c.x, c.y);
    }

    // Nails, with a faint warning glow behind the cluster.
    for (const nail of index.nails) {
      const centers = nailCenters(nail);
      const cy = nail.y;
      const g = ctx.createRadialGradient(nail.x, cy, 2, nail.x, cy, nail.length + 18);
      g.addColorStop(0, alpha(p.danger, 0.22));
      g.addColorStop(1, alpha(p.danger, 0));
      ctx.fillStyle = g;
      ctx.fillRect(nail.x - nail.length - 20, cy - 40, nail.length + 40, 80);

      const s = nail.length / NAIL_SPRITE_LENGTH;
      for (const y of centers) {
        this.sprite(ctx, atlas.nail, nail.x, y, s, 0, nail.dir === "right");
      }
    }

    // Portal core (rings are dynamic).
    for (const portal of index.portals) {
      const g = ctx.createRadialGradient(portal.x, portal.y, portal.r * 0.6, portal.x, portal.y, portal.r * 2.2);
      g.addColorStop(0, alpha(p.gold, 0.16));
      g.addColorStop(1, alpha(p.gold, 0));
      ctx.fillStyle = g;
      ctx.fillRect(portal.x - portal.r * 2.2, portal.y - portal.r * 2.2, portal.r * 4.4, portal.r * 4.4);
      this.sprite(ctx, atlas.portalCore, portal.x, portal.y, portal.r / 16);
    }

    // Pegs last so they sit on top of every glow.
    for (const peg of index.pegs) {
      this.sprite(ctx, atlas.peg, peg.x, peg.y, peg.r / 5);
    }

    return layer;
  }

  private rail(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number): void {
    const { palette: p } = this;
    const g = ctx.createLinearGradient(x, 0, x + RAIL_WIDTH, 0);
    g.addColorStop(0, shade(p.goldDim, 0.5));
    g.addColorStop(0.35, p.goldDim);
    g.addColorStop(0.55, shade(p.gold, 0.95));
    g.addColorStop(0.7, p.goldDim);
    g.addColorStop(1, shade(p.goldDim, 0.45));
    ctx.fillStyle = g;
    ctx.fillRect(x, y0, RAIL_WIDTH, y1 - y0);
    ctx.fillStyle = alpha(p.goldBright, 0.35);
    ctx.fillRect(x + RAIL_WIDTH * 0.55, y0, 0.8, y1 - y0);
    ctx.fillStyle = alpha("#000000", 0.45);
    ctx.fillRect(x, y0, 0.8, y1 - y0);
    ctx.fillRect(x + RAIL_WIDTH - 0.8, y0, 0.8, y1 - y0);
  }

  private divider(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number): void {
    const { palette: p } = this;
    const r = DIVIDER_CAP_RADIUS;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 4 * this.scale;
    ctx.shadowOffsetY = 1.5 * this.scale;
    const g = ctx.createLinearGradient(x - r, 0, x + r, 0);
    g.addColorStop(0, shade(p.goldDim, 0.5));
    g.addColorStop(0.5, p.gold);
    g.addColorStop(1, shade(p.goldDim, 0.5));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - r, y1);
    ctx.lineTo(x - r, y0);
    ctx.arc(x, y0, r, Math.PI, 0);
    ctx.lineTo(x + r, y1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = alpha("#fff6d8", 0.75);
    ctx.beginPath();
    ctx.arc(x - 0.8, y0 - 0.6, 0.9, 0, TAU);
    ctx.fill();
  }

  private innerShadow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    strength: number,
  ): void {
    const edges: [number, number, number, number][] = [
      [x, y, x + size, y],
      [x + w, y, x + w - size, y],
      [x, y, x, y + size],
      [x, y + h, x, y + h - size],
    ];
    for (const [x0, y0, x1, y1] of edges) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }
  }

  // ---------------------------------------------------------------------------
  // Dynamic pass
  // ---------------------------------------------------------------------------

  render(scene: SceneState): void {
    const { ctx, atlas, staticLayer, scale, board, index, palette: p } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (!atlas || !staticLayer) {
      ctx.fillStyle = p.vaultMid;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    ctx.drawImage(staticLayer, 0, 0);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const { floorY } = board;

    // Hopper glow while a ball is loading.
    if (scene.hopperGlow > 0.01) {
      this.glow(ctx, board.spawn.x, board.spawn.y - 2, 22, p.goldBright, scene.hopperGlow * 0.7);
    }

    // Fans: air stream and blades.
    index.fans.forEach((fan, i) => {
      const active = scene.fanActive[i];
      if (active > 0.02) {
        const stream = fanStream(fan);
        ctx.save();
        ctx.beginPath();
        ctx.rect(stream.x, stream.y, stream.w, stream.h);
        ctx.clip();
        ctx.globalCompositeOperation = "lighter";
        const dir = fan.dir === "left" ? -1 : 1;
        const origin = fan.dir === "left" ? stream.x + stream.w : stream.x;
        for (let k = 0; k < 7; k++) {
          const phase = (scene.time * 260 + k * 41) % (stream.w + 40);
          const x = origin + dir * (phase - 20);
          const y = stream.y + ((k * 37) % Math.max(1, Math.round(stream.h - 4))) + 2;
          const len = 18 + (k % 3) * 8;
          const fade = 1 - phase / (stream.w + 40);
          const g = ctx.createLinearGradient(x, y, x + dir * len, y);
          g.addColorStop(0, alpha(p.goldBright, 0));
          g.addColorStop(0.5, alpha(p.goldBright, 0.35 * active * fade));
          g.addColorStop(1, alpha(p.goldBright, 0));
          ctx.strokeStyle = g;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + dir * len, y);
          ctx.stroke();
        }
        ctx.restore();
      }
      const c = fanCenter(fan);
      this.sprite(ctx, atlas.fanBlades, c.x, c.y, 1, scene.fanSpin[i]);
    });

    // Trampoline bands.
    index.trampolines.forEach((t, i) => {
      const span = trampolineSpan(t);
      const flex = scene.trampFlex[i];
      const sag = 3 + flex.amp * 14 * Math.cos(flex.t * 22) * Math.exp(-flex.t * 5);
      const cx = (span.x0 + span.x1) / 2;
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = alpha(p.gold, 0.55);
      ctx.shadowBlur = 6 * scale;
      ctx.strokeStyle = p.gold;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(span.x0, t.y);
      ctx.quadraticCurveTo(cx, t.y + sag * 2, span.x1, t.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = alpha(p.goldBright, 0.7);
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(span.x0 + 2, t.y - 0.6);
      ctx.quadraticCurveTo(cx, t.y - 0.6 + sag * 2, span.x1 - 2, t.y - 0.6);
      ctx.stroke();
      ctx.restore();
    });

    // Portal rings.
    index.portals.forEach((portal, i) => {
      const pulse = scene.portalPulse[i];
      const s = (portal.r / 22) * (1 + pulse * 0.18);
      if (pulse > 0.02) {
        this.glow(ctx, portal.x, portal.y, portal.r * 2.4, p.goldBright, pulse * 0.6);
      }
      this.sprite(ctx, atlas.portalRing, portal.x, portal.y, s, scene.portalSpin);
      this.sprite(ctx, atlas.portalRing, portal.x, portal.y, s * 0.72, -scene.portalSpin * 1.6);
    });

    // Void breath.
    index.voids.forEach((pit, i) => {
      const g = scene.voidGlow[i];
      if (g > 0.02) {
        this.glow(ctx, pit.x, floorY + 2, pit.width * 0.7, p.danger, g * 0.55);
      }
    });

    // Nail flash.
    index.nails.forEach((nail, i) => {
      const f = scene.nailFlash[i];
      if (f > 0.02) {
        const x = nail.dir === "left" ? nail.x - nail.length * 0.5 : nail.x + nail.length * 0.5;
        this.glow(ctx, x, nail.y, 36, p.danger, f * 0.8);
      }
    });

    // Impact glows on pegs and dividers.
    index.pegs.forEach((peg, i) => {
      const f = scene.pegFlash[i];
      if (f > 0.02) {
        this.glow(ctx, peg.x, peg.y, 14, p.goldBright, f * 0.85);
      }
    });
    index.dividers.forEach((d, i) => {
      const f = scene.dividerFlash[i];
      if (f > 0.02) {
        this.glow(ctx, d.x, floorY - d.height, 12, p.goldBright, f * 0.8);
      }
    });

    // Chest lid, light beam, glow.
    for (const chest of index.chests) {
      const s = chest.width / CHEST_BODY_WIDTH;
      const bodyTop = floorY - CHEST_BODY_HEIGHT * s;
      const open = scene.chest.open;

      if (scene.chest.glow > 0.02) {
        this.glow(ctx, chest.x, bodyTop - 6, chest.width * 0.9, p.goldBright, scene.chest.glow * 0.7);
      }

      // Light escapes once the lid has swung past vertical.
      const beamK = Math.max(0, (open - 0.35) / 0.65);
      if (beamK > 0.02) {
        const reach = 72 * beamK;
        const beam = ctx.createLinearGradient(0, bodyTop, 0, bodyTop - reach);
        beam.addColorStop(0, alpha(p.goldBright, 0.6 * beamK));
        beam.addColorStop(1, alpha(p.goldBright, 0));
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(chest.x - chest.width * 0.4, bodyTop);
        ctx.lineTo(chest.x + chest.width * 0.4, bodyTop);
        ctx.lineTo(chest.x + chest.width * 0.6, bodyTop - reach);
        ctx.lineTo(chest.x - chest.width * 0.6, bodyTop - reach);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // The lid is hinged at the back edge: in front view it swings up and
      // over, so its projected height goes 1 → 0 → −0.37 (underside visible).
      const swing = Math.cos(open * 1.95);
      ctx.save();
      ctx.translate(chest.x, bodyTop);
      ctx.scale(1, Math.abs(swing) < 0.02 ? 0.02 : swing);
      if (swing < 0 && "filter" in ctx) {
        ctx.filter = "brightness(0.45)";
      }
      this.sprite(ctx, atlas.chestLid, 0, 0, s);
      ctx.restore();
    }

    // Particles below the ball.
    this.particles(ctx, atlas, scene.particles, "air");
    this.particles(ctx, atlas, scene.particles, "dust");

    // Trail then ball.
    if (scene.trail.length > 1 && scene.ball.visible) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const now = scene.time;
      const r = board.ballRadius * scene.ball.scale;
      for (const point of scene.trail) {
        const age = now - point.t;
        const k = 1 - Math.min(1, age / 0.16);
        if (k <= 0) continue;
        ctx.fillStyle = alpha(p.gold, 0.28 * k * k * scene.ball.alpha);
        ctx.beginPath();
        ctx.arc(point.x, point.y, r * (0.3 + 0.7 * k), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    if (scene.ball.visible && scene.ball.alpha > 0.01 && scene.ball.scale > 0.01) {
      const b = scene.ball;
      const r = board.ballRadius * b.scale;
      // Contact shadow on the board.
      const shadow = ctx.createRadialGradient(b.x, b.y + r * 0.8, r * 0.2, b.x, b.y + r * 0.8, r * 1.8);
      shadow.addColorStop(0, `rgba(0, 0, 0, ${0.45 * b.alpha})`);
      shadow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = shadow;
      ctx.fillRect(b.x - r * 2, b.y - r, r * 4, r * 3.2);

      if (b.flash > 0.02) {
        this.glow(ctx, b.x, b.y, r * 3.2, p.goldBright, b.flash * 0.8 * b.alpha);
      }
      ctx.save();
      ctx.globalAlpha = b.alpha;
      this.sprite(ctx, atlas.ball, b.x, b.y, b.scale);
      ctx.restore();
    }

    this.particles(ctx, atlas, scene.particles, "spark");
    this.particles(ctx, atlas, scene.particles, "shard");
    this.particles(ctx, atlas, scene.particles, "coin");
  }

  private particles(
    ctx: CanvasRenderingContext2D,
    atlas: Atlas,
    particles: Particle[],
    kind: Particle["kind"],
  ): void {
    const { palette: p } = this;
    ctx.save();
    for (const q of particles) {
      if (q.kind !== kind) continue;
      const k = Math.max(0, q.life / q.maxLife);
      switch (kind) {
        case "spark": {
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = alpha(p.goldBright, 0.9 * k);
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.size * (0.4 + 0.6 * k), 0, TAU);
          ctx.fill();
          break;
        }
        case "shard": {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = k;
          ctx.fillStyle = k > 0.5 ? p.goldBright : p.gold;
          ctx.save();
          ctx.translate(q.x, q.y);
          ctx.rotate(q.phase + (1 - k) * 6);
          ctx.beginPath();
          ctx.moveTo(-q.size, q.size * 0.6);
          ctx.lineTo(q.size, 0);
          ctx.lineTo(-q.size * 0.6, -q.size * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          ctx.globalAlpha = 1;
          break;
        }
        case "coin": {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = Math.min(1, k * 2);
          const spin = Math.abs(Math.cos(q.phase + (1 - k) * 9));
          ctx.save();
          ctx.translate(q.x, q.y);
          ctx.scale(Math.max(0.15, spin), 1);
          this.sprite(ctx, atlas.coin, 0, 0, q.size / 5);
          ctx.restore();
          ctx.globalAlpha = 1;
          break;
        }
        case "air":
        case "dust": {
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = alpha(p.goldBright, 0.35 * k);
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.size, 0, TAU);
          ctx.fill();
          break;
        }
      }
    }
    ctx.restore();
  }

  private glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, strength: number): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, alpha(color, strength));
    g.addColorStop(0.45, alpha(color, strength * 0.35));
    g.addColorStop(1, alpha(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  /** Draw a sprite at world position, anchored, optionally scaled / rotated / mirrored. */
  private sprite(
    ctx: CanvasRenderingContext2D,
    sprite: Sprite,
    x: number,
    y: number,
    s = 1,
    rotation = 0,
    mirror = false,
  ): void {
    if (rotation === 0 && !mirror) {
      ctx.drawImage(sprite.bitmap, x - sprite.ax * s, y - sprite.ay * s, sprite.w * s, sprite.h * s);
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    if (rotation !== 0) ctx.rotate(rotation);
    if (mirror) ctx.scale(-1, 1);
    ctx.drawImage(sprite.bitmap, -sprite.ax * s, -sprite.ay * s, sprite.w * s, sprite.h * s);
    ctx.restore();
  }
}

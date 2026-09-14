/**
 * The galaxy map — where the route sits in the whole.
 *
 * A seeded barred spiral painted once per resize: a warm bulge, two arms of
 * star clouds threaded with dark dust lanes and pink nurseries, blue clusters
 * on the rim, a sparse halo. It turns very slowly under a still sky of deep
 * nebula blooms. Everything Kal has not reached is under a dust veil — a
 * dim, starry mist that thins around the road so far — with no label on it:
 * the map simply has not been drawn there yet. Kal's route is a short thread
 * on the rim of one arm, each reached zone lit in its hue.
 *
 * Canvas 2D only, DPR capped, still under reduced motion, paused when hidden.
 */
import { readNeonPalette } from "../breakout/render/palette";
import { alpha } from "../shared/color";
import { createRng } from "../shared/random";
import type { JourneyHue, JourneyNodeState } from "./model";

const TAU = Math.PI * 2;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
/** Radians per second the galaxy turns. */
const TURN = 0.005;
/** Spiral: how far around each arm winds. */
const TURNS = 1.15;
const ARMS = 2;
/** The disc is squashed: seen a little from above, not face on. */
const TILT = 0.78;
/** Where the route runs along arm 0, as fractions of the arm's length (rim inward). */
const ROUTE_FROM = 0.9;
const ROUTE_TO = 0.6;
/** The arm's `t` that hangs at the bottom of the screen: the early road, where a phone has room for it. */
const ANCHOR_T = 0.84;

export interface GalaxyZone {
  kicker: string;
  title: string;
  state: JourneyNodeState;
  hue: JourneyHue;
}

/** Where the disc sits on its stage, CSS px. */
export interface GalaxyFrame {
  cx: number;
  cy: number;
  R: number;
}

export interface GalaxyMountOptions {
  maxDpr?: number;
  /** A tap on a reachable zone. */
  onTap?: (index: number) => void;
  /** A card-sized galaxy: no zone numerals, no "you are here" plate. The disc alone carries it. */
  compact?: boolean;
  /** Frame the disc yourself (a second mount continuing a first one's picture at another size). */
  frame?: (width: number, height: number) => GalaxyFrame;
  /** Seconds of turn to start from, so a second mount picks up where the first one's disc was. */
  startTime?: number;
}

export interface GalaxyHandle {
  destroy(): void;
  setZones(zones: readonly GalaxyZone[]): void;
  /** The disc's place on the stage, or null before the first size. */
  frame(): GalaxyFrame | null;
  /** Seconds the disc has turned. */
  time(): number;
  /**
   * Dive toward zone `index`: the whole picture scales about it, `scale` × over
   * `seconds`, eased in, a cool bloom rising as it goes. The dive keeps
   * running when the caller's own motion preference is off — callers skip it then.
   */
  zoomTo(index: number, scale: number, seconds: number): void;
}

interface Frame extends GalaxyFrame {
  width: number;
  height: number;
  /** Side of the square layers the disc and its veil are painted on (they turn). */
  S: number;
}

interface Point {
  x: number;
  y: number;
}

/** A point on arm `arm` at `t` in [0, 1] (0 = core, 1 = rim), before rotation. */
function armPoint(arm: number, t: number, R: number): Point {
  const r = R * (0.06 + 0.94 * t);
  const a = (arm / ARMS) * TAU + t * TURNS * TAU;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * TILT };
}

/** The disc is turned so `ANCHOR_T` on the route's arm points straight down. */
const BASE_ROTATION = (() => {
  const p = armPoint(0, ANCHOR_T, 1);
  return Math.PI / 2 - Math.atan2(p.y, p.x);
})();

/** Soft radial bloom. */
function bloom(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a: number, mid = 0) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, alpha(color, a));
  if (mid > 0) g.addColorStop(mid, alpha(color, a * 0.55));
  g.addColorStop(1, alpha(color, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

/** A bright star: a soft core with a faint four-point glint. */
function glint(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a: number) {
  bloom(c, x, y, r * 3, color, a * 0.35);
  c.save();
  c.globalCompositeOperation = "lighter";
  c.strokeStyle = alpha(color, a * 0.45);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(x - r * 4, y);
  c.lineTo(x + r * 4, y);
  c.moveTo(x, y - r * 4);
  c.lineTo(x, y + r * 4);
  c.stroke();
  c.restore();
  c.fillStyle = alpha("#ffffff", a);
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

export function mountGalaxy(canvas: HTMLCanvasElement, inputs: readonly GalaxyZone[], options: GalaxyMountOptions = {}): GalaxyHandle {
  const stage = canvas.parentElement ?? canvas;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D is not available");
  const palette = readNeonPalette();
  const maxDpr = options.maxDpr ?? 2;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let zones = [...inputs];
  let frame: Frame | null = null;
  let dpr = 1;
  let sky: HTMLCanvasElement | null = null;
  let disc: HTMLCanvasElement | null = null;
  let veil: HTMLCanvasElement | null = null;
  let raf = 0;
  let last = 0;
  let time = options.startTime ?? 0;
  let destroyed = false;
  let hidden = document.visibilityState === "hidden";
  const compact = options.compact === true;
  /** The dive: scale about a zone, eased from `from` to `to` over `seconds`. */
  let zoom: { index: number; from: number; to: number; t: number; seconds: number } | null = null;
  let zoomScale = 1;

  const hueOf = (hue: JourneyHue) => (hue === "steel" ? palette.steel : palette.neon[hue]);

  /** Twinkling stars on the arms, and dust motes drifting over the charted corner. */
  const twinkle = (() => {
    const rng = createRng(0x9a1a);
    return Array.from({ length: 26 }, () => ({
      arm: rng.int(0, ARMS - 1),
      t: rng.range(0.15, 0.98),
      spread: rng.range(-0.06, 0.06),
      phase: rng.range(0, TAU),
      rate: rng.range(0.7, 1.5),
    }));
  })();
  const motes = (() => {
    const rng = createRng(0x9a1b);
    return Array.from({ length: 14 }, () => ({
      t: rng.range(0.55, 0.98),
      spread: rng.range(-0.1, 0.1),
      phase: rng.range(0, TAU),
      speed: rng.range(0.02, 0.05),
      size: rng.range(0.6, 1.3),
    }));
  })();

  /** Route node positions in the galaxy's own frame (unrotated). */
  const routePoint = (i: number, R: number): Point => {
    const n = Math.max(1, zones.length - 1);
    const t = ROUTE_FROM - (i / n) * (ROUTE_FROM - ROUTE_TO);
    return armPoint(0, t, R);
  };

  const rotation = () => BASE_ROTATION + (reducedMotion.matches ? 0 : time * TURN);

  /** Galaxy-frame point to screen, under the current rotation. */
  const toScreen = (p: Point, a: number): Point => {
    if (!frame) return { x: 0, y: 0 };
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: frame.cx + p.x * c - p.y * s, y: frame.cy + p.x * s + p.y * c };
  };

  /** Screen position of route node `i`. */
  const nodeAt = (i: number): Point => (frame ? toScreen(routePoint(i, frame.R), rotation()) : { x: 0, y: 0 });

  // ---------------------------------------------------------------------------
  // Static layers
  // ---------------------------------------------------------------------------

  /** The sky: deep gradient, faint nebula blooms, a distant field, a few bright stars. Does not turn. */
  const paintSky = (f: Frame): HTMLCanvasElement => {
    const layer = offscreen(f.width * dpr, f.height * dpr);
    const c = layer.getContext("2d")!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { width: w, height: h } = f;
    // Ends on the sheet's own black so the canvas has no seam with the chrome around it.
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#05060c");
    g.addColorStop(0.45, "#070a1c");
    g.addColorStop(1, "#05060c");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    const rng = createRng(0x6a1a);
    // Nebula blooms, far behind the disc.
    c.globalCompositeOperation = "lighter";
    bloom(c, w * 0.18, h * 0.22, Math.max(w, h) * 0.42, palette.neon.violet, 0.07, 0.35);
    bloom(c, w * 0.86, h * 0.38, Math.max(w, h) * 0.36, palette.neon.blue, 0.06, 0.35);
    bloom(c, w * 0.62, h * 0.86, Math.max(w, h) * 0.34, palette.neon.pink, 0.035, 0.35);
    bloom(c, w * 0.3, h * 0.72, Math.max(w, h) * 0.3, palette.neon.cyan, 0.025, 0.35);
    c.globalCompositeOperation = "source-over";

    // Distant field, denser toward the middle band.
    for (let i = 0; i < 520; i++) {
      const x = rng.range(0, w);
      const y = rng.range(0, h);
      const a = rng.range(0.1, 0.6);
      c.fillStyle = rng.chance(0.15) ? `rgba(214, 226, 255, ${a.toFixed(3)})` : `rgba(255, 255, 255, ${a.toFixed(3)})`;
      c.beginPath();
      c.arc(x, y, rng.range(0.25, 0.9), 0, TAU);
      c.fill();
    }
    // A handful of bright foreground stars.
    for (let i = 0; i < 7; i++) {
      const x = rng.range(w * 0.05, w * 0.95);
      const y = rng.range(h * 0.05, h * 0.95);
      const color = rng.chance(0.5) ? "#dfe8ff" : rng.chance(0.5) ? palette.neon.amber : palette.neon.cyan;
      glint(c, x, y, rng.range(0.9, 1.5), color, rng.range(0.5, 0.85));
    }
    return layer;
  };

  /** The disc on a square, transparent layer centred on the galaxy. Turns. */
  const paintDisc = (f: Frame): HTMLCanvasElement => {
    const layer = offscreen(f.S * dpr, f.S * dpr);
    const c = layer.getContext("2d")!;
    c.setTransform(dpr, 0, 0, dpr, f.S * dpr * 0.5, f.S * dpr * 0.5);
    const rng = createRng(0x6a1b);
    const { R } = f;

    // Diffuse disc light: a broad, very faint ellipse under everything.
    c.globalCompositeOperation = "lighter";
    const disk = c.createRadialGradient(0, 0, 0, 0, 0, R * 1.05);
    disk.addColorStop(0, "rgba(120, 110, 170, 0.22)");
    disk.addColorStop(0.5, "rgba(80, 90, 170, 0.11)");
    disk.addColorStop(1, "rgba(60, 80, 160, 0)");
    c.fillStyle = disk;
    c.save();
    c.scale(1, TILT);
    c.beginPath();
    c.arc(0, 0, R * 1.05, 0, TAU);
    c.fill();
    c.restore();

    // Haze along the arms: amber at the core, blue and violet toward the rim.
    for (let arm = 0; arm < ARMS; arm++) {
      for (let i = 0; i < 150; i++) {
        const t = rng.range(0.04, 1);
        const p = armPoint(arm, t, R);
        const spread = R * (0.03 + 0.1 * t);
        const x = p.x + rng.range(-spread, spread);
        const y = p.y + rng.range(-spread, spread) * TILT;
        const size = R * rng.range(0.05, 0.14) * (0.6 + t * 0.6);
        const cool = t > 0.42;
        const color = cool ? (rng.chance(0.6) ? palette.neon.blue : palette.neon.violet) : palette.neon.amber;
        bloom(c, x, y, size, color, cool ? 0.16 : 0.12);
      }
    }
    // Two faint spurs between the arms, so the disc is not just two lines.
    for (let arm = 0; arm < ARMS; arm++) {
      for (let i = 0; i < 50; i++) {
        const t = rng.range(0.3, 0.95);
        const a = ((arm + 0.5) / ARMS) * TAU + t * TURNS * TAU;
        const r = R * (0.06 + 0.94 * t);
        const spread = R * 0.06;
        const x = Math.cos(a) * r + rng.range(-spread, spread);
        const y = Math.sin(a) * r * TILT + rng.range(-spread, spread) * TILT;
        bloom(c, x, y, R * rng.range(0.04, 0.09), palette.neon.blue, 0.045);
      }
    }
    // Star-forming regions: small pink and amber nurseries on the arms.
    for (let arm = 0; arm < ARMS; arm++) {
      for (let i = 0; i < 16; i++) {
        const t = rng.range(0.3, 0.98);
        const p = armPoint(arm, t, R);
        const spread = R * 0.05;
        const x = p.x + rng.range(-spread, spread);
        const y = p.y + rng.range(-spread, spread) * TILT;
        bloom(c, x, y, R * rng.range(0.018, 0.04), rng.chance(0.7) ? palette.neon.pink : palette.neon.amber, 0.22, 0.3);
      }
    }
    // The bulge and its bar.
    const core = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.36);
    core.addColorStop(0, "rgba(255, 246, 222, 0.95)");
    core.addColorStop(0.14, "rgba(255, 220, 160, 0.5)");
    core.addColorStop(0.42, "rgba(170, 120, 200, 0.16)");
    core.addColorStop(1, "rgba(139, 92, 246, 0)");
    c.fillStyle = core;
    c.beginPath();
    c.ellipse(0, 0, R * 0.36, R * 0.28, 0, 0, TAU);
    c.fill();
    c.save();
    c.rotate(0.35);
    const bar = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.22);
    bar.addColorStop(0, "rgba(255, 236, 200, 0.18)");
    bar.addColorStop(1, "rgba(255, 236, 200, 0)");
    c.fillStyle = bar;
    c.beginPath();
    c.ellipse(0, 0, R * 0.22, R * 0.08, 0, 0, TAU);
    c.fill();
    c.restore();
    c.globalCompositeOperation = "source-over";

    // Dust lanes: dark filaments hugging the inner edge of each arm.
    for (let arm = 0; arm < ARMS; arm++) {
      for (let i = 0; i < 120; i++) {
        const t = rng.range(0.12, 0.96);
        const p = armPoint(arm, t, R);
        const inward = 0.035 + 0.02 * t;
        const x = p.x * (1 - inward) + rng.range(-R * 0.015, R * 0.015);
        const y = p.y * (1 - inward) + rng.range(-R * 0.015, R * 0.015) * TILT;
        const size = R * rng.range(0.02, 0.05);
        bloom(c, x, y, size, "#04050c", rng.range(0.25, 0.5));
      }
    }

    // Stars on the arms: warm and dense inside, blue and loose on the rim.
    for (let arm = 0; arm < ARMS; arm++) {
      for (let i = 0; i < 1400; i++) {
        const t = Math.sqrt(rng.range(0, 1));
        const p = armPoint(arm, t, R);
        const spread = R * (0.025 + 0.08 * t);
        const x = p.x + rng.range(-spread, spread);
        const y = p.y + rng.range(-spread, spread) * TILT;
        const a = rng.range(0.3, 1) * (0.7 + 0.3 * (1 - t));
        const warm = t < 0.35;
        c.fillStyle = warm
          ? `rgba(255, 236, 205, ${a.toFixed(3)})`
          : rng.chance(0.2)
            ? `rgba(160, 200, 255, ${a.toFixed(3)})`
            : `rgba(220, 230, 255, ${a.toFixed(3)})`;
        c.beginPath();
        c.arc(x, y, rng.range(0.35, 1.15), 0, TAU);
        c.fill();
      }
    }
    // Blue clusters on the rim: tight knots of young stars.
    for (let i = 0; i < 14; i++) {
      const arm = rng.int(0, ARMS - 1);
      const p = armPoint(arm, rng.range(0.55, 0.98), R);
      const kx = p.x + rng.range(-R * 0.04, R * 0.04);
      const ky = p.y + rng.range(-R * 0.04, R * 0.04) * TILT;
      bloom(c, kx, ky, R * 0.035, palette.neon.cyan, 0.16);
      for (let k = 0; k < 9; k++) {
        c.fillStyle = `rgba(200, 235, 255, ${rng.range(0.5, 0.95).toFixed(3)})`;
        c.beginPath();
        c.arc(kx + rng.range(-R * 0.014, R * 0.014), ky + rng.range(-R * 0.014, R * 0.014), rng.range(0.4, 0.9), 0, TAU);
        c.fill();
      }
    }
    // A sparse halo of stars around the disc.
    for (let i = 0; i < 260; i++) {
      const a = rng.range(0, TAU);
      const r = R * rng.range(0.2, 1.12);
      c.fillStyle = `rgba(214, 226, 255, ${rng.range(0.08, 0.3).toFixed(3)})`;
      c.beginPath();
      c.arc(Math.cos(a) * r, Math.sin(a) * r * TILT, rng.range(0.3, 0.8), 0, TAU);
      c.fill();
    }
    return layer;
  };

  /**
   * The undiscovered: a dust veil over the disc, textured with darker knots
   * and its own faint mist of stars, cut open around the road so far. Same
   * square as the disc; turns with it.
   */
  const paintVeil = (f: Frame): HTMLCanvasElement => {
    const layer = offscreen(f.S * dpr, f.S * dpr);
    const c = layer.getContext("2d")!;
    c.setTransform(dpr, 0, 0, dpr, f.S * dpr * 0.5, f.S * dpr * 0.5);
    const rng = createRng(0x6a1c);
    const { R, S } = f;

    // Base veil: dense over the disc, fading past the rim.
    const base = c.createRadialGradient(0, 0, R * 0.85, 0, 0, S * 0.5);
    base.addColorStop(0, "rgba(6, 7, 16, 0.42)");
    base.addColorStop(1, "rgba(6, 7, 16, 0)");
    c.fillStyle = base;
    c.fillRect(-S / 2, -S / 2, S, S);
    // Dust knots: darker clouds with a cold tint.
    for (let i = 0; i < 160; i++) {
      const a = rng.range(0, TAU);
      const r = R * Math.sqrt(rng.range(0, 1)) * 1.02;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * TILT;
      const cold = rng.chance(0.35);
      bloom(c, x, y, R * rng.range(0.05, 0.14), cold ? "#141a34" : "#05060f", rng.range(0.08, 0.2));
    }
    // A mist of faint stars over the veil, so it reads as unmapped sky, not paint.
    for (let i = 0; i < 380; i++) {
      const a = rng.range(0, TAU);
      const r = R * Math.sqrt(rng.range(0, 1)) * 1.02;
      c.fillStyle = `rgba(200, 210, 240, ${rng.range(0.05, 0.2).toFixed(3)})`;
      c.beginPath();
      c.arc(Math.cos(a) * r, Math.sin(a) * r * TILT, rng.range(0.25, 0.7), 0, TAU);
      c.fill();
    }

    // The clearing: soft, irregular holes along the reached part of the route,
    // and a fainter one around the next zone — the road ahead is guessed at.
    c.globalCompositeOperation = "destination-out";
    const n = zones.length;
    let reached = 0;
    zones.forEach((z, i) => {
      if (z.state !== "locked") reached = i;
    });
    const holeRng = createRng(0x6a1d);
    const carve = (p: Point, reach: number, strength: number) => {
      for (let k = 0; k < 5; k++) {
        const jx = p.x + holeRng.range(-reach * 0.25, reach * 0.25);
        const jy = p.y + holeRng.range(-reach * 0.2, reach * 0.2);
        const r = reach * holeRng.range(0.7, 1.05);
        const g = c.createRadialGradient(jx, jy, r * 0.3, jx, jy, r);
        g.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        c.fillStyle = g;
        c.fillRect(jx - r, jy - r, r * 2, r * 2);
      }
    };
    const stepLen = n > 1 ? Math.hypot(routePoint(0, R).x - routePoint(1, R).x, routePoint(0, R).y - routePoint(1, R).y) : R * 0.1;
    const reach = Math.max(R * 0.2, stepLen * 2.8);
    for (let i = 0; i <= reached; i++) carve(routePoint(i, R), reach, 1);
    if (reached + 1 < n) carve(routePoint(reached + 1, R), reach * 0.7, 0.45);
    return layer;
  };

  // ---------------------------------------------------------------------------
  // Frame
  // ---------------------------------------------------------------------------

  const draw = () => {
    const f = frame;
    if (!f || !sky || !disc || !veil) return;
    const { width: w, height: h } = f;
    // Diving: the whole picture scales about the zone being dived into.
    const z = zoomScale;
    const focus = zoom && z !== 1 ? nodeAt(zoom.index) : null;
    if (focus) {
      ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (focus.x - focus.x * z), dpr * (focus.y - focus.y * z));
    } else {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // Sky stays put; the disc turns.
    ctx.drawImage(sky, 0, 0, w, h);
    const a = rotation();
    ctx.save();
    ctx.translate(f.cx, f.cy);
    ctx.rotate(a);
    ctx.drawImage(disc, -f.S / 2, -f.S / 2, f.S, f.S);
    ctx.drawImage(veil, -f.S / 2, -f.S / 2, f.S, f.S);
    ctx.restore();

    // Twinkles on the arms.
    ctx.fillStyle = "#ffffff";
    for (const s of twinkle) {
      const p = armPoint(s.arm, s.t, f.R);
      const k = 0.5 + 0.5 * Math.sin(time * s.rate + s.phase);
      const q = toScreen({ x: p.x + s.spread * f.R, y: p.y + s.spread * f.R * 0.6 }, a);
      ctx.globalAlpha = 0.08 + 0.5 * k * k;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 0.7 + 0.9 * k, 0, TAU);
      ctx.fill();
    }
    // Motes drifting over the charted corner.
    for (const m of motes) {
      const drift = Math.sin(time * m.speed * TAU + m.phase);
      const p = armPoint(0, m.t + drift * 0.01, f.R);
      const q = toScreen({ x: p.x + m.spread * f.R, y: p.y + m.spread * f.R * 0.7 + drift * 3 }, a);
      ctx.globalAlpha = 0.12 + 0.18 * (0.5 + 0.5 * Math.cos(time * 0.7 + m.phase));
      ctx.fillStyle = "#cfe0ff";
      ctx.beginPath();
      ctx.arc(q.x, q.y, m.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // The route: a glowing thread with a dot per zone.
    const n = zones.length;
    if (n === 0) return;
    const pts = zones.map((_, i) => nodeAt(i));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < n - 1; i++) {
      const lit = zones[i].state !== "locked" && zones[i + 1].state !== "locked";
      const hue = hueOf(zones[i].hue);
      if (lit) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = alpha(hue, 0.28);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.stroke();
        ctx.restore();
      }
      ctx.setLineDash(lit ? [] : [2, 5]);
      ctx.strokeStyle = lit ? alpha("#ffffff", 0.85) : "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = lit ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      ctx.stroke();
    }
    // Past the last zone the road goes on, fading into the veil.
    {
      const end = toScreen(routePoint(n - 1 + Math.max(2, n * 0.6), f.R), a);
      const g = ctx.createLinearGradient(pts[n - 1].x, pts[n - 1].y, end.x, end.y);
      g.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      g.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pts[n - 1].x, pts[n - 1].y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.font = `600 9px ${MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let current = -1;
    zones.forEach((zone, i) => {
      const p = pts[i];
      const hue = hueOf(zone.hue);
      if (zone.state === "locked") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, TAU);
        ctx.fill();
        return;
      }
      if (zone.state === "current") current = i;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      bloom(ctx, p.x, p.y, 18, hue, 0.6);
      ctx.restore();
      ctx.fillStyle = zone.state === "cleared" ? hue : "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, TAU);
      ctx.stroke();
      if (compact) return;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText(zone.kicker, p.x, p.y - 13);
    });

    // Kal: a pulse, a leader and a glass label.
    if (current >= 0) {
      const p = pts[current];
      const k = reducedMotion.matches ? 0.5 : 0.5 + 0.5 * Math.sin(time * 2.2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.7 - 0.5 * k).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8 + 12 * k, 0, TAU);
      ctx.stroke();
    }

    // The dive's light: a cool bloom over the zone, rising with the scale.
    if (focus && zoom) {
      const span = Math.max(0.001, Math.abs(zoom.to - zoom.from));
      const k = Math.min(1, Math.abs(z - Math.min(zoom.from, zoom.to)) / span);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      bloom(ctx, focus.x, focus.y, Math.max(w, h) * (0.35 + 0.65 * k), "#dfe8ff", 0.95 * k * k, 0.3);
      ctx.restore();
    }

    if (current >= 0 && !compact) {
      const p = pts[current];
      const above = p.y > h * 0.5;
      const caption = `${zones[current].kicker} · ${zones[current].title}`.toUpperCase();
      ctx.font = `500 10px ${MONO}`;
      const cw = ctx.measureText(caption).width;
      ctx.font = `600 11px ${MONO}`;
      const tw = Math.max(cw, ctx.measureText("YOU ARE HERE").width);
      const pw = tw + 28;
      const ph = 40;
      const lx = Math.max(pw / 2 + 8, Math.min(w - pw / 2 - 8, p.x));
      const ly = above ? p.y - 62 : p.y + 62;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + (above ? -10 : 10));
      ctx.lineTo(lx, ly + (above ? ph / 2 : -ph / 2));
      ctx.stroke();
      // Label plate.
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      roundRect(ctx, lx - pw / 2, ly - ph / 2, pw, ph, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.fillText("YOU ARE HERE", lx, ly - 7);
      ctx.font = `500 10px ${MONO}`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
      ctx.fillText(caption, lx, ly + 8);
    }
  };

  const live = () => !destroyed && !hidden;

  const tick = (now: number) => {
    raf = 0;
    if (!live()) return;
    const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reducedMotion.matches) time += dt;
    if (zoom) {
      zoom.t = Math.min(zoom.seconds, zoom.t + dt);
      const p = zoom.seconds > 0 ? zoom.t / zoom.seconds : 1;
      // Ease in: the dive gathers speed, the way falling does.
      const e = zoom.to > zoom.from ? p * p * (3 - 2 * p) * (0.4 + 0.6 * p) : 1 - (1 - p) * (1 - p);
      zoomScale = zoom.from + (zoom.to - zoom.from) * e;
      if (p >= 1) {
        zoomScale = zoom.to;
        if (zoom.to === 1) zoom = null;
      }
    }
    draw();
    const diving = zoom !== null && zoom.t < zoom.seconds;
    if (!reducedMotion.matches || diving) raf = requestAnimationFrame(tick);
  };
  const schedule = () => {
    if (!raf && live()) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };

  // ---------------------------------------------------------------------------
  // Browser plumbing
  // ---------------------------------------------------------------------------

  const applySize = () => {
    const width = stage.clientWidth || canvas.clientWidth;
    const height = stage.clientHeight || canvas.clientHeight;
    if (width === 0 || height === 0) return;
    dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    // The disc may run past a phone's sides; the route hangs at the bottom, on screen.
    const own = options.frame?.(width, height) ?? {
      cx: width / 2,
      cy: height * 0.46,
      R: Math.min(width * 0.62, height * 0.5) * 0.92,
    };
    frame = { width, height, ...own, S: Math.ceil(own.R * 2.5) };
    sky = paintSky(frame);
    disc = paintDisc(frame);
    veil = paintVeil(frame);
    draw();
    schedule();
  };
  let resizeTimer = 0;
  let sized = false;
  const resize = () => {
    if (!sized) {
      applySize();
      sized = frame !== null;
      return;
    }
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!destroyed) applySize();
    }, 80);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();

  const onVisibility = () => {
    hidden = document.visibilityState === "hidden";
    schedule();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const onMotion = () => schedule();
  reducedMotion.addEventListener("change", onMotion);

  const onClick = (e: MouseEvent) => {
    if (!options.onTap || !frame || zoom) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    let best = -1;
    let bestD = 24;
    zones.forEach((zone, i) => {
      if (zone.state === "locked") return;
      const p = nodeAt(i);
      const d = Math.hypot(px - p.x, py - p.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) options.onTap(best);
  };
  canvas.addEventListener("click", onClick);

  return {
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onMotion);
      canvas.removeEventListener("click", onClick);
    },
    setZones(next) {
      zones = [...next];
      if (frame) {
        veil = paintVeil(frame);
        draw();
      }
      schedule();
    },
    frame: () => (frame ? { cx: frame.cx, cy: frame.cy, R: frame.R } : null),
    time: () => time,
    zoomTo(index, scale, seconds) {
      const i = Math.max(0, Math.min(zones.length - 1, index));
      zoom = { index: i, from: zoomScale, to: Math.max(1, scale), t: 0, seconds: Math.max(0, seconds) };
      if (zoom.seconds === 0) {
        zoomScale = zoom.to;
        zoom.t = 0;
        if (zoom.to === 1) zoom = null;
      }
      schedule();
    },
  };
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function offscreen(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
}

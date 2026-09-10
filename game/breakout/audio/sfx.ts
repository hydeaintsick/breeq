/**
 * The breakout sound design: engine events in, voices out.
 *
 * Direction — noble, spacious, futuristic, and easy on the ear over a long
 * session:
 * - Every pitched sound sits in the level's key (root from the level id) on a
 *   six-note scale (major without the fourth), so brick runs form melodies
 *   instead of noise. Brick color picks the degree, brick height the octave,
 *   paddle position bends the paddle note across the scale.
 * - No square waves, no chiptune. Struck glass and metal are modelled with
 *   sine partials; movement is filtered air; impacts are soft-attacked sines.
 * - Everything feeds a hall reverb; the closer to the player, the drier.
 * - Repeats within a few tens of milliseconds are softened, dense moments
 *   drop the least important hits, and pitch/detune vary from the seeded RNG.
 * - A quiet pad breathes under play only, and brightens with heat and speed,
 *   so the mix always tells you how hot the ball is without a single beep.
 */
import { createRng } from "../../shared/random";
import { RULES } from "../engine/game";
import type { BrickColor, GameEvent, GameState, Level } from "../engine/types";
import { currentBus, unlockSound } from "./bus";
import { Layer, STEEL } from "./synth";

/** Semitone offsets: major scale without the fourth. Any two notes agree. */
const SCALE = [0, 2, 4, 7, 9, 11] as const;
/** Brick color → scale degree. */
const COLOR_DEGREE: Record<BrickColor, number> = { blue: 0, violet: 1, pink: 2, cyan: 3, lime: 4, amber: 5 };

const PAD_LEVEL = 0.045;
const WIND_LEVEL = 0.018;
/** Ambient parameters are re-targeted at most this often, seconds. */
const PAD_REFRESH = 0.12;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Root note (MIDI) from the level id: D3..A3, stable per level. */
function keyOf(level: Level): number {
  let h = 0;
  for (let i = 0; i < level.id.length; i++) h = (h * 31 + level.id.charCodeAt(i)) >>> 0;
  return 50 + (h % 8);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

interface Pad {
  close(): void;
  gain: GainNode;
  filter: BiquadFilterNode;
  wind: GainNode;
  sources: AudioScheduledSourceNode[];
}

export class BreakoutSfx {
  private level: Level;
  private root: number;
  private layer: Layer | null = null;
  private active = true;
  private readonly lastAt = new Map<string, number>();
  private pad: Pad | null = null;
  private padNext = 0;
  private padTarget = { gain: -1, cutoff: -1, wind: -1 };

  constructor(level: Level) {
    this.level = level;
    this.root = keyOf(level);
  }

  /** A new wall: new key, fresh ambience. */
  setLevel(level: Level): void {
    this.level = level;
    this.root = keyOf(level);
    this.lastAt.clear();
    this.stopPad();
  }

  /** Call from a pointer gesture: starts the audio context if it may sound. */
  unlock(): void {
    unlockSound();
    this.ensure();
  }

  /** False while paused, off-screen, or in a hidden tab. */
  setActive(on: boolean): void {
    this.active = on;
    this.layer?.setActive(on);
  }

  destroy(): void {
    this.stopPad();
    this.layer?.destroy();
    this.layer = null;
  }

  apply(e: GameEvent, s: GameState): void {
    if (!this.active) return;
    const L = this.ensure();
    if (!L) return;
    const now = L.now;

    switch (e.type) {
      case "launch": {
        L.noise({ gain: 0.08, attack: 0.05, decay: 0.3, filter: "bandpass", freq: 500, to: 3200, q: 0.9, send: 0.6 });
        L.tone({
          freq: this.note(0, 12),
          to: this.note(0, 24),
          glide: 0.28,
          type: "triangle",
          lowpass: 2200,
          gain: 0.09,
          attack: 0.04,
          decay: 0.35,
          send: 0.7,
        });
        return;
      }

      case "wall": {
        // The most frequent event: a muted marble on stone, mostly room.
        const v = this.soften("wall", 0.09) * (L.crowded ? 0.5 : 1);
        const pan = this.pan(e.x);
        const f = e.side === "top" ? 260 : 190;
        L.tone({ freq: f * 1.4, to: f, glide: 0.035, gain: 0.15 * v, decay: 0.09, pan, send: 0.4 });
        L.noise({ gain: 0.03 * v, decay: 0.03, filter: "bandpass", freq: 1500, q: 1.2, pan, send: 0.3 });
        return;
      }

      case "paddle": {
        const pan = this.pan(e.x);
        if (e.caught) {
          // Sticky paddle: a soft magnetic hold.
          L.tone({ freq: this.note(0, 0), gain: 0.16, attack: 0.02, decay: 0.5, pan, send: 0.6 });
          L.noise({ gain: 0.03, decay: 0.04, filter: "bandpass", freq: 2400, q: 2, pan, send: 0.3 });
          return;
        }
        const v = this.soften("paddle", 0.1);
        const speed = clamp(s.speed.total, 0.5, 3);
        const amp = 0.13 + 0.06 * clamp((speed - 1) / 2, 0, 1);
        // Where the ball met the paddle bends the note across the scale.
        const deg = Math.round(((clamp(e.offset, -1, 1) + 1) / 2) * 4);
        L.tone({
          freq: this.note(deg, 12),
          type: "triangle",
          lowpass: 3200,
          gain: amp * v,
          attack: 0.004,
          decay: 0.32,
          pan,
          send: 0.6,
        });
        L.tone({ freq: this.note(deg + 2, 12), gain: amp * 0.5 * v, attack: 0.004, decay: 0.26, pan, send: 0.65 });
        L.noise({ gain: 0.025 * v, decay: 0.03, filter: "highpass", freq: 3000, pan, send: 0.3 });
        return;
      }

      case "brick": {
        const b = e.brick;
        const pan = this.pan(e.x);
        const deg = COLOR_DEGREE[b.color];
        const { top, bottom } = this.level.field;
        // Higher rows ring an octave higher.
        const oct = (e.y - top) / (bottom - top) < 0.3 ? 36 : 24;

        if (!e.broken) {
          const v = this.soften("tock", 0.08);
          switch (b.kind) {
            case "steel":
              L.bell({ freq: 420, gain: 0.15 * v, decay: 0.22, partials: STEEL, pan, send: 0.45 });
              return;
            case "rotor":
              L.bell({ freq: this.note(deg, 24), gain: 0.14 * v, decay: 0.18, partials: STEEL, pan, send: 0.45 });
              return;
            case "lock":
              L.tone({ freq: 150, to: 110, glide: 0.06, gain: 0.2 * v, decay: 0.12, lowpass: 900, pan, send: 0.35 });
              L.noise({ gain: 0.04 * v, decay: 0.04, filter: "lowpass", freq: 900, pan, send: 0.3 });
              return;
            default:
              // Hard brick cracking, magnet holding: a damped knock.
              L.tone({ freq: this.note(deg, oct), type: "triangle", lowpass: 2500, gain: 0.13 * v, decay: 0.1, pan, send: 0.4 });
              L.noise({ gain: 0.05 * v, decay: 0.035, filter: "bandpass", freq: 1800, q: 1.5, pan, send: 0.3 });
              return;
          }
        }

        const v = this.soften("brick", 0.06);
        switch (b.kind) {
          case "key":
            L.bell({ freq: this.note(deg, oct), gain: 0.2 * v, decay: 0.9, pan, send: 0.75 });
            L.bell({ freq: this.note(deg + 4, oct), gain: 0.12 * v, decay: 0.6, pan, send: 0.8, at: now + 0.05 });
            return;
          case "regen":
            L.bell({ freq: this.note(deg, oct - 12), gain: 0.2 * v, decay: 0.7, pan, send: 0.7 });
            return;
          case "magnet": {
            const f = this.note(deg, oct - 12);
            L.bell({ freq: this.note(deg, oct), gain: 0.16 * v, decay: 0.8, pan, send: 0.7 });
            L.tone({ freq: f, to: f * 0.8, glide: 0.3, gain: 0.08 * v, attack: 0.01, decay: 0.3, pan, send: 0.6 });
            return;
          }
          case "hard":
            L.bell({ freq: this.note(deg, oct), gain: 0.22 * v, decay: 0.8, pan, send: 0.7 });
            L.noise({ gain: 0.05 * v, decay: 0.06, filter: "bandpass", freq: 2500, q: 1, pan, send: 0.5 });
            return;
          case "explosive":
            // Short: the `explode` event carries the weight.
            L.bell({ freq: this.note(deg, oct), gain: 0.14 * v, decay: 0.4, pan, send: 0.7 });
            return;
          default:
            L.bell({ freq: this.note(deg, oct), gain: 0.2 * v, decay: 1.0, pan, send: 0.7 });
            return;
        }
      }

      case "explode": {
        const pan = this.pan(e.x);
        L.tone({ freq: 150, to: 36, glide: 0.5, gain: 0.42, attack: 0.008, decay: 0.55, pan: pan * 0.5, send: 0.5 });
        L.noise({ gain: 0.2, attack: 0.005, decay: 0.45, filter: "lowpass", freq: 1200, to: 120, pan, send: 0.6 });
        const deg = COLOR_DEGREE[e.color];
        for (let i = 0; i < 3; i++) {
          L.bell({
            freq: this.note(deg + i * 2, 36 - (i % 2) * 12),
            gain: 0.09,
            decay: 0.5,
            at: now + 0.02 + 0.03 * i,
            pan: clamp(pan + L.vary(0.4), -1, 1),
            send: 0.8,
          });
        }
        return;
      }

      case "regen": {
        // Materialize: swells in instead of striking.
        const b = e.brick;
        const pan = this.pan(b.x + b.w / 2);
        L.tone({ freq: this.note(COLOR_DEGREE[b.color], 24), gain: 0.11, attack: 0.22, decay: 0.45, pan, send: 0.85 });
        L.noise({ gain: 0.025, attack: 0.2, decay: 0.3, filter: "bandpass", freq: 4500, q: 2, pan, send: 0.8 });
        return;
      }

      case "unlock": {
        [0, 2, 3, 5].forEach((deg, i) => {
          L.bell({ freq: this.note(deg, 24), gain: 0.17, decay: 0.9, at: now + i * 0.075, pan: -0.3 + 0.2 * i, send: 0.8 });
        });
        return;
      }

      case "orderDone": {
        L.bell({ freq: this.note(3, 24), gain: 0.16, decay: 0.8, send: 0.8 });
        L.bell({ freq: this.note(6, 24), gain: 0.14, decay: 0.9, at: now + 0.09, send: 0.85 });
        return;
      }

      case "zone": {
        const z = e.zone;
        const pan = this.pan(z.x);
        switch (z.kind) {
          case "slow":
            L.tone({
              freq: this.note(0, 24),
              to: this.note(0, 12),
              glide: 0.45,
              type: "triangle",
              lowpass: 1800,
              gain: 0.18,
              attack: 0.02,
              decay: 0.5,
              pan,
              send: 0.7,
            });
            L.noise({ gain: 0.06, attack: 0.02, decay: 0.45, filter: "lowpass", freq: 3000, to: 250, pan, send: 0.6 });
            return;
          case "fast2":
            L.tone({
              freq: this.note(0, 12),
              to: this.note(0, 24),
              glide: 0.3,
              type: "triangle",
              lowpass: 3000,
              gain: 0.18,
              attack: 0.01,
              decay: 0.35,
              pan,
              send: 0.6,
            });
            L.noise({ gain: 0.06, decay: 0.3, filter: "bandpass", freq: 400, to: 4000, q: 1, pan, send: 0.5 });
            return;
          case "fast3":
            L.tone({
              freq: this.note(0, 12),
              to: this.note(0, 36),
              glide: 0.28,
              type: "triangle",
              lowpass: 3600,
              gain: 0.2,
              attack: 0.01,
              decay: 0.35,
              pan,
              send: 0.6,
            });
            L.tone({ freq: this.note(3, 12), to: this.note(3, 24), glide: 0.28, gain: 0.1, attack: 0.01, decay: 0.3, pan, send: 0.6 });
            L.noise({ gain: 0.07, decay: 0.3, filter: "bandpass", freq: 400, to: 6000, q: 1, pan, send: 0.5 });
            return;
          case "mirror": {
            const side = pan >= 0 ? 1 : -1;
            L.tone({ freq: this.note(2, 24), gain: 0.13, decay: 0.2, pan: -0.6 * side, send: 0.6 });
            L.tone({ freq: this.note(2, 24), gain: 0.13, decay: 0.2, at: now + 0.06, pan: 0.6 * side, send: 0.6 });
            L.noise({ gain: 0.05, decay: 0.2, filter: "bandpass", freq: 1500, to: 3500, q: 1.2, pan, send: 0.6 });
            return;
          }
          case "fakePortal":
            // A dud. The joke is that nothing shimmers.
            L.tone({ freq: 140, gain: 0.07, decay: 0.12, lowpass: 600, pan, send: 0.3 });
            return;
          default:
            // portal → `teleport`, split → `split`, paddle mods → `mod`.
            return;
        }
      }

      case "teleport": {
        const from = this.pan(e.from.x);
        const to = this.pan(e.to.x);
        L.noise({ gain: 0.08, attack: 0.01, decay: 0.35, filter: "bandpass", freq: 1800, to: 9000, q: 1.6, pan: from, send: 0.85 });
        [0, 3, 5].forEach((deg, i) => {
          L.bell({ freq: this.note(deg, 36), gain: 0.08, decay: 0.45, at: now + 0.04 * i, pan: i === 2 ? to : from, send: 0.9 });
        });
        L.tone({ freq: this.note(0, 12), gain: 0.07, attack: 0.05, decay: 0.3, at: now + 0.08, pan: to, send: 0.8 });
        return;
      }

      case "split": {
        const f = this.note(3, 24);
        const pan = this.pan(e.x);
        L.tone({ freq: f, to: f * 2 ** (4 / 12), glide: 0.4, gain: 0.13, attack: 0.02, decay: 0.45, pan: clamp(pan + 0.3, -1, 1), send: 0.7 });
        L.tone({ freq: f, to: f * 2 ** (-3 / 12), glide: 0.4, gain: 0.13, attack: 0.02, decay: 0.45, pan: clamp(pan - 0.3, -1, 1), send: 0.7 });
        return;
      }

      case "mod": {
        const f = this.note(0, 24);
        switch (e.kind) {
          case "shrink":
            L.tone({ freq: f, to: f * 2 ** (-5 / 12), glide: 0.3, type: "triangle", lowpass: 2400, gain: 0.17, attack: 0.01, decay: 0.4, send: 0.6 });
            return;
          case "grow":
            L.tone({ freq: f * 2 ** (-5 / 12), to: f, glide: 0.3, type: "triangle", lowpass: 2400, gain: 0.17, attack: 0.01, decay: 0.4, send: 0.6 });
            return;
          case "invert": {
            const g = this.note(2, 24);
            L.tone({ freq: g, gain: 0.12, decay: 0.22, pan: -0.8, send: 0.6 });
            L.tone({ freq: g, gain: 0.12, decay: 0.22, pan: 0.8, send: 0.6, at: now + 0.09 });
            L.tone({ freq: this.note(4, 24), gain: 0.1, decay: 0.22, pan: 0.8, send: 0.6 });
            L.tone({ freq: this.note(4, 24), gain: 0.1, decay: 0.22, pan: -0.8, send: 0.6, at: now + 0.09 });
            L.noise({ gain: 0.05, decay: 0.3, filter: "bandpass", freq: 1200, to: 2800, q: 1, send: 0.6 });
            return;
          }
          case "ice":
            [0, 2, 3, 5].forEach((deg, i) => {
              L.bell({ freq: this.note(deg, 48), gain: 0.06, decay: 0.6, at: now + 0.03 * i, pan: -0.5 + 0.33 * i, send: 0.9 });
            });
            L.noise({ gain: 0.035, attack: 0.02, decay: 0.3, filter: "highpass", freq: 7000, send: 0.9 });
            return;
          case "sticky":
            L.tone({ freq: this.note(0, 0), gain: 0.17, attack: 0.12, decay: 0.5, send: 0.6 });
            L.tone({ freq: this.note(3, 0), gain: 0.09, attack: 0.14, decay: 0.5, send: 0.6 });
            return;
        }
        return;
      }

      case "modEnd": {
        // A quiet release back to the root.
        L.tone({ freq: this.note(0, 24), gain: 0.09, attack: 0.03, decay: 0.3, send: 0.8 });
        L.tone({ freq: this.note(0, 12), gain: 0.05, attack: 0.03, decay: 0.3, send: 0.8 });
        return;
      }

      case "bonusEnd": {
        L.tone({ freq: this.note(2, 24), gain: 0.07, attack: 0.05, decay: 0.35, send: 0.8 });
        return;
      }

      case "obstacle": {
        const o = e.obstacle;
        const pan = this.pan(e.x);
        switch (o.kind) {
          case "bumper": {
            const v = this.soften("bumper", 0.08);
            L.tone({ freq: 280, to: 120, glide: 0.07, gain: 0.3 * v, decay: 0.12, pan, send: 0.45 });
            L.bell({ freq: this.note(0, 36), gain: 0.11 * v, decay: 0.3, pan, send: 0.6 });
            return;
          }
          case "rail": {
            const v = this.soften("rail", 0.15);
            L.tone({ freq: this.note(0, 12), type: "triangle", lowpass: 1500, gain: 0.09 * v, attack: 0.01, decay: 0.18, pan, send: 0.5 });
            L.noise({ gain: 0.04 * v, decay: 0.15, filter: "bandpass", freq: 2200, q: 2, pan, send: 0.4 });
            return;
          }
          case "fan": {
            const v = this.soften("fan", 0.4);
            L.noise({ gain: 0.09 * v, attack: 0.05, decay: 0.4, filter: "bandpass", freq: 600, to: 1200, q: 0.6, pan, send: 0.5 });
            return;
          }
          case "guard": {
            const v = this.soften("guard", 0.08);
            L.bell({ freq: 330, gain: 0.2 * v, decay: 0.3, partials: STEEL, pan, send: 0.5 });
            return;
          }
          case "trampoline": {
            const v = this.soften("trampoline", 0.1);
            L.tone({
              freq: this.note(0, 12),
              to: this.note(0, 24),
              glide: 0.22,
              type: "triangle",
              lowpass: 2800,
              gain: 0.22 * v,
              attack: 0.005,
              decay: 0.28,
              pan,
              send: 0.6,
            });
            L.noise({ gain: 0.04 * v, decay: 0.15, filter: "bandpass", freq: 800, to: 3000, pan, send: 0.4 });
            return;
          }
          case "blackhole": {
            const v = this.soften("blackhole", 0.3);
            L.tone({ freq: 60, gain: 0.28 * v, attack: 0.1, decay: 0.6, pan, send: 0.4 });
            L.noise({ gain: 0.06 * v, attack: 0.1, decay: 0.5, filter: "lowpass", freq: 300, pan, send: 0.6 });
            return;
          }
        }
        return;
      }

      case "swallow": {
        const pan = this.pan(e.x);
        L.tone({ freq: this.note(0, 24), to: 34, glide: 0.8, gain: 0.24, attack: 0.02, decay: 0.85, pan, send: 0.7 });
        L.noise({ gain: 0.09, attack: 0.3, decay: 0.5, filter: "lowpass", freq: 2000, to: 100, pan, send: 0.8 });
        return;
      }

      case "heat": {
        // The pad carries heat continuously; only the ceiling gets a shimmer.
        if (e.heat < RULES.heatMax - 0.01 || this.soften("heatMax", 2) < 1) return;
        L.noise({ gain: 0.045, attack: 0.15, decay: 0.6, filter: "highpass", freq: 6000, send: 0.9 });
        L.bell({ freq: this.note(5, 36), gain: 0.07, decay: 0.9, send: 0.9 });
        return;
      }

      case "descend": {
        L.tone({ freq: this.note(0, 0), lowpass: 400, gain: 0.22, attack: 0.03, decay: 0.7, send: 0.6 });
        L.tone({ freq: this.note(3, 0), type: "triangle", lowpass: 500, gain: 0.11, attack: 0.03, decay: 0.6, send: 0.6 });
        L.noise({ gain: 0.11, attack: 0.02, decay: 0.5, filter: "lowpass", freq: 260, send: 0.5 });
        return;
      }

      case "life": {
        // The last life is told by `over`.
        if (e.lives <= 0) return;
        const pan = this.pan(e.x);
        L.tone({ freq: this.note(2, 12), type: "triangle", lowpass: 1400, gain: 0.15, attack: 0.02, decay: 1.2, pan, send: 0.9 });
        L.tone({ freq: this.note(0, 12), gain: 0.15, attack: 0.02, decay: 1.4, at: now + 0.22, pan, send: 0.9 });
        L.noise({ gain: 0.06, attack: 0.02, decay: 0.7, filter: "lowpass", freq: 700, to: 150, pan, send: 0.7 });
        return;
      }

      case "cleared": {
        [0, 2, 3, 6, 8].forEach((deg, i) => {
          L.bell({ freq: this.note(deg, 24), gain: 0.19, decay: 1.4, at: now + 0.09 * i, pan: -0.4 + 0.2 * i, send: 0.85 });
        });
        L.tone({ freq: this.note(0, 12), type: "triangle", lowpass: 1200, gain: 0.08, attack: 0.5, hold: 0.8, decay: 2.2, send: 0.9 });
        L.tone({ freq: this.note(3, 12), gain: 0.06, attack: 0.6, hold: 0.8, decay: 2.2, send: 0.9 });
        L.tone({ freq: this.note(0, 0), gain: 0.09, attack: 0.4, hold: 1, decay: 2, send: 0.6 });
        return;
      }

      case "over": {
        const low = this.note(0, 0);
        L.tone({ freq: this.note(3, 12), type: "triangle", lowpass: 1200, gain: 0.15, attack: 0.03, decay: 1.6, send: 0.9 });
        L.tone({ freq: this.note(0, 12), gain: 0.15, attack: 0.03, decay: 1.8, at: now + 0.3, send: 0.9 });
        L.tone({ freq: low, to: low / 2, glide: 1.5, gain: 0.16, attack: 0.1, decay: 2, at: now + 0.3, send: 0.7 });
        if (e.reason === "crushed") {
          L.noise({ gain: 0.13, attack: 0.05, decay: 1, filter: "lowpass", freq: 300, to: 60, send: 0.6 });
        }
        return;
      }
    }
  }

  /** Once per frame: the pad follows phase, heat, and speed. */
  update(s: GameState): void {
    if (!this.active) return;
    const L = this.ensure();
    if (!L) return;
    const now = L.now;
    if (now < this.padNext) return;
    this.padNext = now + PAD_REFRESH;

    const playing = s.phase === "play";
    if (!this.pad) {
      if (!playing) return;
      this.pad = this.startPad(L);
    }
    const pad = this.pad;
    if (!pad) return;
    const heat = clamp(s.speed.heat / RULES.heatMax, 0, 1);
    const speed = clamp((s.speed.total - 1) / 2, 0, 1);
    const gain = playing ? PAD_LEVEL * (0.7 + 0.3 * speed) : 0;
    const cutoff = 240 + 900 * heat + 300 * speed;
    const wind = playing ? WIND_LEVEL * (0.5 + heat + speed) : 0;
    const t = this.padTarget;
    if (Math.abs(gain - t.gain) > 0.0005) {
      t.gain = gain;
      pad.gain.gain.setTargetAtTime(gain, now, playing ? 0.9 : 0.35);
    }
    if (Math.abs(cutoff - t.cutoff) > 8) {
      t.cutoff = cutoff;
      pad.filter.frequency.setTargetAtTime(cutoff, now, 0.4);
    }
    if (Math.abs(wind - t.wind) > 0.0005) {
      t.wind = wind;
      pad.wind.gain.setTargetAtTime(wind, now, 0.5);
    }
  }

  // ---------------------------------------------------------------------------

  private ensure(): Layer | null {
    if (!this.layer) {
      const bus = currentBus();
      if (!bus) return null;
      this.layer = new Layer(bus, this.root);
      this.layer.setActive(this.active);
    }
    return this.layer.ready ? this.layer : null;
  }

  /** Scale degree (wraps into the next octave) above the root, offset by `octave` semitones. */
  private note(degree: number, octave: number): number {
    const d = ((degree % SCALE.length) + SCALE.length) % SCALE.length;
    return hz(this.root + octave + SCALE[d] + 12 * Math.floor(degree / SCALE.length));
  }

  private pan(x: number): number {
    return clamp(((x / this.level.width) * 2 - 1) * 0.7, -1, 1);
  }

  /** 1 for a fresh hit, down to 0.35 when the same kind repeats within `gap` seconds. */
  private soften(key: string, gap: number): number {
    const now = this.layer?.now ?? 0;
    const last = this.lastAt.get(key) ?? -Infinity;
    this.lastAt.set(key, now);
    const d = now - last;
    return d >= gap ? 1 : 0.35 + 0.65 * (d / gap);
  }

  private startPad(L: Layer): Pad | null {
    const ch = L.channel({ pan: 0, send: 0.8 });
    if (!ch) return null;
    const ctx = L.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ch.input);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 240;
    filter.Q.value = 0.8;
    filter.connect(gain);

    const sources: AudioScheduledSourceNode[] = [];
    const voice = (freq: number, detune: number, level: number, type: OscillatorType = "sine") => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(filter);
      osc.start();
      sources.push(osc);
    };
    // Root and fifth, a touch apart, over a sub root.
    voice(this.note(0, 0), -3, 1);
    voice(this.note(3, 0), 4, 0.7);
    voice(this.note(0, -12), 0, 0.5, "triangle");

    // Slow drift on the filter so the pad never sits still.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    sources.push(lfo);

    // Air: a band of noise that widens with heat.
    const windSrc = ctx.createBufferSource();
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 700;
    windFilter.Q.value = 0.5;
    const wind = ctx.createGain();
    wind.gain.value = 0;
    windSrc.buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.5), ctx.sampleRate);
    fillNoise(windSrc.buffer, this.root);
    windSrc.loop = true;
    windSrc.connect(windFilter).connect(wind).connect(ch.input);
    windSrc.start();
    sources.push(windSrc);

    this.padTarget = { gain: -1, cutoff: -1, wind: -1 };
    return { close: ch.close, gain, filter, wind, sources };
  }

  private stopPad(): void {
    const pad = this.pad;
    if (!pad) return;
    this.pad = null;
    const ctx = pad.gain.context;
    const t = ctx.currentTime;
    pad.gain.gain.setTargetAtTime(0, t, 0.08);
    pad.wind.gain.setTargetAtTime(0, t, 0.08);
    for (const src of pad.sources) src.stop(t + 0.5);
    pad.sources[0]?.addEventListener("ended", pad.close, { once: true });
  }
}

function fillNoise(buffer: AudioBuffer, seed: number): void {
  const data = buffer.getChannelData(0);
  const rng = createRng(seed);
  for (let i = 0; i < data.length; i++) data[i] = rng.next() * 2 - 1;
}

/**
 * The energy gauge's voice: what the cells sound like as they leave and land.
 *
 * Direction — a reactor made of the same glass as the bricks, in the story
 * theme's key of D so it sits under the tune:
 * - `drain`: a cell goes dark as the ball is served. A short glass note that
 *   falls a fifth, with a breath of air. Quiet; the run is about to start.
 * - `charge`: a cell lights. A capacitor filling — a swept band of noise
 *   rising into a bell that climbs the scale with the gauge, so a full
 *   recharge is an ascending run and one cell after a clear is a single high
 *   note.
 * - `full`: the gauge reaches the max. Root, fifth, octave, a shimmer.
 * - `empty`: the last run was paid, nothing is left. A low D, a slow fall, a
 *   hollow of air: not a punishment, a door closing.
 * - `stamp`: the "+N" or "−N" pill lands.
 * - `surge`: a bought recharge hits the core. A reactor spinning up — a
 *   swept band and a riser climbing for `ENERGY_SURGE_MS`, then the blast: a
 *   sub thump, a low-passed burst, a bright wash of air and the root-fifth-
 *   octave stab. The cells land on `charge` right after.
 *
 * Every call is a no-op while sound is off or no gesture has opened the bus.
 */
import { currentBus } from "./bus";
import { Layer } from "./synth";

/** D3: the story theme's root. */
const ROOT = 50;
/** Major without the fourth, the game's scale. */
const SCALE = [0, 2, 4, 7, 9, 11] as const;
/** Minimum gap between two charges, seconds. */
const CHARGE_GAP = 0.05;
/** Tails to let ring after the last call before the layer goes, ms. */
const LINGER_MS = 2600;
/** From `surge()` to the blast: the reactor's spin-up, the same beat the screen flashes on. */
export const ENERGY_SURGE_MS = 720;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function note(degree: number, octave: number): number {
  const d = ((degree % SCALE.length) + SCALE.length) % SCALE.length;
  return hz(ROOT + octave + SCALE[d] + 12 * Math.floor(degree / SCALE.length));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export interface EnergySfx {
  /** A cell goes dark. `ratio` is how full the gauge is after, 0..1. */
  drain(ratio: number): void;
  /** A cell lights. `ratio` is how full the gauge is after, 0..1 (past 1 for banked cells). */
  charge(ratio: number): void;
  /** The gauge reached the max. */
  full(): void;
  /** Nothing left in the gauge. */
  empty(): void;
  /** The "+N" / "−N" pill lands. */
  stamp(): void;
  /** A recharge hits the core: spin-up for `ENERGY_SURGE_MS`, then the blast. */
  surge(): void;
  /** Lets the tails ring, then frees the voices. */
  destroy(): void;
}

class Energy implements EnergySfx {
  private layer: Layer | null = null;
  private lastCharge = -Infinity;
  private timer = 0;
  private dead = false;

  drain(ratio: number): void {
    const L = this.ensure();
    if (!L) return;
    const at = L.now + 0.01;
    const r = clamp(ratio, 0, 1);
    const degree = 3 + Math.round(r * 3);
    L.tone({
      freq: note(degree, 24),
      to: note(degree - 3, 24),
      glide: 0.16,
      type: "triangle",
      lowpass: 2600,
      gain: 0.07,
      attack: 0.004,
      decay: 0.2,
      pan: -0.1,
      at,
      send: 0.45,
    });
    L.noise({ gain: 0.03, attack: 0.02, decay: 0.22, filter: "bandpass", freq: 1800, to: 500, q: 1.1, at, send: 0.6 });
  }

  charge(ratio: number): void {
    const L = this.ensure();
    if (!L) return;
    const now = L.now;
    if (now - this.lastCharge < CHARGE_GAP) return;
    this.lastCharge = now;
    const at = now + 0.01;
    const r = clamp(ratio, 0, 1.5);
    // The gauge's fill picks the step: a recharge climbs the scale.
    const degree = Math.floor(r * 6);
    const pan = -0.3 + 0.6 * clamp(r, 0, 1);
    // The capacitor: a swept band rising into the note.
    L.noise({ gain: 0.035, attack: 0.03, hold: 0.02, decay: 0.12, filter: "bandpass", freq: 700, to: 4200, q: 2.2, at, pan, send: 0.5 });
    L.bell({ freq: note(degree, 24), gain: 0.14, decay: 0.75, at: at + 0.06, pan, send: 0.8 });
    L.tone({ freq: note(degree, 0), type: "sine", gain: 0.05, attack: 0.01, decay: 0.3, lowpass: 600, at: at + 0.06, send: 0.4 });
  }

  full(): void {
    const L = this.ensure();
    if (!L) return;
    const at = L.now + 0.02;
    [0, 3, 6].forEach((deg, i) => {
      L.bell({ freq: note(deg, 24), gain: 0.16 - 0.02 * i, decay: 1.2 + 0.1 * i, at: at + 0.07 * i, pan: -0.35 + 0.35 * i, send: 0.9 });
    });
    L.bell({ freq: note(0, 48), gain: 0.06, decay: 1.4, at: at + 0.3, send: 0.9 });
    L.noise({ gain: 0.045, attack: 0.1, decay: 0.7, filter: "highpass", freq: 5200, at, send: 0.9 });
    L.tone({ freq: note(0, 12), type: "triangle", lowpass: 1000, gain: 0.08, attack: 0.04, hold: 0.25, decay: 1.1, at, send: 0.8 });
  }

  empty(): void {
    const L = this.ensure();
    if (!L) return;
    const at = L.now + 0.01;
    L.tone({ freq: hz(ROOT - 24), type: "sine", gain: 0.12, attack: 0.02, hold: 0.08, decay: 0.7, lowpass: 160, at, send: 0.3 });
    L.tone({
      freq: note(0, 12),
      to: note(0, 0),
      glide: 0.5,
      type: "triangle",
      lowpass: 900,
      gain: 0.07,
      attack: 0.01,
      decay: 0.55,
      at,
      send: 0.6,
    });
    L.noise({ gain: 0.04, attack: 0.06, decay: 0.6, filter: "lowpass", freq: 900, to: 250, q: 0.8, at, send: 0.7 });
  }

  stamp(): void {
    const L = this.ensure();
    if (!L) return;
    const at = L.now + 0.01;
    L.bell({ freq: note(0, 24), gain: 0.18, decay: 0.85, at, send: 0.75 });
    L.bell({ freq: note(4, 24), gain: 0.09, decay: 0.7, at: at + 0.04, pan: 0.2, send: 0.8 });
    L.noise({ gain: 0.035, attack: 0.01, decay: 0.22, filter: "bandpass", freq: 2200, to: 4800, q: 1.2, at, send: 0.7 });
  }

  surge(): void {
    const L = this.ensure();
    if (!L) return;
    const at = L.now + 0.01;
    const rise = ENERGY_SURGE_MS / 1000;
    const blast = at + rise;
    // Spin-up: a band of air sweeping up and a riser climbing two octaves, both cut at the blast.
    L.noise({ gain: 0.06, attack: rise * 0.55, hold: rise * 0.4, decay: 0.08, filter: "bandpass", freq: 240, to: 3800, q: 1.6, at, send: 0.5 });
    L.tone({
      freq: hz(ROOT - 24),
      to: hz(ROOT),
      glide: rise,
      type: "triangle",
      lowpass: 1800,
      gain: 0.07,
      attack: rise * 0.5,
      hold: rise * 0.45,
      decay: 0.06,
      at,
      send: 0.4,
    });
    L.tone({ freq: hz(ROOT - 12), to: hz(ROOT + 12), glide: rise, type: "sine", gain: 0.05, attack: rise * 0.6, hold: rise * 0.35, decay: 0.05, at, send: 0.5 });
    // The blast: a sub thump, a low burst, a wash of bright air.
    L.tone({ freq: 62, to: 28, glide: 0.45, type: "sine", gain: 0.22, attack: 0.004, hold: 0.05, decay: 0.55, at: blast, send: 0.2 });
    L.tone({ freq: hz(ROOT - 12), type: "triangle", lowpass: 420, gain: 0.12, attack: 0.004, hold: 0.04, decay: 0.5, at: blast, send: 0.5 });
    L.noise({ gain: 0.14, attack: 0.004, hold: 0.02, decay: 0.42, filter: "lowpass", freq: 5200, to: 240, q: 0.7, at: blast, send: 0.55 });
    L.noise({ gain: 0.05, attack: 0.02, hold: 0.1, decay: 1.1, filter: "highpass", freq: 4800, at: blast + 0.02, send: 0.95 });
    // Root, fifth, octave: the reactor sings.
    [0, 3, 6].forEach((deg, i) => {
      L.bell({ freq: note(deg, 12), gain: 0.15 - 0.02 * i, decay: 1.5 + 0.15 * i, at: blast + 0.02 + 0.03 * i, pan: -0.4 + 0.4 * i, send: 0.9 });
    });
    L.bell({ freq: note(0, 36), gain: 0.05, decay: 1.6, at: blast + 0.12, send: 0.95 });
  }

  destroy(): void {
    if (this.dead) return;
    this.dead = true;
    const layer = this.layer;
    this.layer = null;
    if (!layer) return;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => layer.destroy(), LINGER_MS);
  }

  private ensure(): Layer | null {
    if (this.dead) return null;
    if (!this.layer) {
      const bus = currentBus();
      if (!bus) return null;
      this.layer = new Layer(bus, 0xe7e6);
      this.layer.setActive(true);
    }
    return this.layer.ready ? this.layer : null;
  }
}

/** One per surface that moves the gauge. Safe to call from render effects: nothing sounds until asked. */
export function createEnergySfx(): EnergySfx {
  return new Energy();
}

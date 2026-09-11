/**
 * The payout: what the clear screen sounds like while it counts the XP in.
 *
 * Direction — the same glass as the bricks, in the story theme's key of D so it
 * sits under the tune when the shelf comes back:
 * - `stamp`: the "+N XP" pill lands. One bell and a puff of air.
 * - `tick`: the counter steps. A tiny struck note that climbs the scale as the
 *   level bar fills, rate-limited so a fast count reads as a ripple, not a buzz.
 * - `levelUp`: the bar rolls over. A rising arpeggio, a shimmer, a soft floor.
 * - `settle`: the numbers lock. Root and fifth, quietly.
 * - `star`: a slot of the 1–3 grade lights. Deep D under the theme; empty
 *   slots stay silent.
 *
 * Every call is a no-op while sound is off or no gesture has opened the bus.
 */
import { currentBus } from "./bus";
import { Layer } from "./synth";

/** D3: the story theme's root. */
const ROOT = 50;
/** Major without the fourth, the game's scale. */
const SCALE = [0, 2, 4, 7, 9, 11] as const;
/** Minimum gap between two ticks, seconds. */
const TICK_GAP = 0.03;
/** Ticks stay out of the way while a level-up rings, seconds. */
const TICK_REST = 0.26;
/** Tails to let ring after the last call before the layer goes, ms. */
const LINGER_MS = 2400;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function note(degree: number, octave: number): number {
  const d = ((degree % SCALE.length) + SCALE.length) % SCALE.length;
  return hz(ROOT + octave + SCALE[d] + 12 * Math.floor(degree / SCALE.length));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export interface PayoutSfx {
  /** The "+N XP" stamp lands. */
  stamp(): void;
  /** One step of the counter. `ratio` is how full the level bar is, 0..1. */
  tick(ratio: number): void;
  /** The bar rolled over into a new level. */
  levelUp(): void;
  /** The counter locked on its final value. */
  settle(): void;
  /**
   * One slot of the star grade lights. `index` is 0..2.
   * `filled` stars are a deep D; empty slots stay silent.
   */
  star(index: number, filled: boolean): void;
  /** Lets the tails ring, then frees the voices. */
  destroy(): void;
}

class Payout implements PayoutSfx {
  private layer: Layer | null = null;
  private lastTick = -Infinity;
  private restUntil = -Infinity;
  private timer = 0;
  private dead = false;

  stamp(): void {
    const L = this.ensure();
    if (!L) return;
    const at = L.now + 0.01;
    L.bell({ freq: note(0, 24), gain: 0.2, decay: 0.9, at, send: 0.75 });
    L.bell({ freq: note(3, 24), gain: 0.1, decay: 0.7, at: at + 0.04, pan: 0.2, send: 0.8 });
    L.tone({ freq: note(0, 0), gain: 0.12, attack: 0.01, decay: 0.28, lowpass: 700, at, send: 0.4 });
    L.noise({ gain: 0.04, attack: 0.01, decay: 0.25, filter: "bandpass", freq: 2400, to: 5000, q: 1.2, at, send: 0.7 });
  }

  tick(ratio: number): void {
    const L = this.ensure();
    if (!L) return;
    const now = L.now;
    if (now < this.restUntil || now - this.lastTick < TICK_GAP) return;
    this.lastTick = now;
    const r = clamp(ratio, 0, 1);
    // The bar's fill picks the step: the count climbs as the level fills.
    const degree = Math.floor(r * 6);
    const pan = -0.25 + 0.5 * r;
    L.tone({
      freq: note(degree, 36),
      type: "triangle",
      lowpass: 4200,
      gain: 0.075,
      attack: 0.002,
      decay: 0.07,
      pan,
      send: 0.35,
    });
    L.noise({ gain: 0.014, decay: 0.02, filter: "highpass", freq: 5000, pan, send: 0.25 });
  }

  levelUp(): void {
    const L = this.ensure();
    if (!L) return;
    const at = L.now + 0.01;
    this.restUntil = at + TICK_REST;
    // Up the scale and over the octave, the same figure as an unlock, but wider.
    [0, 2, 3, 5, 6, 8].forEach((deg, i) => {
      L.bell({
        freq: note(deg, 24),
        gain: 0.18 - 0.01 * i,
        decay: 1.1 + 0.08 * i,
        at: at + 0.065 * i,
        pan: -0.45 + 0.18 * i,
        send: 0.85,
      });
    });
    L.bell({ freq: note(0, 48), gain: 0.07, decay: 1.3, at: at + 0.42, send: 0.9 });
    L.noise({ gain: 0.05, attack: 0.12, decay: 0.7, filter: "highpass", freq: 5500, at, send: 0.9 });
    L.tone({ freq: note(0, 12), type: "triangle", lowpass: 1100, gain: 0.09, attack: 0.05, hold: 0.3, decay: 1.2, at, send: 0.8 });
    L.tone({ freq: note(0, 0), gain: 0.1, attack: 0.02, decay: 0.6, lowpass: 500, at, send: 0.5 });
  }

  settle(): void {
    const L = this.ensure();
    if (!L) return;
    const at = L.now + 0.01;
    L.bell({ freq: note(0, 36), gain: 0.13, decay: 1.0, at, pan: -0.15, send: 0.8 });
    L.bell({ freq: note(3, 36), gain: 0.08, decay: 0.9, at: at + 0.06, pan: 0.15, send: 0.85 });
    L.tone({ freq: note(0, 12), gain: 0.06, attack: 0.03, decay: 0.5, lowpass: 1200, at, send: 0.7 });
  }

  star(index: number, filled: boolean): void {
    const L = this.ensure();
    if (!L) return;
    if (!filled) return;
    const i = clamp(Math.floor(index), 0, 2);
    const at = L.now + 0.01;
    // D1 rumble + D2 body: the grade sits under the theme, not on the glass.
    L.tone({
      freq: hz(ROOT - 24),
      type: "sine",
      gain: 0.1 + i * 0.03,
      attack: 0.018,
      hold: 0.06,
      decay: 0.55 + i * 0.12,
      lowpass: 140 + i * 20,
      at,
      send: 0.28,
    });
    L.tone({
      freq: hz(ROOT - 12 + i * 3),
      type: "sine",
      gain: 0.14 + i * 0.04,
      attack: 0.012,
      hold: 0.1,
      decay: 0.72 + i * 0.18,
      lowpass: 320 + i * 70,
      at,
      send: 0.5,
    });
    L.bell({
      freq: note(i === 2 ? 3 : i, 12),
      gain: 0.08 + i * 0.025,
      decay: 1.05 + i * 0.18,
      at: at + 0.045,
      pan: -0.22 + i * 0.22,
      send: 0.78,
    });
    if (i === 2) {
      L.bell({ freq: note(0, 24), gain: 0.07, decay: 1.35, at: at + 0.1, send: 0.85 });
      L.noise({
        gain: 0.028,
        attack: 0.05,
        decay: 0.45,
        filter: "lowpass",
        freq: 520,
        at,
        send: 0.45,
      });
    }
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
      this.layer = new Layer(bus, 0x9a70);
      this.layer.setActive(true);
    }
    return this.layer.ready ? this.layer : null;
  }
}

/** One per clear screen. Safe to call from render effects: nothing sounds until asked. */
export function createPayoutSfx(): PayoutSfx {
  return new Payout();
}

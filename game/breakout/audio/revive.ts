/**
 * The revive's voice: a heart offered, a heart bought, a heart landing.
 *
 * Direction — the same glass as the sheets, in the story theme's D, with a
 * heartbeat underneath everything: two soft sub thumps, lub-dub, the one
 * motif the whole feature is built on.
 * - `offer`: the Revive button shows on the game over screen. One quiet
 *   heartbeat and a single high glass note — an invitation, not a siren.
 * - `pulse`: the heart on the button beats again (the screen calls it on the
 *   CSS pulse's beat while the offer stands). Just the heartbeat, quieter.
 * - `surge`: a heart is bought. Spin-up for `REVIVE_SURGE_MS` — a swept band
 *   of air and a riser climbing an octave — then the beat: a heartbeat at full
 *   weight, a warm major triad on glass bells, a wash of bright air.
 * - `stamp`: the "+1 heart" pill lands.
 * - `land`: the heart is on the paddle and the ball is back: a short rising
 *   glass figure, the "go".
 *
 * Every call is a no-op while sound is off or no gesture has opened the bus.
 */
import { currentBus, unlockSound } from "./bus";
import { Layer } from "./synth";

/** D3: the story theme's root. */
const ROOT = 50;
/** Major without the fourth, the game's scale. */
const SCALE = [0, 2, 4, 7, 9, 11] as const;
/** Tails to let ring after the last call before the layer goes, ms. */
const LINGER_MS = 2800;
/** From `surge()` to the beat: the heart gathering, the same beat the screen flashes on. */
export const REVIVE_SURGE_MS = 560;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function note(degree: number, octave: number): number {
  const d = ((degree % SCALE.length) + SCALE.length) % SCALE.length;
  return hz(ROOT + octave + SCALE[d] + 12 * Math.floor(degree / SCALE.length));
}

export interface ReviveSfx {
  /** The Revive button shows: a heartbeat and one high glass note. Must be called from a gesture the first time. */
  offer(): void;
  /** The heart on the button beats. */
  pulse(): void;
  /** A heart is bought: spin-up for `REVIVE_SURGE_MS`, then the beat. */
  surge(): void;
  /** The "+1" pill lands. */
  stamp(): void;
  /** The heart is on the paddle, the ball is back. */
  land(): void;
  /** Lets the tails ring, then frees the voices. */
  destroy(): void;
}

class Revive implements ReviveSfx {
  private layer: Layer | null = null;
  private timer = 0;
  private dead = false;
  private lastPulse = -Infinity;

  /** Lub-dub: two sub thumps a fifth of a second apart. `weight` scales the whole beat. */
  private heartbeat(L: Layer, at: number, weight: number): void {
    L.tone({ freq: 58, to: 40, glide: 0.18, type: "sine", gain: 0.2 * weight, attack: 0.005, hold: 0.03, decay: 0.28, at, send: 0.15 });
    L.tone({ freq: hz(ROOT - 24), type: "triangle", lowpass: 260, gain: 0.05 * weight, attack: 0.004, decay: 0.16, at, send: 0.3 });
    L.tone({ freq: 52, to: 38, glide: 0.16, type: "sine", gain: 0.15 * weight, attack: 0.005, hold: 0.02, decay: 0.24, at: at + 0.2, send: 0.15 });
    L.tone({ freq: hz(ROOT - 24), type: "triangle", lowpass: 220, gain: 0.035 * weight, attack: 0.004, decay: 0.14, at: at + 0.2, send: 0.3 });
  }

  offer(): void {
    const L = this.ensure(true);
    if (!L) return;
    const at = L.now + 0.02;
    this.heartbeat(L, at, 0.7);
    L.bell({ freq: note(4, 24), gain: 0.09, decay: 1.1, at: at + 0.42, pan: 0.12, send: 0.9 });
    L.noise({ gain: 0.02, attack: 0.05, decay: 0.5, filter: "highpass", freq: 5000, at: at + 0.4, send: 0.9 });
    this.lastPulse = at;
  }

  pulse(): void {
    const L = this.ensure(false);
    if (!L) return;
    const now = L.now;
    if (now - this.lastPulse < 0.9) return;
    this.lastPulse = now;
    this.heartbeat(L, now + 0.01, 0.35);
  }

  surge(): void {
    const L = this.ensure(true);
    if (!L) return;
    const at = L.now + 0.01;
    const rise = REVIVE_SURGE_MS / 1000;
    const beat = at + rise;
    // Spin-up: the heart gathers — air sweeping up, a riser climbing an octave, both cut at the beat.
    L.noise({ gain: 0.05, attack: rise * 0.5, hold: rise * 0.45, decay: 0.06, filter: "bandpass", freq: 300, to: 3600, q: 1.5, at, send: 0.5 });
    L.tone({ freq: hz(ROOT - 12), to: hz(ROOT), glide: rise, type: "sine", gain: 0.05, attack: rise * 0.6, hold: rise * 0.35, decay: 0.05, at, send: 0.5 });
    L.tone({ freq: hz(ROOT - 24), to: hz(ROOT - 12), glide: rise, type: "triangle", lowpass: 900, gain: 0.05, attack: rise * 0.5, hold: rise * 0.45, decay: 0.05, at, send: 0.4 });
    // The beat: a heartbeat at full weight under a warm triad and a wash of bright air.
    this.heartbeat(L, beat, 1);
    L.noise({ gain: 0.1, attack: 0.004, hold: 0.02, decay: 0.36, filter: "lowpass", freq: 4200, to: 260, q: 0.7, at: beat, send: 0.55 });
    L.noise({ gain: 0.04, attack: 0.02, hold: 0.08, decay: 1, filter: "highpass", freq: 4800, at: beat + 0.02, send: 0.95 });
    [0, 2, 3].forEach((deg, i) => {
      L.bell({ freq: note(deg, 24), gain: 0.16 - 0.02 * i, decay: 1.5 + 0.15 * i, at: beat + 0.03 + 0.07 * i, pan: -0.35 + 0.35 * i, send: 0.9 });
    });
    L.bell({ freq: note(0, 36), gain: 0.05, decay: 1.6, at: beat + 0.26, send: 0.95 });
    L.tone({ freq: note(0, 12), type: "triangle", lowpass: 1000, gain: 0.07, attack: 0.05, hold: 0.3, decay: 1.2, at: beat, send: 0.85 });
  }

  stamp(): void {
    const L = this.ensure(false);
    if (!L) return;
    const at = L.now + 0.01;
    L.bell({ freq: note(2, 24), gain: 0.16, decay: 0.8, at, send: 0.75 });
    L.bell({ freq: note(4, 24), gain: 0.09, decay: 0.7, at: at + 0.04, pan: 0.2, send: 0.8 });
    L.noise({ gain: 0.03, attack: 0.01, decay: 0.2, filter: "bandpass", freq: 2400, to: 5000, q: 1.2, at, send: 0.7 });
  }

  land(): void {
    const L = this.ensure(false);
    if (!L) return;
    const at = L.now + 0.01;
    [0, 3, 6].forEach((deg, i) => {
      L.bell({ freq: note(deg, 24), gain: 0.12 - 0.015 * i, decay: 0.7 + 0.1 * i, at: at + 0.06 * i, pan: -0.2 + 0.2 * i, send: 0.8 });
    });
    L.noise({ gain: 0.03, attack: 0.02, decay: 0.4, filter: "bandpass", freq: 1200, to: 5200, q: 1.1, at, send: 0.75 });
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

  /** `gesture` calls may open the bus (they come from a click); the others only use one already open. */
  private ensure(gesture: boolean): Layer | null {
    if (this.dead) return null;
    if (!this.layer) {
      const bus = gesture ? unlockSound() : currentBus();
      if (!bus) return null;
      this.layer = new Layer(bus, 0x4ea7);
      this.layer.setActive(true);
    }
    return this.layer.ready ? this.layer : null;
  }
}

/** One per surface that offers or lands a heart. Safe to call from render effects: nothing sounds until asked. */
export function createReviveSfx(): ReviveSfx {
  return new Revive();
}

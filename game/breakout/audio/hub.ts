/**
 * The hub's voice: the dock at the bottom of the game (Play / Shop) and the
 * wardrobe (trying a skin on, unlocking one). Same D as the sheets so a tab
 * change and a purchase sit under the theme instead of on top of it.
 *
 * Must be called from the click that asked (autoplay policy). Silent while
 * sound is off or the bus has not been unlocked.
 */
import { unlockSound } from "./bus";
import { Layer } from "./synth";

/** D3: the story theme's root. */
const ROOT = 50;
/** Major without the fourth, the game's scale. */
const SCALE = [0, 2, 4, 7, 9, 11] as const;
/** Minimum gap between two cues, seconds. */
const GAP = 0.05;
/** Tails to let ring after the last call before the layer goes, ms. */
const LINGER_MS = 2200;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function note(degree: number, octave: number): number {
  const d = ((degree % SCALE.length) + SCALE.length) % SCALE.length;
  return hz(ROOT + octave + SCALE[d] + 12 * Math.floor(degree / SCALE.length));
}

let layer: Layer | null = null;
let last = -Infinity;
let timer = 0;

function ensure(): Layer | null {
  const bus = unlockSound();
  if (!bus) return null;
  if (!layer) {
    layer = new Layer(bus, 0x7ab5);
    layer.setActive(true);
  }
  if (!layer.ready) return null;
  const now = layer.now;
  if (now - last < GAP) return null;
  last = now;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    layer?.destroy();
    layer = null;
  }, LINGER_MS);
  return layer;
}

/**
 * A dock tab lands: one short glass tick, pitched by the tab (the second tab
 * a third above the first) so switching back and forth is a two-note figure.
 */
export function playDockTap(index: number): void {
  const L = ensure();
  if (!L) return;
  const at = L.now + 0.006;
  const degree = index * 2;
  L.bell({ freq: note(degree, 24), gain: 0.085, decay: 0.28, at, pan: index === 0 ? -0.2 : 0.2, send: 0.5 });
  L.tone({ freq: note(degree, 12), type: "triangle", lowpass: 1200, gain: 0.035, attack: 0.003, decay: 0.09, at, send: 0.25 });
  L.noise({ gain: 0.016, attack: 0.003, decay: 0.06, filter: "bandpass", freq: 3200, to: 1600, q: 1.2, at, send: 0.3 });
}

/** A skin is worn: two quick glass notes, like a clasp closing. */
export function playSkinEquip(): void {
  const L = ensure();
  if (!L) return;
  const at = L.now + 0.008;
  L.bell({ freq: note(2, 24), gain: 0.1, decay: 0.32, at, pan: -0.1, send: 0.55 });
  L.bell({ freq: note(4, 24), gain: 0.09, decay: 0.42, at: at + 0.07, pan: 0.14, send: 0.6 });
  L.noise({ gain: 0.02, attack: 0.004, decay: 0.09, filter: "bandpass", freq: 2400, to: 4200, q: 1.3, at, send: 0.4 });
}

/** A skin is unlocked: a rising four-note arpeggio with a shimmer on top. */
export function playSkinUnlock(): void {
  const L = ensure();
  if (!L) return;
  const at = L.now + 0.01;
  const steps = [0, 2, 4, 6];
  steps.forEach((degree, i) => {
    L.bell({ freq: note(degree, 24), gain: 0.11 - i * 0.008, decay: 0.7 + i * 0.1, at: at + i * 0.085, pan: -0.25 + i * 0.16, send: 0.7 });
  });
  L.bell({ freq: note(0, 36), gain: 0.06, decay: 1.1, at: at + 0.36, pan: 0.1, send: 0.85 });
  L.tone({ freq: note(0, 0), type: "sine", gain: 0.05, attack: 0.02, decay: 0.6, lowpass: 420, at: at + 0.3, send: 0.4 });
  L.noise({ gain: 0.03, attack: 0.05, hold: 0.05, decay: 0.5, filter: "bandpass", freq: 900, to: 5200, q: 1.0, at: at + 0.28, send: 0.75 });
}

/** From `playSkinReveal()` to the reveal: the wardrobe's spin-up, the beat the unlock sheet flashes on. */
export const SKIN_REVEAL_MS = 640;

/**
 * A bought skin lands: a band of air sweeping up and a riser for
 * `SKIN_REVEAL_MS`, then the reveal — a soft thump, a wash of bright air and
 * the unlock arpeggio (`playSkinUnlock`) on the same beat. Quieter and
 * shorter than the reactor's surge: a clasp, not a blast.
 */
export function playSkinReveal(): void {
  const L = ensure();
  if (!L) return;
  const at = L.now + 0.01;
  const rise = SKIN_REVEAL_MS / 1000;
  const hit = at + rise;
  L.noise({ gain: 0.045, attack: rise * 0.55, hold: rise * 0.4, decay: 0.08, filter: "bandpass", freq: 320, to: 4200, q: 1.5, at, send: 0.5 });
  L.tone({ freq: hz(ROOT - 12), to: hz(ROOT + 12), glide: rise, type: "sine", gain: 0.045, attack: rise * 0.6, hold: rise * 0.35, decay: 0.05, at, send: 0.5 });
  L.tone({ freq: 70, to: 34, glide: 0.35, type: "sine", gain: 0.14, attack: 0.004, hold: 0.04, decay: 0.4, at: hit, send: 0.2 });
  L.noise({ gain: 0.08, attack: 0.004, hold: 0.02, decay: 0.34, filter: "lowpass", freq: 4800, to: 300, q: 0.7, at: hit, send: 0.55 });
  L.noise({ gain: 0.035, attack: 0.02, hold: 0.08, decay: 0.9, filter: "highpass", freq: 5200, at: hit + 0.02, send: 0.95 });
  const steps = [0, 2, 4, 6];
  steps.forEach((degree, i) => {
    L.bell({ freq: note(degree, 24), gain: 0.12 - i * 0.008, decay: 0.8 + i * 0.1, at: hit + 0.02 + i * 0.075, pan: -0.25 + i * 0.16, send: 0.75 });
  });
  L.bell({ freq: note(0, 36), gain: 0.06, decay: 1.3, at: hit + 0.32, pan: 0.1, send: 0.9 });
}

/** The "Unlocked" pill lands: a short glass tap. */
export function playSkinStamp(): void {
  const L = ensure();
  if (!L) return;
  const at = L.now + 0.005;
  L.tone({ freq: note(0, 12), type: "triangle", lowpass: 1600, gain: 0.06, attack: 0.003, decay: 0.12, at, send: 0.3 });
  L.bell({ freq: note(4, 24), gain: 0.07, decay: 0.3, at: at + 0.01, pan: 0.05, send: 0.5 });
  L.noise({ gain: 0.02, attack: 0.002, decay: 0.05, filter: "bandpass", freq: 3000, q: 1.3, at, send: 0.3 });
}

/** A tab or slot changes inside the shop: a soft click, quieter than the dock. */
export function playShopTab(): void {
  const L = ensure();
  if (!L) return;
  const at = L.now + 0.005;
  L.tone({ freq: note(4, 24), type: "triangle", lowpass: 2600, gain: 0.04, attack: 0.002, decay: 0.07, at, send: 0.3 });
  L.noise({ gain: 0.014, attack: 0.002, decay: 0.05, filter: "bandpass", freq: 2600, q: 1.4, at, send: 0.25 });
}

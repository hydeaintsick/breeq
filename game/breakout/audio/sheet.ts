/**
 * The sheets' voice: glass sliding up, a gem strike on buy, a falling fifth
 * on back. Same D as energy and payout so a recharge, the shop and a ticket
 * sit under the theme instead of on top of it.
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
const GAP = 0.07;
/** Tails to let ring after the last call before the layer goes, ms. */
const LINGER_MS = 1800;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function note(degree: number, octave: number): number {
  const d = ((degree % SCALE.length) + SCALE.length) % SCALE.length;
  return hz(ROOT + octave + SCALE[d] + 12 * Math.floor(degree / SCALE.length));
}

let layer: Layer | null = null;
let lastAppear = -Infinity;
let lastBuy = -Infinity;
let lastBack = -Infinity;
let timer = 0;

function ensure(): Layer | null {
  const bus = unlockSound();
  if (!bus) return null;
  if (!layer) {
    layer = new Layer(bus, 0x5ee7);
    layer.setActive(true);
  }
  return layer.ready ? layer : null;
}

function kick(slot: { last: number; set: (t: number) => void }): Layer | null {
  const L = ensure();
  if (!L) return null;
  const now = L.now;
  if (now - slot.last < GAP) return null;
  slot.set(now);
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    layer?.destroy();
    layer = null;
  }, LINGER_MS);
  return L;
}

/** A sheet slides up: a breath of air and two glass notes rising. */
export function playSheetAppear(): void {
  const L = kick({ last: lastAppear, set: (t) => (lastAppear = t) });
  if (!L) return;
  const at = L.now + 0.01;
  L.noise({
    gain: 0.04,
    attack: 0.04,
    hold: 0.02,
    decay: 0.28,
    filter: "bandpass",
    freq: 380,
    to: 2200,
    q: 1.1,
    at,
    send: 0.7,
  });
  L.bell({ freq: note(0, 24), gain: 0.11, decay: 0.7, at: at + 0.03, pan: -0.18, send: 0.75 });
  L.bell({ freq: note(3, 24), gain: 0.08, decay: 0.85, at: at + 0.1, pan: 0.2, send: 0.8 });
  L.tone({ freq: note(0, 0), type: "sine", gain: 0.05, attack: 0.03, decay: 0.35, lowpass: 480, at, send: 0.4 });
}

/** A gem CTA (buy, get gems, play for N). A short crystal strike. */
export function playSheetBuy(): void {
  const L = kick({ last: lastBuy, set: (t) => (lastBuy = t) });
  if (!L) return;
  const at = L.now + 0.008;
  L.bell({ freq: note(4, 24), gain: 0.14, decay: 0.45, at, pan: -0.12, send: 0.65 });
  L.bell({ freq: note(6, 36), gain: 0.07, decay: 0.55, at: at + 0.035, pan: 0.22, send: 0.75 });
  L.tone({ freq: note(0, 12), type: "triangle", lowpass: 1400, gain: 0.06, attack: 0.003, decay: 0.16, at, send: 0.35 });
  L.noise({
    gain: 0.03,
    attack: 0.004,
    decay: 0.12,
    filter: "bandpass",
    freq: 2800,
    to: 5200,
    q: 1.4,
    at,
    send: 0.55,
  });
}

/** Close, not now, back. A quiet falling fifth and the air going with the sheet. */
export function playSheetBack(): void {
  const L = kick({ last: lastBack, set: (t) => (lastBack = t) });
  if (!L) return;
  const at = L.now + 0.008;
  L.tone({
    freq: note(3, 24),
    to: note(0, 12),
    glide: 0.18,
    type: "triangle",
    lowpass: 2200,
    gain: 0.06,
    attack: 0.006,
    decay: 0.22,
    pan: 0.08,
    at,
    send: 0.55,
  });
  L.noise({
    gain: 0.028,
    attack: 0.02,
    decay: 0.2,
    filter: "bandpass",
    freq: 1600,
    to: 420,
    q: 1.0,
    at,
    send: 0.6,
  });
}

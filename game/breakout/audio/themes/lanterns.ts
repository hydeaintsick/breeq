/**
 * Theme one — "Lanterns". The original story theme, kept as it first shipped.
 *
 * Low, slow, and easy to leave on: a sub bass that breathes, a dark analog
 * pad that slides between four chords, a distant band of air, and the tune
 * struck on the same glass bells as the bricks, so the menu and the board are
 * one voice. Each bell answers itself with a softer echo a beat later.
 *
 * Key of D on the game's six-note scale (major without the fourth). Four
 * chords, eight seconds each — D · A · Bm · F#m — voice-led so no pad note
 * ever moves more than a fourth; the loop is 32 seconds and never cadences
 * hard, so it can circle for as long as the player browses.
 */
import type { Layer } from "../synth";
import { hz, type ThemeChord, type ThemeGraph, type ThemeHit, type ThemeParts, type ThemeScore } from "./score";

const BAR = 8;
const LOOP = 32;

/** Part levels, tuned to sit near -24 dBFS at the master: present, never in the way. */
const SUB_LEVEL = 0.095;
const SUB_TOP_LEVEL = 0.04;
const PAD_LEVEL = 0.02;
const AIR_LEVEL = 0.007;
const BELL_LEVEL = 0.1;
const BODY_LEVEL = 0.04;

const ECHO_AFTER = 0.75;
const ECHO_LEVEL = 0.42;

interface Chord extends ThemeChord {
  /** Pad voicing (MIDI). */
  pad: readonly [number, number, number];
  /** Bass root (MIDI). */
  bass: number;
}

/** D · A · Bm · F#m. Pad voicings: D F# A · E A C# · D F# B · F# A C#. */
const CHORDS: readonly Chord[] = [
  { pad: [50, 54, 57], bass: 38, triad: [0, 4, 7], extras: [9, 2] },
  { pad: [52, 57, 61], bass: 45, triad: [7, 11, 2], extras: [9, 4] },
  { pad: [50, 54, 59], bass: 47, triad: [9, 0, 4], extras: [7, 2] },
  { pad: [54, 57, 61], bass: 42, triad: [4, 7, 11], extras: [2, 9] },
];

/** The tune, one figure per bar on the same rhythm so it reads as a theme: [time in loop, MIDI]. */
const TUNE: readonly (readonly [number, number])[] = [
  [0, 74], [1.5, 81], [3, 78], [5.5, 76],
  [8, 73], [9.5, 76], [11, 81], [13.5, 83],
  [16, 74], [17.5, 78], [19, 71], [21.5, 69],
  [24, 73], [25.5, 69], [27, 66], [29.5, 64],
];

const HITS: readonly ThemeHit[] = TUNE.map(([t, midi], slot) => ({ t, voice: "bell", midi, slot }));

function build(L: Layer, { part, own, rng }: ThemeParts): ThemeGraph {
  const ctx = L.ctx;

  // Sub: a sine on the root that breathes, a filtered triangle an octave up
  // so small speakers still feel where the bass is.
  const bassOscs: OscillatorNode[] = [];
  const subDuck = part(0, 0.15);
  if (subDuck) {
    const breath = ctx.createGain();
    breath.gain.value = 0.82;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.25;
    const depth = ctx.createGain();
    depth.gain.value = 0.18;
    lfo.connect(depth).connect(breath.gain);
    lfo.start();
    breath.connect(subDuck);

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = hz(CHORDS[0].bass);
    const subGain = ctx.createGain();
    subGain.gain.value = SUB_LEVEL;
    sub.connect(subGain).connect(breath);
    sub.start();

    const top = ctx.createOscillator();
    top.type = "triangle";
    top.frequency.value = hz(CHORDS[0].bass) * 2;
    const topFilter = ctx.createBiquadFilter();
    topFilter.type = "lowpass";
    topFilter.frequency.value = 260;
    topFilter.Q.value = 0.6;
    const topGain = ctx.createGain();
    topGain.gain.value = SUB_TOP_LEVEL;
    top.connect(topFilter).connect(topGain).connect(breath);
    top.start();

    bassOscs.push(sub, top);
    own(lfo, sub, top);
  }

  // Pad: three notes, each two saws a few cents apart and split left/right,
  // under a dark low-pass that drifts and opens on every chord.
  const padOscs: OscillatorNode[] = [];
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 340;
  padFilter.Q.value = 0.9;
  const padDuck = part(0, 0.85);
  if (padDuck) {
    const padGain = ctx.createGain();
    padGain.gain.value = PAD_LEVEL;
    padFilter.connect(padGain).connect(padDuck);
    CHORDS[0].pad.forEach((midi, i) => {
      for (let side = 0; side < 2; side++) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = hz(midi);
        osc.detune.value = (side === 0 ? -1 : 1) * (5 + i * 1.5) + rng.range(-1.5, 1.5);
        const pan = ctx.createStereoPanner();
        pan.pan.value = (side === 0 ? -1 : 1) * (0.35 + i * 0.12);
        osc.connect(pan).connect(padFilter);
        osc.start();
        padOscs.push(osc);
        own(osc);
      }
    });
    const drift = ctx.createOscillator();
    drift.frequency.value = 0.05;
    const driftDepth = ctx.createGain();
    driftDepth.gain.value = 70;
    drift.connect(driftDepth).connect(padFilter.frequency);
    drift.start();
    own(drift);
  }

  // Air: a slow band of seeded noise, mostly heard through the hall.
  const airDuck = part(0, 0.9);
  if (airDuck) {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = rng.next() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 0.7;
    const airGain = ctx.createGain();
    airGain.gain.value = AIR_LEVEL;
    src.connect(band).connect(airGain).connect(airDuck);
    src.start();
    const sway = ctx.createOscillator();
    sway.frequency.value = 0.037;
    const swayDepth = ctx.createGain();
    swayDepth.gain.value = 320;
    sway.connect(swayDepth).connect(band.frequency);
    sway.start();
    own(src, sway);
  }

  return {
    chord(index, t) {
      // The pad glides to the new voicing; the bass follows a little faster.
      const chord = CHORDS[index];
      padOscs.forEach((osc, i) => {
        osc.frequency.setTargetAtTime(hz(chord.pad[i >> 1]), t, 0.35);
      });
      const bass = hz(chord.bass);
      bassOscs[0]?.frequency.setTargetAtTime(bass, t, 0.12);
      bassOscs[1]?.frequency.setTargetAtTime(bass * 2, t, 0.12);
      // The filter opens on the change and settles back over the bar.
      padFilter.frequency.cancelScheduledValues(t);
      padFilter.frequency.setTargetAtTime(760, t, 0.5);
      padFilter.frequency.setTargetAtTime(340, t + 2.2, 2.4);
    },
    hit(hit, at) {
      const pan = hit.slot % 2 === 0 ? -0.28 : 0.28;
      const freq = hz(hit.midi);
      L.bell({ freq, gain: BELL_LEVEL, decay: 1.7, at, pan, send: 0.9 });
      L.bell({ freq, gain: BELL_LEVEL * ECHO_LEVEL, decay: 1.4, at: at + ECHO_AFTER, pan: -pan, send: 0.95 });
      // A soft body an octave under the bell, swelling in behind it.
      L.tone({ freq: freq / 2, gain: BODY_LEVEL, attack: 0.22, decay: 1.3, lowpass: 900, at, pan: pan * 0.5, send: 0.85 });
    },
  };
}

export const lanterns: ThemeScore = {
  id: "lanterns",
  root: 2,
  bar: BAR,
  loop: LOOP,
  chords: CHORDS,
  hits: HITS,
  build,
};

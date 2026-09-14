/**
 * Theme four — "Pursuit". Under a paid run: a ticket spent, a pot on the
 * line, three lives. Suspense with a pulse.
 *
 * Direction — a chase. A staccato saw bass hammering every sixteenth on the
 * minor tonic, kick on every beat, a tight military snare on two and four, a
 * clock of hat ticks; a dark drone with a slow-breathing low-pass; dissonant
 * two-note stabs (the second and the minor third a semitone apart) on the
 * syncopated sixteenths; and, on the second pass, a repeated-note riff that
 * circles the tonic without ever landing. A riser lifts the last two beats of
 * each half.
 *
 * The score listens to the run: `intensity` (lives lost, heat) opens the
 * drone and the riff, brings the stabs and the ticks forward, and above 0.4
 * adds a heartbeat under the downbeats. At zero it is already tense; at one
 * it is a sprint.
 *
 * 132 BPM. Built in the level's key so it agrees with the bricks: the sfx
 * play the six-note major scale on the level's root, and Pursuit sits in that
 * key's relative minor — for D, B minor: Bm · Bm · A · F#m · Bm · D · A · F#m
 * (i · i · VII · v · i · III · VII · v), one bar each, twice per loop. Every
 * pitch is a scale tone, so a brick struck on any beat lands inside the chord.
 */
import type { Layer } from "../synth";
import { hz, type ThemeChord, type ThemeGraph, type ThemeHit, type ThemeParts, type ThemeScore } from "./score";

const BPM = 132;
const BEAT = 60 / BPM;
const SIXTEENTH = BEAT / 4;
const CHORD_BEATS = 4;
const BAR = CHORD_BEATS * BEAT;
const SLOTS = 16;
const LOOP = SLOTS * BAR;

/** Part levels, tuned to sit near -24 dBFS at the master under the effects. */
const KICK_LEVEL = 0.075;
const SNARE_LEVEL = 0.03;
const TICK_LEVEL = 0.009;
const BASS_LEVEL = 0.04;
const DRONE_LEVEL = 0.03;
const SUB_LEVEL = 0.045;
const STAB_LEVEL = 0.03;
const RIFF_LEVEL = 0.032;
const PULSE_LEVEL = 0.06;
const RISE_LEVEL = 0.014;

/** Sixteenth accents for the bass ostinato and the ticks. */
const accent = (k: number) => (k % 4 === 0 ? 1 : k % 2 === 0 ? 0.75 : 0.55);
/** The ostinato: semitones above the chord's bass, per sixteenth. */
const BASS_PATTERN = [0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 7, 12, 7] as const;

/**
 * The riff, semitones above the key's root (B4 = 21 in D), -1 rests. Two
 * bars that alternate; both circle B and lean on the ninth (C#).
 */
const RIFF_A = [21, -1, 21, -1, 24, -1, 21, 23, -1, 21, -1, 21, 28, -1, 24, 23] as const;
const RIFF_B = [21, -1, 21, -1, 24, -1, 21, 19, -1, 21, -1, 21, 16, -1, 19, 23] as const;
const RIFF_DECAY = 0.16;

/** The stab: the second and the minor third of the key's relative minor (C#5 · D5 in D), a semitone apart. */
const STAB = [23, 24] as const;

interface Chord extends ThemeChord {
  /** Drone voicing, semitones above the key's root. */
  pad: readonly [number, number, number];
  /** Bass root, semitones above the key's root (negative: below). */
  bass: number;
}

const Bm: Chord = { pad: [-3, 0, 4], bass: -15, triad: [9, 0, 4], extras: [7, 2] };
const A: Chord = { pad: [-5, -1, 2], bass: -17, triad: [7, 11, 2], extras: [9, 4] };
const Fsm: Chord = { pad: [-8, -5, -1], bass: -20, triad: [4, 7, 11], extras: [2, 9] };
const D: Chord = { pad: [0, 4, 7], bass: -12, triad: [0, 4, 7], extras: [9, 2] };

const CYCLE: readonly Chord[] = [Bm, Bm, A, Fsm, Bm, D, A, Fsm];
const CHORDS: readonly Chord[] = [...CYCLE, ...CYCLE];

const bars = <T,>(make: (slot: number, chord: Chord) => T[]): T[] => CHORDS.flatMap((chord, slot) => make(slot, chord));

/** Hits carry semitone offsets in `midi`; `build` adds the root. */
const HITS: readonly ThemeHit[] = [
  // Kick on every beat.
  ...bars((slot) =>
    Array.from({ length: CHORD_BEATS }, (_, b): ThemeHit => ({ t: slot * BAR + b * BEAT, voice: "kick", midi: 0, slot: slot * CHORD_BEATS + b })),
  ),
  // Snare on two and four.
  ...bars((slot) => [1, 3].map((b, i): ThemeHit => ({ t: slot * BAR + b * BEAT, voice: "snare", midi: 0, slot: slot * 2 + i }))),
  // The clock: a tick on every sixteenth.
  ...bars((slot) =>
    Array.from({ length: 16 }, (_, k): ThemeHit => ({ t: slot * BAR + k * SIXTEENTH, voice: "tick", midi: 0, slot: slot * 16 + k, level: accent(k) })),
  ),
  // The ostinato.
  ...bars((slot, chord) =>
    BASS_PATTERN.map((up, k): ThemeHit => ({
      t: slot * BAR + k * SIXTEENTH,
      voice: "bass",
      midi: chord.bass + up,
      slot: slot * 16 + k,
      level: accent(k),
    })),
  ),
  // Stabs on the syncopated sixteenths.
  ...bars((slot) =>
    [3, 11].flatMap((k, i) => STAB.map((off, n): ThemeHit => ({ t: slot * BAR + k * SIXTEENTH, voice: "stab", midi: off, slot: slot * 4 + i * 2 + n }))),
  ),
  // The riff, second pass only.
  ...CHORDS.flatMap((_, slot) => {
    if (slot < 8) return [];
    const riff = slot % 2 === 0 ? RIFF_A : RIFF_B;
    return riff.flatMap((off, k): ThemeHit[] =>
      off < 0 ? [] : [{ t: slot * BAR + k * SIXTEENTH, voice: "riff", midi: off, slot: slot * 16 + k, level: k % 4 === 0 ? 1 : 0.8 }],
    );
  }),
  // The heartbeat: lub on the bar, dub a sixteenth and a half later. Silent until the run gets tense.
  ...bars((slot) => [
    { t: slot * BAR, voice: "pulse", midi: 0, slot: slot * 2 },
    { t: slot * BAR + 1.5 * SIXTEENTH, voice: "pulse", midi: 0, slot: slot * 2 + 1, level: 0.7 },
  ]),
  // A riser over the last two beats of each half.
  ...[7, 15].map((slot, i): ThemeHit => ({ t: slot * BAR + 2 * BEAT, voice: "rise", midi: 0, slot: i, length: 2 * BEAT })),
];

interface MonoVoice {
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  env: GainNode;
}

function buildFor(root: number) {
  const note = (off: number) => hz(root + off);

  return function build(L: Layer, { part, own, rng }: ThemeParts): ThemeGraph {
    const ctx = L.ctx;
    /** 0..1, the run's tension; read at every hit. */
    let tension = 0;

    // Sub: a sine on the bass root, steady.
    let sub: OscillatorNode | null = null;
    const subDuck = part(0, 0.06);
    if (subDuck) {
      sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.value = note(CHORDS[0].bass + 12);
      const gain = ctx.createGain();
      gain.gain.value = SUB_LEVEL;
      sub.connect(gain).connect(subDuck);
      sub.start();
      own(sub);
    }

    // Drone: three detuned saw pairs under a low-pass that breathes slowly and
    // opens with tension.
    const droneOscs: OscillatorNode[] = [];
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 260;
    droneFilter.Q.value = 1.4;
    const droneDuck = part(0, 0.8);
    if (droneDuck) {
      const gain = ctx.createGain();
      gain.gain.value = DRONE_LEVEL;
      droneFilter.connect(gain).connect(droneDuck);
      CHORDS[0].pad.forEach((off, i) => {
        for (let side = 0; side < 2; side++) {
          const osc = ctx.createOscillator();
          osc.type = "sawtooth";
          osc.frequency.value = note(off);
          osc.detune.value = (side === 0 ? -1 : 1) * (6 + i * 2) + rng.range(-1.5, 1.5);
          const pan = ctx.createStereoPanner();
          pan.pan.value = (side === 0 ? -1 : 1) * (0.5 + i * 0.1);
          osc.connect(pan).connect(droneFilter);
          osc.start();
          droneOscs.push(osc);
          own(osc);
        }
      });
      const breath = ctx.createOscillator();
      breath.frequency.value = 0.11;
      const depth = ctx.createGain();
      depth.gain.value = 70;
      breath.connect(depth).connect(droneFilter.frequency);
      breath.start();
      own(breath);
    }

    // Riff and stabs: mono saw voices with their own pluck filter; the riff
    // alternates two, the stab has one per cluster note.
    const riff: MonoVoice[] = [];
    const stabs: MonoVoice[] = [];
    const mono = (into: GainNode, pan: number, cutoff: number, q: number): MonoVoice => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = note(21);
      osc.detune.value = rng.range(-4, 4);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cutoff;
      filter.Q.value = q;
      const env = ctx.createGain();
      env.gain.value = 0;
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      osc.connect(filter).connect(env).connect(panner).connect(into);
      osc.start();
      own(osc);
      return { osc, filter, env };
    };
    const riffDuck = part(0, 0.4);
    if (riffDuck) {
      riff.push(mono(riffDuck, -0.3, 1400, 1.8), mono(riffDuck, 0.3, 1400, 1.8));
    }
    const stabDuck = part(0, 0.55);
    if (stabDuck) {
      stabs.push(mono(stabDuck, -0.45, 900, 1.2), mono(stabDuck, 0.45, 900, 1.2));
    }

    const pluck = (v: MonoVoice, freq: number, gain: number, at: number, decay: number) => {
      v.osc.frequency.setValueAtTime(freq, at);
      v.env.gain.setValueAtTime(0, at);
      v.env.gain.linearRampToValueAtTime(gain, at + 0.004);
      v.env.gain.setTargetAtTime(0, at + 0.025, decay / 4.5);
    };

    return {
      chord(index, t) {
        const chord = CHORDS[index];
        droneOscs.forEach((osc, i) => osc.frequency.setTargetAtTime(note(chord.pad[i >> 1]), t, 0.015));
        sub?.frequency.setTargetAtTime(note(chord.bass + 12), t, 0.012);
      },
      intensity(level, t) {
        tension = level;
        droneFilter.frequency.setTargetAtTime(260 + 900 * level, t, 0.6);
        for (const v of riff) v.filter.frequency.setTargetAtTime(1400 + 2000 * level, t, 0.4);
        for (const v of stabs) v.filter.frequency.setTargetAtTime(900 + 1600 * level, t, 0.4);
      },
      hit(hit, at) {
        const level = hit.level ?? 1;
        switch (hit.voice) {
          case "kick": {
            L.tone({ freq: 150, to: 40, glide: 0.05, type: "sine", gain: KICK_LEVEL, attack: 0.002, hold: 0.01, decay: 0.17, send: 0.03, at });
            return;
          }
          case "snare": {
            // Tight and dry: a short band of noise with a body tone under it.
            L.noise({ gain: SNARE_LEVEL, attack: 0.001, decay: 0.09, filter: "bandpass", freq: 1500, q: 1.8, send: 0.25, at });
            L.tone({ freq: 210, to: 160, glide: 0.04, type: "triangle", gain: SNARE_LEVEL * 0.8, attack: 0.001, decay: 0.07, send: 0.1, at });
            return;
          }
          case "tick": {
            // The clock comes forward as the run tightens.
            const gain = TICK_LEVEL * level * (0.6 + 0.8 * tension);
            L.noise({ gain, attack: 0.001, decay: 0.03, filter: "bandpass", freq: 6800, q: 1.4, send: 0.08, at, pan: hit.slot % 2 === 0 ? 0.2 : -0.2 });
            return;
          }
          case "bass": {
            L.tone({ freq: note(hit.midi), type: "sawtooth", gain: BASS_LEVEL * level, attack: 0.002, hold: 0.02, decay: 0.09, lowpass: 520 + 380 * tension, send: 0.04, at });
            return;
          }
          case "stab": {
            const v = stabs[hit.slot % 2];
            if (!v) return;
            pluck(v, note(hit.midi), STAB_LEVEL * (0.25 + 0.75 * tension), at, 0.14);
            return;
          }
          case "riff": {
            const v = riff[hit.slot % 2];
            if (!v) return;
            pluck(v, note(hit.midi), RIFF_LEVEL * level, at, RIFF_DECAY);
            return;
          }
          case "pulse": {
            const weight = Math.max(0, (tension - 0.4) / 0.6);
            if (weight <= 0) return;
            L.tone({ freq: 70, to: 48, glide: 0.09, type: "sine", gain: PULSE_LEVEL * level * weight, attack: 0.004, hold: 0.02, decay: 0.22, send: 0.02, at });
            return;
          }
          case "rise": {
            const length = hit.length ?? BEAT;
            L.noise({ gain: RISE_LEVEL * (0.7 + 0.6 * tension), attack: length * 0.9, decay: 0.3, filter: "bandpass", freq: 400, to: 2800, q: 1, send: 0.9, at });
            return;
          }
        }
      },
    };
  };
}

const cache = new Map<number, ThemeScore>();

/**
 * Pursuit in the key of `root` (MIDI, the level's key from `levelKey`). One
 * score per root, so two runs in the same key share a player.
 */
export function pursuit(root: number): ThemeScore {
  const key = Math.round(root);
  let score = cache.get(key);
  if (!score) {
    score = {
      id: `pursuit:${key}`,
      root: ((key % 12) + 12) % 12,
      bar: BAR,
      loop: LOOP,
      chords: CHORDS,
      hits: HITS,
      build: buildFor(key),
    };
    cache.set(key, score);
  }
  return score;
}

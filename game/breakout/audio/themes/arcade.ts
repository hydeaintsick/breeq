/**
 * Theme three — "Arcade". The Earn store: a floor of walls on sale, tickets,
 * pots in ETH. It has to smell like a game and like winning, and still be
 * glass and neon, not a casino.
 *
 * Direction — a bright, driving anthem. Four-on-the-floor kick with a clap on
 * two and four and a ticking closed hat on the off-beats; a punchy saw bass on
 * a syncopated sixteenth pattern that never stops; a sixteenth-note pluck
 * arpeggio glittering on top; a wide pad and a sub, both pumping with the
 * kick. Every loop opens on a rising three-bell stinger — the sound of a pot
 * paid — and the second pass carries a lead hook that climbs and resolves so
 * the return lands like a win. A riser lifts the last two beats before each
 * return. Nothing sits off the grid.
 *
 * 118 BPM. Key of D major: D · A · Bm · G (I · V · vi · IV, the anthem
 * cycle), one bar each, four times per loop. The first two cycles are the
 * groove; the lead sings the last two.
 */
import type { Layer } from "../synth";
import { hz, type ThemeChord, type ThemeGraph, type ThemeHit, type ThemeParts, type ThemeScore } from "./score";

const BPM = 118;
const BEAT = 60 / BPM;
const SIXTEENTH = BEAT / 4;
const CHORD_BEATS = 4;
const BAR = CHORD_BEATS * BEAT;
const SLOTS = 16;
const LOOP = SLOTS * BAR;

/** Part levels, tuned to sit near -22 dBFS at the master. */
const KICK_LEVEL = 0.085;
const CLAP_LEVEL = 0.028;
const HAT_LEVEL = 0.011;
const BASS_LEVEL = 0.05;
const SUB_LEVEL = 0.05;
const PAD_LEVEL = 0.018;
const ARP_LEVEL = 0.036;
const LEAD_LEVEL = 0.026;
const BELL_LEVEL = 0.03;
const STINGER_LEVEL = 0.04;
const RISE_LEVEL = 0.016;

/** The pump: how far the pad and sub dip on each kick, and how fast they come back. */
const PUMP_FLOOR = 0.4;
const PUMP_DIP = 0.02;
const PUMP_RECOVER = 0.12;

/** Sixteenths in the bar that carry a bass note; `true` jumps the octave. */
const BASS_PATTERN: readonly (readonly [step: number, octave: boolean])[] = [
  [0, false], [2, false], [3, true], [6, false], [8, false], [10, false], [11, true], [14, false],
];
/** Sixteenth-note pluck arpeggio, indices into the chord's arp voicing. */
const ARP_PATTERN = [0, 2, 4, 5, 3, 4, 2, 5, 0, 2, 4, 5, 3, 5, 4, 2] as const;
const ARP_DECAY = 0.22;

interface Chord extends ThemeChord {
  /** Pad voicing (MIDI). */
  pad: readonly [number, number, number];
  /** Bass root (MIDI). */
  bass: number;
  /** Arpeggio voicing (MIDI), six notes low to high. */
  arp: readonly [number, number, number, number, number, number];
  /** The bell on the downbeat (MIDI). */
  top: number;
}

/** D · A · Bm · G, voice-led around D3. */
const CYCLE: readonly Chord[] = [
  { pad: [50, 54, 57], bass: 38, arp: [62, 66, 69, 74, 78, 81], top: 74, triad: [0, 4, 7], extras: [9, 2] },
  { pad: [49, 52, 57], bass: 33, arp: [61, 64, 69, 73, 76, 81], top: 73, triad: [7, 11, 2], extras: [9, 4] },
  { pad: [50, 54, 59], bass: 35, arp: [59, 62, 66, 71, 74, 78], top: 71, triad: [9, 0, 4], extras: [7, 2] },
  { pad: [50, 55, 59], bass: 31, arp: [59, 62, 67, 71, 74, 79], top: 74, triad: [5, 9, 0], extras: [2, 7] },
];
const CHORDS: readonly Chord[] = [...CYCLE, ...CYCLE, ...CYCLE, ...CYCLE];

/**
 * The hook, on the last two cycles: [bar, sixteenth, MIDI, sixteenths held].
 * Climbs through each chord, crests on the C# over A, and steps down into
 * the return so the loop resolves on D.
 */
const LEAD: readonly (readonly [number, number, number, number])[] = [
  [8, 0, 74, 6], [8, 6, 78, 2], [8, 8, 81, 8],
  [9, 0, 81, 4], [9, 4, 78, 4], [9, 8, 76, 8],
  [10, 0, 74, 6], [10, 6, 76, 2], [10, 8, 78, 8],
  [11, 0, 79, 8], [11, 8, 78, 4], [11, 12, 76, 4],
  [12, 0, 74, 4], [12, 4, 78, 4], [12, 8, 81, 4], [12, 12, 83, 4],
  [13, 0, 85, 8], [13, 8, 83, 4], [13, 12, 81, 4],
  [14, 0, 78, 8], [14, 8, 81, 8],
  [15, 0, 79, 6], [15, 6, 78, 2], [15, 8, 76, 8],
];

const bars = <T,>(make: (slot: number, chord: Chord) => T[]): T[] => CHORDS.flatMap((chord, slot) => make(slot, chord));

const HITS: readonly ThemeHit[] = [
  // Kick on every beat.
  ...bars((slot) =>
    Array.from({ length: CHORD_BEATS }, (_, b): ThemeHit => ({ t: slot * BAR + b * BEAT, voice: "kick", midi: 0, slot: slot * CHORD_BEATS + b })),
  ),
  // Clap on two and four.
  ...bars((slot) => [1, 3].map((b, i): ThemeHit => ({ t: slot * BAR + b * BEAT, voice: "clap", midi: 0, slot: slot * 2 + i }))),
  // Closed hat on the off-eighths, a ghost sixteenth before three and before the bar.
  ...bars((slot) => [
    ...[2, 6, 10, 14].map((k, i): ThemeHit => ({ t: slot * BAR + k * SIXTEENTH, voice: "hat", midi: 0, slot: slot * 6 + i })),
    ...[7, 15].map((k, i): ThemeHit => ({ t: slot * BAR + k * SIXTEENTH, voice: "hat", midi: 0, slot: slot * 6 + 4 + i, level: 0.45 })),
  ]),
  // Bass.
  ...bars((slot, chord) =>
    BASS_PATTERN.map(([k, octave], i): ThemeHit => ({
      t: slot * BAR + k * SIXTEENTH,
      voice: "bass",
      midi: chord.bass + (octave ? 12 : 0),
      slot: slot * BASS_PATTERN.length + i,
      level: k % 4 === 0 ? 1 : 0.8,
    })),
  ),
  // Pluck arpeggio, sixteen to the bar.
  ...bars((slot, chord) =>
    ARP_PATTERN.map((index, k): ThemeHit => ({
      t: slot * BAR + k * SIXTEENTH,
      voice: "arp",
      midi: chord.arp[index],
      slot: slot * ARP_PATTERN.length + k,
      level: k % 4 === 0 ? 1 : k % 2 === 0 ? 0.8 : 0.6,
    })),
  ),
  // A bell on each downbeat, far back.
  ...CHORDS.map((chord, slot): ThemeHit => ({ t: slot * BAR, voice: "bell", midi: chord.top, slot })),
  // The stinger that opens each half: three bells rising, the pot paid.
  ...[0, 8].flatMap((slot, i) =>
    [74, 78, 81].map((midi, k): ThemeHit => ({ t: slot * BAR + k * 0.07, voice: "stinger", midi, slot: i * 3 + k })),
  ),
  // The hook.
  ...LEAD.map(([slot, k, midi, held], i): ThemeHit => ({
    t: slot * BAR + k * SIXTEENTH,
    voice: "lead",
    midi,
    slot: i,
    length: held * SIXTEENTH,
  })),
  // A riser over the last two beats before each return to D.
  ...[3, 7, 11, 15].map((slot, i): ThemeHit => ({ t: slot * BAR + 2 * BEAT, voice: "rise", midi: 0, slot: i, length: 2 * BEAT })),
];

interface MonoVoice {
  osc: OscillatorNode;
  env: GainNode;
}

function build(L: Layer, { part, own, rng }: ThemeParts): ThemeGraph {
  const ctx = L.ctx;
  const pumps: GainNode[] = [];

  const pumped = (into: GainNode): GainNode => {
    const pump = ctx.createGain();
    pump.gain.value = 1;
    pump.connect(into);
    pumps.push(pump);
    return pump;
  };

  // Sub: a sine on the root, under the pump.
  let sub: OscillatorNode | null = null;
  const subDuck = part(0, 0.08);
  if (subDuck) {
    const pump = pumped(subDuck);
    sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = hz(CHORDS[0].bass);
    const gain = ctx.createGain();
    gain.gain.value = SUB_LEVEL;
    sub.connect(gain).connect(pump);
    sub.start();
    own(sub);
  }

  // Pad: three notes as detuned saw pairs, split left/right, under a low-pass
  // that opens on every chord; pumped.
  const padOscs: OscillatorNode[] = [];
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 700;
  padFilter.Q.value = 0.7;
  const padDuck = part(0, 0.75);
  if (padDuck) {
    const pump = pumped(padDuck);
    const padGain = ctx.createGain();
    padGain.gain.value = PAD_LEVEL;
    padFilter.connect(padGain).connect(pump);
    CHORDS[0].pad.forEach((midi, i) => {
      for (let side = 0; side < 2; side++) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = hz(midi);
        osc.detune.value = (side === 0 ? -1 : 1) * (5 + i * 1.5) + rng.range(-1, 1);
        const pan = ctx.createStereoPanner();
        pan.pan.value = (side === 0 ? -1 : 1) * (0.45 + i * 0.12);
        osc.connect(pan).connect(padFilter);
        osc.start();
        padOscs.push(osc);
        own(osc);
      }
    });
  }

  // Pluck: two mono voices taking turns, a fast filter pluck each.
  const arp: MonoVoice[] = [];
  const arpDuck = part(0, 0.45);
  if (arpDuck) {
    for (let side = 0; side < 2; side++) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = hz(CHORDS[0].arp[0]);
      osc.detune.value = rng.range(-3, 3);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2400;
      filter.Q.value = 2.2;
      const env = ctx.createGain();
      env.gain.value = 0;
      const pan = ctx.createStereoPanner();
      pan.pan.value = side === 0 ? -0.35 : 0.35;
      osc.connect(filter).connect(env).connect(pan).connect(arpDuck);
      osc.start();
      arp.push({ osc, env });
      own(osc);
    }
  }

  /** The lead's last pitch, so each note glides in from the one before. */
  let leadFrom: number | null = null;

  return {
    chord(index, t) {
      const chord = CHORDS[index];
      padOscs.forEach((osc, i) => osc.frequency.setTargetAtTime(hz(chord.pad[i >> 1]), t, 0.01));
      sub?.frequency.setTargetAtTime(hz(chord.bass), t, 0.01);
      padFilter.frequency.cancelScheduledValues(t);
      padFilter.frequency.setTargetAtTime(1400, t, 0.25);
      padFilter.frequency.setTargetAtTime(700, t + 0.8, 1.2);
    },
    hit(hit, at) {
      const level = hit.level ?? 1;
      switch (hit.voice) {
        case "kick": {
          L.tone({ freq: 160, to: 42, glide: 0.06, type: "sine", gain: KICK_LEVEL, attack: 0.002, hold: 0.012, decay: 0.2, send: 0.04, at });
          for (const pump of pumps) {
            pump.gain.setValueAtTime(1, at);
            pump.gain.linearRampToValueAtTime(PUMP_FLOOR, at + PUMP_DIP);
            pump.gain.setTargetAtTime(1, at + PUMP_DIP, PUMP_RECOVER);
          }
          return;
        }
        case "clap": {
          // Two bursts a few milliseconds apart: the flam of a clap.
          L.noise({ gain: CLAP_LEVEL * 0.7, attack: 0.001, decay: 0.05, filter: "bandpass", freq: 1900, q: 0.9, send: 0.35, at, pan: -0.1 });
          L.noise({ gain: CLAP_LEVEL, attack: 0.001, decay: 0.16, filter: "bandpass", freq: 2100, q: 0.8, send: 0.45, at: at + 0.011, pan: 0.1 });
          return;
        }
        case "hat": {
          L.noise({ gain: HAT_LEVEL * level, attack: 0.001, decay: 0.045, filter: "bandpass", freq: 7600, q: 1.1, send: 0.1, at, pan: hit.slot % 2 === 0 ? 0.25 : -0.25 });
          return;
        }
        case "bass": {
          L.tone({ freq: hz(hit.midi), type: "sawtooth", gain: BASS_LEVEL * level, attack: 0.003, hold: 0.05, decay: 0.16, lowpass: 720, send: 0.05, at });
          return;
        }
        case "arp": {
          const v = arp[hit.slot % arp.length];
          if (!v) return;
          v.osc.frequency.setValueAtTime(hz(hit.midi), at);
          v.env.gain.setValueAtTime(0, at);
          v.env.gain.linearRampToValueAtTime(ARP_LEVEL * level, at + 0.004);
          v.env.gain.setTargetAtTime(0, at + 0.03, ARP_DECAY / 4.5);
          return;
        }
        case "bell": {
          L.bell({ freq: hz(hit.midi), gain: BELL_LEVEL * 0.7, decay: 2.2, at, pan: hit.slot % 2 === 0 ? -0.3 : 0.3, send: 0.95 });
          return;
        }
        case "stinger": {
          L.bell({ freq: hz(hit.midi), gain: STINGER_LEVEL, decay: 1.6 + hit.slot * 0.2, at, pan: (hit.slot % 3 - 1) * 0.3, send: 0.9 });
          return;
        }
        case "lead": {
          const length = hit.length ?? BEAT;
          const target = hz(hit.midi);
          const from = leadFrom ?? target;
          leadFrom = target;
          const hold = Math.max(0.04, length - 0.3);
          for (let side = 0; side < 2; side++) {
            L.tone({
              freq: from,
              to: target,
              glide: 0.06,
              type: "sawtooth",
              gain: LEAD_LEVEL,
              attack: 0.03,
              hold,
              decay: 0.4,
              detune: side === 0 ? -8 : 8,
              lowpass: 2200,
              at,
              pan: side === 0 ? -0.25 : 0.25,
              send: 0.7,
            });
          }
          L.bell({ freq: target, gain: BELL_LEVEL * 0.8, decay: 1.4, at, pan: 0, send: 0.85 });
          return;
        }
        case "rise": {
          const length = hit.length ?? BEAT;
          L.noise({ gain: RISE_LEVEL, attack: length * 0.9, decay: 0.35, filter: "bandpass", freq: 600, to: 3200, q: 0.9, send: 0.9, at });
          return;
        }
      }
    },
  };
}

export const arcade: ThemeScore = {
  id: "arcade",
  root: 2,
  bar: BAR,
  loop: LOOP,
  chords: CHORDS,
  hits: HITS,
  build,
};

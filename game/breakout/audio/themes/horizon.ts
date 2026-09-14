/**
 * Theme two — "Horizon". Calm synthwave: the quest, the road, the future.
 *
 * Direction — a slow night drive. A soft kick on every beat with the pad and
 * the bass breathing under it (the sidechain pump of the genre), a steady
 * eighth-note arpeggio that never syncopates, a wide analog pad, a deep sub,
 * a far band of air — and, on the second half of the loop, a lead of long
 * gliding saw notes, doubled by a faint glass bell so the menu still speaks
 * with the board's voice. Every note lands on the beat or the half-beat; the
 * pulse is the pump, not accents. Everything sits in the hall reverb.
 *
 * 84 BPM. Key of D on the game's six-note scale (major without the fourth),
 * heard from its relative minor: Bm · D · A · F#m, two bars each, the cycle
 * twice per loop. The first pass is just the drive; the lead sings the second
 * pass and leans back to Bm, so the loop circles without ever cadencing hard.
 * A quiet swell of air rises into each return.
 */
import type { Layer } from "../synth";
import { hz, type ThemeChord, type ThemeGraph, type ThemeHit, type ThemeParts, type ThemeScore } from "./score";

const BPM = 84;
const BEAT = 60 / BPM;
const CHORD_BEATS = 8;
const BAR = CHORD_BEATS * BEAT;
const SLOTS = 8;
const LOOP = SLOTS * BAR;

/** Part levels, tuned to sit near -24 dBFS at the master. */
const SUB_LEVEL = 0.06;
const SUB_TOP_LEVEL = 0.04;
const PAD_LEVEL = 0.022;
const ARP_LEVEL = 0.045;
const LEAD_LEVEL = 0.03;
const KICK_LEVEL = 0.07;
const AIR_LEVEL = 0.005;
const SHIMMER_LEVEL = 0.03;
const RISE_LEVEL = 0.014;

/** The pump: how far the pad and bass dip on each beat, and how fast they come back. */
const PUMP_FLOOR = 0.45;
const PUMP_DIP = 0.025;
const PUMP_RECOVER = 0.17;

const ARP_PATTERN = [0, 1, 2, 3, 4, 3, 2, 1] as const;
const ARP_DECAY = 0.32;

interface Chord extends ThemeChord {
  /** Pad voicing (MIDI). */
  pad: readonly [number, number, number];
  /** Sub root (MIDI). */
  bass: number;
  /** Arpeggio voicing (MIDI): root, third, fifth, octave, third, fifth. */
  arp: readonly [number, number, number, number, number, number];
  /** The shimmer on the downbeat (MIDI). */
  top: number;
}

/** Bm · D · A · F#m, voice-led; the sub walks down under it. */
const CYCLE: readonly Chord[] = [
  { pad: [50, 54, 59], bass: 35, arp: [59, 62, 66, 71, 74, 78], top: 71, triad: [9, 0, 4], extras: [7, 2] },
  { pad: [50, 54, 57], bass: 38, arp: [62, 66, 69, 74, 78, 81], top: 69, triad: [0, 4, 7], extras: [9, 2] },
  { pad: [52, 57, 61], bass: 33, arp: [57, 61, 64, 69, 73, 76], top: 73, triad: [7, 11, 2], extras: [9, 4] },
  { pad: [54, 57, 61], bass: 30, arp: [54, 57, 61, 66, 69, 73], top: 73, triad: [4, 7, 11], extras: [2, 9] },
];
const CHORDS: readonly Chord[] = [...CYCLE, ...CYCLE];

/**
 * The lead: [slot, beat in the slot, MIDI, beats held]. Sparse on the first
 * pass — two long sighs — then the phrase on the second: falling on Bm,
 * rising through D to A, cresting, then stepping down into the return.
 */
const LEAD: readonly (readonly [number, number, number, number])[] = [
  [2, 4, 78, 4],
  [3, 4, 73, 4],
  [4, 0, 78, 3], [4, 3, 76, 1], [4, 4, 74, 3],
  [5, 0, 76, 2], [5, 2, 78, 2], [5, 4, 81, 4],
  [6, 0, 83, 3], [6, 3, 81, 1], [6, 4, 78, 4],
  [7, 0, 76, 2], [7, 2, 74, 2], [7, 4, 73, 4],
];

const HITS: readonly ThemeHit[] = [
  // The arpeggio: sixteen even eighths per chord, up the voicing and back.
  ...CHORDS.flatMap((chord, slot) =>
    Array.from({ length: CHORD_BEATS * 2 }, (_, k): ThemeHit => ({
      t: slot * BAR + k * (BEAT / 2),
      voice: "arp",
      midi: chord.arp[ARP_PATTERN[k % ARP_PATTERN.length]],
      slot: slot * CHORD_BEATS * 2 + k,
      level: k % 2 === 0 ? 1 : 0.75,
    })),
  ),
  // The kick: every beat, a little softer on two and four.
  ...CHORDS.flatMap((_, slot) =>
    Array.from({ length: CHORD_BEATS }, (_, b): ThemeHit => ({
      t: slot * BAR + b * BEAT,
      voice: "kick",
      midi: 0,
      slot: slot * CHORD_BEATS + b,
      level: b % 2 === 0 ? 1 : 0.7,
    })),
  ),
  // A glass shimmer on each downbeat, far back.
  ...CHORDS.map((chord, slot): ThemeHit => ({ t: slot * BAR, voice: "shimmer", midi: chord.top, slot })),
  // The lead.
  ...LEAD.map(([slot, beat, midi, beats], i): ThemeHit => ({
    t: slot * BAR + beat * BEAT,
    voice: "lead",
    midi,
    slot: i,
    length: beats * BEAT,
  })),
  // A swell of air over the last two beats before each return to Bm.
  ...[3, 7].map((slot, i): ThemeHit => ({ t: slot * BAR + 6 * BEAT, voice: "rise", midi: 0, slot: i, length: 2 * BEAT })),
];

interface ArpVoice {
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

  // Sub: a sine on the root and a filtered triangle an octave up, both under the pump.
  const bassOscs: OscillatorNode[] = [];
  const subDuck = part(0, 0.12);
  if (subDuck) {
    const pump = pumped(subDuck);

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = hz(CHORDS[0].bass);
    const subGain = ctx.createGain();
    subGain.gain.value = SUB_LEVEL;
    sub.connect(subGain).connect(pump);
    sub.start();

    const top = ctx.createOscillator();
    top.type = "triangle";
    top.frequency.value = hz(CHORDS[0].bass) * 2;
    const topFilter = ctx.createBiquadFilter();
    topFilter.type = "lowpass";
    topFilter.frequency.value = 320;
    topFilter.Q.value = 0.7;
    const topGain = ctx.createGain();
    topGain.gain.value = SUB_TOP_LEVEL;
    top.connect(topFilter).connect(topGain).connect(pump);
    top.start();

    bassOscs.push(sub, top);
    own(sub, top);
  }

  // Pad: three notes, each two saws spread a few cents and split left/right,
  // under a low-pass that drifts and opens on every chord; pumped.
  const padOscs: OscillatorNode[] = [];
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 520;
  padFilter.Q.value = 0.8;
  const padDuck = part(0, 0.8);
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
        osc.detune.value = (side === 0 ? -1 : 1) * (4 + i * 1.2) + rng.range(-1, 1);
        const pan = ctx.createStereoPanner();
        pan.pan.value = (side === 0 ? -1 : 1) * (0.4 + i * 0.14);
        osc.connect(pan).connect(padFilter);
        osc.start();
        padOscs.push(osc);
        own(osc);
      }
    });
    const drift = ctx.createOscillator();
    drift.frequency.value = 0.06;
    const driftDepth = ctx.createGain();
    driftDepth.gain.value = 90;
    drift.connect(driftDepth).connect(padFilter.frequency);
    drift.start();
    own(drift);
  }

  // Arpeggio: two mono saw voices, one per side, taking turns — an
  // arpeggiator, not a note per oscillator. Not pumped, so its pulse stays even.
  const arp: ArpVoice[] = [];
  const arpDuck = part(0, 0.55);
  if (arpDuck) {
    const drift = ctx.createOscillator();
    drift.frequency.value = 0.07;
    const driftDepth = ctx.createGain();
    driftDepth.gain.value = 350;
    drift.connect(driftDepth);
    drift.start();
    own(drift);
    for (let side = 0; side < 2; side++) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = hz(CHORDS[0].arp[0]);
      osc.detune.value = rng.range(-3, 3);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1500;
      filter.Q.value = 1.1;
      driftDepth.connect(filter.frequency);
      const env = ctx.createGain();
      env.gain.value = 0;
      const pan = ctx.createStereoPanner();
      pan.pan.value = side === 0 ? -0.3 : 0.3;
      osc.connect(filter).connect(env).connect(pan).connect(arpDuck);
      osc.start();
      arp.push({ osc, env });
      own(osc);
    }
  }

  // Air: a slow, high band of seeded noise, mostly heard through the hall.
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
    band.frequency.value = 1400;
    band.Q.value = 0.5;
    const airGain = ctx.createGain();
    airGain.gain.value = AIR_LEVEL;
    src.connect(band).connect(airGain).connect(airDuck);
    src.start();
    const sway = ctx.createOscillator();
    sway.frequency.value = 0.03;
    const swayDepth = ctx.createGain();
    swayDepth.gain.value = 500;
    sway.connect(swayDepth).connect(band.frequency);
    sway.start();
    own(src, sway);
  }

  /** The lead's last pitch, so each note glides in from the one before. */
  let leadFrom: number | null = null;

  return {
    chord(index, t) {
      // Chords change on the beat, in a few milliseconds: a slide would pass
      // through every pitch in between while the arpeggio is running.
      const chord = CHORDS[index];
      padOscs.forEach((osc, i) => {
        osc.frequency.setTargetAtTime(hz(chord.pad[i >> 1]), t, 0.012);
      });
      const bass = hz(chord.bass);
      bassOscs[0]?.frequency.setTargetAtTime(bass, t, 0.01);
      bassOscs[1]?.frequency.setTargetAtTime(bass * 2, t, 0.01);
      // The filter opens on the change and settles back over the bar.
      padFilter.frequency.cancelScheduledValues(t);
      padFilter.frequency.setTargetAtTime(900, t, 0.4);
      padFilter.frequency.setTargetAtTime(520, t + 1.6, 2);
    },
    hit(hit, at) {
      const level = hit.level ?? 1;
      switch (hit.voice) {
        case "arp": {
          const v = arp[hit.slot % arp.length];
          if (!v) return;
          v.osc.frequency.setValueAtTime(hz(hit.midi), at);
          v.env.gain.setValueAtTime(0, at);
          v.env.gain.linearRampToValueAtTime(ARP_LEVEL * level, at + 0.006);
          v.env.gain.setTargetAtTime(0, at + 0.046, ARP_DECAY / 4.5);
          return;
        }
        case "kick": {
          // A felt thump, and the pump it drives on the pad and the bass.
          L.tone({ freq: 130, to: 45, glide: 0.07, type: "sine", gain: KICK_LEVEL * level, attack: 0.003, hold: 0.015, decay: 0.24, send: 0.06, at });
          for (const pump of pumps) {
            pump.gain.setValueAtTime(1, at);
            pump.gain.linearRampToValueAtTime(PUMP_FLOOR, at + PUMP_DIP);
            pump.gain.setTargetAtTime(1, at + PUMP_DIP, PUMP_RECOVER);
          }
          return;
        }
        case "shimmer": {
          const pan = hit.slot % 2 === 0 ? -0.35 : 0.35;
          L.bell({ freq: hz(hit.midi), gain: SHIMMER_LEVEL, decay: 2.6, at, pan, send: 0.95 });
          return;
        }
        case "lead": {
          const length = hit.length ?? BEAT;
          const target = hz(hit.midi);
          const from = leadFrom ?? target;
          leadFrom = target;
          const hold = Math.max(0.05, length - 0.45);
          for (let side = 0; side < 2; side++) {
            L.tone({
              freq: from,
              to: target,
              glide: 0.1,
              type: "sawtooth",
              gain: LEAD_LEVEL,
              attack: 0.05,
              hold,
              decay: 0.6,
              detune: side === 0 ? -7 : 7,
              lowpass: 1500,
              at,
              pan: side === 0 ? -0.22 : 0.22,
              send: 0.75,
            });
          }
          // The board's voice under the lead: a faint glass bell on the attack.
          L.bell({ freq: target, gain: SHIMMER_LEVEL * 1.1, decay: 1.8, at, pan: 0, send: 0.9 });
          return;
        }
        case "rise": {
          const length = hit.length ?? BEAT;
          L.noise({ gain: RISE_LEVEL, attack: length * 0.85, decay: 0.5, filter: "bandpass", freq: 500, to: 2400, q: 0.8, send: 0.9, at });
          return;
        }
      }
    },
  };
}

export const horizon: ThemeScore = {
  id: "horizon",
  root: 2,
  bar: BAR,
  loop: LOOP,
  chords: CHORDS,
  hits: HITS,
  build,
};

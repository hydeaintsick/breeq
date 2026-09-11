/**
 * The story theme: the game's tune, looping under the episode shelf.
 *
 * Direction — low, slow, futuristic, and easy to leave on: a sub bass that
 * breathes, a dark analog pad that slides between four chords, a distant band
 * of air, and the tune itself struck on the same glass bells as the bricks, so
 * the menu and the board are one voice. Everything sits in the hall reverb.
 *
 * Key of D on the game's six-note scale (major without the fourth). Four
 * chords, eight seconds each — D · A · Bm · F#m — voice-led so no pad note ever
 * moves more than a fourth; the loop is 32 seconds and never cadences hard, so
 * it can circle for as long as the player browses.
 *
 * Procedural, seeded, no samples. One instance per page (`acquireStoryTheme`):
 * route changes inside story mode hand the same loop over without a restart.
 */
import { createRng } from "../../shared/random";
import { unlockSound } from "./bus";
import { Layer } from "./synth";

/** Seconds per chord and per loop. */
const BAR = 8;
const LOOP = 32;
/** Scheduler cadence and look-ahead, seconds. Music tolerates latency; hidden tabs throttle timers. */
const TICK = 0.3;
const HORIZON = 1.2;
/** Late by more than this and a note is dropped rather than smeared. */
const LATE = 0.08;
/** Fades: in when the shelf appears, out when it leaves or a run starts. */
const FADE_IN = 0.9;
const FADE_OUT = 0.45;
/** Grace after the last holder leaves before the graph is torn down, ms. */
const DISPOSE_MS = 1600;

/** Part levels, tuned to sit near -24 dBFS at the master: present, never in the way. */
const SUB_LEVEL = 0.095;
const SUB_TOP_LEVEL = 0.04;
const PAD_LEVEL = 0.02;
const AIR_LEVEL = 0.007;
const BELL_LEVEL = 0.1;
const PLUCK_LEVEL = 0.04;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Pad voicings (MIDI): D F# A · E A C# · D F# B · F# A C#. */
const PAD_CHORDS: readonly (readonly [number, number, number])[] = [
  [50, 54, 57],
  [52, 57, 61],
  [50, 54, 59],
  [54, 57, 61],
];
/** Bass roots (MIDI): D2 A2 B2 F#2. */
const BASS_NOTES = [38, 45, 47, 42] as const;

/**
 * The tune, one figure per bar on the same rhythm so it reads as a theme:
 * [time in loop, MIDI]. Each note answers itself with a softer echo a beat later.
 */
const TUNE: readonly (readonly [number, number])[] = [
  [0, 74], [1.5, 81], [3, 78], [5.5, 76],
  [8, 73], [9.5, 76], [11, 81], [13.5, 83],
  [16, 74], [17.5, 78], [19, 71], [21.5, 69],
  [24, 73], [25.5, 69], [27, 66], [29.5, 64],
];
const ECHO_AFTER = 0.75;
const ECHO_LEVEL = 0.42;

type Step = { t: number; kind: "chord"; index: number } | { t: number; kind: "note"; midi: number; slot: number };

const STEPS: readonly Step[] = [
  ...PAD_CHORDS.map((_, index): Step => ({ t: index * BAR, kind: "chord", index })),
  ...TUNE.map(([t, midi], slot): Step => ({ t, kind: "note", midi, slot })),
].sort((a, b) => a.t - b.t || (a.kind === "chord" ? -1 : 1));

interface Graph {
  /** One per part; the whole theme fades through these. */
  ducks: GainNode[];
  padOscs: OscillatorNode[];
  padFilter: BiquadFilterNode;
  bassOscs: OscillatorNode[];
  sources: AudioScheduledSourceNode[];
  closes: (() => void)[];
}

class StoryTheme {
  private layer: Layer | null = null;
  private graph: Graph | null = null;
  private timer = 0;
  private loopStart = -1;
  private cursor = 0;
  private lap = 0;
  private active = true;
  private level = 0;
  private disposed = false;

  /**
   * Safe to call often and from any gesture: creates the graph once, then only
   * pokes the bus so a suspended context gets its chance to resume.
   */
  start(): void {
    if (this.disposed) return;
    const bus = unlockSound();
    if (!bus) return;
    if (!this.layer) {
      const layer = new Layer(bus, 0x5709);
      layer.setActive(true);
      this.layer = layer;
      this.graph = this.build(layer);
      this.timer = window.setInterval(() => this.tick(), TICK * 1000);
      this.applyLevel(FADE_IN);
    }
    this.tick();
  }

  /** False while a chapter runs or the tab is hidden: the theme steps aside. */
  setActive(on: boolean): void {
    this.active = on;
    this.applyLevel(on ? FADE_IN : FADE_OUT);
  }

  fadeIn(): void {
    this.level = 1;
    this.applyLevel(FADE_IN);
  }

  fadeOut(): void {
    this.level = 0;
    this.applyLevel(FADE_OUT);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    window.clearInterval(this.timer);
    const g = this.graph;
    const L = this.layer;
    if (g && L) {
      const t = L.now;
      for (const duck of g.ducks) duck.gain.setTargetAtTime(0, t, 0.05);
      for (const src of g.sources) {
        try {
          src.stop(t + 0.3);
        } catch {
          // Already stopped.
        }
      }
      window.setTimeout(() => {
        for (const close of g.closes) close();
        L.destroy();
      }, 400);
    } else {
      L?.destroy();
    }
    this.graph = null;
    this.layer = null;
  }

  // ---------------------------------------------------------------------------

  private applyLevel(tc: number): void {
    const g = this.graph;
    const L = this.layer;
    if (!g || !L) return;
    const target = this.active ? this.level : 0;
    const t = L.now;
    for (const duck of g.ducks) duck.gain.setTargetAtTime(target, t, tc);
  }

  private get audible(): boolean {
    return this.active && this.level > 0;
  }

  private tick(): void {
    const L = this.layer;
    const g = this.graph;
    if (!L || !g || !L.ready) return;
    const now = L.now;
    if (this.loopStart < 0) {
      this.loopStart = now + 0.05;
      this.cursor = 0;
      this.lap = 0;
    }
    const horizon = now + HORIZON;
    // Bounded: a long-hidden tab catches up in one pass instead of spinning.
    for (let guard = 0; guard < STEPS.length * 4; guard++) {
      const step = STEPS[this.cursor];
      const at = this.loopStart + this.lap * LOOP + step.t;
      if (at > horizon) break;
      this.schedule(step, at, now);
      this.cursor += 1;
      if (this.cursor >= STEPS.length) {
        this.cursor = 0;
        this.lap += 1;
      }
    }
  }

  private schedule(step: Step, at: number, now: number): void {
    const L = this.layer;
    const g = this.graph;
    if (!L || !g) return;
    if (step.kind === "chord") {
      // Harmony always moves, even silently, so a return lands on the right chord.
      const t = Math.max(at, now);
      const chord = PAD_CHORDS[step.index];
      g.padOscs.forEach((osc, i) => {
        osc.frequency.setTargetAtTime(hz(chord[i >> 1]), t, 0.35);
      });
      const bass = hz(BASS_NOTES[step.index]);
      g.bassOscs[0].frequency.setTargetAtTime(bass, t, 0.12);
      g.bassOscs[1].frequency.setTargetAtTime(bass * 2, t, 0.12);
      // The filter opens on the change and settles back over the bar.
      g.padFilter.frequency.cancelScheduledValues(t);
      g.padFilter.frequency.setTargetAtTime(760, t, 0.5);
      g.padFilter.frequency.setTargetAtTime(340, t + 2.2, 2.4);
      return;
    }
    if (!this.audible || at < now - LATE) return;
    const pan = step.slot % 2 === 0 ? -0.28 : 0.28;
    const freq = hz(step.midi);
    L.bell({ freq, gain: BELL_LEVEL, decay: 1.7, at, pan, send: 0.9 });
    L.bell({ freq, gain: BELL_LEVEL * ECHO_LEVEL, decay: 1.4, at: at + ECHO_AFTER, pan: -pan, send: 0.95 });
    // A soft body an octave under the bell, swelling in behind it.
    L.tone({ freq: freq / 2, gain: PLUCK_LEVEL, attack: 0.22, decay: 1.3, lowpass: 900, at, pan: pan * 0.5, send: 0.85 });
  }

  private build(L: Layer): Graph {
    const ctx = L.ctx;
    const ducks: GainNode[] = [];
    const sources: AudioScheduledSourceNode[] = [];
    const closes: (() => void)[] = [];
    const rng = createRng(0x7e11e);

    const part = (pan: number, send: number): GainNode | null => {
      const ch = L.channel({ pan, send });
      if (!ch) return null;
      const duck = ctx.createGain();
      duck.gain.value = 0;
      duck.connect(ch.input);
      ducks.push(duck);
      closes.push(ch.close);
      return duck;
    };

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
      sources.push(lfo);
      breath.connect(subDuck);

      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.value = hz(BASS_NOTES[0]);
      const subGain = ctx.createGain();
      subGain.gain.value = SUB_LEVEL;
      sub.connect(subGain).connect(breath);
      sub.start();

      const top = ctx.createOscillator();
      top.type = "triangle";
      top.frequency.value = hz(BASS_NOTES[0]) * 2;
      const topFilter = ctx.createBiquadFilter();
      topFilter.type = "lowpass";
      topFilter.frequency.value = 260;
      topFilter.Q.value = 0.6;
      const topGain = ctx.createGain();
      topGain.gain.value = SUB_TOP_LEVEL;
      top.connect(topFilter).connect(topGain).connect(breath);
      top.start();

      bassOscs.push(sub, top);
      sources.push(sub, top);
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
      PAD_CHORDS[0].forEach((midi, i) => {
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
          sources.push(osc);
        }
      });
      const drift = ctx.createOscillator();
      drift.frequency.value = 0.05;
      const driftDepth = ctx.createGain();
      driftDepth.gain.value = 70;
      drift.connect(driftDepth).connect(padFilter.frequency);
      drift.start();
      sources.push(drift);
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
      sources.push(src);
      const sway = ctx.createOscillator();
      sway.frequency.value = 0.037;
      const swayDepth = ctx.createGain();
      swayDepth.gain.value = 320;
      sway.connect(swayDepth).connect(band.frequency);
      sway.start();
      sources.push(sway);
    }

    return { ducks, padOscs, padFilter, bassOscs, sources, closes };
  }
}

// -----------------------------------------------------------------------------

export interface StoryThemeHandle {
  /** Call from gestures too: a context created before any gesture resumes here. */
  start(): void;
  /** Duck for a run or a hidden tab; the harmony keeps moving underneath. */
  setActive(on: boolean): void;
  release(): void;
}

let theme: StoryTheme | null = null;
let holders = 0;
let disposeTimer = 0;

/**
 * Hold the theme while a story surface is mounted. Holders overlap during route
 * changes, so the loop carries across them; it fades out and is torn down only
 * once the last one has left.
 */
export function acquireStoryTheme(): StoryThemeHandle {
  holders += 1;
  window.clearTimeout(disposeTimer);
  if (!theme) theme = new StoryTheme();
  const current = theme;
  current.fadeIn();
  current.start();
  let released = false;
  return {
    start: () => current.start(),
    setActive: (on) => current.setActive(on),
    release: () => {
      if (released) return;
      released = true;
      holders = Math.max(0, holders - 1);
      if (holders > 0) return;
      current.fadeOut();
      disposeTimer = window.setTimeout(() => {
        if (holders > 0 || theme !== current) return;
        current.dispose();
        theme = null;
      }, DISPOSE_MS);
    },
  };
}

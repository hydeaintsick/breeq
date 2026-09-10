/**
 * Voice primitives for the sound design. A `Layer` is one mount's set of
 * voices on the shared bus: every voice is routed through its own pan and
 * reverb send, the layer ducks as a whole when the game pauses, and it holds
 * the bus awake only while it may sound.
 *
 * Three instruments cover the whole design:
 * - `tone`: one oscillator with an envelope and an optional pitch glide.
 * - `bell`: a struck object, sine partials with their own decays.
 * - `noise`: a filtered burst of seeded noise (air, shatter, wind).
 * Everything is soft-edged: attacks are never 0, decays are exponential, and
 * micro detune comes from the seeded RNG so no two hits are identical.
 */
import { createRng, type Rng } from "../../shared/random";
import type { AudioBus } from "./bus";

const MAX_VOICES = 32;
const NOISE_SECONDS = 2;
/** Nothing above this is ever synthesized; the bus rolls off from 9.5 kHz anyway. */
const MAX_HZ = 14000;

export interface Spatial {
  /** Absolute context time. Defaults to now. */
  at?: number;
  /** -1 (left) .. 1 (right). */
  pan?: number;
  /** Reverb send, 0..1. */
  send?: number;
}

export interface ToneSpec extends Spatial {
  freq: number;
  /** Glide target frequency. */
  to?: number;
  /** Glide duration; defaults to the decay. */
  glide?: number;
  type?: OscillatorType;
  gain: number;
  attack?: number;
  hold?: number;
  /** Time to fall to about -25 dB. */
  decay: number;
  detune?: number;
  /** Low-pass cutoff on the oscillator. */
  lowpass?: number;
}

export type Partials = readonly (readonly [ratio: number, amp: number, decayMul: number])[];

export interface BellSpec extends Spatial {
  freq: number;
  gain: number;
  decay: number;
  detune?: number;
  partials?: Partials;
}

export interface NoiseSpec extends Spatial {
  gain: number;
  attack?: number;
  hold?: number;
  decay: number;
  filter?: BiquadFilterType;
  freq?: number;
  /** Filter sweep target. */
  to?: number;
  q?: number;
}

/** Struck glass: a clear fundamental with a few stiff, fast-dying overtones. */
export const GLASS: Partials = [
  [1, 1, 1],
  [2.32, 0.38, 0.6],
  [4.17, 0.18, 0.4],
  [6.8, 0.07, 0.28],
];

/** Struck metal: inharmonic, denser, shorter. */
export const STEEL: Partials = [
  [1, 1, 1],
  [1.51, 0.6, 0.8],
  [2.93, 0.4, 0.5],
  [4.4, 0.2, 0.35],
];

const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (buffer) return buffer;
  const length = Math.floor(ctx.sampleRate * NOISE_SECONDS);
  buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const rng = createRng(0xa11ce);
  for (let i = 0; i < length; i++) data[i] = rng.next() * 2 - 1;
  noiseBuffers.set(ctx, buffer);
  return buffer;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Attack, optional hold, then an exponential fall (time constant decay / 4.5). */
function shape(param: AudioParam, at: number, peak: number, attack: number, hold: number, decay: number): void {
  param.setValueAtTime(0, at);
  param.linearRampToValueAtTime(peak, at + attack);
  param.setValueAtTime(peak, at + attack + hold);
  param.setTargetAtTime(0, at + attack + hold, decay / 4.5);
}

function tail(attack: number, hold: number, decay: number): number {
  return attack + hold + decay * 1.4;
}

interface Voice {
  input: GainNode;
  close(): void;
}

export class Layer {
  readonly bus: AudioBus;
  private readonly dry: GainNode;
  private readonly wet: GainNode;
  private readonly rng: Rng;
  private voices = 0;
  private held = false;
  private dead = false;

  constructor(bus: AudioBus, seed = 1) {
    this.bus = bus;
    this.rng = createRng(seed);
    const ctx = bus.ctx;
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.dry.gain.value = 0;
    this.wet.gain.value = 0;
    this.dry.connect(bus.dry);
    this.wet.connect(bus.send);
  }

  get ctx(): AudioContext {
    return this.bus.ctx;
  }

  get now(): number {
    return this.bus.ctx.currentTime;
  }

  /** True while voices may be scheduled and heard. */
  get ready(): boolean {
    return !this.dead && this.bus.running;
  }

  /** Many voices already sounding: callers drop or soften low-priority hits. */
  get crowded(): boolean {
    return this.voices >= MAX_VOICES * 0.6;
  }

  /** Small deterministic variation, in the given range. */
  vary(range: number): number {
    return this.rng.range(-range, range);
  }

  /** Duck the whole layer (pause, hidden tab) and release the bus while silent. */
  setActive(on: boolean): void {
    if (this.dead) return;
    const t = this.now;
    const g = on ? 1 : 0;
    this.dry.gain.setTargetAtTime(g, t, 0.04);
    this.wet.gain.setTargetAtTime(g, t, 0.04);
    if (on && !this.held) {
      this.held = true;
      this.bus.retain();
    } else if (!on && this.held) {
      this.held = false;
      this.bus.release();
    }
  }

  destroy(): void {
    if (this.dead) return;
    this.dead = true;
    if (this.held) {
      this.held = false;
      this.bus.release();
    }
    this.dry.disconnect();
    this.wet.disconnect();
  }

  /**
   * A long-lived input (ambient pads). The caller owns its sources and calls
   * `close` when done.
   */
  channel(spec: Spatial = {}): Voice | null {
    return this.open(spec);
  }

  tone(spec: ToneSpec): void {
    if (spec.freq > MAX_HZ) return;
    const at = spec.at ?? this.now;
    const attack = spec.attack ?? 0.004;
    const hold = spec.hold ?? 0;
    const stop = at + tail(attack, hold, spec.decay);
    const v = this.open(spec);
    if (!v) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = spec.type ?? "sine";
    osc.frequency.setValueAtTime(spec.freq, at);
    if (spec.to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, spec.to), at + (spec.glide ?? spec.decay));
    }
    osc.detune.value = (spec.detune ?? 0) + this.rng.range(-4, 4);
    let node: AudioNode = osc;
    if (spec.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = spec.lowpass;
      f.Q.value = 0.7;
      osc.connect(f);
      node = f;
    }
    node.connect(v.input);
    shape(v.input.gain, at, spec.gain, attack, hold, spec.decay);
    osc.onended = v.close;
    osc.start(at);
    osc.stop(stop);
  }

  bell(spec: BellSpec): void {
    const partials = (spec.partials ?? GLASS).filter(([ratio]) => spec.freq * ratio <= MAX_HZ);
    if (partials.length === 0) return;
    const at = spec.at ?? this.now;
    const v = this.open(spec);
    if (!v) return;
    const ctx = this.ctx;
    const detune = (spec.detune ?? 0) + this.rng.range(-6, 6);
    v.input.gain.value = 1;
    let last: OscillatorNode | null = null;
    let lastStop = 0;
    for (const [ratio, amp, decayMul] of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = spec.freq * ratio;
      osc.detune.value = detune + this.rng.range(-3, 3);
      const g = ctx.createGain();
      const decay = spec.decay * decayMul;
      shape(g.gain, at, spec.gain * amp, 0.003, 0, decay);
      osc.connect(g).connect(v.input);
      const stop = at + tail(0.003, 0, decay);
      osc.start(at);
      osc.stop(stop);
      if (stop > lastStop) {
        lastStop = stop;
        last = osc;
      }
    }
    if (last) last.onended = v.close;
  }

  noise(spec: NoiseSpec): void {
    const at = spec.at ?? this.now;
    const attack = spec.attack ?? 0.002;
    const hold = spec.hold ?? 0;
    const stop = at + tail(attack, hold, spec.decay);
    const v = this.open(spec);
    if (!v) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    let node: AudioNode = src;
    if (spec.filter) {
      const f = ctx.createBiquadFilter();
      f.type = spec.filter;
      f.frequency.setValueAtTime(spec.freq ?? 1000, at);
      if (spec.to !== undefined) {
        f.frequency.exponentialRampToValueAtTime(Math.max(20, spec.to), at + attack + hold + spec.decay);
      }
      f.Q.value = spec.q ?? 0.8;
      src.connect(f);
      node = f;
    }
    node.connect(v.input);
    shape(v.input.gain, at, spec.gain, attack, hold, spec.decay);
    src.onended = v.close;
    src.start(at, this.rng.range(0, NOISE_SECONDS - 0.2));
    src.stop(stop);
  }

  private open(spec: Spatial): Voice | null {
    if (this.dead || this.voices >= MAX_VOICES) return null;
    const ctx = this.ctx;
    const input = ctx.createGain();
    const pan = ctx.createStereoPanner();
    pan.pan.value = clamp(spec.pan ?? 0, -1, 1);
    const send = ctx.createGain();
    send.gain.value = clamp(spec.send ?? 0.5, 0, 1);
    input.connect(pan);
    pan.connect(this.dry);
    pan.connect(send);
    send.connect(this.wet);
    this.voices += 1;
    let closed = false;
    return {
      input,
      close: () => {
        if (closed) return;
        closed = true;
        this.voices -= 1;
        input.disconnect();
        pan.disconnect();
        send.disconnect();
      },
    };
  }
}

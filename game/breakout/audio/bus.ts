/**
 * Shared Web Audio bus for the breakout sound design.
 *
 * One AudioContext per page, created lazily inside a user gesture (autoplay
 * policy). Every mount that plays with sound adds a `Layer` on top: voices go
 * to `dry` and, scaled by a per-voice send, to `send`, which feeds a hall
 * reverb. The mix is glued by a soft compressor, an "air" low-pass that tames
 * anything sharp, and the master gain that the sound preference drives.
 *
 * No samples, no files. The reverb impulse is seeded noise shaped by a decaying
 * envelope whose highs die faster than its lows, like a large stone hall.
 */
import { createRng } from "../../shared/random";

const IR_SECONDS = 3.4;
const IR_PREDELAY = 0.018;
const MASTER_LEVEL = 0.85;
const REVERB_LEVEL = 0.8;
/** Master fade when the preference flips, seconds. */
const FADE = 0.16;
/** Idle time with no active layer before the context sleeps, ms. */
const IDLE_SLEEP = 900;

let wanted = true;
let bus: AudioBus | null = null;

export function isSoundSupported(): boolean {
  return typeof window !== "undefined" && typeof window.AudioContext === "function";
}

/** The player's preference. Mutes at the master and puts the context to sleep. */
export function setSoundEnabled(on: boolean): void {
  wanted = on;
  bus?.setEnabled(on);
}

export function isSoundEnabled(): boolean {
  return wanted;
}

/**
 * Call from a user gesture (pointer down, a toggle click). Creates the context
 * on first call and resumes it. Returns null when sound is off or unsupported.
 */
export function unlockSound(): AudioBus | null {
  if (!wanted || !isSoundSupported()) return null;
  if (!bus) {
    try {
      bus = new AudioBus(new AudioContext({ latencyHint: "interactive" }));
    } catch {
      return null;
    }
  }
  bus.resume();
  return bus;
}

/** The bus, if a gesture already created it and sound is on. */
export function currentBus(): AudioBus | null {
  return bus && wanted ? bus : null;
}

export class AudioBus {
  readonly ctx: AudioContext;
  /** Direct path. */
  readonly dry: GainNode;
  /** Reverb path. */
  readonly send: GainNode;
  private readonly master: GainNode;
  private enabled = wanted;
  private holders = 0;
  private timer = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = this.enabled ? MASTER_LEVEL : 0;

    // Rolls off what phone speakers turn harsh; the design lives below this.
    const air = ctx.createBiquadFilter();
    air.type = "lowpass";
    air.frequency.value = 9500;
    air.Q.value = 0.4;

    const glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -20;
    glue.knee.value = 14;
    glue.ratio.value = 3;
    glue.attack.value = 0.004;
    glue.release.value = 0.22;

    glue.connect(air).connect(master).connect(ctx.destination);

    this.dry = ctx.createGain();
    this.dry.connect(glue);

    const hall = ctx.createConvolver();
    hall.normalize = true;
    hall.buffer = buildHall(ctx);
    const wet = ctx.createGain();
    wet.gain.value = REVERB_LEVEL;
    this.send = ctx.createGain();
    this.send.connect(hall).connect(wet).connect(glue);

    this.master = master;
  }

  get now(): number {
    return this.ctx.currentTime;
  }

  get running(): boolean {
    return this.enabled && this.ctx.state === "running";
  }

  resume(): void {
    if (!this.enabled) return;
    if (this.ctx.state !== "running") {
      void this.ctx.resume().catch(() => {
        // Not inside a gesture yet; the next pointer down retries.
      });
    }
    this.master.gain.setTargetAtTime(MASTER_LEVEL, this.ctx.currentTime, FADE / 3);
  }

  setEnabled(on: boolean): void {
    if (this.enabled === on) return;
    this.enabled = on;
    window.clearTimeout(this.timer);
    if (on) {
      this.resume();
      return;
    }
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, FADE / 3);
    this.timer = window.setTimeout(() => this.sleep(), FADE * 1000 + 200);
  }

  /** A layer that may sound holds the bus; the context sleeps when nobody does. */
  retain(): void {
    this.holders += 1;
    window.clearTimeout(this.timer);
    this.resume();
  }

  release(): void {
    this.holders = Math.max(0, this.holders - 1);
    if (this.holders > 0) return;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      if (this.holders === 0) this.sleep();
    }, IDLE_SLEEP);
  }

  private sleep(): void {
    if (this.ctx.state === "running") {
      void this.ctx.suspend().catch(() => {
        // Nothing to do; the context stays awake.
      });
    }
  }
}

/**
 * Hall impulse response: a short pre-delay, a handful of early reflections,
 * then a dense tail that loses its highs as it decays (-60 dB at IR_SECONDS).
 */
function buildHall(ctx: AudioContext): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * IR_SECONDS);
  const buffer = ctx.createBuffer(2, length, rate);
  const pre = Math.floor(rate * IR_PREDELAY);
  const decay = 6.9 / IR_SECONDS;

  for (let ch = 0; ch < 2; ch++) {
    const rng = createRng(0x5eed + ch * 97);
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = pre; i < length; i++) {
      const t = (i - pre) / rate;
      const env = Math.exp(-t * decay);
      // One-pole low-pass whose cutoff falls with time: bright onset, dark tail.
      const coef = 0.55 - 0.47 * Math.min(1, t / IR_SECONDS);
      lp += (rng.next() * 2 - 1 - lp) * coef;
      data[i] = lp * env;
    }
    // Early reflections, alternating sides.
    const taps: [number, number][] = [
      [0.011, 0.55],
      [0.019, 0.42],
      [0.027, 0.36],
      [0.036, 0.28],
      [0.047, 0.22],
      [0.061, 0.16],
    ];
    for (let k = 0; k < taps.length; k++) {
      const [at, amp] = taps[k];
      const side = (k + ch) % 2 === 0 ? 1 : 0.6;
      const index = pre + Math.floor(at * rate);
      if (index < length) data[index] += amp * side;
    }
  }
  return buffer;
}

/**
 * A run as the engine saw it: the seed, and the paddle input of every fixed
 * step. Replaying that through `Game` is the same board, at the renderer's
 * own resolution — a canvas game cannot be reconstructed from DOM snapshots.
 */
import type { GameInput } from "./types";

export type TapeSample = {
  /** Step index this input applies to. Later steps repeat `x` with no launch. */
  i: number;
  x: number;
  launch?: 1;
  ax?: number;
  ay?: number;
};

export type TapeRevive = {
  /** Steps already played when the player took the second chance. */
  i: number;
  lives: number;
};

export type PlayTape = {
  v: 1;
  seed: number;
  steps: number;
  samples: TapeSample[];
  revives: TapeRevive[];
};

export class TapeRecorder {
  private step = 0;
  private holdX = 0;
  private samples: TapeSample[] = [];
  private revives: TapeRevive[] = [];

  constructor(private seed: number) {}

  reset(seed: number): void {
    this.seed = seed;
    this.step = 0;
    this.holdX = 0;
    this.samples = [];
    this.revives = [];
  }

  push(input: GameInput): void {
    const aimed = input.aimX !== undefined && input.aimY !== undefined;
    const changed = this.samples.length === 0 || input.targetX !== this.holdX || input.launch || aimed;
    if (changed) {
      const sample: TapeSample = { i: this.step, x: input.targetX };
      if (input.launch) sample.launch = 1;
      if (aimed) {
        sample.ax = input.aimX;
        sample.ay = input.aimY;
      }
      this.samples.push(sample);
      this.holdX = input.targetX;
    }
    this.step += 1;
  }

  markRevive(lives: number): void {
    this.revives.push({ i: this.step, lives });
  }

  snapshot(): PlayTape {
    return {
      v: 1,
      seed: this.seed,
      steps: this.step,
      samples: this.samples,
      revives: this.revives,
    };
  }
}

/** The input the engine received on this step, or null past the end of the tape. */
export function inputAt(tape: PlayTape, step: number): GameInput | null {
  const samples = tape.samples;
  if (step < 0 || step >= tape.steps || samples.length === 0) return null;

  let lo = 0;
  let hi = samples.length - 1;
  let found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].i <= step) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  const sample = samples[found];
  if (sample.i > step) return { targetX: sample.x, launch: false };
  const on = sample.i === step;
  const input: GameInput = { targetX: sample.x, launch: Boolean(on && sample.launch === 1) };
  if (on && sample.ax !== undefined && sample.ay !== undefined) {
    input.aimX = sample.ax;
    input.aimY = sample.ay;
  }
  return input;
}

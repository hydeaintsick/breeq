/**
 * What a story theme is, for the player in `../theme.ts`.
 *
 * A theme is a seeded loop: a harmonic cycle (`chords`, one per `bar`
 * seconds) and a list of timed `hits` (notes, kicks, swells) the player
 * schedules ahead of time. The theme builds its own sustained parts (bass,
 * pads, air) on the channels the player hands it, moves them when the chord
 * changes, and strikes the hits. The player owns time, fades, ducking and
 * teardown, so every theme behaves the same under the map and the sheet.
 */
import type { Rng } from "../../../shared/random";
import type { Layer } from "../synth";

export interface ThemeChord {
  /** Semitones above the key's root that form the triad, root first. */
  triad: readonly [number, number, number];
  /** Semitones above the root that sit safely on top of the triad. */
  extras: readonly number[];
}

/** One scheduled event. `voice` is the theme's own vocabulary. */
export interface ThemeHit {
  /** Seconds into the loop. */
  t: number;
  voice: string;
  /** MIDI pitch, when the voice is pitched. */
  midi: number;
  /** Position in the voice's own sequence, for alternating sides and accents. */
  slot: number;
  /** Duration, seconds, for held voices. */
  length?: number;
  /** Relative level, 0..1. Defaults to 1. */
  level?: number;
}

export interface ThemeParts {
  /** A long-lived channel that fades with the whole theme. Null when the layer is dead. */
  part(pan: number, send: number): GainNode | null;
  /** Hand over sources so teardown stops them. */
  own(...sources: AudioScheduledSourceNode[]): void;
  /** Seeded, for detune and texture. */
  rng: Rng;
}

export interface ThemeGraph {
  /** Step the sustained parts to chord `index` at `t`. Called even while ducked. */
  chord(index: number, t: number): void;
  /** Strike a hit at `at`. Called only when audible and on time. */
  hit(hit: ThemeHit, at: number): void;
  /**
   * Themes that react to play (a run's tension) take a 0..1 level here and
   * move their filters and layer gains from `t`. Optional; menu themes are flat.
   */
  intensity?(level: number, t: number): void;
}

export interface ThemeScore {
  id: string;
  /** MIDI pitch class of the key's root. */
  root: number;
  /** Seconds per chord. */
  bar: number;
  /** Seconds per loop; a whole number of bars. */
  loop: number;
  chords: readonly ThemeChord[];
  /** Any order; the player sorts. */
  hits: readonly ThemeHit[];
  build(L: Layer, parts: ThemeParts): ThemeGraph;
}

export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

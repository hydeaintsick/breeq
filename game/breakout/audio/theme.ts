/**
 * The story theme player: loops a `ThemeScore` under the map and the episode
 * sheet. The music itself lives in `themes/` — "Lanterns" (the first theme,
 * glass bells over a sliding pad) and "Horizon" (calm synthwave, the default).
 *
 * The player owns time and plumbing: a look-ahead scheduler that survives
 * throttled hidden tabs, one fade for the whole theme, ducking during runs,
 * and teardown. Harmony always moves, even silently, so a return lands on the
 * right chord; notes are only struck while audible and on time.
 *
 * Procedural, seeded, no samples. One instance per page (`acquireStoryTheme`):
 * route changes inside story mode hand the same loop over without a restart.
 * `storyThemeChord()` tells other sound layers what is sounding right now so
 * their notes land inside it.
 */
import { createRng } from "../../shared/random";
import { unlockSound } from "./bus";
import { Layer } from "./synth";
import { activeTheme, type ThemeChord, type ThemeGraph, type ThemeHit, type ThemeScore } from "./themes";

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

type Step = { t: number; kind: "chord"; index: number } | { t: number; kind: "hit"; hit: ThemeHit };

/** Chord changes first, then every hit, in loop order. */
function stepsOf(score: ThemeScore): Step[] {
  return [
    ...score.chords.map((_, index): Step => ({ t: index * score.bar, kind: "chord", index })),
    ...score.hits.map((hit): Step => ({ t: hit.t, kind: "hit", hit })),
  ].sort((a, b) => a.t - b.t || (a.kind === "chord" ? -1 : b.kind === "chord" ? 1 : 0));
}

interface Graph {
  /** One per part; the whole theme fades through these. */
  ducks: GainNode[];
  voices: ThemeGraph;
  sources: AudioScheduledSourceNode[];
  closes: (() => void)[];
}

class StoryTheme {
  readonly score: ThemeScore;
  private readonly steps: readonly Step[];
  private layer: Layer | null = null;
  private graph: Graph | null = null;
  private timer = 0;
  private loopStart = -1;
  private cursor = 0;
  private lap = 0;
  private active = true;
  private level = 0;
  private disposed = false;

  constructor(score: ThemeScore) {
    this.score = score;
    this.steps = stepsOf(score);
  }

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

  /** The chord sounding at this moment, or the first chord before the loop has started. */
  chord(): ThemeChord {
    const { chords, loop, bar } = this.score;
    const L = this.layer;
    if (!L || this.loopStart < 0) return chords[0];
    const into = (((L.now - this.loopStart) % loop) + loop) % loop;
    return chords[Math.min(chords.length - 1, Math.floor(into / bar))];
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
    const steps = this.steps;
    // Bounded: a long-hidden tab catches up in one pass instead of spinning.
    for (let guard = 0; guard < steps.length * 4; guard++) {
      const step = steps[this.cursor];
      const at = this.loopStart + this.lap * this.score.loop + step.t;
      if (at > horizon) break;
      this.schedule(step, at, now);
      this.cursor += 1;
      if (this.cursor >= steps.length) {
        this.cursor = 0;
        this.lap += 1;
      }
    }
  }

  private schedule(step: Step, at: number, now: number): void {
    const g = this.graph;
    if (!g) return;
    if (step.kind === "chord") {
      // Harmony always moves, even silently, so a return lands on the right chord.
      g.voices.chord(step.index, Math.max(at, now));
      return;
    }
    if (!this.audible || at < now - LATE) return;
    g.voices.hit(step.hit, at);
  }

  private build(L: Layer): Graph {
    const ctx = L.ctx;
    const ducks: GainNode[] = [];
    const sources: AudioScheduledSourceNode[] = [];
    const closes: (() => void)[] = [];
    const voices = this.score.build(L, {
      rng: createRng(0x7e11e),
      own: (...added) => {
        sources.push(...added);
      },
      part: (pan, send) => {
        const ch = L.channel({ pan, send });
        if (!ch) return null;
        const duck = ctx.createGain();
        duck.gain.value = 0;
        duck.connect(ch.input);
        ducks.push(duck);
        closes.push(ch.close);
        return duck;
      },
    });
    return { ducks, voices, sources, closes };
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

/** What the theme is playing now, for other layers to tune to. */
export interface StoryThemeChord {
  /** MIDI pitch class of the key's root (D). */
  root: number;
  /** Semitones above the root that are in the chord, the triad. */
  triad: readonly [number, number, number];
  /** Semitones above the root that sit safely on top of it. */
  extras: readonly number[];
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
  if (!theme) theme = new StoryTheme(activeTheme());
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

/**
 * The chord sounding right now — the first chord of the active theme when it
 * is not running, so a layer tuned to it is always in the key.
 */
export function storyThemeChord(): StoryThemeChord {
  const score = theme ? theme.score : activeTheme();
  const chord = theme ? theme.chord() : score.chords[0];
  return { root: score.root, triad: chord.triad, extras: chord.extras };
}

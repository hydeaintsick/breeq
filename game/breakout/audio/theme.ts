/**
 * The theme player: loops a `ThemeScore` under a surface — the story map and
 * episode sheet, the Earn store, a paid run. The music itself lives in
 * `themes/`: "Lanterns" and "Horizon" for the story, "Arcade" for the store,
 * "Pursuit" for runs.
 *
 * The player owns time and plumbing: a look-ahead scheduler that survives
 * throttled hidden tabs, one fade for the whole theme, ducking, and teardown.
 * Harmony always moves, even silently, so a return lands on the right chord;
 * notes are only struck while audible and on time.
 *
 * Procedural, seeded, no samples. One instance per score (`acquireTheme`):
 * route changes inside a mode hand the same loop over without a restart.
 * Themes stack — the one acquired last is the one heard, the others hold
 * their harmony underneath in silence and come back when it leaves. That is
 * how a run's music takes over from the store and hands back on the clear
 * screen without either surface knowing about the other.
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

class ThemePlayer {
  readonly score: ThemeScore;
  private readonly steps: readonly Step[];
  private layer: Layer | null = null;
  private graph: Graph | null = null;
  private timer = 0;
  private loopStart = -1;
  private cursor = 0;
  private lap = 0;
  /** The holder's wish: false during a run under it or a hidden tab. */
  private active = true;
  /** The stack's verdict: false while a theme acquired later is sounding. */
  private top = true;
  private level = 0;
  private intensityLevel = 0;
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
      this.graph.voices.intensity?.(this.intensityLevel, layer.now);
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

  /** Set by the stack: only the theme on top is heard. */
  setTop(on: boolean): void {
    if (this.top === on) return;
    this.top = on;
    this.applyLevel(on ? FADE_IN : FADE_OUT);
  }

  /** 0..1, for scores that react to play. Remembered until the graph exists. */
  setIntensity(level: number): void {
    const clamped = Math.max(0, Math.min(1, level));
    if (Math.abs(clamped - this.intensityLevel) < 0.005) return;
    this.intensityLevel = clamped;
    const L = this.layer;
    if (L && this.graph) this.graph.voices.intensity?.(clamped, L.now);
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
    const target = this.active && this.top ? this.level : 0;
    const t = L.now;
    for (const duck of g.ducks) duck.gain.setTargetAtTime(target, t, tc);
  }

  private get audible(): boolean {
    return this.active && this.top && this.level > 0;
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

export interface ThemeHandle {
  /** Call from gestures too: a context created before any gesture resumes here. */
  start(): void;
  /** Duck for a run or a hidden tab; the harmony keeps moving underneath. */
  setActive(on: boolean): void;
  /** 0..1 tension, for scores that listen (`ThemeGraph.intensity`). */
  setIntensity(level: number): void;
  release(): void;
}

/** @deprecated Kept for the story surfaces; the same thing as `ThemeHandle`. */
export type StoryThemeHandle = ThemeHandle;

/** What the theme is playing now, for other layers to tune to. */
export interface StoryThemeChord {
  /** MIDI pitch class of the key's root (D). */
  root: number;
  /** Semitones above the root that are in the chord, the triad. */
  triad: readonly [number, number, number];
  /** Semitones above the root that sit safely on top of it. */
  extras: readonly number[];
}

interface Slot {
  player: ThemePlayer;
  holders: number;
  disposeTimer: number;
}

/** Live players by score id. */
const slots = new Map<string, Slot>();
/** Acquisition order; the last entry is the theme that sounds. */
const stack: Slot[] = [];

function restack(): void {
  const top = stack[stack.length - 1] ?? null;
  for (const slot of stack) slot.player.setTop(slot === top);
}

function lift(slot: Slot): void {
  const i = stack.indexOf(slot);
  if (i >= 0) stack.splice(i, 1);
  stack.push(slot);
  restack();
}

function drop(slot: Slot): void {
  const i = stack.indexOf(slot);
  if (i >= 0) stack.splice(i, 1);
  restack();
}

/**
 * Hold a theme while a surface is mounted. Holders of the same score overlap
 * during route changes, so the loop carries across them; it fades out and is
 * torn down only once the last one has left. Acquiring a different score
 * puts it on top: it sounds, the others wait underneath.
 */
export function acquireTheme(score: ThemeScore): ThemeHandle {
  let slot = slots.get(score.id);
  if (!slot) {
    slot = { player: new ThemePlayer(score), holders: 0, disposeTimer: 0 };
    slots.set(score.id, slot);
  }
  const current = slot;
  current.holders += 1;
  window.clearTimeout(current.disposeTimer);
  lift(current);
  current.player.fadeIn();
  current.player.start();
  let released = false;
  return {
    start: () => current.player.start(),
    setActive: (on) => current.player.setActive(on),
    setIntensity: (level) => current.player.setIntensity(level),
    release: () => {
      if (released) return;
      released = true;
      current.holders = Math.max(0, current.holders - 1);
      if (current.holders > 0) return;
      current.player.fadeOut();
      // Leave the stack now so the theme underneath comes back at once.
      drop(current);
      current.disposeTimer = window.setTimeout(() => {
        if (current.holders > 0 || slots.get(score.id) !== current) return;
        current.player.dispose();
        slots.delete(score.id);
      }, DISPOSE_MS);
    },
  };
}

/** The story theme (the player's default, or the local override). */
export function acquireStoryTheme(): ThemeHandle {
  return acquireTheme(activeTheme());
}

/**
 * The chord sounding right now — from the theme on top of the stack, or the
 * first chord of the story theme when nothing runs, so a layer tuned to it is
 * always in a key.
 */
export function storyThemeChord(): StoryThemeChord {
  const top = stack[stack.length - 1]?.player ?? null;
  const score = top ? top.score : activeTheme();
  const chord = top ? top.chord() : score.chords[0];
  return { root: score.root, triad: chord.triad, extras: chord.extras };
}

/**
 * The Story Journey — Kal's route home as a map.
 *
 * Pure data: the nodes (one per episode, the tutorial ahead of them when it is
 * on), their state, and where each sits along a route that undulates through
 * a row of zones. Layout is in CSS pixels for a given viewport; the camera is a
 * fractional node index so it survives a resize. Everything is seeded: the same
 * journey looks the same on every device.
 */
import { createRng } from "../shared/random";

/** The neon a zone is lit with. `steel` is the neutral tutorial zone. */
export type JourneyHue = "blue" | "violet" | "pink" | "cyan" | "lime" | "amber" | "steel";

export type JourneyNodeState =
  /** Not reachable yet: shrouded in debris. */
  | "locked"
  /** Reachable and not finished: the one Kal stands on. */
  | "current"
  /** Reachable, not finished, but not the frontier (a replayable tutorial ahead of the story). */
  | "open"
  /** Every wall down. */
  | "cleared";

export interface JourneyNodeInput {
  id: string;
  /** "01", "02", … or "00" for the tutorial. */
  kicker: string;
  title: string;
  state: JourneyNodeState;
  /** Best stars, 0..3, averaged over the episode's walls. */
  stars: number;
  /** Cleared walls over total, 0..1. */
  progress: number;
  /** A small square photo for the medallion, or null for a plain glass disc. */
  cover: string | null;
  hue: JourneyHue;
}

export interface JourneyNode extends JourneyNodeInput {
  index: number;
  /** Route position in CSS px, relative to the first node. */
  x: number;
  /** Vertical offset from the route's midline, CSS px. */
  y: number;
}

export interface JourneyLayout {
  nodes: JourneyNode[];
  /** Distance between two nodes, CSS px. */
  spacing: number;
  /** Node radius, CSS px. */
  radius: number;
  /** The route's midline as a fraction of the stage height. */
  midline: number;
}

/** Slug → hue, from the lore: cold, home sky, dark nest, reef, embers, the eye, a new sun. */
const HUE_BY_SLUG: Record<string, JourneyHue> = {
  tutorial: "steel",
  "gecko-legacy": "blue",
  "cold-orbit": "cyan",
  "glass-sky": "blue",
  "empty-nest": "violet",
  "lumen-reef": "lime",
  "ashen-court": "amber",
  "the-hush": "pink",
  "second-sun": "amber",
};
const HUE_CYCLE: readonly JourneyHue[] = ["blue", "cyan", "violet", "lime", "amber", "pink"];

export function hueForEpisode(slug: string, index: number): JourneyHue {
  return HUE_BY_SLUG[slug] ?? HUE_CYCLE[index % HUE_CYCLE.length];
}

/** How far apart the nodes sit for a stage this wide: most of a phone, less of a desktop. */
export function spacingFor(stageWidth: number): number {
  return Math.round(Math.max(250, Math.min(400, stageWidth * 0.66)));
}

/**
 * Where each node sits. The route swings up and down on a seeded, smooth curve
 * so the way home reads as a path through space rather than a ruler.
 */
export function layoutJourney(
  inputs: readonly JourneyNodeInput[],
  stage: { width: number; height: number },
): JourneyLayout {
  const spacing = spacingFor(stage.width);
  const radius = Math.round(Math.max(30, Math.min(46, spacing * 0.14)));
  const amplitude = Math.max(28, Math.min(96, stage.height * 0.09));
  const rng = createRng(0x0a11);
  // Three incommensurate waves with seeded phases: smooth, never repeating in 9 nodes.
  const waves = [0, 1, 2].map((k) => ({
    freq: [0.9, 1.7, 2.6][k],
    phase: rng.range(0, Math.PI * 2),
    amp: [0.6, 0.3, 0.14][k],
  }));
  const wave = (i: number) => {
    let y = 0;
    for (const w of waves) y += Math.sin(i * w.freq + w.phase) * w.amp;
    return y;
  };

  const nodes = inputs.map((input, index) => ({
    ...input,
    index,
    x: index * spacing,
    y: Math.round(wave(index) * amplitude),
  }));

  return { nodes, spacing, radius, midline: 0.46 };
}

/** The node the camera should open on: the frontier, else the last one. */
export function frontierIndex(nodes: readonly Pick<JourneyNodeInput, "state">[]): number {
  const current = nodes.findIndex((node) => node.state === "current");
  if (current >= 0) return current;
  const open = nodes.findIndex((node) => node.state === "open");
  if (open >= 0) return open;
  return Math.max(0, nodes.length - 1);
}

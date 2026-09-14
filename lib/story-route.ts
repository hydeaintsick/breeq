import { hueForEpisode, type JourneyHue, type JourneyNodeState } from "@/game/journey/model";
import { episodeIsComplete, episodeIsLocked, episodeProgress, type StoryEpisodeCard } from "@/lib/story";

/** One zone of the route as the galaxy needs it: number, name, state, hue. */
export interface RouteZone {
  slug: string;
  kicker: string;
  title: string;
  state: JourneyNodeState;
  hue: JourneyHue;
}

/** Where the player stands on the route, for the Story card. */
export interface RouteStand {
  zones: RouteZone[];
  /** The zone Kal is on (the frontier), or the last one once the road is walked. */
  current: { index: number; kicker: string; title: string; cleared: number; total: number } | null;
  /** Whether any wall has come down yet. */
  started: boolean;
}

/**
 * The route as zones, the tutorial ahead of the episodes when it is on. Same
 * rules as the Story Journey: locked until the previous episode is complete,
 * `current` on the frontier, `open` for a finished tutorial ahead of it.
 */
export function routeStand(
  episodes: readonly StoryEpisodeCard[],
  tutorial: { done: boolean } | null,
): RouteStand {
  const zones: RouteZone[] = [];
  const gate = tutorial !== null && !tutorial.done;
  if (tutorial) {
    zones.push({
      slug: "tutorial",
      kicker: "00",
      title: "How to Play",
      state: tutorial.done ? "cleared" : "current",
      hue: "steel",
    });
  }
  let frontier = gate;
  let current: RouteStand["current"] = null;
  let started = false;
  episodes.forEach((episode, index) => {
    const locked = gate || episodeIsLocked(episodes, index);
    const progress = episodeProgress(episode);
    if (progress.cleared > 0) started = true;
    const state: JourneyNodeState = locked
      ? "locked"
      : episodeIsComplete(episode)
        ? "cleared"
        : frontier
          ? "open"
          : "current";
    if (state === "current") {
      frontier = true;
      current = {
        index: zones.length,
        kicker: String(index + 1).padStart(2, "0"),
        title: episode.title,
        cleared: progress.cleared,
        total: progress.total,
      };
    }
    zones.push({
      slug: episode.slug,
      kicker: String(index + 1).padStart(2, "0"),
      title: episode.title,
      state,
      hue: hueForEpisode(episode.slug, index),
    });
  });
  if (!current && episodes.length > 0) {
    const index = episodes.length - 1;
    const last = episodes[index];
    const progress = episodeProgress(last);
    current = {
      index: zones.length - 1,
      kicker: String(index + 1).padStart(2, "0"),
      title: last.title,
      cleared: progress.cleared,
      total: progress.total,
    };
  }
  return { zones, current, started };
}

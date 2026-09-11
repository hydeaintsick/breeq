import type { Level } from "../../engine/types";

export interface StoryChapterDef {
  /** Stable slug inside the episode; the seed upserts by it. */
  slug: string;
  title: string;
  /** One line of the story, shown in the README and kept with the level. */
  intro: string;
  xp: number;
  level: Level;
}

export interface StoryEpisodeDef {
  /** Stable slug; the seed upserts by it. */
  slug: string;
  title: string;
  /** Position on the shelf. Gecko Legacy, the hand-made first episode, is 1. */
  order: number;
  tagline: string;
  /** Same-origin photo behind every wall of the episode (`/backgrounds/...`). */
  background: string;
  chapters: StoryChapterDef[];
}

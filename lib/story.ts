import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { storyPercent } from "@/lib/progress";
import { clampStar, starFill, STARS_PER_CLEAR, type StarCount } from "@/game/breakout/engine/stars";

export type StoryChapterCard = {
  id: string;
  title: string;
  /** One or two sentences of story, shown on the card and before the run. */
  intro: string | null;
  xpReward: number;
  cleared: boolean;
  /** Best star grade, 0 until the wall is cleared. */
  stars: 0 | StarCount;
  level: unknown;
};

export type StoryEpisodeCard = {
  id: string;
  slug: string;
  title: string;
  /** One line of story under the title. */
  tagline: string | null;
  backgroundUrl: string | null;
  chapterCount: number;
  previewLevel: unknown | null;
  chapters: StoryChapterCard[];
};

export type StoryShelf = {
  episodes: StoryEpisodeCard[];
  storyPercent: number;
};

export function episodeIsComplete(episode: StoryEpisodeCard) {
  return episode.chapterCount > 0 && episode.chapters.every((chapter) => chapter.cleared);
}

/** Cleared walls in this episode only — never the whole campaign. */
export function episodeProgress(episode: Pick<StoryEpisodeCard, "chapters">) {
  const total = episode.chapters.length;
  const cleared = episode.chapters.filter((chapter) => chapter.cleared).length;
  const starEarned = episode.chapters.reduce((sum, chapter) => sum + chapter.stars, 0);
  const starPossible = total * STARS_PER_CLEAR;
  return {
    cleared,
    total,
    percent: storyPercent(cleared, total),
    starEarned,
    starPossible,
    starValue: starFill(starEarned, starPossible),
  };
}

export function episodeIsLocked(episodes: readonly StoryEpisodeCard[], index: number) {
  const episode = episodes[index];
  if (!episode || episode.chapterCount === 0) {
    return true;
  }
  return episodes.slice(0, index).some((previous) => !episodeIsComplete(previous));
}

export function episodeLockHint(episodes: readonly StoryEpisodeCard[], index: number) {
  const episode = episodes[index];
  if (!episode || episode.chapterCount === 0) {
    return "No chapters yet.";
  }
  if (episodeIsLocked(episodes, index)) {
    return "Clear the previous episode first.";
  }
  return null;
}

/** Playable once every earlier chapter in the episode is cleared. Replays stay open. */
export function chapterIsLocked(
  chapters: readonly Pick<StoryChapterCard, "cleared">[],
  index: number,
) {
  if (!chapters[index]) {
    return true;
  }
  return chapters.slice(0, index).some((previous) => !previous.cleared);
}

export function chapterLockHint(
  chapters: readonly Pick<StoryChapterCard, "cleared">[],
  index: number,
) {
  if (chapterIsLocked(chapters, index)) {
    return "Clear the previous chapter first.";
  }
  return null;
}

/** First playable uncleared wall, or the last chapter once the episode is done. */
export function continueChapterIndex(chapters: readonly Pick<StoryChapterCard, "cleared">[]) {
  const playable = chapters.findIndex(
    (chapter, index) => !chapterIsLocked(chapters, index) && !chapter.cleared,
  );
  if (playable >= 0) {
    return playable;
  }
  return Math.max(0, chapters.length - 1);
}

const ORDER = [{ order: "asc" as const }, { createdAt: "asc" as const }];

/**
 * Episode photos by slug, for public surfaces (the home page's lore deck).
 * The admin picks these; the marketing page must never fall over because the
 * database is away, so an unreachable database reads as "no photos".
 */
export const getEpisodeCovers = cache(async function getEpisodeCovers(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.episode.findMany({ select: { slug: true, backgroundUrl: true } });
    const covers: Record<string, string> = {};
    for (const row of rows) {
      if (row.backgroundUrl) {
        covers[row.slug] = row.backgroundUrl;
      }
    }
    return covers;
  } catch {
    return {};
  }
});

export const getStoryShelf = cache(async function getStoryShelf(userId: string): Promise<StoryShelf> {
  const [episodes, clears] = await Promise.all([
    prisma.episode.findMany({
      orderBy: ORDER,
      include: {
        chapters: {
          orderBy: ORDER,
          select: { id: true, title: true, intro: true, xpReward: true, level: true },
        },
      },
    }),
    prisma.chapterClear.findMany({
      where: { userId },
      select: { chapterId: true, stars: true },
    }),
  ]);

  const best = new Map(clears.map((row) => [row.chapterId, row.stars] as const));
  const cards: StoryEpisodeCard[] = episodes.map((episode) => ({
    id: episode.id,
    slug: episode.slug,
    title: episode.title,
    tagline: episode.tagline ?? null,
    backgroundUrl: episode.backgroundUrl,
    chapterCount: episode.chapters.length,
    previewLevel: episode.chapters[0]?.level ?? null,
    chapters: episode.chapters.map((chapter) => {
      const stored = best.get(chapter.id);
      return {
        id: chapter.id,
        title: chapter.title,
        intro: chapter.intro ?? null,
        xpReward: chapter.xpReward ?? 100,
        cleared: stored !== undefined,
        stars: stored !== undefined ? clampStar(stored) : 0,
        level: chapter.level,
      };
    }),
  }));

  const total = cards.reduce((sum, episode) => sum + episode.chapters.length, 0);
  const clearedCount = cards.reduce(
    (sum, episode) => sum + episode.chapters.filter((chapter) => chapter.cleared).length,
    0,
  );

  return { episodes: cards, storyPercent: storyPercent(clearedCount, total) };
});

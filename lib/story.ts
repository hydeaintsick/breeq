import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { storyPercent } from "@/lib/progress";

export type StoryChapterCard = {
  id: string;
  title: string;
  xpReward: number;
  cleared: boolean;
  level: unknown;
};

export type StoryEpisodeCard = {
  id: string;
  slug: string;
  title: string;
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

const ORDER = [{ order: "asc" as const }, { createdAt: "asc" as const }];

export const getStoryShelf = cache(async function getStoryShelf(userId: string): Promise<StoryShelf> {
  const [episodes, clears] = await Promise.all([
    prisma.episode.findMany({
      orderBy: ORDER,
      include: {
        chapters: {
          orderBy: ORDER,
          select: { id: true, title: true, xpReward: true, level: true },
        },
      },
    }),
    prisma.chapterClear.findMany({
      where: { userId },
      select: { chapterId: true },
    }),
  ]);

  const cleared = new Set(clears.map((row) => row.chapterId));
  const cards: StoryEpisodeCard[] = episodes.map((episode) => ({
    id: episode.id,
    slug: episode.slug,
    title: episode.title,
    backgroundUrl: episode.backgroundUrl,
    chapterCount: episode.chapters.length,
    previewLevel: episode.chapters[0]?.level ?? null,
    chapters: episode.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      xpReward: chapter.xpReward ?? 100,
      cleared: cleared.has(chapter.id),
      level: chapter.level,
    })),
  }));

  const total = cards.reduce((sum, episode) => sum + episode.chapters.length, 0);
  const clearedCount = cards.reduce(
    (sum, episode) => sum + episode.chapters.filter((chapter) => chapter.cleared).length,
    0,
  );

  return { episodes: cards, storyPercent: storyPercent(clearedCount, total) };
});

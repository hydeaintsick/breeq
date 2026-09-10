import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type StoryEpisodeCard = {
  id: string;
  slug: string;
  title: string;
  chapterCount: number;
  previewLevel: unknown | null;
};

const ORDER = [{ order: "asc" as const }, { createdAt: "asc" as const }];

export const listStoryEpisodes = cache(async function listStoryEpisodes(): Promise<StoryEpisodeCard[]> {
  const episodes = await prisma.episode.findMany({
    orderBy: ORDER,
    include: {
      _count: { select: { chapters: true } },
      chapters: {
        orderBy: ORDER,
        take: 1,
        select: { level: true },
      },
    },
  });

  return episodes.map((episode) => ({
    id: episode.id,
    slug: episode.slug,
    title: episode.title,
    chapterCount: episode._count.chapters,
    previewLevel: episode.chapters[0]?.level ?? null,
  }));
});

export const getStoryEpisode = cache(async function getStoryEpisode(slug: string) {
  return prisma.episode.findUnique({
    where: { slug },
    include: {
      chapters: {
        orderBy: ORDER,
        select: { id: true, title: true, level: true },
      },
    },
  });
});

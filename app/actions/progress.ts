"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { progressFromXp, storyPercent, XP_PER_STORY_CLEAR, type Progress } from "@/lib/progress";

/** What the clear screen animates: XP before → after, and the campaign bar. */
export type ChapterClearResult = {
  /** True the first time this player clears the chapter (the only time XP is paid). */
  firstClear: boolean;
  /** XP paid out for this clear. 0 on a replay. */
  xpGained: number;
  /** Player progress before this clear. Equal to `progress` on a replay. */
  before: Progress;
  /** Player progress after this clear. */
  progress: Progress;
  storyPercent: number;
};

async function campaignPercent(userId: string) {
  const [cleared, total] = await Promise.all([
    prisma.chapterClear.count({ where: { userId } }),
    prisma.chapter.count(),
  ]);
  return storyPercent(cleared, total);
}

async function replayResult(userId: string): Promise<ChapterClearResult> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true },
  });
  const progress = progressFromXp(row?.xp ?? 0);
  return {
    firstClear: false,
    xpGained: 0,
    before: progress,
    progress,
    storyPercent: await campaignPercent(userId),
  };
}

export async function awardChapterClear(
  chapterId: string,
): Promise<ChapterClearResult | { error: "Chapter not found." | "Chapter locked." }> {
  const user = await requireUser();
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, xpReward: true, episodeId: true },
  });

  if (!chapter) {
    return { error: "Chapter not found." as const };
  }

  const existing = await prisma.chapterClear.findUnique({
    where: { userId_chapterId: { userId: user.id, chapterId } },
    select: { id: true },
  });

  if (existing) {
    return replayResult(user.id);
  }

  const siblings = await prisma.chapter.findMany({
    where: { episodeId: chapter.episodeId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const index = siblings.findIndex((row) => row.id === chapter.id);
  const previousIds = siblings.slice(0, Math.max(0, index)).map((row) => row.id);
  if (previousIds.length > 0) {
    const clearedPrev = await prisma.chapterClear.count({
      where: { userId: user.id, chapterId: { in: previousIds } },
    });
    if (clearedPrev < previousIds.length) {
      return { error: "Chapter locked." as const };
    }
  }

  const xpGained = chapter.xpReward || XP_PER_STORY_CLEAR;

  try {
    const [, updated] = await prisma.$transaction([
      prisma.chapterClear.create({
        data: { userId: user.id, chapterId },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { xp: { increment: xpGained } },
        select: { xp: true },
      }),
    ]);

    return {
      firstClear: true,
      xpGained,
      before: progressFromXp(updated.xp - xpGained),
      progress: progressFromXp(updated.xp),
      storyPercent: await campaignPercent(user.id),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return replayResult(user.id);
    }
    throw error;
  }
}

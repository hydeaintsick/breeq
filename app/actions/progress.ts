"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { GAME_ROOT_PATH } from "@/lib/auth/paths";
import { campaignPercent } from "@/lib/campaign";
import { parseStoredLevel, starsForClear, clampStar, type StarCount } from "@/game/breakout/engine";
import { progressFromXp, xpAfter, XP_PER_STORY_CLEAR, type Progress } from "@/lib/progress";

export type ClearRunInput = {
  score: number;
  paddleHits: number;
  livesLeft: number;
};

/** What the clear screen animates: XP before → after, the grade, and the campaign bar. */
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
  /** Stars this run earned. Omitted for the tutorial. */
  stars?: StarCount;
  /** Best stars on this wall after applying the run. */
  bestStars?: StarCount;
  /** True when this run raised the stored grade. */
  improved?: boolean;
};

function clampInt(value: unknown, lo: number, hi: number, fallback: number) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

function gradeChapter(
  storedLevel: unknown,
  chapterId: string,
  run: ClearRunInput,
): { stars: StarCount; hits: number; score: number } {
  const hits = clampInt(run.paddleHits, 0, 9_999, 0);
  const score = clampInt(run.score, 0, 1_000_000, 0);
  const livesLeft = clampInt(run.livesLeft, 0, 5, 0);
  const level = parseStoredLevel(storedLevel, {
    id: chapterId,
    name: "Chapter",
    author: "Breeq",
  });
  return { stars: starsForClear(level, { paddleHits: hits, livesLeft }), hits, score };
}

async function paidResult(
  userId: string,
  stars: StarCount,
  bestStars: StarCount,
  improved: boolean,
  xp?: { before: number; after: number; gained: number },
): Promise<ChapterClearResult> {
  const row = xp
    ? null
    : await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });
  const beforeXp = xp?.before ?? row?.xp ?? 0;
  const afterXp = xp?.after ?? beforeXp;
  const progress = progressFromXp(afterXp);
  const before = xp ? progressFromXp(xp.before) : progress;
  return {
    firstClear: Boolean(xp && xp.gained > 0),
    xpGained: xp?.gained ?? 0,
    before,
    progress,
    storyPercent: await campaignPercent(userId),
    stars,
    bestStars,
    improved,
  };
}

export async function awardChapterClear(
  chapterId: string,
  run: ClearRunInput,
): Promise<ChapterClearResult | { error: "Chapter not found." | "Chapter locked." }> {
  const user = await requireUser();
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, xpReward: true, episodeId: true, level: true },
  });

  if (!chapter) {
    return { error: "Chapter not found." as const };
  }

  const grade = gradeChapter(chapter.level, chapter.id, run);

  const existing = await prisma.chapterClear.findUnique({
    where: { userId_chapterId: { userId: user.id, chapterId } },
    select: { id: true, stars: true, hits: true, score: true },
  });

  if (existing) {
    const bestStars = clampStar(Math.max(existing.stars, grade.stars));
    const improved = grade.stars > existing.stars;
    const betterHits =
      grade.stars >= existing.stars && (existing.hits === 0 || grade.hits < existing.hits);
    if (improved || betterHits) {
      await prisma.chapterClear.update({
        where: { id: existing.id },
        data: { stars: bestStars, hits: grade.hits, score: grade.score },
      });
      if (improved) {
        revalidatePath(GAME_ROOT_PATH, "layout");
      }
    }
    return paidResult(user.id, grade.stars, bestStars, improved);
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
  const balance = await prisma.user.findUnique({
    where: { id: user.id },
    select: { xp: true },
  });
  const xpBefore = balance?.xp ?? 0;

  try {
    const [, updated] = await prisma.$transaction([
      prisma.chapterClear.create({
        data: {
          userId: user.id,
          chapterId,
          stars: grade.stars,
          hits: grade.hits,
          score: grade.score,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { xp: xpAfter(xpBefore, xpGained) },
        select: { xp: true },
      }),
    ]);

    revalidatePath(GAME_ROOT_PATH, "layout");

    return paidResult(user.id, grade.stars, grade.stars, true, {
      before: xpBefore,
      after: updated.xp,
      gained: xpGained,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const row = await prisma.chapterClear.findUnique({
        where: { userId_chapterId: { userId: user.id, chapterId } },
        select: { stars: true },
      });
      const bestStars = clampStar(Math.max(row?.stars ?? 1, grade.stars));
      return paidResult(user.id, grade.stars, bestStars, grade.stars > (row?.stars ?? 0));
    }
    throw error;
  }
}

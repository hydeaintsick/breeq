"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { progressFromXp, storyPercent, XP_PER_STORY_CLEAR } from "@/lib/progress";

async function campaignPercent(userId: string) {
  const [cleared, total] = await Promise.all([
    prisma.chapterClear.count({ where: { userId } }),
    prisma.chapter.count(),
  ]);
  return storyPercent(cleared, total);
}

export async function awardChapterClear(chapterId: string) {
  const user = await requireUser();
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true },
  });

  if (!chapter) {
    return { error: "Chapter not found." as const };
  }

  const existing = await prisma.chapterClear.findUnique({
    where: { userId_chapterId: { userId: user.id, chapterId } },
    select: { id: true },
  });

  if (existing) {
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true },
    });
    return {
      firstClear: false,
      progress: progressFromXp(row?.xp ?? 0),
      storyPercent: await campaignPercent(user.id),
    };
  }

  try {
    const [, updated] = await prisma.$transaction([
      prisma.chapterClear.create({
        data: { userId: user.id, chapterId },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { xp: { increment: XP_PER_STORY_CLEAR } },
        select: { xp: true },
      }),
    ]);

    return {
      firstClear: true,
      progress: progressFromXp(updated.xp),
      storyPercent: await campaignPercent(user.id),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const row = await prisma.user.findUnique({
        where: { id: user.id },
        select: { xp: true },
      });
      return {
        firstClear: false,
        progress: progressFromXp(row?.xp ?? 0),
        storyPercent: await campaignPercent(user.id),
      };
    }
    throw error;
  }
}

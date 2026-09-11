import { prisma } from "@/lib/prisma";
import { storyPercent } from "@/lib/progress";

/** Cleared Story walls over the whole campaign, as a 0–100 percent. */
export async function campaignPercent(userId: string) {
  const [cleared, total] = await Promise.all([
    prisma.chapterClear.count({ where: { userId } }),
    prisma.chapter.count(),
  ]);
  return storyPercent(cleared, total);
}

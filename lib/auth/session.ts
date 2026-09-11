import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  GAME_MENU_PATH,
  LOGIN_PATH,
} from "@/lib/auth/paths";
import { canPlayEarn, progressFromXp, starTally, type StarTally } from "@/lib/progress";
import { getSiteSettings } from "@/lib/tutorial";

export const getSession = cache(async () => auth());

export async function requireUser() {
  const session = await getSession();

  if (!session?.user) {
    redirect(LOGIN_PATH);
  }

  return session.user;
}

export const requireProgress = cache(async () => {
  const user = await requireUser();
  const [row, starSum, chapterCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true },
    }),
    prisma.chapterClear.aggregate({
      where: { userId: user.id },
      _sum: { stars: true },
    }),
    prisma.chapter.count(),
  ]);
  const progress = progressFromXp(row?.xp ?? 0);
  const stars: StarTally = starTally(starSum._sum.stars ?? 0, chapterCount);
  return { user, progress, stars };
});

export async function requireAdmin() {
  const { user } = await requireProgress();

  if (user.role !== "ADMIN") {
    redirect(GAME_MENU_PATH);
  }

  return user;
}

export async function requireEarn() {
  const [{ user, progress }, settings] = await Promise.all([
    requireProgress(),
    getSiteSettings(),
  ]);

  if (!canPlayEarn(user.role, progress.level, settings.earnEnabled)) {
    redirect(GAME_MENU_PATH);
  }

  return { user, progress };
}

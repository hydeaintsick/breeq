import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  GAME_MENU_PATH,
  LOGIN_PATH,
} from "@/lib/auth/paths";
import { canPlayEarn, progressFromXp } from "@/lib/progress";

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
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { xp: true },
  });
  const progress = progressFromXp(row?.xp ?? 0);
  return { user, progress };
});

export async function requireAdmin() {
  const { user } = await requireProgress();

  if (user.role !== "ADMIN") {
    redirect(GAME_MENU_PATH);
  }

  return user;
}

export async function requireEarn() {
  const { user, progress } = await requireProgress();

  if (!canPlayEarn(user.role, progress.level)) {
    redirect(GAME_MENU_PATH);
  }

  return { user, progress };
}

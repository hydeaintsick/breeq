"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { ADMIN_DASHBOARD_PATH, GAME_ROOT_PATH } from "@/lib/auth/paths";
import { campaignPercent } from "@/lib/campaign";
import { progressFromXp, XP_TUTORIAL_CLEAR } from "@/lib/progress";
import { SITE_SETTINGS_ID } from "@/lib/tutorial";
import type { ChapterClearResult } from "@/app/actions/progress";

/**
 * The player cleared the how-to-play wall. The first time pays a little XP
 * and opens the story; replays keep the original date and pay nothing.
 */
export async function completeTutorial(): Promise<ChapterClearResult> {
  const user = await requireUser();
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { xp: true, tutorialDoneAt: true },
  });
  const xpBefore = row?.xp ?? 0;

  // Players from before the field existed have it unset, not null, so a
  // `tutorialDoneAt: null` filter would skip them: read, then decide.
  if (row?.tutorialDoneAt) {
    const progress = progressFromXp(xpBefore);
    return {
      firstClear: false,
      xpGained: 0,
      before: progress,
      progress,
      storyPercent: await campaignPercent(user.id),
    };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { tutorialDoneAt: new Date(), xp: { increment: XP_TUTORIAL_CLEAR } },
    select: { xp: true },
  });

  // Story gate, menu copy, and the level meter in the game layout.
  revalidatePath(GAME_ROOT_PATH, "layout");

  return {
    firstClear: true,
    xpGained: XP_TUTORIAL_CLEAR,
    before: progressFromXp(updated.xp - XP_TUTORIAL_CLEAR),
    progress: progressFromXp(updated.xp),
    storyPercent: await campaignPercent(user.id),
  };
}

/** Admin: show or hide the tutorial for everyone. */
export async function setTutorialEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
  await requireAdmin();
  const row = await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, tutorialEnabled: enabled },
    update: { tutorialEnabled: enabled },
    select: { tutorialEnabled: true },
  });
  revalidatePath(ADMIN_DASHBOARD_PATH);
  revalidatePath(GAME_ROOT_PATH, "layout");
  return { enabled: row.tutorialEnabled };
}

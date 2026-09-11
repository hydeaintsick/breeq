"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { ADMIN_DASHBOARD_PATH, GAME_MENU_PATH, STORY_PATH, TUTORIAL_PATH } from "@/lib/auth/paths";
import { SITE_SETTINGS_ID } from "@/lib/tutorial";

/** The player cleared the how-to-play wall. Idempotent: the first date stays. */
export async function completeTutorial(): Promise<{ done: true }> {
  const user = await requireUser();
  await prisma.user.updateMany({
    where: { id: user.id, tutorialDoneAt: null },
    data: { tutorialDoneAt: new Date() },
  });
  revalidatePath(STORY_PATH);
  revalidatePath(GAME_MENU_PATH);
  revalidatePath(TUTORIAL_PATH);
  return { done: true };
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
  revalidatePath(STORY_PATH);
  revalidatePath(GAME_MENU_PATH);
  revalidatePath(TUTORIAL_PATH);
  return { enabled: row.tutorialEnabled };
}

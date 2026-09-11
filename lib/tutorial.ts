import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const SITE_SETTINGS_ID = "site";

export type TutorialStatus = {
  /** An admin left the tutorial on for everyone. */
  enabled: boolean;
  /** This player finished it at least once. */
  done: boolean;
  /** Enabled and not done yet: the story waits for it. */
  required: boolean;
};

export const getSiteSettings = cache(async function getSiteSettings() {
  const row = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    select: { tutorialEnabled: true },
  });
  return { tutorialEnabled: row?.tutorialEnabled ?? true };
});

export const getTutorialStatus = cache(async function getTutorialStatus(userId: string): Promise<TutorialStatus> {
  const [settings, user] = await Promise.all([
    getSiteSettings(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { tutorialDoneAt: true },
    }),
  ]);
  const done = user?.tutorialDoneAt !== null && user?.tutorialDoneAt !== undefined;
  return {
    enabled: settings.tutorialEnabled,
    done,
    required: settings.tutorialEnabled && !done,
  };
});

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { REVIEW_EVERY_DEFAULT, REVIEW_GEMS_DEFAULT } from "@/lib/review";

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
    select: { tutorialEnabled: true, earnEnabled: true, energyEnabled: true, reviewEvery: true, reviewGems: true },
  });
  return {
    tutorialEnabled: row?.tutorialEnabled ?? true,
    earnEnabled: row?.earnEnabled ?? true,
    // Missing on a document written before the switch existed: energy stays on.
    energyEnabled: row?.energyEnabled ?? true,
    // Missing on a document written before the ask existed: every 3 clears, 50 gems.
    reviewEvery: row?.reviewEvery ?? REVIEW_EVERY_DEFAULT,
    reviewGems: row?.reviewGems ?? REVIEW_GEMS_DEFAULT,
  };
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

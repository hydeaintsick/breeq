"use client";

import { EarnCard } from "@/components/earn-card";
import { StoryCard } from "@/components/story-card";
import { STORY_PATH } from "@/lib/auth/paths";
import type { EarnTeaser } from "@/lib/earn";
import { EARN_UNLOCK_LEVEL } from "@/lib/progress";
import type { RouteStand } from "@/lib/story-route";

export function GameModePicker({
  stand,
  teaser,
  earnLocked,
  earnLockedHint = `Reach level ${EARN_UNLOCK_LEVEL} in Story to unlock.`,
  tutorialRequired = false,
}: {
  /** Where the player stands on Kal's route: the Story card's galaxy and its continue line. */
  stand: RouteStand;
  /** The Earn floor in numbers: walls, the biggest pot, what has been paid. */
  teaser: EarnTeaser;
  earnLocked: boolean;
  earnLockedHint?: string;
  /** The tutorial is on and this player has not finished it: Story opens on it. */
  tutorialRequired?: boolean;
}) {
  return (
    <div className="grid w-full justify-items-stretch gap-6 md:grid-cols-2 md:justify-items-start">
      <StoryCard href={STORY_PATH} stand={stand} tutorialRequired={tutorialRequired} />
      <EarnCard teaser={teaser} locked={earnLocked} lockedHint={earnLockedHint} />
    </div>
  );
}

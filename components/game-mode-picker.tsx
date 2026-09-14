"use client";

import { PlayCard } from "@/components/play-card";
import { StoryCard } from "@/components/story-card";
import { LOCKDOWN } from "@/game/breakout/levels";
import { EARN_PATH, STORY_PATH } from "@/lib/auth/paths";
import { EARN_UNLOCK_LEVEL } from "@/lib/progress";
import type { RouteStand } from "@/lib/story-route";

const EARN_LEVELS = [LOCKDOWN];

export function GameModePicker({
  stand,
  earnLocked,
  earnLockedHint = `Reach level ${EARN_UNLOCK_LEVEL} in Story to unlock.`,
  tutorialRequired = false,
}: {
  /** Where the player stands on Kal's route: the Story card's galaxy and its continue line. */
  stand: RouteStand;
  earnLocked: boolean;
  earnLockedHint?: string;
  /** The tutorial is on and this player has not finished it: Story opens on it. */
  tutorialRequired?: boolean;
}) {
  return (
    <div className="grid w-full justify-items-stretch gap-6 md:grid-cols-2 md:justify-items-start">
      <StoryCard href={STORY_PATH} stand={stand} tutorialRequired={tutorialRequired} />
      <PlayCard
        href={EARN_PATH}
        kicker="02"
        title="Earn"
        body="Publish or play levels to earn real money."
        action="Play Earn"
        levels={EARN_LEVELS}
        seed={23}
        locked={earnLocked}
        lockedHint={earnLockedHint}
      />
    </div>
  );
}

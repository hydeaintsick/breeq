"use client";

import { PlayCard } from "@/components/play-card";
import { LOCKDOWN, QUIET_START } from "@/game/breakout/levels";
import { EARN_PATH, STORY_PATH } from "@/lib/auth/paths";
import { EARN_UNLOCK_LEVEL } from "@/lib/progress";

const STORY_LEVELS = [QUIET_START];
const EARN_LEVELS = [LOCKDOWN];

export function GameModePicker({
  earnLocked,
  tutorialRequired = false,
}: {
  earnLocked: boolean;
  /** The tutorial is on and this player has not finished it: Story opens on it. */
  tutorialRequired?: boolean;
}) {
  return (
    <div className="grid w-full justify-items-stretch gap-6 md:grid-cols-2 md:justify-items-start">
      <PlayCard
        href={STORY_PATH}
        kicker="01"
        title="Story"
        body={tutorialRequired ? "Starts with a two-minute tutorial, then the campaign." : "The campaign. One wall, then the next."}
        action={tutorialRequired ? "Learn to play" : "Play Story"}
        levels={STORY_LEVELS}
        seed={11}
      />
      <PlayCard
        href={EARN_PATH}
        kicker="02"
        title="Earn"
        body="Publish or play levels to earn real money."
        action="Play Earn"
        levels={EARN_LEVELS}
        seed={23}
        locked={earnLocked}
        lockedHint={`Reach level ${EARN_UNLOCK_LEVEL} in Story to unlock.`}
      />
    </div>
  );
}

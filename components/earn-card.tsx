"use client";

import { EthGlyph } from "@/components/currency-glyphs";
import { PlayCard } from "@/components/play-card";
import { LOCKDOWN } from "@/game/breakout/levels";
import { EARN_PATH } from "@/lib/auth/paths";
import type { EarnTeaser } from "@/lib/earn";
import { formatEth } from "@/lib/economy";

const EARN_LEVELS = [LOCKDOWN];

/**
 * The Earn door on the game menu. Same bones as the Story card: the live
 * board is the picture, the copy is a title, one sentence and one quiet line.
 * The ETH mark sits in the title; the biggest pot on the floor is the line.
 */
export function EarnCard({ teaser, locked, lockedHint }: { teaser: EarnTeaser; locked: boolean; lockedHint?: string }) {
  const meta =
    teaser.topPotEth > 0
      ? `Top pot ${formatEth(teaser.topPotEth)}`
      : teaser.walls > 0
        ? `${teaser.walls} ${teaser.walls === 1 ? "wall" : "walls"} on sale`
        : undefined;

  return (
    <PlayCard
      href={EARN_PATH}
      kicker="02"
      title="Play to Earn"
      titleMark={<EthGlyph className="mode-card-title-mark" />}
      body="Break a wall built by a player. Pocket the pot."
      meta={meta}
      action="Play"
      levels={EARN_LEVELS}
      seed={23}
      locked={locked}
      lockedHint={lockedHint}
    />
  );
}

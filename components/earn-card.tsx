"use client";

import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { PlayCard } from "@/components/play-card";
import { LOCKDOWN } from "@/game/breakout/levels";
import { EARN_PATH } from "@/lib/auth/paths";
import type { EarnTeaser } from "@/lib/earn";
import { formatEth, formatGems } from "@/lib/economy";

const EARN_LEVELS = [LOCKDOWN];

/**
 * The Earn door on the game menu. The live board stays the picture; over it,
 * the biggest pot on the floor glows in a glass pill, and under the title the
 * deal is one line: a ticket in gems becomes a pot in ETH.
 */
export function EarnCard({ teaser, locked, lockedHint }: { teaser: EarnTeaser; locked: boolean; lockedHint?: string }) {
  const hasPot = teaser.topPotEth > 0;
  const paid = teaser.paidOutEth > 0;

  const badge = hasPot ? (
    <span className="earn-pot-pill" aria-label={`Biggest pot on the floor: ${formatEth(teaser.topPotEth)}`}>
      <span className="earn-pot-pill-label">Top pot</span>
      <span className="earn-pot-pill-n">
        <EthGlyph />
        {formatEth(teaser.topPotEth, { unit: false })}
        <small>ETH</small>
      </span>
    </span>
  ) : null;

  const detail = hasPot ? (
    <p className="earn-card-deal" aria-hidden="true">
      <span>
        <GemGlyph /> {formatGems(teaser.topTicketGems)}
      </span>
      <span className="earn-card-deal-arrow">→</span>
      <span className="earn-card-deal-win">
        <EthGlyph /> {formatEth(teaser.topPotEth, { unit: false })} ETH
      </span>
    </p>
  ) : null;

  const meta = paid
    ? `${formatEth(teaser.paidOutEth)} paid to players`
    : teaser.walls > 0
      ? `${teaser.walls} ${teaser.walls === 1 ? "wall" : "walls"} on sale`
      : undefined;

  return (
    <PlayCard
      href={EARN_PATH}
      kicker="02"
      title="Earn"
      body="Break a wall built by a player. Pocket the pot in ETH."
      meta={meta}
      action="Play for ETH"
      levels={EARN_LEVELS}
      seed={23}
      locked={locked}
      lockedHint={lockedHint}
      badge={badge}
      detail={detail}
    />
  );
}

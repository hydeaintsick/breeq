"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BreakoutPreview } from "@/components/breakout-preview";
import { GemGlyph } from "@/components/currency-glyphs";
import { applyBackgroundPhoto, parseStoredLevel } from "@/game/breakout/engine";
import type { EarnMapCard as Card } from "@/lib/earn";
import { formatCount, formatEth, formatGems } from "@/lib/economy";

/**
 * A map in the store: the live board is the card. The engine only mounts
 * while the card is near the viewport (one board costs a canvas, a renderer
 * and a game loop; a store has dozens), and the sky stays under it as a
 * static image so nothing flashes while it loads.
 */
export function EarnMapCard({
  card,
  featured = false,
  seed = 7,
  onPlay,
}: {
  card: Card;
  featured?: boolean;
  seed?: number;
  onPlay: (card: Card) => void;
}) {
  const rootRef = useRef<HTMLButtonElement>(null);
  // Without IntersectionObserver every card is "near"; with it, none is until seen.
  const [near, setNear] = useState(() => typeof window !== "undefined" && typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setNear(entry.isIntersecting);
      },
      { rootMargin: "240px 120px" },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const levels = useMemo(() => {
    // The store record names the map; the stored level is only the wall.
    const level = parseStoredLevel(card.level, { id: card.id, name: card.title, author: card.author });
    level.name = card.title;
    level.author = card.author;
    return [applyBackgroundPhoto(level, card.backgroundSrc)];
  }, [card.author, card.backgroundSrc, card.id, card.level, card.title]);

  const state = card.won ? "won" : card.mine ? "mine" : "open";
  const label =
    state === "won"
      ? `${card.title} by ${card.author}. Cleared and paid. Difficulty ${card.difficulty} of 100.`
      : state === "mine"
        ? `${card.title}, your map. ${formatCount(card.plays)} plays. Difficulty ${card.difficulty} of 100.`
        : `Play ${card.title} by ${card.author} for ${formatGems(card.ticketGems)} gems. Win ${formatEth(card.payoutEth)}. Difficulty ${card.difficulty} of 100, ${card.difficultyLabel}. ${formatCount(card.plays)} plays.`;

  return (
    <button
      ref={rootRef}
      type="button"
      className="earn-card"
      data-state={state}
      data-featured={featured}
      aria-label={label}
      onClick={() => onPlay(card)}
    >
      <div className="earn-card-sky" aria-hidden="true" style={{ backgroundImage: `url("${card.backgroundSrc}")` }} />
      {near ? (
        <div className="earn-card-board" aria-hidden="true">
          <BreakoutPreview
            levels={levels}
            seed={seed}
            followQuery={false}
            controls="auto"
            fill
            showHud={false}
            showCaption={false}
          />
        </div>
      ) : null}

      <div className="earn-card-top" aria-hidden="true">
        <span className="earn-pill" data-tier={card.tier}>
          <span className="earn-pill-dot" />
          {card.difficulty}
          <span className="opacity-70">· {card.difficultyLabel}</span>
        </span>
        <span className="earn-pill">
          <PlayGlyph />
          {formatCount(card.plays)}
        </span>
      </div>

      <div className="earn-card-copy" aria-hidden="true">
        {featured ? <p className="earn-kicker mb-1 text-white/70">Featured</p> : null}
        <p className="earn-card-title">{card.title}</p>
        <p className="earn-card-by">by {card.author}</p>
        <div className="earn-card-cta">
          {state === "won" ? (
            <span className="earn-card-play">Cleared · paid</span>
          ) : state === "mine" ? (
            <span className="earn-card-play">Your map</span>
          ) : (
            <span className="earn-card-play">
              <PlayGlyph />
              <GemGlyph />
              {formatGems(card.ticketGems)}
            </span>
          )}
          <span className="earn-card-win">
            <span>{formatEth(card.payoutEth)}</span>
            <small>{state === "won" ? "already won" : "on a clear"}</small>
          </span>
        </div>
      </div>
    </button>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d="M4.5 3.2v9.6L12.5 8z" fill="currentColor" />
    </svg>
  );
}

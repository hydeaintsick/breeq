"use client";

import { useEffect, useId, useRef, useState } from "react";
import { skipChapter, type ChapterSkipResult } from "@/app/actions/progress";
import { useBalances } from "@/components/balances-provider";
import { GemGlyph } from "@/components/currency-glyphs";
import { playSheetBack, playSheetBuy } from "@/game/breakout/audio";
import { formatGems } from "@/lib/economy";
import { SKIP_CHAPTER_GEMS } from "@/lib/progress";
import type { StoryChapterCard } from "@/lib/story";

/**
 * The action sheet before a paid skip: the price, the bag now and the bag
 * after, one confirm. Short on gems, it hands over to the shop and stays up
 * underneath, so the pack lands and the skip is one more tap.
 */
export function StorySkipSheet({
  chapter,
  index,
  onSkipped,
  onTopUp,
  onClose,
}: {
  chapter: StoryChapterCard;
  /** Zero-based position in the episode, for the "Chapter 07" line. */
  index: number;
  onSkipped: (result: ChapterSkipResult) => void;
  onTopUp: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const shared = useBalances();
  const gems = shared?.balances.gems ?? 0;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cost = SKIP_CHAPTER_GEMS;
  const after = gems - cost;
  const short = Math.max(0, -after);

  useEffect(() => {
    sheetRef.current?.focus({ preventScroll: true });
  }, []);

  async function confirm() {
    playSheetBuy();
    setBusy(true);
    setError(null);
    try {
      const result = await skipChapter(chapter.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSkipped(result);
    } catch {
      setError("Could not skip the chapter. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="earn-sheet story-skip-sheet" onClick={() => { playSheetBack(); onClose(); }}>
      <div
        ref={sheetRef}
        className="earn-sheet-body glass-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Skip chapter {String(index + 1).padStart(2, "0")}</p>
            <h2 id={titleId} className="mt-2 truncate text-2xl font-semibold tracking-tight text-ink">
              {chapter.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              The wall counts as cleared with one star and pays its {formatGems(chapter.xpReward)} XP. Replay it any time for the full grade.
            </p>
          </div>
          <button type="button" className="header-chip" aria-label="Close" onClick={() => { playSheetBack(); onClose(); }}>
            <CloseGlyph />
          </button>
        </div>

        <div className="mt-4">
          <div className="earn-sheet-row">
            <span>Skip costs</span>
            <strong className="inline-flex items-center gap-1.5">
              <GemGlyph />
              {formatGems(cost)}
            </strong>
          </div>
          <div className="earn-sheet-row">
            <span>Your gems</span>
            <strong className="inline-flex items-center gap-1.5">
              <GemGlyph />
              {formatGems(gems)}
            </strong>
          </div>
          <div className="earn-sheet-row" data-big="true" data-short={short > 0 ? "true" : undefined}>
            <span>{short > 0 ? "Still needed" : "Left in the bag"}</span>
            <strong className="inline-flex items-center gap-1.5">
              <GemGlyph />
              {formatGems(short > 0 ? short : after)}
            </strong>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <div className="mt-5 grid gap-3">
          {short > 0 ? (
            <>
              <p className="text-sm leading-6 text-ink-muted">
                You are {formatGems(short)} gems short. Fill the bag and the skip is one more tap.
              </p>
              <button type="button" className="btn-play min-h-11 w-full" onClick={() => { playSheetBuy(); onTopUp(); }}>
                Top up gems
              </button>
            </>
          ) : (
            <button type="button" className="btn-play min-h-11 w-full" disabled={busy} onClick={() => void confirm()}>
              {busy ? (
                "Skipping…"
              ) : (
                <span className="inline-flex items-center gap-2">
                  Skip for <GemGlyph /> {formatGems(cost)}
                </span>
              )}
            </button>
          )}
          <button type="button" className="btn-glass min-h-11 w-full" onClick={() => { playSheetBack(); onClose(); }}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

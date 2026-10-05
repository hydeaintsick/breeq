"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { GemGlyph } from "@/components/currency-glyphs";
import { CloseIcon } from "@/components/nav-icons";
import { StarRating } from "@/components/star-rating";
import { useSheetSwipe } from "@/components/use-sheet-swipe";
import { playSheetAppear } from "@/game/breakout/audio";
import { pulseUi } from "@/game/breakout/haptics";
import { formatGems } from "@/lib/economy";
import { PLAY_STORE_URL } from "@/lib/review";

export type ReviewPhase = "ask" | "thanks";

/**
 * Night glass over the story, in the Play Store's voice: five amber stars,
 * the gem reward on the one primary button, Not now under it, and a plain
 * line to close the ask forever.
 */
export function ReviewPromptSheet({
  phase,
  gems,
  pending,
  error,
  storeOpen,
  preview = false,
  onRate,
  onLater,
  onNever,
  onClose,
}: {
  phase: ReviewPhase;
  gems: number;
  pending: boolean;
  error: string | null;
  /** Thanks: the listing was handed to the Play app. */
  storeOpen: boolean;
  preview?: boolean;
  onRate: () => void;
  onLater: () => void;
  onNever: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const appeared = useRef(false);
  const thanks = phase === "thanks";

  useEffect(() => {
    if (appeared.current) return;
    appeared.current = true;
    playSheetAppear();
    pulseUi(6);
    sheetRef.current?.focus();
  }, []);

  function dismiss() {
    if (pending) return;
    if (thanks) onClose();
    else onLater();
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || pending) return;
      event.preventDefault();
      if (thanks) onClose();
      else onLater();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onLater, pending, thanks]);

  const swipe = useSheetSwipe(sheetRef, dismiss);
  const title = thanks ? `${formatGems(gems)} gems are in your bag` : "Enjoying Breeq?";
  const line = thanks
    ? preview
      ? "Preview. Nothing was saved, and Google Play stays closed."
      : storeOpen
        ? "Google Play is open. The gems are already yours."
        : "The gems are yours. Google Play did not open from here — the button below does."
    : `Five stars on Google Play, and ${formatGems(gems)} gems go in your bag.`;

  return createPortal(
    <div className="energy-sheet review-sheet" onClick={dismiss}>
      <div
        ref={sheetRef}
        className="energy-sheet-body"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={swipe.onPointerDown}
        onPointerMove={swipe.onPointerMove}
        onPointerUp={swipe.onPointerUp}
        onPointerCancel={swipe.onPointerCancel}
      >
        <div className="gem-shop-handle" aria-hidden="true" />
        <div className="energy-sheet-head">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Play Store</p>
            <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
          </div>
          <button type="button" className="header-chip energy-sheet-close" aria-label={thanks ? "Close" : "Not now"} onClick={dismiss}>
            <CloseIcon />
          </button>
        </div>

        <div className="review-stars">
          <StarRating value={5} count={5} tone="store" label="5 stars on Google Play" />
        </div>
        <p className="energy-sheet-copy mt-4">{line}</p>
        {preview && !thanks ? (
          <p className="energy-sheet-fine mt-3">Preview. Nothing is saved, and the store stays closed.</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {thanks ? (
          <div className="mt-6 grid gap-3">
            {!preview && !storeOpen ? (
              <a className="btn-glass story-clear-glass inline-flex min-h-11 w-full items-center justify-center" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                Open Google Play
              </a>
            ) : null}
            <button type="button" className="btn-play min-h-11 w-full" onClick={onClose}>
              Keep playing
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            <button
              type="button"
              className="btn-play review-rate w-full"
              disabled={pending}
              aria-label={pending ? "One moment" : `I give 5 stars, ${formatGems(gems)} free gems`}
              onClick={onRate}
            >
              <span className="review-rate-title">{pending ? "One moment…" : "I give 5 stars"}</span>
              <span className="review-rate-pay">
                <GemGlyph />+{formatGems(gems)} free
              </span>
            </button>
            <button type="button" className="btn-glass story-clear-glass min-h-11 w-full" disabled={pending} onClick={onLater}>
              Not now
            </button>
            <button type="button" className="review-never" disabled={pending} onClick={onNever}>
              Don&apos;t ask me again
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GemGlyph } from "@/components/currency-glyphs";
import { GemBag, type BagTier } from "@/components/gem-bag";
import { createPayoutSfx, type PayoutSfx } from "@/game/breakout/audio";
import { formatGems } from "@/lib/economy";

/** Milliseconds from mount. */
const T = {
  stamp: 320,
  count: 760,
  countDur: 1050,
  buttonsAfter: 260,
} as const;
const TICKS = 16;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * The pack has landed: the clear screen of a purchase. The bag drops in, the
 * "+N" stamps, then the bag's total counts up from what the player had to
 * what they have now — with the payout voice ticking under it — and locks.
 * `onCount` fires when the counter starts so the header pill rolls with it.
 * A tap anywhere skips to the end; reduced motion starts there. `onClose`
 * puts the player back where they were (the shop is a sheet over the page).
 */
export function PackLanded({
  gems,
  from,
  to,
  tier,
  viaStripe,
  onCount,
  onClose,
  onMore,
}: {
  gems: number;
  from: number;
  to: number;
  tier: BagTier;
  viaStripe: boolean;
  onCount: () => void;
  onClose: () => void;
  onMore: () => void;
}) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const [skipped, setSkipped] = useState(false);
  const [stageAnim, setStage] = useState<"drop" | "stamp" | "count" | "done">("drop");
  const [buttonsTimed, setButtons] = useState(false);
  const totalRef = useRef<HTMLSpanElement>(null);
  const sfxRef = useRef<PayoutSfx | null>(null);
  const counted = useRef(false);

  const skip = reduced || skipped;
  const stage = skip ? "done" : stageAnim;
  const buttons = skip || buttonsTimed;

  useEffect(() => {
    const sfx = createPayoutSfx();
    sfxRef.current = sfx;
    return () => {
      sfxRef.current = null;
      sfx.destroy();
    };
  }, []);

  // The sequence. Skipping paints the end and lets the header roll at once.
  useEffect(() => {
    const paint = (n: number) => {
      if (totalRef.current) totalRef.current.textContent = formatGems(n);
    };
    if (skip) {
      paint(to);
      if (!counted.current) {
        counted.current = true;
        onCount();
        sfxRef.current?.settle();
      }
      return;
    }
    paint(from);
    let raf = 0;
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        setStage("stamp");
        sfxRef.current?.stamp();
      }, T.stamp),
    );
    timers.push(
      window.setTimeout(() => {
        setStage("count");
        if (!counted.current) {
          counted.current = true;
          onCount();
        }
        const start = performance.now();
        let lastStep = 0;
        const frame = (now: number) => {
          const t = Math.min(1, (now - start) / T.countDur);
          const eased = easeOutCubic(t);
          paint(Math.round(from + (to - from) * eased));
          const step = Math.floor(eased * TICKS);
          if (step !== lastStep) {
            lastStep = step;
            sfxRef.current?.tick(eased);
          }
          if (t < 1) raf = requestAnimationFrame(frame);
          else {
            paint(to);
            sfxRef.current?.settle();
            setStage("done");
          }
        };
        raf = requestAnimationFrame(frame);
      }, T.count),
    );
    return () => {
      cancelAnimationFrame(raf);
      for (const id of timers) window.clearTimeout(id);
    };
  }, [from, to, skip, onCount]);

  useEffect(() => {
    if (stage !== "done" || buttons) return;
    const id = window.setTimeout(() => setButtons(true), T.buttonsAfter);
    return () => window.clearTimeout(id);
  }, [stage, buttons]);

  return (
    <div
      className="story-clear pack-landed"
      role="dialog"
      aria-modal="true"
      aria-label={`Purchase complete: ${formatGems(gems)} gems added. You now have ${formatGems(to)} gems.`}
      data-stage={stage}
      data-skip={skip}
      onClick={() => setSkipped(true)}
    >
      <div className="story-clear-body">
        <p className="story-clear-kicker">Purchase complete</p>
        <h2 className="story-clear-title">Bag filled</h2>

        <div className="pack-landed-art" aria-hidden="true">
          <GemBag tier={tier} />
        </div>

        <div className="story-clear-xp" data-stage={stage === "drop" ? "hidden" : "stamp"}>
          <span className="story-clear-stamp pack-landed-stamp">
            <GemGlyph /> +{formatGems(gems)}
          </span>
        </div>

        <div className="pack-landed-total" data-live={stage === "count" || stage === "done"}>
          <span className="pack-landed-total-label">In your bag</span>
          <span className="pack-landed-total-n">
            <GemGlyph />
            <span ref={totalRef}>{formatGems(skip ? to : from)}</span>
          </span>
        </div>

        <p className="story-clear-note mt-3">
          {viaStripe ? "Paid through Stripe. The receipt is in your inbox." : "Sandbox pack — no card was charged."}
        </p>

        <div className="story-clear-actions" data-show={buttons}>
          <button type="button" className="btn-play min-h-12" onClick={onClose}>
            Back to the game
          </button>
          <button type="button" className="btn-glass min-h-12" onClick={onMore}>
            Buy more
          </button>
        </div>
      </div>
    </div>
  );
}

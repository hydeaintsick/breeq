"use client";

import { useEffect, useId, useRef, useState } from "react";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { CloseIcon } from "@/components/nav-icons";
import { formatEth, formatGems, type Economy } from "@/lib/economy";

function QuestionMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.1 6.3a1.95 1.95 0 0 1 3.8.5c0 1.1-1.9 1.4-1.9 2.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.6" r="0.8" fill="currentColor" />
    </svg>
  );
}

function TicketMark() {
  return <GemGlyph className="gem-glyph manual-glyph" />;
}

function PotMark() {
  return <EthGlyph className="eth-glyph manual-glyph" />;
}

function WallMark() {
  return (
    <svg viewBox="0 0 24 24" className="manual-glyph" aria-hidden="true">
      <rect x="3" y="6" width="5.5" height="3.2" rx="1" fill="var(--neon-pink)" />
      <rect x="9.5" y="6" width="5.5" height="3.2" rx="1" fill="var(--neon-blue)" />
      <rect x="16" y="6" width="5" height="3.2" rx="1" fill="var(--neon-lime)" />
      <rect x="3" y="10.4" width="5.5" height="3.2" rx="1" fill="var(--neon-violet)" />
      <rect x="9.5" y="10.4" width="5.5" height="3.2" rx="1" fill="var(--neon-amber)" />
      <rect x="16" y="10.4" width="5" height="3.2" rx="1" fill="var(--neon-cyan)" />
      <rect x="8" y="19" width="8" height="1.6" rx="0.8" fill="currentColor" opacity="0.8" />
      <circle cx="12" cy="16.2" r="1.1" fill="#fff" />
    </svg>
  );
}

function RobotMark() {
  return (
    <svg viewBox="0 0 24 24" className="manual-glyph" aria-hidden="true">
      <rect x="5" y="8" width="14" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8V5.2M10 5.2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9.5" cy="13" r="1.2" fill="var(--neon-cyan)" />
      <circle cx="14.5" cy="13" r="1.2" fill="var(--neon-cyan)" />
    </svg>
  );
}

function OutMark() {
  return (
    <svg viewBox="0 0 24 24" className="manual-glyph" aria-hidden="true">
      <path d="M12 16V5M8.5 8.5 12 5l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * "How it works": the Earn manual, an action sheet over the store. Five
 * steps, one line each, numbers from the live economy. Opened by the button
 * beside the store's title; the page keeps its calm.
 */
export function EarnManual({ economy }: { economy: Pick<Economy, "winMultiplier" | "withdrawMinEth" | "publishCostGems"> }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pct = Math.round(economy.winMultiplier * 100);
  const steps: { mark: React.ReactNode; title: string; body: string }[] = [
    { mark: <TicketMark />, title: "Buy a ticket", body: "Every wall has a price in gems. Pay it and the wall is yours to try." },
    { mark: <WallMark />, title: "Bring the wall down", body: "Clear every brick with the lives you are given. Lose them all and the ticket is spent." },
    { mark: <PotMark />, title: "Pocket the pot", body: `A clear pays ${pct}% of your ticket in ETH, straight to your balance. Once per wall.` },
    { mark: <OutMark />, title: "Withdraw", body: `From ${formatEth(economy.withdrawMinEth)}, ask for a payout from your wallet. It is sent to your address.` },
    { mark: <RobotMark />, title: "Build your own", body: `Publish a wall for ${formatGems(economy.publishCostGems)} gems. Our robot proves it can be cleared before it goes on sale — every wall here passed.` },
  ];

  return (
    <>
      <button type="button" className="btn-glass min-h-11 gap-2" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <QuestionMark />
        How it works
      </button>

      {open ? (
        <div className="gem-shop" onClick={() => setOpen(false)}>
          <div
            ref={sheetRef}
            className="gem-shop-sheet glass-sheet"
            data-auto="true"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="gem-shop-handle" aria-hidden="true" />
            <div className="gem-shop-head">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Earn</p>
                <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  How it <span className="text-neon">works</span>
                </h2>
              </div>
              <button type="button" className="header-chip" aria-label="Close" onClick={() => setOpen(false)}>
                <span className="sr-only">Close</span>
                <CloseIcon />
              </button>
            </div>

            <div className="gem-shop-scroll">
              <ol className="manual-steps">
                {steps.map((step, index) => (
                  <li key={step.title} className="manual-step">
                    <span className="manual-step-n" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="manual-step-mark" aria-hidden="true">
                      {step.mark}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-semibold tracking-tight text-ink">{step.title}</span>
                      <span className="mt-0.5 block text-sm leading-6 text-ink-muted">{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-xs leading-5 text-ink-muted">
                Gems are a game currency with no cash value. You never win on your own map, and a pot is paid once per
                wall.
              </p>
              <button type="button" className="btn-play mt-5 min-h-12 w-full" onClick={() => setOpen(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useSwipe } from "@/components/swipe-provider";

/**
 * Full-page paddle swipe on/off. `row` is a full-width glass button for the
 * pause menu and account settings; `menu` is a text row for the header dropdown.
 */
export function SwipeToggle({ variant = "row" }: { variant?: "row" | "menu" }) {
  const { anywhere, toggle } = useSwipe();
  const label = anywhere ? "Steer from the rail only" : "Swipe anywhere to move the paddle";

  if (variant === "menu") {
    return (
      <button
        type="button"
        className="nav-link flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-left"
        aria-pressed={anywhere}
        aria-label={label}
        onClick={toggle}
      >
        <span className="flex items-center gap-2.5">
          <SwipeIcon off={!anywhere} />
          Swipe anywhere
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.12em]">{anywhere ? "On" : "Off"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn-glass min-h-11 w-full"
      aria-pressed={anywhere}
      aria-label={label}
      onClick={toggle}
    >
      <SwipeIcon off={!anywhere} />
      {anywhere ? "Swipe anywhere on" : "Swipe anywhere off"}
    </button>
  );
}

function SwipeIcon({ off }: { off: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path
        d="M3.2 8h9.6M5.2 5.6L2.8 8l2.4 2.4M10.8 5.6L13.2 8l-2.4 2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {off ? (
        <path d="M2.2 13.8L13.8 2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

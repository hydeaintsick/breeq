"use client";

import Link from "next/link";
import Image from "next/image";
import { BreakoutPreview } from "@/components/breakout-preview";
import type { Level } from "@/game/breakout/engine/types";

const LOCK_MARK = (
  <div className="mode-card-veil" aria-hidden="true">
    <svg className="mode-card-lock" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8.2 11V8.1a3.8 3.8 0 0 1 7.6 0V11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export function PlayCard({
  href,
  onSelect,
  kicker,
  title,
  body,
  meta,
  action,
  levels,
  seed,
  cover,
  locked = false,
  lockedHint,
  frozen = false,
  fill = false,
  aura = true,
  progress,
  paused = false,
  preview = true,
}: {
  href?: string;
  onSelect?: (card: HTMLElement) => void;
  kicker: string;
  title: string;
  body: string;
  /** Small line under the body: XP, "Cleared", a count. */
  meta?: string;
  action: string;
  levels: readonly Level[];
  seed: number;
  cover?: string | null;
  locked?: boolean;
  lockedHint?: string;
  /** Show the board frozen (serve frame) even when locked. */
  frozen?: boolean;
  fill?: boolean;
  aura?: boolean;
  progress?: { cleared: number; total: number; percent: number };
  /** Hold the live board still (the card is hidden behind another surface). */
  paused?: boolean;
  /** Mount the live board at all. Off while the card's surface is still animating in. */
  preview?: boolean;
}) {
  const hasProgress = Boolean(progress && progress.total > 0);
  const playClass = [
    "btn-play pointer-events-none min-h-11",
    hasProgress ? "mt-4" : "mt-5",
    locked ? "" : "play-shimmer",
  ]
    .filter(Boolean)
    .join(" ");
  const copy = (
    <>
      {cover ? (
        <div className="absolute inset-0">
          <Image src={cover} alt="" fill className="object-cover" sizes="22rem" />
        </div>
      ) : (locked && !frozen) || !preview ? null : (
        <div
          className="mode-card-board pointer-events-none absolute inset-0 [&_*]:pointer-events-none"
          inert={true}
        >
          <BreakoutPreview
            levels={levels}
            seed={seed}
            controls="auto"
            followQuery={false}
            fill
            frozen={frozen}
            loop={!frozen}
            paused={paused}
            showCaption={false}
            showHud={false}
          />
        </div>
      )}
      {locked ? LOCK_MARK : null}
      <div className="mode-card-copy">
        <p className="font-mono text-xs tracking-[0.16em] text-accent">{kicker}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-2 max-w-[16rem] text-sm leading-6 text-white/75">{body}</p>
        {meta ? <p className="mt-1 font-mono text-xs tracking-[0.08em] text-white/60">{meta}</p> : null}
        {locked && lockedHint ? (
          <p className="mt-1 max-w-[16rem] text-sm leading-6 text-white/75">{lockedHint}</p>
        ) : null}
        {hasProgress && progress ? (
          <div className="mode-card-progress" aria-hidden="true">
            <span className="mode-card-progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>
        ) : null}
        <span className={playClass}>
          {locked ? "Locked" : action}
        </span>
      </div>
    </>
  );

  const progressLabel =
    progress && progress.total > 0
      ? `${progress.cleared} of ${progress.total} chapters cleared.`
      : null;
  const label = locked
    ? `Locked. ${title}. ${lockedHint ?? body}`
    : `${action}. ${title}. ${body}${meta ? ` ${meta}.` : ""}${progressLabel ? ` ${progressLabel}` : ""}`;
  const cardClass = [
    "mode-card",
    fill ? "mode-card-fill" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const hasPreview = Boolean(cover) || !locked || frozen;

  return (
    <div className={fill ? "relative h-full w-full" : "relative w-full md:max-w-[22rem]"}>
      {locked || !aura ? null : <div className="board-aura" aria-hidden="true" />}
      {locked ? (
        <div
          className={cardClass}
          aria-disabled="true"
          data-cover={cover ? "true" : undefined}
          data-preview={hasPreview ? "true" : undefined}
          role="group"
          aria-label={label}
        >
          {copy}
        </div>
      ) : onSelect ? (
        <button
          type="button"
          className={cardClass}
          aria-label={label}
          onClick={(event) => onSelect(event.currentTarget)}
        >
          {copy}
        </button>
      ) : href ? (
        <Link href={href} className={cardClass} aria-label={label}>
          {copy}
        </Link>
      ) : null}
    </div>
  );
}

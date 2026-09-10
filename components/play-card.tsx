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
  action,
  levels,
  seed,
  cover,
  locked = false,
  lockedHint,
  fill = false,
  aura = true,
}: {
  href?: string;
  onSelect?: (card: HTMLElement) => void;
  kicker: string;
  title: string;
  body: string;
  action: string;
  levels: readonly Level[];
  seed: number;
  cover?: string | null;
  locked?: boolean;
  lockedHint?: string;
  fill?: boolean;
  aura?: boolean;
}) {
  const copy = (
    <>
      {cover ? (
        <div className="absolute inset-0">
          <Image src={cover} alt="" fill className="object-cover" sizes="22rem" />
        </div>
      ) : locked ? null : (
        <div
          className="pointer-events-none absolute inset-0 [&_*]:pointer-events-none"
          inert={true}
        >
          <BreakoutPreview
            levels={levels}
            seed={seed}
            controls="auto"
            followQuery={false}
            fill
          />
        </div>
      )}
      {locked ? LOCK_MARK : null}
      <div className="mode-card-copy">
        <p className="font-mono text-xs tracking-[0.16em] text-accent">{kicker}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-2 max-w-[16rem] text-sm leading-6 text-white/75">{body}</p>
        {locked && lockedHint ? (
          <p className="mt-1 max-w-[16rem] text-sm leading-6 text-white/75">{lockedHint}</p>
        ) : null}
        <span
          className={
            locked
              ? "btn-play pointer-events-none mt-5 min-h-11"
              : "btn-play play-shimmer pointer-events-none mt-5 min-h-11"
          }
        >
          {locked ? "Locked" : action}
        </span>
      </div>
    </>
  );

  const label = locked
    ? `Locked. ${title}. ${lockedHint ?? body}`
    : `${action}. ${title}. ${body}`;
  const cardClass = fill ? "mode-card mode-card-fill" : "mode-card";

  return (
    <div className={fill ? "relative h-full w-full" : "relative w-full md:max-w-[22rem]"}>
      {locked || !aura ? null : <div className="board-aura" aria-hidden="true" />}
      {locked ? (
        <div
          className={cardClass}
          aria-disabled="true"
          data-cover={cover ? "true" : undefined}
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

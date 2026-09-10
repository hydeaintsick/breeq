"use client";

import Link from "next/link";
import { BreakoutPreview } from "@/components/breakout-preview";
import type { Level } from "@/game/breakout/engine/types";

export function PlayCard({
  href,
  kicker,
  title,
  body,
  action,
  levels,
  seed,
  locked = false,
  lockedHint,
}: {
  href: string;
  kicker: string;
  title: string;
  body: string;
  action: string;
  levels: readonly Level[];
  seed: number;
  locked?: boolean;
  lockedHint?: string;
}) {
  const copy = (
    <>
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
              ? "btn-play play-shimmer pointer-events-none mt-5 min-h-11 opacity-60"
              : "btn-play play-shimmer pointer-events-none mt-5 min-h-11"
          }
        >
          {locked ? "Locked" : action}
        </span>
      </div>
    </>
  );

  return (
    <div className="relative w-full max-w-[22rem]">
      <div className="board-aura" aria-hidden="true" />
      {locked ? (
        <div className="mode-card" aria-disabled="true">
          {copy}
        </div>
      ) : (
        <Link href={href} className="mode-card" aria-label={`${action}. ${title}. ${body}`}>
          {copy}
        </Link>
      )}
    </div>
  );
}

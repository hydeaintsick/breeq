"use client";

import Link from "next/link";
import { BreakoutPreview } from "@/components/breakout-preview";
import { FIRST_LIGHT, LOCKDOWN } from "@/game/breakout/levels";
import { EARN_PATH, STORY_PATH } from "@/lib/auth/paths";

const STORY_LEVELS = [FIRST_LIGHT];
const EARN_LEVELS = [LOCKDOWN];

const modes = [
  {
    href: STORY_PATH,
    kicker: "01",
    title: "Story",
    body: "The campaign. Clear a wall, then the next — episode by episode.",
    levels: STORY_LEVELS,
    seed: 11,
  },
  {
    href: EARN_PATH,
    kicker: "02",
    title: "Earn",
    body: "Player-built walls. Clear them. The shelf is theirs, the score is yours.",
    levels: EARN_LEVELS,
    seed: 23,
  },
] as const;

export function GameModePicker() {
  return (
    <div className="grid w-full gap-5 md:grid-cols-2">
      {modes.map((mode) => (
        <ModeCard key={mode.href} {...mode} />
      ))}
    </div>
  );
}

function ModeCard({
  href,
  kicker,
  title,
  body,
  levels,
  seed,
}: (typeof modes)[number]) {
  return (
    <Link href={href} className="mode-card glass flex flex-col p-5 sm:p-6">
      <p className="font-mono text-xs tracking-[0.16em] text-accent">{kicker}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-2 text-base leading-7 text-ink-muted">{body}</p>
      <div
        className="pointer-events-none mt-6 flex flex-1 items-end justify-center [&_*]:pointer-events-none"
        inert={true}
      >
        <BreakoutPreview
          levels={levels}
          seed={seed}
          controls="auto"
          followQuery={false}
          compact
          showCaption={false}
        />
      </div>
    </Link>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { BreakoutPreview } from "@/components/breakout-preview";
import { FIRST_LIGHT } from "@/game/breakout/levels";
import { GAME_MENU_PATH } from "@/lib/auth/paths";
import { requireUser } from "@/lib/auth/session";

const STORY_LEVELS = [FIRST_LIGHT];

export const metadata: Metadata = {
  title: "Story",
  description: "Play the Breeq campaign, episode by episode.",
};

export default async function StoryPage() {
  await requireUser();

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col items-center justify-center gap-12 px-6 pb-20 pt-28 lg:flex-row">
      <div className="max-w-xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Story · Episode 1
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          First Light
        </h1>
        <p className="mt-5 text-lg leading-8 text-ink-muted">
          The campaign opens here. Clear this wall, then the next. Move over
          the board to take the paddle.
        </p>
        <Link href={GAME_MENU_PATH} className="nav-link mt-8 inline-flex min-h-11 items-center">
          Back to modes
        </Link>
      </div>
      <BreakoutPreview
        levels={STORY_LEVELS}
        seed={11}
        followQuery={false}
        controls="hybrid"
      />
    </section>
  );
}

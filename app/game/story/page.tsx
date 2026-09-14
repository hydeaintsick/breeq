import type { Metadata } from "next";
import Link from "next/link";
import { StoryShelf } from "@/components/story-shelf";
import { GAME_MENU_PATH, STORY_FROM_TUTORIAL, TUTORIAL_PATH } from "@/lib/auth/paths";
import { requireProgress } from "@/lib/auth/session";
import { getDiscoveries } from "@/lib/discoveries-server";
import { getStoryShelf } from "@/lib/story";
import { getTutorialStatus } from "@/lib/tutorial";

export const metadata: Metadata = {
  title: "Story",
  description: "Play the Breeq campaign, episode by episode.",
};

export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { user } = await requireProgress();
  const [{ episodes }, tutorial, discovered, { from }] = await Promise.all([
    getStoryShelf(user.id),
    getTutorialStatus(user.id),
    getDiscoveries(user.id),
    searchParams,
  ]);
  const fromTutorial = from === STORY_FROM_TUTORIAL && tutorial.enabled && tutorial.done;

  if (episodes.length === 0) {
    return (
      <section className="page-gutter flex min-h-[100svh] flex-col justify-center pb-16 pt-28">
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Story</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Choose an <span className="text-neon">episode</span>.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-ink-muted">
          No episodes yet. Check back once the campaign is published.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          {tutorial.enabled ? (
            <Link href={TUTORIAL_PATH} className="btn-play min-h-11">
              {tutorial.done ? "Replay the tutorial" : "Learn to play"}
            </Link>
          ) : null}
          <Link href={GAME_MENU_PATH} className="nav-link inline-flex min-h-11 items-center">
            Back to modes
          </Link>
        </div>
        </div>
      </section>
    );
  }

  return (
    <StoryShelf
      episodes={episodes}
      tutorial={tutorial.enabled ? { done: tutorial.done } : null}
      arriveFromTutorial={fromTutorial}
      discovered={discovered}
    />
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { StoryShelf } from "@/components/story-shelf";
import { GAME_MENU_PATH } from "@/lib/auth/paths";
import { requireProgress } from "@/lib/auth/session";
import { getStoryShelf } from "@/lib/story";

export const metadata: Metadata = {
  title: "Story",
  description: "Play the Breeq campaign, episode by episode.",
};

export default async function StoryPage() {
  const { user } = await requireProgress();
  const { episodes, storyPercent } = await getStoryShelf(user.id);

  if (episodes.length === 0) {
    return (
      <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Story</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Choose an <span className="text-neon">episode</span>.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-ink-muted">
          No episodes yet. Check back once the campaign is published.
        </p>
        <Link href={GAME_MENU_PATH} className="nav-link mt-10 inline-flex min-h-11 items-center">
          Back to modes
        </Link>
      </section>
    );
  }

  return (
    <StoryShelf
      episodes={episodes}
      storyPercent={storyPercent}
      kicker="Story"
      title={
        <>
          Choose an <span className="text-neon">episode</span>.
        </>
      }
      body="Each episode is a run of walls. Finish one to unlock the next."
    />
  );
}

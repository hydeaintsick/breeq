import type { Metadata } from "next";
import Link from "next/link";
import { EpisodePicker } from "@/components/episode-picker";
import { GAME_MENU_PATH } from "@/lib/auth/paths";
import { requireUser } from "@/lib/auth/session";
import { listStoryEpisodes } from "@/lib/story";

export const metadata: Metadata = {
  title: "Story",
  description: "Play the Breeq campaign, episode by episode.",
};

export default async function StoryPage() {
  const [, episodes] = await Promise.all([requireUser(), listStoryEpisodes()]);

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Story
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Choose an <span className="text-neon">episode</span>.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-ink-muted">
        Each episode is a run of walls. Open one to take the paddle.
      </p>
      <div className="mt-10">
        {episodes.length === 0 ? (
          <p className="text-sm leading-6 text-ink-muted">
            No episodes yet. Check back once the campaign is published.
          </p>
        ) : (
          <EpisodePicker episodes={episodes} />
        )}
      </div>
      <Link href={GAME_MENU_PATH} className="nav-link mt-10 inline-flex min-h-11 items-center">
        Back to modes
      </Link>
    </section>
  );
}

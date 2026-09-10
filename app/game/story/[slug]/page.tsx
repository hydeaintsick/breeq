import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryShelf } from "@/components/story-shelf";
import { GAME_MENU_PATH } from "@/lib/auth/paths";
import { requireProgress } from "@/lib/auth/session";
import { getStoryShelf } from "@/lib/story";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { user } = await requireProgress();
  const { episodes } = await getStoryShelf(user.id);
  const episode = episodes.find((item) => item.slug === slug);
  return {
    title: episode?.title ?? "Episode",
    description: "Play this Breeq story episode.",
  };
}

export default async function StoryEpisodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user } = await requireProgress();
  const { episodes, storyPercent } = await getStoryShelf(user.id);
  const episode = episodes.find((item) => item.slug === slug);

  if (!episode) {
    notFound();
  }

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Story
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {episode.title}
      </h1>
      <div className="mt-10">
        <StoryShelf episodes={episodes} storyPercent={storyPercent} initialSlug={slug} />
      </div>
      <Link href={GAME_MENU_PATH} className="nav-link mt-10 inline-flex min-h-11 items-center">
        Back to modes
      </Link>
    </section>
  );
}

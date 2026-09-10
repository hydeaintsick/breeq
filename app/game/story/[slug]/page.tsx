import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryPlay } from "@/components/story-play";
import { STORY_PATH } from "@/lib/auth/paths";
import { requireUser } from "@/lib/auth/session";
import { getStoryEpisode } from "@/lib/story";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getStoryEpisode(slug);
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
  const [, episode] = await Promise.all([requireUser(), getStoryEpisode(slug)]);

  if (!episode) {
    notFound();
  }

  const chapters = episode.chapters;
  const chapterLabel =
    chapters.length === 1 ? "1 chapter" : `${chapters.length} chapters`;

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col items-center justify-center gap-12 px-6 pb-20 pt-28 lg:flex-row">
      <div className="max-w-xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Story · {chapterLabel}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {episode.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-ink-muted">
          {chapters.length === 0
            ? "This episode has no walls yet."
            : "Clear this wall, then the next. Move over the board to take the paddle."}
        </p>
        <Link href={STORY_PATH} className="nav-link mt-8 inline-flex min-h-11 items-center">
          Back to episodes
        </Link>
      </div>
      {chapters.length > 0 ? (
        <StoryPlay storedLevels={chapters.map((chapter) => chapter.level)} seed={11} />
      ) : null}
    </section>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryShelf } from "@/components/story-shelf";
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
  const { episodes } = await getStoryShelf(user.id);
  const episode = episodes.find((item) => item.slug === slug);

  if (!episode) {
    notFound();
  }

  return (
    <StoryShelf
      episodes={episodes}
      initialSlug={slug}
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

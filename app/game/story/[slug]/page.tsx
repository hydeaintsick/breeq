import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryShelf } from "@/components/story-shelf";
import { requireProgress } from "@/lib/auth/session";
import { getDiscoveries } from "@/lib/discoveries-server";
import { getStoryShelf } from "@/lib/story";
import { getTutorialStatus } from "@/lib/tutorial";

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
  const [{ episodes }, tutorial, discovered] = await Promise.all([
    getStoryShelf(user.id),
    getTutorialStatus(user.id),
    getDiscoveries(user.id),
  ]);
  const episode = episodes.find((item) => item.slug === slug);

  if (!episode) {
    notFound();
  }

  return (
    <StoryShelf
      episodes={episodes}
      tutorial={tutorial.enabled ? { done: tutorial.done } : null}
      initialSlug={slug}
      discovered={discovered}
    />
  );
}

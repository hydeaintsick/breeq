import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { moveChapter } from "@/app/actions/editor";
import { CreateChapterForm } from "@/components/create-chapter-form";
import { ReorderControls } from "@/components/reorder-controls";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ADMIN_EDITOR_PATH } from "@/lib/auth/paths";

export const metadata: Metadata = {
  title: "Chapters",
  description: "Create chapters for this episode.",
};

export default async function EpisodeEditorPage({
  params,
}: {
  params: Promise<{ episodeId: string }>;
}) {
  await requireAdmin();
  const { episodeId } = await params;
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: {
      chapters: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!episode) {
    notFound();
  }

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col justify-center px-6 pb-20 pt-28">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        <Link href={ADMIN_EDITOR_PATH} className="underline decoration-hairline underline-offset-4">
          Editor
        </Link>
        {" / "}
        Episode
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {episode.title}
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-ink-muted">
        A chapter is one level. Open it to place bricks, zones, and obstacles, then save.
      </p>

      <CreateChapterForm episodeId={episode.id} />

      {episode.chapters.length === 0 ? (
        <p className="mt-8 text-sm leading-6 text-ink-muted">
          No chapters yet. Name the first wall above.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {episode.chapters.map((chapter, index) => (
            <li key={chapter.id} className="glass flex items-center gap-3 px-3 py-3 sm:px-5">
              <ReorderControls
                name={chapter.title}
                canUp={index > 0}
                canDown={index < episode.chapters.length - 1}
                upAction={moveChapter.bind(null, episode.id, chapter.id, "up")}
                downAction={moveChapter.bind(null, episode.id, chapter.id, "down")}
              />
              <Link
                href={`${ADMIN_EDITOR_PATH}/${episode.id}/${chapter.id}`}
                className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-4"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-xs tracking-[0.16em] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block truncate font-semibold tracking-tight text-ink">
                    {chapter.title}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-ink-muted">Edit</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

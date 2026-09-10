import type { Metadata } from "next";
import Link from "next/link";
import { moveEpisode } from "@/app/actions/editor";
import { CreateEpisodeForm } from "@/components/create-episode-form";
import { ReorderControls } from "@/components/reorder-controls";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ADMIN_EDITOR_PATH } from "@/lib/auth/paths";

export const metadata: Metadata = {
  title: "Editor",
  description: "Create episodes and chapters.",
};

export default async function AdminEditorPage() {
  await requireAdmin();
  const episodes = await prisma.episode.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { chapters: true } } },
  });

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col justify-center px-6 pb-20 pt-28">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Editor
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Episodes
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-ink-muted">
        An episode is a slice of the story. Each chapter inside it is one wall.
      </p>

      <CreateEpisodeForm />

      {episodes.length === 0 ? (
        <p className="mt-8 text-sm leading-6 text-ink-muted">
          No episodes yet. Name the first one above.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {episodes.map((episode, index) => (
            <li key={episode.id} className="glass flex items-center gap-3 px-3 py-3 sm:px-5">
              <ReorderControls
                name={episode.title}
                canUp={index > 0}
                canDown={index < episodes.length - 1}
                upAction={moveEpisode.bind(null, episode.id, "up")}
                downAction={moveEpisode.bind(null, episode.id, "down")}
              />
              <Link
                href={`${ADMIN_EDITOR_PATH}/${episode.id}`}
                className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-4"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-xs tracking-[0.16em] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block truncate font-semibold tracking-tight text-ink">
                    {episode.title}
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {episode._count.chapters} {episode._count.chapters === 1 ? "chapter" : "chapters"}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-ink-muted">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

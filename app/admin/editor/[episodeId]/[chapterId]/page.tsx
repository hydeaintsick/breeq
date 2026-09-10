import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LevelEditor } from "@/components/level-editor";
import { parseStoredLevel } from "@/game/breakout/engine";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Chapter",
  description: "Place pieces and save this chapter.",
};

export default async function ChapterEditorPage({
  params,
}: {
  params: Promise<{ episodeId: string; chapterId: string }>;
}) {
  const user = await requireAdmin();
  const { episodeId, chapterId } = await params;
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, episodeId },
    include: { episode: { select: { title: true } } },
  });

  if (!chapter) {
    notFound();
  }

  const level = parseStoredLevel(chapter.level, {
    id: chapter.id,
    name: chapter.title,
    author: user.username ?? user.name ?? "admin",
  });

  return (
    <LevelEditor
      episodeId={episodeId}
      chapterId={chapter.id}
      episodeTitle={chapter.episode.title}
      initialTitle={chapter.title}
      initialXpReward={chapter.xpReward ?? 100}
      initialLevel={level}
    />
  );
}

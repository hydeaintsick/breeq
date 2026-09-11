"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ADMIN_EDITOR_PATH, STORY_PATH, storyEpisodePath } from "@/lib/auth/paths";
import { slugify } from "@/lib/slug";
import { createDraftLevel, parseStoredLevel, serializeLevel } from "@/game/breakout/engine";
import { uploadStoryBackground } from "@/lib/cloudinary";
import { XP_PER_STORY_CLEAR } from "@/lib/progress";
import { CHAPTER_INTRO_MAX, normalizeIntro } from "@/lib/chapter-intro";

type ActionState = { error: string } | null;
type MoveDirection = "up" | "down";

function shiftItem<T extends { id: string }>(items: T[], id: string, direction: MoveDirection) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }
  const swap = direction === "up" ? index - 1 : index + 1;
  if (swap < 0 || swap >= items.length) {
    return null;
  }
  const next = [...items];
  const [moved] = next.splice(index, 1);
  next.splice(swap, 0, moved);
  return next;
}

async function writeOrder(items: { id: string }[], update: (id: string, order: number) => Promise<unknown>) {
  for (let index = 0; index < items.length; index += 1) {
    await update(items[index].id, index + 1);
  }
}

function parseXp(value: FormDataEntryValue | string | number | null | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return XP_PER_STORY_CLEAR;
  }
  return Math.min(10_000, Math.max(0, Math.round(parsed)));
}

async function readStoryImage(formData: FormData) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  return uploadStoryBackground(file);
}

function revalidateStory(slug?: string) {
  revalidatePath(STORY_PATH);
  if (slug) {
    revalidatePath(storyEpisodePath(slug));
  }
}

export async function createEpisode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();

  if (title.length < 2 || title.length > 60) {
    return { error: "Episode name must be 2–60 characters." };
  }

  const base = slugify(title);
  const slug = await uniqueEpisodeSlug(base);
  const last = await prisma.episode.aggregate({ _max: { order: true } });

  let backgroundUrl: string | undefined;
  try {
    backgroundUrl = (await readStoryImage(formData)) ?? undefined;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not upload the image." };
  }

  const episode = await prisma.episode.create({
    data: {
      title,
      slug,
      order: (last._max.order ?? 0) + 1,
      backgroundUrl,
    },
  });

  revalidatePath(ADMIN_EDITOR_PATH);
  revalidateStory();
  redirect(`${ADMIN_EDITOR_PATH}/${episode.id}`);
}

export async function createChapter(
  episodeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();

  if (title.length < 2 || title.length > 60) {
    return { error: "Chapter name must be 2–60 characters." };
  }

  const xpReward = parseXp(formData.get("xpReward"));

  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: { id: true, slug: true },
  });

  if (!episode) {
    return { error: "Episode not found." };
  }

  const slug = await uniqueChapterSlug(episode.id, slugify(title));
  const last = await prisma.chapter.aggregate({
    where: { episodeId: episode.id },
    _max: { order: true },
  });

  const chapter = await prisma.chapter.create({
    data: {
      episodeId: episode.id,
      title,
      slug,
      order: (last._max.order ?? 0) + 1,
      xpReward,
      level: {} as Prisma.InputJsonValue,
    },
  });

  const author = user.username ?? user.name ?? "admin";
  const level = createDraftLevel({
    id: chapter.id,
    name: title,
    author,
  });

  await prisma.chapter.update({
    where: { id: chapter.id },
    data: { level: serializeLevel(level) as Prisma.InputJsonValue },
  });

  revalidatePath(`${ADMIN_EDITOR_PATH}/${episode.id}`);
  revalidateStory(episode.slug);
  redirect(`${ADMIN_EDITOR_PATH}/${episode.id}/${chapter.id}`);
}

export async function saveChapter(input: {
  episodeId: string;
  chapterId: string;
  title: string;
  /** The chapter's story beat; empty clears it. */
  intro?: string;
  xpReward: number;
  level: unknown;
}): Promise<{ ok: true } | { error: string }> {
  const user = await requireAdmin();
  const title = input.title.trim();

  if (title.length < 2 || title.length > 60) {
    return { error: "Chapter name must be 2–60 characters." };
  }

  const intro = normalizeIntro(input.intro);
  if (intro.length > CHAPTER_INTRO_MAX) {
    return { error: `Story text must be ${CHAPTER_INTRO_MAX} characters or fewer.` };
  }

  const xpReward = parseXp(input.xpReward);

  const chapter = await prisma.chapter.findFirst({
    where: { id: input.chapterId, episodeId: input.episodeId },
    select: { id: true, episode: { select: { slug: true } } },
  });

  if (!chapter) {
    return { error: "Chapter not found." };
  }

  const author = user.username ?? user.name ?? "admin";
  const level = parseStoredLevel(input.level, {
    id: chapter.id,
    name: title,
    author,
  });
  level.id = chapter.id;
  level.name = title;
  level.author = author;

  await prisma.chapter.update({
    where: { id: chapter.id },
    data: {
      title,
      intro: intro || null,
      xpReward,
      level: serializeLevel(level) as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`${ADMIN_EDITOR_PATH}/${input.episodeId}`);
  revalidatePath(`${ADMIN_EDITOR_PATH}/${input.episodeId}/${chapter.id}`);
  revalidateStory(chapter.episode.slug);
  return { ok: true };
}

export async function updateEpisodeBackground(
  episodeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: { id: true, slug: true },
  });

  if (!episode) {
    return { error: "Episode not found." };
  }

  try {
    const backgroundUrl = await readStoryImage(formData);
    if (!backgroundUrl) {
      return { error: "Choose an image." };
    }
    await prisma.episode.update({
      where: { id: episode.id },
      data: { backgroundUrl },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not upload the image." };
  }

  revalidatePath(`${ADMIN_EDITOR_PATH}/${episode.id}`);
  revalidateStory(episode.slug);
  return null;
}

export async function moveEpisode(id: string, direction: MoveDirection) {
  await requireAdmin();
  const episodes = await prisma.episode.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, slug: true },
  });
  const next = shiftItem(episodes, id, direction);
  if (!next) {
    return;
  }

  await writeOrder(next, (episodeId, order) =>
    prisma.episode.update({ where: { id: episodeId }, data: { order } }),
  );

  revalidatePath(ADMIN_EDITOR_PATH);
  revalidateStory();
  for (const episode of next) {
    revalidatePath(storyEpisodePath(episode.slug));
  }
}

export async function moveChapter(episodeId: string, chapterId: string, direction: MoveDirection) {
  await requireAdmin();
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: {
      id: true,
      slug: true,
      chapters: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      },
    },
  });

  if (!episode) {
    return;
  }

  const next = shiftItem(episode.chapters, chapterId, direction);
  if (!next) {
    return;
  }

  await writeOrder(next, (id, order) => prisma.chapter.update({ where: { id }, data: { order } }));

  revalidatePath(`${ADMIN_EDITOR_PATH}/${episode.id}`);
  revalidateStory(episode.slug);
}

async function uniqueEpisodeSlug(base: string) {
  let slug = base;
  let n = 2;
  while (await prisma.episode.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

async function uniqueChapterSlug(episodeId: string, base: string) {
  let slug = base;
  let n = 2;
  while (
    await prisma.chapter.findUnique({
      where: { episodeId_slug: { episodeId, slug } },
      select: { id: true },
    })
  ) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

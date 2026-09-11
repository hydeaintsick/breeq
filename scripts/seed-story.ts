/**
 * Seed the Story episodes that live in code (`game/breakout/levels/story`) into
 * the database. Idempotent: episodes are matched by slug, chapters by slug
 * inside their episode; titles, order, XP, levels and backgrounds are updated
 * in place, and chapters the code no longer defines are removed. Seeded
 * episodes are owned by the code — edits made to them in the admin editor are
 * overwritten on the next run.
 *
 *   pnpm story:seed                 # prove, rate, upsert
 *   pnpm story:seed --dry-run       # prove and rate only
 *   pnpm story:seed --retire pilot  # also back up and delete the "pilot" episode
 *   pnpm story:seed --reupload      # push the backgrounds to Cloudinary again
 *
 * Every wall must pass validation and the flawless autopilot before anything is
 * written. Backgrounds go to Cloudinary when it is configured (same folder as
 * the admin uploads), otherwise the same-origin `/backgrounds/...` path is used.
 */
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { rateDifficulty, serializeLevel, starBands, starsForClear, validateLevel, type Level } from "../game/breakout/engine";
import { GECKO_LEGACY_COPY, STORY_EPISODES, type StoryEpisodeDef } from "../game/breakout/levels/story";
import { cloudinaryConfigured, uploadStoryBackground } from "../lib/cloudinary";

const AUTHOR = "Breeq";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const reupload = args.includes("--reupload");
const retire = args.flatMap((arg, index) => (arg === "--retire" && args[index + 1] ? [args[index + 1]] : []));

const prisma = new PrismaClient();

function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function proveEpisode(episode: StoryEpisodeDef) {
  console.log(`\n${episode.title} (${episode.slug}) — ${episode.chapters.length} chapters`);
  for (const [index, chapter] of episode.chapters.entries()) {
    const errors = validateLevel(chapter.level).filter((issue) => issue.level === "error");
    if (errors.length > 0) {
      fail(`${chapter.title}: ${errors.map((e) => e.message).join("; ")}`);
    }
    const rating = rateDifficulty(chapter.level);
    if (!rating.clearable) {
      fail(`${chapter.title}: the flawless autopilot could not clear it.`);
    }
    const bands = starBands(chapter.level);
    const grade = rating.proof
      ? starsForClear(chapter.level, {
          paddleHits: rating.proof.paddleHits,
          livesLeft: rating.proof.livesLeft,
        })
      : 1;
    const marks = `${"★".repeat(grade)}${"☆".repeat(3 - grade)}`;
    const rates = rating.samples.map((s) => `${Math.round(s.winRate * 100)}%`).join("/");
    console.log(
      `  ${String(index + 1).padStart(2, "0")} ${chapter.title.padEnd(20)} ${String(rating.score).padStart(3)} ${rating.label.padEnd(7)} clears ${rates}  ~${Math.round(rating.meanSeconds ?? 0)}s  ${chapter.xp} XP  3★≤${bands.three}  2★≤${bands.two}  flawless ${rating.proof?.paddleHits ?? "–"}h → ${marks}`,
    );
  }
}

async function backgroundUrlFor(episode: StoryEpisodeDef, current: string | null): Promise<string> {
  const onCloudinary = current?.startsWith("https://res.cloudinary.com/") ?? false;
  if (onCloudinary && !reupload) {
    return current as string;
  }
  if (!cloudinaryConfigured()) {
    return episode.background;
  }
  const file = path.join(process.cwd(), "public", episode.background);
  const bytes = await readFile(file);
  const blob = new File([bytes], path.basename(file), { type: "image/jpeg" });
  const url = await uploadStoryBackground(blob);
  console.log(`  uploaded ${episode.background} → ${url}`);
  return url;
}

function storedLevel(level: Level, chapterId: string, title: string, background: string) {
  const next: Level = {
    ...level,
    id: chapterId,
    name: title,
    author: AUTHOR,
    background: { ...level.background, type: "photo", src: background },
  };
  return serializeLevel(next) as Prisma.InputJsonValue;
}

async function retireEpisode(slug: string) {
  const episode = await prisma.episode.findUnique({
    where: { slug },
    include: { chapters: { include: { clears: true } } },
  });
  if (!episode) {
    console.log(`\nNothing to retire: no episode "${slug}".`);
    return;
  }
  const backup = path.join(tmpdir(), `breeq-story-${slug}-${Date.now()}.json`);
  await writeFile(backup, JSON.stringify(episode, null, 2));
  const clears = episode.chapters.reduce((sum, chapter) => sum + chapter.clears.length, 0);
  console.log(`\nRetiring "${episode.title}" (${episode.chapters.length} chapters, ${clears} clears). Backup: ${backup}`);
  if (!dryRun) {
    await prisma.episode.delete({ where: { id: episode.id } });
  }
}

async function upsertEpisode(episode: StoryEpisodeDef) {
  const existing = await prisma.episode.findUnique({
    where: { slug: episode.slug },
    include: { chapters: { select: { id: true, slug: true } } },
  });

  const backgroundUrl = await backgroundUrlFor(episode, existing?.backgroundUrl ?? null);

  const row = existing
    ? await prisma.episode.update({
        where: { id: existing.id },
        data: { title: episode.title, order: episode.order, tagline: episode.tagline, backgroundUrl },
      })
    : await prisma.episode.create({
        data: { title: episode.title, slug: episode.slug, order: episode.order, tagline: episode.tagline, backgroundUrl },
      });

  const keep = new Set<string>();
  for (const [index, chapter] of episode.chapters.entries()) {
    const found = existing?.chapters.find((c) => c.slug === chapter.slug);
    const data = { title: chapter.title, intro: chapter.intro, order: index + 1, xpReward: chapter.xp };
    let id: string;
    if (found) {
      id = found.id;
      await prisma.chapter.update({ where: { id }, data });
    } else {
      const created = await prisma.chapter.create({
        data: { ...data, episodeId: row.id, slug: chapter.slug, level: {} as Prisma.InputJsonValue },
      });
      id = created.id;
    }
    await prisma.chapter.update({
      where: { id },
      data: { level: storedLevel(chapter.level, id, chapter.title, backgroundUrl) },
    });
    keep.add(id);
  }

  const stale = (existing?.chapters ?? []).filter((c) => !keep.has(c.id));
  if (stale.length > 0) {
    await prisma.chapter.deleteMany({ where: { id: { in: stale.map((c) => c.id) } } });
    console.log(`  removed ${stale.length} chapter(s) the code no longer defines`);
  }
  console.log(`  ${existing ? "updated" : "created"} episode #${episode.order} with ${episode.chapters.length} chapters`);
}

/**
 * Gecko Legacy is hand-made: its walls are never touched. Its story lines are
 * filled in only where the editor left them empty, so an admin edit wins.
 */
async function fillGeckoLegacyCopy() {
  const episode = await prisma.episode.findUnique({
    where: { slug: GECKO_LEGACY_COPY.slug },
    select: { id: true, title: true, tagline: true, chapters: { select: { id: true, slug: true, intro: true } } },
  });
  if (!episode) {
    console.log(`\n"${GECKO_LEGACY_COPY.slug}" is not in the database yet; its story lines wait.`);
    return;
  }
  let written = 0;
  if (!episode.tagline) {
    await prisma.episode.update({ where: { id: episode.id }, data: { tagline: GECKO_LEGACY_COPY.tagline } });
    written += 1;
  }
  for (const chapter of episode.chapters) {
    const intro = (GECKO_LEGACY_COPY.chapters as Record<string, string | undefined>)[chapter.slug];
    if (!intro || chapter.intro) continue;
    await prisma.chapter.update({ where: { id: chapter.id }, data: { intro } });
    written += 1;
  }
  console.log(`\n${episode.title}: ${written === 0 ? "story lines already set" : `wrote ${written} story line(s)`}.`);
}

async function backfillClearStars() {
  const rows = await prisma.chapterClear.findMany({ select: { id: true, stars: true, hits: true } });
  let count = 0;
  for (const row of rows) {
    if (row.hits === 0 && row.stars <= 1) {
      await prisma.chapterClear.update({ where: { id: row.id }, data: { stars: 2 } });
      count += 1;
    }
  }
  if (count > 0) {
    console.log(`\nBackfilled ${count} existing clear(s) to 2 stars.`);
  }
}

async function settleOrder() {
  const seeded = new Map(STORY_EPISODES.map((e) => [e.slug, e.order]));
  const taken = new Set(seeded.values());
  const episodes = await prisma.episode.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  let next = Math.max(0, ...taken) + 1;
  for (const episode of episodes) {
    if (seeded.has(episode.slug)) continue;
    if (!taken.has(episode.order)) {
      taken.add(episode.order);
      continue;
    }
    while (taken.has(next)) next += 1;
    console.log(`  moved "${episode.title}" from #${episode.order} to #${next}`);
    await prisma.episode.update({ where: { id: episode.id }, data: { order: next } });
    taken.add(next);
  }
}

async function main() {
  console.log(dryRun ? "Dry run: proving and rating only." : "Seeding the Story.");
  for (const episode of STORY_EPISODES) proveEpisode(episode);

  for (const slug of retire) await retireEpisode(slug);

  if (dryRun) {
    console.log("\nEvery wall is clearable. Nothing written.");
    return;
  }

  for (const episode of STORY_EPISODES) {
    console.log(`\nWriting ${episode.title}…`);
    await upsertEpisode(episode);
  }
  await fillGeckoLegacyCopy();
  await settleOrder();
  await backfillClearStars();

  const shelf = await prisma.episode.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { title: true, slug: true, order: true, _count: { select: { chapters: true } } },
  });
  console.log("\nShelf:");
  for (const episode of shelf) {
    console.log(`  #${episode.order} ${episode.title} (${episode.slug}) — ${episode._count.chapters} chapters`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

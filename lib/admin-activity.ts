import { prisma } from "@/lib/prisma";
import { countedAccount } from "@/lib/admin-stats";
import { formatAdminWhen } from "@/lib/admin-time";
import { formatGems } from "@/lib/economy";

/** How many rows each source contributes before the feed is trimmed. */
const CANDIDATES = 40;

/** Rows on the dashboard overview. */
export const ADMIN_ACTIVITY_LIMIT = 5;
/** Rows on one player's page. */
export const PLAYER_PLAY_LIMIT = 20;

export type AdminActivity = {
  id: string;
  /** ISO instant, for `<time dateTime>`. */
  iso: string;
  /** Paris, 24-hour. */
  at: string;
  userId: string;
  username: string;
  what: string;
  detail: string | null;
};

type Raw = {
  id: string;
  at: Date;
  userId: string;
  username: string;
  what: string;
  detail: string | null;
};

function nameOf(user: { username: string | null; name: string | null }): string {
  return user.username ?? user.name ?? "player";
}

function lossReason(reason: string): string {
  switch (reason) {
    case "lives":
      return "Out of lives";
    case "timeout":
      return "Time ran out";
    case "crushed":
      return "Crushed";
    default:
      return "Lost";
  }
}

function starsLabel(stars: number): string {
  return stars === 1 ? "1 star" : `${stars} stars`;
}

function present(rows: Raw[], limit: number): AdminActivity[] {
  return rows
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      iso: row.at.toISOString(),
      at: formatAdminWhen(row.at),
      userId: row.userId,
      username: row.username,
      what: row.what,
      detail: row.detail,
    }));
}

async function playEvents(userId: string | undefined): Promise<Raw[]> {
  const where = userId ? { userId } : { user: { is: countedAccount } };
  const [clears, losses, runs] = await Promise.all([
    prisma.chapterClear.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: CANDIDATES,
      select: {
        id: true,
        stars: true,
        score: true,
        hits: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, name: true } },
        chapter: { select: { title: true, episode: { select: { title: true } } } },
      },
    }),
    prisma.storyLoss.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: CANDIDATES,
      select: {
        id: true,
        reason: true,
        score: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, name: true } },
        chapter: { select: { title: true, episode: { select: { title: true } } } },
      },
    }),
    prisma.earnRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: CANDIDATES,
      select: {
        id: true,
        outcome: true,
        createdAt: true,
        endedAt: true,
        userId: true,
        user: { select: { username: true, name: true } },
        map: { select: { title: true } },
      },
    }),
  ]);

  const rows: Raw[] = [];

  for (const clear of clears) {
    const skipped = clear.score === 0 && clear.hits === 0;
    rows.push({
      id: `clear:${clear.id}`,
      at: clear.createdAt,
      userId: clear.userId,
      username: nameOf(clear.user),
      what: `${skipped ? "Skipped" : "Cleared"} ${clear.chapter.title}`,
      detail: `${clear.chapter.episode.title} · ${starsLabel(clear.stars)}`,
    });
  }

  for (const loss of losses) {
    rows.push({
      id: `loss:${loss.id}`,
      at: loss.createdAt,
      userId: loss.userId,
      username: nameOf(loss.user),
      what: `Lost ${loss.chapter.title}`,
      detail: `${loss.chapter.episode.title} · ${lossReason(loss.reason)}`,
    });
  }

  for (const run of runs) {
    const verb = run.outcome === "WON" ? "Won" : run.outcome === "LOST" ? "Lost" : "Playing";
    rows.push({
      id: `earn:${run.id}`,
      at: run.endedAt ?? run.createdAt,
      userId: run.userId,
      username: nameOf(run.user),
      what: `${verb} ${run.map.title}`,
      detail: "Earn",
    });
  }

  return rows;
}

/** Latest play on one account: clears, losses, Earn tickets. */
export async function recentPlayForUser(userId: string, limit = PLAYER_PLAY_LIMIT): Promise<AdminActivity[]> {
  return present(await playEvents(userId), limit);
}

/**
 * Latest activity across the game: play, plus sign-ups and gem packs.
 * Deleted accounts stay out.
 */
export async function recentAdminActivity(limit = ADMIN_ACTIVITY_LIMIT): Promise<AdminActivity[]> {
  const [play, signups, packs] = await Promise.all([
    playEvents(undefined),
    prisma.user.findMany({
      where: countedAccount,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, username: true, name: true, createdAt: true },
    }),
    prisma.gemPurchase.findMany({
      where: { status: "PAID", user: { is: countedAccount } },
      orderBy: { paidAt: "desc" },
      take: limit,
      select: {
        id: true,
        gems: true,
        paidAt: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, name: true } },
      },
    }),
  ]);

  const rows: Raw[] = [...play];

  for (const user of signups) {
    rows.push({
      id: `join:${user.id}`,
      at: user.createdAt,
      userId: user.id,
      username: nameOf(user),
      what: "Signed up",
      detail: null,
    });
  }

  for (const pack of packs) {
    rows.push({
      id: `pack:${pack.id}`,
      at: pack.paidAt ?? pack.createdAt,
      userId: pack.userId,
      username: nameOf(pack.user),
      what: `Bought ${formatGems(pack.gems)} gems`,
      detail: "Shop",
    });
  }

  return present(rows, limit);
}

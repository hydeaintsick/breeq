import { cache } from "react";
import { countedAccount } from "@/lib/admin-stats";
import { prisma } from "@/lib/prisma";
import { progressFromXp } from "@/lib/progress";

/** Names on the header board, podium included. */
export const LEADERBOARD_LIMIT = 10;

export type LeaderboardEntry = {
  rank: number;
  name: string;
  level: number;
  you: boolean;
};

export type Leaderboard = {
  entries: LeaderboardEntry[];
  /** The signed-in player when they fall outside `entries`. */
  you: LeaderboardEntry | null;
};

function playerName(user: { username: string | null; name: string | null }) {
  const username = user.username?.trim();
  if (username) return username;
  const name = user.name?.trim();
  if (name) return name;
  return "Player";
}

/**
 * Top players by level (XP), oldest account first on a tie.
 * Pass the signed-in player to pin their row when they sit past the window.
 * Cached per request so the home header and the Play menu share one read.
 */
export const getLeaderboard = cache(async (viewerId: string | null): Promise<Leaderboard> => {
  const users = await prisma.user.findMany({
    where: countedAccount,
    orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
    take: LEADERBOARD_LIMIT,
    select: { id: true, username: true, name: true, xp: true },
  });

  const entries: LeaderboardEntry[] = users.map((user, index) => ({
    rank: index + 1,
    name: playerName(user),
    level: progressFromXp(user.xp ?? 0).level,
    you: viewerId !== null && user.id === viewerId,
  }));

  if (!viewerId || entries.some((entry) => entry.you)) {
    return { entries, you: null };
  }

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { username: true, name: true, xp: true, createdAt: true, deletedAt: true },
  });
  if (!viewer || viewer.deletedAt) return { entries, you: null };

  const xp = Math.max(0, Math.floor(viewer.xp ?? 0));
  const ahead = await prisma.user.count({
    where: {
      AND: [countedAccount, { OR: [{ xp: { gt: xp } }, { xp, createdAt: { lt: viewer.createdAt } }] }],
    },
  });

  return {
    entries,
    you: {
      rank: ahead + 1,
      name: playerName(viewer),
      level: progressFromXp(xp).level,
      you: true,
    },
  };
});

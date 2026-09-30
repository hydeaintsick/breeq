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
 * The viewer's own row is pinned on when they sit past the window.
 */
export async function getLeaderboard(viewerId: string): Promise<Leaderboard> {
  const users = await prisma.user.findMany({
    orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
    take: LEADERBOARD_LIMIT,
    select: { id: true, username: true, name: true, xp: true },
  });

  const entries: LeaderboardEntry[] = users.map((user, index) => ({
    rank: index + 1,
    name: playerName(user),
    level: progressFromXp(user.xp ?? 0).level,
    you: user.id === viewerId,
  }));

  if (entries.some((entry) => entry.you)) {
    return { entries, you: null };
  }

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { username: true, name: true, xp: true, createdAt: true },
  });
  if (!viewer) return { entries, you: null };

  const xp = Math.max(0, Math.floor(viewer.xp ?? 0));
  const ahead = await prisma.user.count({
    where: {
      OR: [{ xp: { gt: xp } }, { xp, createdAt: { lt: viewer.createdAt } }],
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
}

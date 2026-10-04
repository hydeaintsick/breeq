import { prisma } from "@/lib/prisma";

/**
 * Delete a player and every row that would still count them: sessions, story
 * clears, Earn runs and maps, purchases, the ledger, withdrawals, referrals.
 * Plays on someone else's wall are taken off that wall's counters first.
 */
export async function purgePlayer(userId: string): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!target) return;

  const runs = await prisma.earnRun.findMany({
    where: { userId, map: { authorId: { not: userId } } },
    select: { mapId: true, outcome: true },
  });
  const deltas = new Map<string, { plays: number; wins: number }>();
  for (const run of runs) {
    const row = deltas.get(run.mapId) ?? { plays: 0, wins: 0 };
    row.plays += 1;
    if (run.outcome === "WON") row.wins += 1;
    deltas.set(run.mapId, row);
  }

  await prisma.$transaction(async (tx) => {
    for (const [mapId, delta] of deltas) {
      const map = await tx.earnMap.findUnique({
        where: { id: mapId },
        select: { plays: true, wins: true },
      });
      if (!map) continue;
      await tx.earnMap.update({
        where: { id: mapId },
        data: {
          plays: Math.max(0, map.plays - delta.plays),
          wins: Math.max(0, map.wins - delta.wins),
        },
      });
    }
    await tx.user.delete({ where: { id: userId } });
  });

  if (target.email) {
    await prisma.verificationToken.deleteMany({ where: { identifier: target.email } });
  }
}

import { prisma } from "@/lib/prisma";
import { gweiToEth } from "@/lib/economy";
import { parisDayKey, recentParisDays } from "@/lib/admin-time";

export const SERIES_DAYS = 14;

/**
 * Accounts an admin has removed stay stored and drop out of every admin number.
 * Mongo leaves the field unset until then, and `{ deletedAt: null }` does not
 * match an unset field, so both shapes count.
 */
export const countedAccount = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
};

/** Counts per Paris calendar day, oldest first, aligned with `days`. */
function bucket(dates: Date[], days: { key: string }[]): number[] {
  const counts = new Map(days.map((day) => [day.key, 0]));
  for (const date of dates) {
    const key = parisDayKey(date);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return days.map((day) => counts.get(day.key) ?? 0);
}

export type AdminStats = {
  /** Paris calendar labels for `series`, oldest first. */
  days: string[];
  players: { total: number; week: number; series: number[] };
  story: { clears: number; chapters: number };
  earn: {
    maps: number;
    runs: number;
    wins: number;
    runsWeek: number;
    series: number[];
    ticketsGems: number;
    payoutEth: number;
  };
  money: {
    purchases: number;
    gemsSold: number;
    usd: number;
    usdWeek: number;
    gemsInCirculation: number;
    ethOwed: number;
  };
  withdrawals: { pending: number; pendingEth: number; paidEth: number };
};

export async function getAdminStats(): Promise<AdminStats> {
  const days = recentParisDays(SERIES_DAYS);
  const since = days[0].start;
  const week = days[SERIES_DAYS - 7].start;

  const [
    players,
    playersWeek,
    playerDates,
    clears,
    chapters,
    maps,
    runs,
    wins,
    runsWeek,
    runDates,
    tickets,
    payouts,
    purchases,
    purchasesWeek,
    circulation,
    owed,
    pending,
    paid,
  ] = await Promise.all([
    prisma.user.count({ where: countedAccount }),
    prisma.user.count({ where: { ...countedAccount, createdAt: { gte: week } } }),
    prisma.user.findMany({ where: { ...countedAccount, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.chapterClear.count({ where: { user: { is: countedAccount } } }),
    prisma.chapter.count(),
    prisma.earnMap.count({ where: { status: "PUBLISHED", author: { is: countedAccount } } }),
    prisma.earnRun.count({ where: { user: { is: countedAccount } } }),
    prisma.earnRun.count({ where: { outcome: "WON", user: { is: countedAccount } } }),
    prisma.earnRun.count({ where: { createdAt: { gte: week }, user: { is: countedAccount } } }),
    prisma.earnRun.findMany({ where: { createdAt: { gte: since }, user: { is: countedAccount } }, select: { createdAt: true } }),
    prisma.ledgerEntry.aggregate({ where: { kind: "TICKET", user: { is: countedAccount } }, _sum: { gems: true } }),
    prisma.ledgerEntry.aggregate({ where: { kind: "PAYOUT", user: { is: countedAccount } }, _sum: { ethGwei: true } }),
    prisma.gemPurchase.aggregate({ where: { status: "PAID", user: { is: countedAccount } }, _sum: { gems: true, usdCents: true }, _count: true }),
    prisma.gemPurchase.aggregate({ where: { status: "PAID", paidAt: { gte: week }, user: { is: countedAccount } }, _sum: { usdCents: true } }),
    prisma.user.aggregate({ where: countedAccount, _sum: { gems: true } }),
    prisma.user.aggregate({ where: countedAccount, _sum: { ethGwei: true } }),
    prisma.withdrawal.aggregate({ where: { status: "PENDING", user: { is: countedAccount } }, _sum: { amountGwei: true }, _count: true }),
    prisma.withdrawal.aggregate({ where: { status: "PAID", user: { is: countedAccount } }, _sum: { amountGwei: true } }),
  ]);

  return {
    days: days.map((day) => day.label),
    players: { total: players, week: playersWeek, series: bucket(playerDates.map((row) => row.createdAt), days) },
    story: { clears, chapters },
    earn: {
      maps,
      runs,
      wins,
      runsWeek,
      series: bucket(runDates.map((row) => row.createdAt), days),
      ticketsGems: Math.abs(tickets._sum.gems ?? 0),
      payoutEth: gweiToEth(payouts._sum.ethGwei ?? 0n),
    },
    money: {
      purchases: purchases._count,
      gemsSold: purchases._sum.gems ?? 0,
      usd: (purchases._sum.usdCents ?? 0) / 100,
      usdWeek: (purchasesWeek._sum.usdCents ?? 0) / 100,
      gemsInCirculation: circulation._sum.gems ?? 0,
      ethOwed: gweiToEth(owed._sum.ethGwei ?? 0n),
    },
    withdrawals: {
      pending: pending._count,
      pendingEth: gweiToEth(pending._sum.amountGwei ?? 0n),
      paidEth: gweiToEth(paid._sum.amountGwei ?? 0n),
    },
  };
}

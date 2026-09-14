import { prisma } from "@/lib/prisma";
import { gweiToEth } from "@/lib/economy";

const DAY = 24 * 60 * 60 * 1000;
export const SERIES_DAYS = 14;

/** Counts per day for the last `SERIES_DAYS`, oldest first. */
function bucket(dates: Date[], now: number): number[] {
  const series = new Array<number>(SERIES_DAYS).fill(0);
  const start = now - (SERIES_DAYS - 1) * DAY;
  for (const date of dates) {
    const index = Math.floor((date.getTime() - start) / DAY);
    if (index >= 0 && index < SERIES_DAYS) series[index] += 1;
  }
  return series;
}

export type AdminStats = {
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
  const now = Date.now();
  const since = new Date(now - (SERIES_DAYS - 1) * DAY);
  since.setHours(0, 0, 0, 0);
  const week = new Date(now - 7 * DAY);

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
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.chapterClear.count(),
    prisma.chapter.count(),
    prisma.earnMap.count({ where: { status: "PUBLISHED" } }),
    prisma.earnRun.count(),
    prisma.earnRun.count({ where: { outcome: "WON" } }),
    prisma.earnRun.count({ where: { createdAt: { gte: week } } }),
    prisma.earnRun.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.ledgerEntry.aggregate({ where: { kind: "TICKET" }, _sum: { gems: true } }),
    prisma.ledgerEntry.aggregate({ where: { kind: "PAYOUT" }, _sum: { ethGwei: true } }),
    prisma.gemPurchase.aggregate({ where: { status: "PAID" }, _sum: { gems: true, usdCents: true }, _count: true }),
    prisma.gemPurchase.aggregate({ where: { status: "PAID", paidAt: { gte: week } }, _sum: { usdCents: true } }),
    prisma.user.aggregate({ _sum: { gems: true } }),
    prisma.user.aggregate({ _sum: { ethGwei: true } }),
    prisma.withdrawal.aggregate({ where: { status: "PENDING" }, _sum: { amountGwei: true }, _count: true }),
    prisma.withdrawal.aggregate({ where: { status: "PAID" }, _sum: { amountGwei: true } }),
  ]);

  return {
    players: { total: players, week: playersWeek, series: bucket(playerDates.map((row) => row.createdAt), since.getTime() + (SERIES_DAYS - 1) * DAY) },
    story: { clears, chapters },
    earn: {
      maps,
      runs,
      wins,
      runsWeek,
      series: bucket(runDates.map((row) => row.createdAt), since.getTime() + (SERIES_DAYS - 1) * DAY),
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

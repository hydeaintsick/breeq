import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { gweiToEth } from "@/lib/economy";
import { getEconomy } from "@/lib/earn";
import { platformLabel, signupMethodLabel } from "@/lib/acquisition";
import { parisDayKey, recentParisDays } from "@/lib/admin-time";
import { countedAccount } from "@/lib/admin-stats";

/** Decision window on the dashboard. Paris calendar days, today included. */
const BRIEF_DAYS = 30;
const TOP_COUNTRIES = 8;
/** A one-player country can be a single pack. Prefer a slightly larger base. */
const SOLID_COUNTRY = 3;

/** Opened the game, or a board was running, inside this window. */
export const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Play-time beats land about every 30s, so this is "a board is running". */
export const PLAYING_WINDOW_MS = 3 * 60 * 1000;

/** Cuts for the players list. The clock lives here so the page stays a pure render. */
export function activityCuts(now = new Date()) {
  return {
    now,
    activeCut: new Date(now.getTime() - ACTIVE_WINDOW_MS),
    playingCut: new Date(now.getTime() - PLAYING_WINDOW_MS),
  };
}

const PLATFORMS = ["android-app", "android-web", "ios", "desktop", "other"] as const;
const METHODS = ["guest", "google", "password", "wallet"] as const;

export function seenWhere(since: Date): Prisma.UserWhereInput {
  return { OR: [{ lastSeenAt: { gte: since } }, { lastPlayAt: { gte: since } }] };
}

/** `unknown` or an ISO code. Anything else is dropped. */
export function parseCountryParam(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.trim().toLowerCase() === "unknown") return "unknown";
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * Home country is the latest connection, then the one stored at sign-up.
 * Mongo does not match a missing field with `null`, so both shapes are named.
 */
export function countryWhere(country: string): Prisma.UserWhereInput {
  const missing = { OR: [{ lastCountry: null }, { lastCountry: { isSet: false } }] };
  if (country === "unknown") {
    return {
      AND: [missing, { OR: [{ signupCountry: null }, { signupCountry: { isSet: false } }] }],
    };
  }
  return {
    OR: [ { lastCountry: country }, { AND: [missing, { signupCountry: country }] } ],
  };
}

export type CountryTally = { code: string | null; players: number };

/** One home country per account: latest connection, then the sign-up country. */
export function tallyCountries(
  rows: { lastCountry: string | null; signupCountry: string | null }[],
): CountryTally[] {
  const map = new Map<string | null, number>();
  for (const row of rows) {
    const code = row.lastCountry ?? row.signupCountry;
    map.set(code, (map.get(code) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([code, players]) => ({ code, players }))
    .sort((a, b) => b.players - a.players || (a.code ?? "\uffff").localeCompare(b.code ?? "\uffff"));
}

export function formatShare(part: number, whole: number): string {
  if (whole <= 0 || part <= 0) return "0%";
  const value = (part / whole) * 100;
  if (value >= 10) return `${Math.round(value)}%`;
  return `${value.toFixed(1).replace(/\.0$/, "")}%`;
}

/** Median wait from sign-up to the first paid pack. */
export function formatLag(ms: number): string {
  const safe = Math.max(0, ms);
  const minutes = Math.round(safe / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(safe / 3_600_000);
  if (hours < 48) return `${hours}h`;
  const days = safe / 86_400_000;
  if (days < 10) return `${days.toFixed(1).replace(/\.0$/, "")}d`;
  return `${Math.round(days)}d`;
}

export type BriefSlice = { key: string; label: string; count: number };

export type AdminBrief = {
  days: string[];
  price: { ethUsd: number; priced: boolean };
  books: {
    collected: number;
    collectedWeek: number;
    collectedMonth: number;
    bagsEth: number;
    bagsUsd: number;
    waitingCount: number;
    waitingEth: number;
    waitingUsd: number;
    sentEth: number;
    sentUsd: number;
    /** Collected minus bags, waiting, and sent. Null until ETH has a reference price. */
    left: number | null;
    gemsSold: number;
    gemsInBags: number;
    cashSeries: number[];
  };
  growth: {
    players: number;
    week: number;
    month: number;
    guests: number;
    active: number;
    playing: number;
    buyers: number;
    lagMs: number | null;
    series: number[];
    clears: number;
    losses: number;
    playSeconds: number;
  };
  countries: {
    /** Distinct ISO codes. Unknown is not a country. */
    count: number;
    top: { code: string | null; players: number } | null;
    best: { code: string; players: number; usdPer: number } | null;
    rows: { code: string | null; players: number; usd: number }[];
  };
  arrival: {
    platforms: BriefSlice[];
    methods: BriefSlice[];
    partners: { name: string; count: number }[];
    referrals: number;
  };
  earn: {
    maps: number;
    runs: number;
    wins: number;
    losses: number;
    open: number;
    runsWeek: number;
    series: number[];
    ticketsGems: number;
    payoutEth: number;
  };
};

function usd(value: number) {
  return Math.round(value * 100) / 100;
}

function bucket(rows: { at: Date; amount: number }[], days: { key: string }[]): number[] {
  const sums = new Map(days.map((day) => [day.key, 0]));
  for (const row of rows) {
    const key = parisDayKey(row.at);
    if (!sums.has(key)) continue;
    sums.set(key, (sums.get(key) ?? 0) + row.amount);
  }
  return days.map((day) => sums.get(day.key) ?? 0);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function countKeys(rows: { key: string | null }[]): { key: string | null; count: number }[] {
  const map = new Map<string | null, number>();
  for (const row of rows) map.set(row.key, (map.get(row.key) ?? 0) + 1);
  return [...map.entries()].map(([key, count]) => ({ key, count }));
}

function slices(
  groups: { key: string | null; count: number }[],
  order: readonly string[],
  labelOf: (key: string | null) => string,
): BriefSlice[] {
  const map = new Map(groups.map((group) => [group.key, group.count]));
  const rows: BriefSlice[] = [];
  for (const key of order) {
    const count = map.get(key) ?? 0;
    if (count > 0) rows.push({ key, label: labelOf(key), count });
  }
  const unknown = map.get(null) ?? 0;
  if (unknown > 0) rows.push({ key: "unknown", label: "Unknown", count: unknown });
  for (const [key, count] of map) {
    if (key && !order.includes(key) && count > 0) rows.push({ key, label: labelOf(key), count });
  }
  return rows;
}

/**
 * The decision view. ETH in bags has already been debited when a withdrawal
 * is requested, so "left" subtracts bags, the queue, and what was sent —
 * valued at the reference price, not a live market.
 */
export async function getAdminBrief(now = new Date()): Promise<AdminBrief> {
  const days = recentParisDays(BRIEF_DAYS, now);
  const since = days[0].start;
  const weekStart = days[days.length - 7].start;
  const activeCut = new Date(now.getTime() - ACTIVE_WINDOW_MS);
  const playingCut = new Date(now.getTime() - PLAYING_WINDOW_MS);

  const [
    economy,
    players,
    playerDates,
    active,
    playing,
    totals,
    clears,
    losses,
    audience,
    referrals,
    purchases,
    owed,
    pending,
    paidOut,
    maps,
    runs,
    wins,
    lossesEarn,
    runDates,
    tickets,
    payouts,
  ] = await Promise.all([
    getEconomy(),
    prisma.user.count({ where: countedAccount }),
    prisma.user.findMany({
      where: { ...countedAccount, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.user.count({ where: { AND: [countedAccount, seenWhere(activeCut)] } }),
    prisma.user.count({ where: { AND: [countedAccount, { lastPlayAt: { gte: playingCut } }] } }),
    prisma.user.aggregate({ where: countedAccount, _sum: { gems: true, playSeconds: true } }),
    prisma.chapterClear.count({ where: { user: { is: countedAccount } } }),
    prisma.storyLoss.count({ where: { user: { is: countedAccount } } }),
    // Mongo's Prisma groupBy panics on these fields, so the rollup is done here.
    prisma.user.findMany({
      where: countedAccount,
      select: {
        signupCountry: true,
        lastCountry: true,
        signupPlatform: true,
        signupMethod: true,
        partner: true,
      },
    }),
    prisma.referral.count({ where: { referred: { is: countedAccount } } }),
    prisma.gemPurchase.findMany({
      where: { status: "PAID", user: { is: countedAccount } },
      select: {
        gems: true,
        usdCents: true,
        paidAt: true,
        createdAt: true,
        userId: true,
        user: { select: { createdAt: true, signupCountry: true, lastCountry: true } },
      },
    }),
    prisma.user.aggregate({ where: countedAccount, _sum: { ethGwei: true } }),
    prisma.withdrawal.aggregate({
      where: { status: "PENDING", user: { is: countedAccount } },
      _sum: { amountGwei: true },
      _count: true,
    }),
    prisma.withdrawal.aggregate({
      where: { status: "PAID", user: { is: countedAccount } },
      _sum: { amountGwei: true },
    }),
    prisma.earnMap.count({ where: { status: "PUBLISHED", author: { is: countedAccount } } }),
    prisma.earnRun.count({ where: { user: { is: countedAccount } } }),
    prisma.earnRun.count({ where: { outcome: "WON", user: { is: countedAccount } } }),
    prisma.earnRun.count({ where: { outcome: "LOST", user: { is: countedAccount } } }),
    prisma.earnRun.findMany({
      where: { createdAt: { gte: since }, user: { is: countedAccount } },
      select: { createdAt: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { kind: "TICKET", user: { is: countedAccount } },
      _sum: { gems: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { kind: "PAYOUT", user: { is: countedAccount } },
      _sum: { ethGwei: true },
    }),
  ]);

  const signupSeries = bucket(
    playerDates.map((row) => ({ at: row.createdAt, amount: 1 })),
    days,
  );
  const earnSeries = bucket(
    runDates.map((row) => ({ at: row.createdAt, amount: 1 })),
    days,
  );

  let collectedCents = 0;
  let weekCents = 0;
  let monthCents = 0;
  const cashCents = new Map(days.map((day) => [day.key, 0]));
  const countryCents = new Map<string | null, number>();
  const firstPaid = new Map<string, { paid: number; created: number }>();

  for (const purchase of purchases) {
    const at = purchase.paidAt ?? purchase.createdAt;
    collectedCents += purchase.usdCents;
    if (at >= weekStart) weekCents += purchase.usdCents;
    if (at >= since) monthCents += purchase.usdCents;
    const key = parisDayKey(at);
    if (cashCents.has(key)) cashCents.set(key, (cashCents.get(key) ?? 0) + purchase.usdCents);
    const home = purchase.user.lastCountry ?? purchase.user.signupCountry;
    countryCents.set(home, (countryCents.get(home) ?? 0) + purchase.usdCents);
    const paid = at.getTime();
    const prev = firstPaid.get(purchase.userId);
    if (!prev || paid < prev.paid) {
      firstPaid.set(purchase.userId, { paid, created: purchase.user.createdAt.getTime() });
    }
  }

  const priced = economy.ethPriceUsd > 0;
  const price = economy.ethPriceUsd;
  const bagsEth = gweiToEth(owed._sum.ethGwei ?? 0n);
  const waitingEth = gweiToEth(pending._sum.amountGwei ?? 0n);
  const sentEth = gweiToEth(paidOut._sum.amountGwei ?? 0n);
  const bagsUsd = priced ? usd(bagsEth * price) : 0;
  const waitingUsd = priced ? usd(waitingEth * price) : 0;
  const sentUsd = priced ? usd(sentEth * price) : 0;
  const collected = usd(collectedCents / 100);

  const tallies = tallyCountries(audience);
  const countries = tallies.map((row) => ({
    ...row,
    usd: (countryCents.get(row.code) ?? 0) / 100,
  }));
  const named = countries.filter((row): row is typeof row & { code: string } => row.code != null);
  const topPool = named.length > 0 ? named : countries;
  const top = topPool.reduce<(typeof topPool)[number] | null>((best, row) => {
    if (!best || row.players > best.players) return row;
    return best;
  }, null);
  const paying = named.filter((row) => row.usd > 0 && row.players > 0);
  const solid = paying.filter((row) => row.players >= SOLID_COUNTRY);
  const bestPool = solid.length > 0 ? solid : paying;
  const best = bestPool.reduce<(typeof bestPool)[number] | null>((winner, row) => {
    if (!winner) return row;
    return row.usd / row.players > winner.usd / winner.players ? row : winner;
  }, null);

  const lags = [...firstPaid.values()].map((row) => Math.max(0, row.paid - row.created));

  return {
    days: days.map((day) => day.label),
    price: { ethUsd: price, priced },
    books: {
      collected,
      collectedWeek: usd(weekCents / 100),
      collectedMonth: usd(monthCents / 100),
      bagsEth,
      bagsUsd,
      waitingCount: pending._count,
      waitingEth,
      waitingUsd,
      sentEth,
      sentUsd,
      left: priced ? usd(collected - bagsUsd - waitingUsd - sentUsd) : null,
      gemsSold: purchases.reduce((total, purchase) => total + purchase.gems, 0),
      gemsInBags: totals._sum.gems ?? 0,
      cashSeries: days.map((day) => usd((cashCents.get(day.key) ?? 0) / 100)),
    },
    growth: {
      players,
      week: signupSeries.slice(-7).reduce((total, value) => total + value, 0),
      month: signupSeries.reduce((total, value) => total + value, 0),
      guests: audience.filter((row) => row.signupMethod === "guest").length,
      active,
      playing,
      buyers: firstPaid.size,
      lagMs: median(lags),
      series: signupSeries,
      clears,
      losses,
      playSeconds: totals._sum.playSeconds ?? 0,
    },
    countries: {
      count: named.length,
      top: top ? { code: top.code, players: top.players } : null,
      best: best ? { code: best.code, players: best.players, usdPer: best.usd / best.players } : null,
      rows: countries.slice(0, TOP_COUNTRIES),
    },
    arrival: {
      platforms: slices(
        countKeys(audience.map((row) => ({ key: row.signupPlatform }))),
        PLATFORMS,
        (key) => platformLabel(key),
      ),
      methods: slices(
        countKeys(audience.map((row) => ({ key: row.signupMethod }))),
        METHODS,
        (key) => (key ? signupMethodLabel(key) : "Unknown"),
      ),
      partners: countKeys(audience.map((row) => ({ key: row.partner })))
        .filter((row): row is { key: string; count: number } => Boolean(row.key) && row.count > 0)
        .map((row) => ({ name: row.key, count: row.count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      referrals,
    },
    earn: {
      maps,
      runs,
      wins,
      losses: lossesEarn,
      open: Math.max(0, runs - wins - lossesEarn),
      runsWeek: earnSeries.slice(-7).reduce((total, value) => total + value, 0),
      series: earnSeries,
      ticketsGems: Math.abs(tickets._sum.gems ?? 0),
      payoutEth: gweiToEth(payouts._sum.ethGwei ?? 0n),
    },
  };
}

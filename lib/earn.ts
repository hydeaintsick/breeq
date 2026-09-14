import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ECONOMY,
  ECONOMY_ID,
  gweiToEth,
  parsePacks,
  payoutFor,
  type Economy,
} from "@/lib/economy";
import { resolveBackgroundSrc } from "@/lib/gradients";
import { boardPhoto } from "@/lib/photo";
import { difficultyTier } from "@/game/breakout/engine/difficulty";

// --- Settings ----------------------------------------------------------------

export const getEconomy = cache(async function getEconomy(): Promise<Economy> {
  const row = await prisma.economySettings.findUnique({ where: { id: ECONOMY_ID } });
  if (!row) return DEFAULT_ECONOMY;
  return {
    gemPriceUsd: row.gemPriceUsd,
    ethPriceUsd: row.ethPriceUsd,
    winMultiplier: row.winMultiplier,
    withdrawMinEth: row.withdrawMinEth,
    publishCostGems: row.publishCostGems,
    ticketMinGems: row.ticketMinGems,
    ticketMaxGems: row.ticketMaxGems,
    ticketDefaultGems: row.ticketDefaultGems,
    packs: parsePacks(row.packs),
  };
});

// --- Balances ----------------------------------------------------------------

export type Balances = {
  gems: number;
  /** Gwei as a decimal string: BigInt does not cross the server boundary. */
  ethGwei: string;
  eth: number;
};

export function toBalances(row: { gems: number; ethGwei: bigint } | null | undefined): Balances {
  const gwei = row?.ethGwei ?? 0n;
  return { gems: row?.gems ?? 0, ethGwei: gwei.toString(), eth: gweiToEth(gwei) };
}

export const getBalances = cache(async function getBalances(userId: string): Promise<Balances> {
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { gems: true, ethGwei: true } });
  return toBalances(row);
});

// --- The teaser on the game menu ----------------------------------------------

export type EarnTeaser = {
  /** Walls on sale. */
  walls: number;
  /** The biggest pot on the floor right now, in ETH (0 when nothing is on sale). */
  topPotEth: number;
  /** Its ticket, in gems. */
  topTicketGems: number;
  /** ETH paid to players since the start. */
  paidOutEth: number;
};

/** What the Earn card on the menu shows: the floor's size, the biggest pot, what has been paid out. */
export const getEarnTeaser = cache(async function getEarnTeaser(): Promise<EarnTeaser> {
  const [economy, maps, paid] = await Promise.all([
    getEconomy(),
    prisma.earnMap.aggregate({ where: { status: "PUBLISHED" }, _count: { _all: true }, _max: { ticketGems: true } }),
    prisma.ledgerEntry.aggregate({ where: { kind: "PAYOUT" }, _sum: { ethGwei: true } }),
  ]);
  const topTicketGems = maps._max.ticketGems ?? 0;
  return {
    walls: maps._count._all,
    topPotEth: topTicketGems > 0 ? payoutFor(topTicketGems, economy).eth : 0,
    topTicketGems,
    paidOutEth: gweiToEth(paid._sum.ethGwei ?? 0n),
  };
});

// --- Maps --------------------------------------------------------------------

export type EarnSort = "plays" | "new" | "easy" | "hard" | "payout";

export const EARN_SORTS: { id: EarnSort; label: string }[] = [
  { id: "plays", label: "Most played" },
  { id: "new", label: "Newest" },
  { id: "payout", label: "Biggest win" },
  { id: "easy", label: "Easiest" },
  { id: "hard", label: "Hardest" },
];

export function isEarnSort(value: unknown): value is EarnSort {
  return EARN_SORTS.some((sort) => sort.id === value);
}

/** What a store card needs; the level travels as its stored JSON. */
export type EarnMapCard = {
  id: string;
  slug: string;
  title: string;
  author: string;
  level: unknown;
  /** The photo (sized for a card) or the gradient, ready for the engine. */
  backgroundSrc: string;
  ticketGems: number;
  difficulty: number;
  difficultyLabel: string;
  tier: number;
  plays: number;
  wins: number;
  /** Today's payout for this ticket; the real one is locked when a run starts. */
  payoutEth: number;
  payoutUsd: number;
  /** This player already cleared it and was paid: no second run. */
  won: boolean;
  /** This player built it: no ticket, no payout. */
  mine: boolean;
  featured: boolean;
  createdAt: string;
};

const CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  level: true,
  backgroundUrl: true,
  gradientId: true,
  ticketGems: true,
  difficulty: true,
  difficultyLabel: true,
  plays: true,
  wins: true,
  featured: true,
  authorId: true,
  createdAt: true,
  author: { select: { username: true, name: true } },
} satisfies Prisma.EarnMapSelect;

type CardRow = Prisma.EarnMapGetPayload<{ select: typeof CARD_SELECT }>;

function toCard(row: CardRow, economy: Economy, won: ReadonlySet<string>, userId: string): EarnMapCard {
  const payout = payoutFor(row.ticketGems, economy);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author.username ?? row.author.name ?? "player",
    level: row.level,
    backgroundSrc: resolveBackgroundSrc(row.backgroundUrl, row.gradientId, boardPhoto),
    ticketGems: row.ticketGems,
    difficulty: row.difficulty,
    difficultyLabel: row.difficultyLabel,
    tier: difficultyTier(row.difficulty).tier,
    plays: row.plays,
    wins: row.wins,
    payoutEth: payout.eth,
    payoutUsd: payout.usd,
    won: won.has(row.id),
    mine: row.authorId === userId,
    featured: row.featured,
    createdAt: row.createdAt.toISOString(),
  };
}

async function wonMapIds(userId: string, mapIds: string[]): Promise<Set<string>> {
  if (mapIds.length === 0) return new Set();
  const rows = await prisma.earnRun.findMany({
    where: { userId, outcome: "WON", mapId: { in: mapIds } },
    select: { mapId: true },
  });
  return new Set(rows.map((row) => row.mapId));
}

function orderFor(sort: EarnSort): Prisma.EarnMapOrderByWithRelationInput[] {
  switch (sort) {
    case "new":
      return [{ createdAt: "desc" }, { id: "desc" }];
    case "easy":
      return [{ difficulty: "asc" }, { id: "desc" }];
    case "hard":
      return [{ difficulty: "desc" }, { id: "desc" }];
    case "payout":
      return [{ ticketGems: "desc" }, { id: "desc" }];
    case "plays":
    default:
      return [{ plays: "desc" }, { id: "desc" }];
  }
}

export const STORE_PAGE_SIZE = 12;

export type EarnPage = { items: EarnMapCard[]; nextCursor: string | null };

/** One page of the store's grid. `cursor` is the last id of the previous page. */
export async function listEarnMaps(input: {
  userId: string;
  sort: EarnSort;
  cursor?: string | null;
  take?: number;
}): Promise<EarnPage> {
  const take = Math.min(24, Math.max(1, input.take ?? STORE_PAGE_SIZE));
  const [economy, rows] = await Promise.all([
    getEconomy(),
    prisma.earnMap.findMany({
      where: { status: "PUBLISHED" },
      orderBy: orderFor(input.sort),
      take: take + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      select: CARD_SELECT,
    }),
  ]);
  const page = rows.slice(0, take);
  const won = await wonMapIds(input.userId, page.map((row) => row.id));
  return {
    items: page.map((row) => toCard(row, economy, won, input.userId)),
    nextCursor: rows.length > take ? page[page.length - 1].id : null,
  };
}

export type EarnStore = {
  featured: EarnMapCard[];
  mostPlayed: EarnMapCard[];
  page: EarnPage;
  balances: Balances;
  economy: Economy;
  total: number;
};

export async function getEarnStore(userId: string, sort: EarnSort): Promise<EarnStore> {
  const [economy, featuredRows, playedRows, balances, total, page] = await Promise.all([
    getEconomy(),
    prisma.earnMap.findMany({
      where: { status: "PUBLISHED", featured: true },
      orderBy: [{ featuredOrder: "asc" }, { updatedAt: "desc" }],
      take: 10,
      select: CARD_SELECT,
    }),
    prisma.earnMap.findMany({
      where: { status: "PUBLISHED", plays: { gt: 0 } },
      orderBy: [{ plays: "desc" }, { id: "desc" }],
      take: 10,
      select: CARD_SELECT,
    }),
    getBalances(userId),
    prisma.earnMap.count({ where: { status: "PUBLISHED" } }),
    listEarnMaps({ userId, sort }),
  ]);
  const ids = [...featuredRows, ...playedRows].map((row) => row.id);
  const won = await wonMapIds(userId, ids);
  return {
    featured: featuredRows.map((row) => toCard(row, economy, won, userId)),
    mostPlayed: playedRows.map((row) => toCard(row, economy, won, userId)),
    page,
    balances,
    economy,
    total,
  };
}

export async function getEarnMapBySlug(slug: string, userId: string): Promise<EarnMapCard | null> {
  const [economy, row] = await Promise.all([
    getEconomy(),
    prisma.earnMap.findFirst({ where: { slug, status: "PUBLISHED" }, select: CARD_SELECT }),
  ]);
  if (!row) return null;
  const won = await wonMapIds(userId, [row.id]);
  return toCard(row, economy, won, userId);
}

export async function getMyMaps(userId: string): Promise<EarnMapCard[]> {
  const [economy, rows] = await Promise.all([
    getEconomy(),
    prisma.earnMap.findMany({
      where: { authorId: userId },
      orderBy: [{ createdAt: "desc" }],
      select: CARD_SELECT,
    }),
  ]);
  return rows.map((row) => toCard(row, economy, new Set(), userId));
}

// --- Wallet ------------------------------------------------------------------

export type LedgerLine = {
  id: string;
  kind: string;
  gems: number;
  eth: number;
  note: string | null;
  createdAt: string;
};

export async function getLedger(userId: string, take = 40): Promise<LedgerLine[]> {
  const rows = await prisma.ledgerEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    gems: row.gems,
    eth: gweiToEth(row.ethGwei),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  }));
}

export type WithdrawalLine = {
  id: string;
  eth: number;
  toAddress: string;
  status: string;
  txHash: string | null;
  note: string | null;
  createdAt: string;
};

export async function getWithdrawals(userId: string): Promise<WithdrawalLine[]> {
  const rows = await prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return rows.map((row) => ({
    id: row.id,
    eth: gweiToEth(row.amountGwei),
    toAddress: row.toAddress,
    status: row.status,
    txHash: row.txHash,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  }));
}

/** Player-wide Earn counters for the wallet page. */
export async function getEarnRecord(userId: string) {
  const [runs, wins, maps] = await Promise.all([
    prisma.earnRun.count({ where: { userId, outcome: { not: "OPEN" } } }),
    prisma.earnRun.count({ where: { userId, outcome: "WON" } }),
    prisma.earnMap.count({ where: { authorId: userId } }),
  ]);
  return { runs, wins, maps };
}

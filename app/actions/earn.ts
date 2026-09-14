"use server";

import { randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireEarn, requireUser } from "@/lib/auth/session";
import { EARN_PATH, EARN_TOPUP_PATH, EARN_WALLET_PATH, GAME_MENU_PATH, GAME_ROOT_PATH } from "@/lib/auth/paths";
import { ensureBalanceFields } from "@/lib/balances";
import { uploadEarnBackground } from "@/lib/cloudinary";
import {
  clampTicket,
  ethToGwei,
  formatEth,
  formatGems,
  isHexAddress,
  packPriceCents,
  payoutFor,
  type Payout,
} from "@/lib/economy";
import {
  getBalances,
  getEconomy,
  isEarnSort,
  listEarnMaps,
  toBalances,
  type Balances,
  type EarnPage,
  type EarnSort,
} from "@/lib/earn";
import { findGradient } from "@/lib/gradients";
import { creditGems, fulfilPurchase } from "@/lib/purchases";
import { slugify } from "@/lib/slug";
import { earnSandbox, stripe, stripeConfigured } from "@/lib/stripe";
import { parseStoredLevel, rateDifficulty, serializeLevel, validateLevel } from "@/game/breakout/engine";

/** A run left open longer than this counts as abandoned. */
const RUN_TTL_MS = 45 * 60 * 1000;

/** The same proof the seed script trusts, sized to answer inside a request. */
const PUBLISH_RATING = { runs: 8, maxSeconds: 240, proofSeeds: [1, 2, 3, 4] };

type Fail = { error: string; need?: number };

function fail(error: string, need?: number): Fail {
  return need === undefined ? { error } : { error, need };
}

function revalidateEarn() {
  revalidatePath(EARN_PATH);
  revalidatePath(EARN_WALLET_PATH);
  revalidatePath(GAME_ROOT_PATH, "layout");
}

// --- Store -------------------------------------------------------------------

export async function loadEarnPage(input: { sort: string; cursor: string | null }): Promise<EarnPage> {
  const { user } = await requireEarn();
  const sort: EarnSort = isEarnSort(input.sort) ? input.sort : "plays";
  return listEarnMaps({ userId: user.id, sort, cursor: input.cursor });
}

// --- Runs --------------------------------------------------------------------

export type RunStart = {
  runId: string;
  seed: number;
  ticketGems: number;
  payoutEth: number;
  payoutUsd: number;
  balances: Balances;
};

/**
 * Pay the ticket and open a run. Any run this player still has open is
 * forfeited first, so closing the tab mid-run never buys a free retry.
 */
export async function startEarnRun(mapId: string): Promise<RunStart | Fail> {
  const { user } = await requireEarn();
  const [map, economy] = await Promise.all([
    prisma.earnMap.findFirst({
      where: { id: mapId, status: "PUBLISHED" },
      select: { id: true, authorId: true, ticketGems: true },
    }),
    getEconomy(),
  ]);
  if (!map) return fail("This map is no longer available.");
  if (map.authorId === user.id) return fail("You built this wall. Your own map pays no ETH.");

  const won = await prisma.earnRun.findFirst({
    where: { userId: user.id, mapId: map.id, outcome: "WON" },
    select: { id: true },
  });
  if (won) return fail("You already cleared this map and were paid. One win per map.");

  await Promise.all([
    prisma.earnRun.updateMany({
      where: { userId: user.id, outcome: "OPEN" },
      data: { outcome: "LOST", endedAt: new Date() },
    }),
    ensureBalanceFields(user.id),
  ]);

  const debit = await prisma.user.updateMany({
    where: { id: user.id, gems: { gte: map.ticketGems } },
    data: { gems: { decrement: map.ticketGems } },
  });
  if (debit.count === 0) {
    const balances = await getBalances(user.id);
    return fail(`You need ${formatGems(map.ticketGems)} gems for this ticket.`, map.ticketGems - balances.gems);
  }

  const payout: Payout = payoutFor(map.ticketGems, economy);
  const seed = randomInt(1, 2 ** 31 - 1);
  const [run] = await prisma.$transaction([
    prisma.earnRun.create({
      data: {
        userId: user.id,
        mapId: map.id,
        ticketGems: map.ticketGems,
        seed,
        payoutGwei: payout.gwei,
        payoutUsd: payout.usd,
      },
      select: { id: true },
    }),
    prisma.ledgerEntry.create({
      data: { userId: user.id, kind: "TICKET", gems: -map.ticketGems, ref: map.id, note: "Ticket" },
    }),
    prisma.earnMap.update({ where: { id: map.id }, data: { plays: { increment: 1 } } }),
  ]);

  const balances = await prisma.user.findUnique({ where: { id: user.id }, select: { gems: true, ethGwei: true } });
  return {
    runId: run.id,
    seed,
    ticketGems: map.ticketGems,
    payoutEth: payout.eth,
    payoutUsd: payout.usd,
    balances: toBalances(balances),
  };
}

export type RunEnd = {
  outcome: "WON" | "LOST";
  payoutEth: number;
  payoutUsd: number;
  balances: Balances;
  /** Balances before the payout, for the counter. */
  before: Balances;
};

/** Close a run. A win credits the payout that was locked in at the start. */
export async function finishEarnRun(runId: string, input: { won: boolean; score: number }): Promise<RunEnd | Fail> {
  const user = await requireUser();
  const run = await prisma.earnRun.findFirst({
    where: { id: runId, userId: user.id },
    select: { id: true, mapId: true, outcome: true, payoutGwei: true, payoutUsd: true, createdAt: true },
  });
  if (!run) return fail("Run not found.");
  const before = await getBalances(user.id);
  if (run.outcome !== "OPEN") {
    return { outcome: run.outcome, payoutEth: 0, payoutUsd: 0, balances: before, before };
  }
  const expired = Date.now() - run.createdAt.getTime() > RUN_TTL_MS;
  const won = input.won && !expired;
  const score = Math.max(0, Math.min(1_000_000, Math.round(Number(input.score) || 0)));

  const gate = await prisma.earnRun.updateMany({
    where: { id: run.id, outcome: "OPEN" },
    data: { outcome: won ? "WON" : "LOST", score, endedAt: new Date() },
  });
  if (gate.count === 0) {
    return { outcome: "LOST", payoutEth: 0, payoutUsd: 0, balances: before, before };
  }

  if (!won) {
    revalidateEarn();
    return { outcome: "LOST", payoutEth: 0, payoutUsd: 0, balances: before, before };
  }

  await ensureBalanceFields(user.id);
  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { ethGwei: { increment: run.payoutGwei } },
      select: { gems: true, ethGwei: true },
    }),
    prisma.ledgerEntry.create({
      data: {
        userId: user.id,
        kind: "PAYOUT",
        ethGwei: run.payoutGwei,
        ref: run.mapId,
        note: `Win · ${formatEth(Number(run.payoutGwei) / 1e9)}`,
      },
    }),
    prisma.earnMap.update({ where: { id: run.mapId }, data: { wins: { increment: 1 } } }),
  ]);
  revalidateEarn();
  return {
    outcome: "WON",
    payoutEth: Number(run.payoutGwei) / 1e9,
    payoutUsd: run.payoutUsd,
    balances: toBalances(updated),
    before,
  };
}

/** Quit mid-run: the ticket is spent. */
export async function forfeitEarnRun(runId: string): Promise<void> {
  const user = await requireUser();
  await prisma.earnRun.updateMany({
    where: { id: runId, userId: user.id, outcome: "OPEN" },
    data: { outcome: "LOST", endedAt: new Date() },
  });
}

// --- Publishing --------------------------------------------------------------

export type PublishResult = { slug: string; difficulty: number; label: string; balances: Balances };

async function uniqueMapSlug(base: string) {
  let slug = base;
  let n = 2;
  while (await prisma.earnMap.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

/**
 * Publish a map. The wall is validated and proved again on the server: the
 * flawless autopilot must clear it, and its rating is what the store shows.
 * Publishing costs gems, charged only once the proof passes.
 */
export async function publishEarnMap(formData: FormData): Promise<PublishResult | Fail> {
  const { user } = await requireEarn();
  const economy = await getEconomy();

  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 2 || title.length > 40) return fail("Name your map: 2–40 characters.");

  const ticketGems = clampTicket(formData.get("ticketGems"), economy);
  const gradientRaw = String(formData.get("gradientId") ?? "");
  const gradient = findGradient(gradientRaw);
  const image = formData.get("image");
  const hasImage = image instanceof File && image.size > 0;
  if (!hasImage && !gradient) return fail("Pick a photo or a gradient for the sky.");

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("level") ?? "null"));
  } catch {
    return fail("The wall could not be read. Try again.");
  }
  const author = user.username ?? user.name ?? "player";
  const level = parseStoredLevel(raw, { id: "draft", name: title, author });
  level.name = title;
  level.author = author;

  const errors = validateLevel(level).filter((issue) => issue.level === "error");
  if (errors.length > 0) return fail(errors[0].message);

  const rating = rateDifficulty(level, PUBLISH_RATING);
  if (!rating.clearable) {
    return fail("Our robot could not clear this wall. Open a path, add lives, or ease a rule, then try again.");
  }

  let backgroundUrl: string | null = null;
  if (hasImage) {
    try {
      backgroundUrl = await uploadEarnBackground(image);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Could not upload the photo.");
    }
  }

  const cost = economy.publishCostGems;
  if (cost > 0) {
    await ensureBalanceFields(user.id);
    const debit = await prisma.user.updateMany({
      where: { id: user.id, gems: { gte: cost } },
      data: { gems: { decrement: cost } },
    });
    if (debit.count === 0) {
      const balances = await getBalances(user.id);
      return fail(`Publishing costs ${formatGems(cost)} gems.`, cost - balances.gems);
    }
  }

  const slug = await uniqueMapSlug(slugify(title, "map"));
  const map = await prisma.earnMap.create({
    data: {
      authorId: user.id,
      title,
      slug,
      level: {} as Prisma.InputJsonValue,
      backgroundUrl,
      gradientId: backgroundUrl ? null : gradient?.id ?? null,
      ticketGems,
      difficulty: rating.score,
      difficultyLabel: rating.label,
      meanSeconds: rating.meanSeconds,
    },
    select: { id: true },
  });
  level.id = map.id;
  // The sky is resolved at read time from `backgroundUrl` / `gradientId`; the
  // stored level keeps no photo URL of its own.
  level.background = { ...level.background, src: "" };
  await prisma.$transaction([
    prisma.earnMap.update({ where: { id: map.id }, data: { level: serializeLevel(level) as Prisma.InputJsonValue } }),
    ...(cost > 0
      ? [
          prisma.ledgerEntry.create({
            data: { userId: user.id, kind: "PUBLISH", gems: -cost, ref: map.id, note: `Published “${title}”` },
          }),
        ]
      : []),
  ]);

  revalidateEarn();
  return { slug, difficulty: rating.score, label: rating.label, balances: await getBalances(user.id) };
}

// --- Top-up (Stripe) ---------------------------------------------------------

async function siteOrigin() {
  const list = await headers();
  const origin = list.get("origin");
  if (origin) return origin;
  const host = list.get("x-forwarded-host") ?? list.get("host");
  const proto = list.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return process.env.AUTH_URL ?? "http://localhost:3333";
}

/** Open a Stripe Checkout Session for one pack. The client follows `url`. */
/** Where Stripe sends the player back: the game page the shop was opened from, never anywhere else. */
function checkoutReturnPath(candidate: string | undefined) {
  if (candidate && /^\/game(\/[A-Za-z0-9_-]+)*\/?$/.test(candidate)) return candidate.replace(/\/$/, "") || GAME_MENU_PATH;
  return EARN_PATH;
}

export async function createGemCheckout(packGems: number, returnTo?: string): Promise<{ url: string } | Fail> {
  const { user } = await requireEarn();
  const back = checkoutReturnPath(returnTo);
  if (!stripeConfigured()) return fail("Payments are not set up yet.");
  const economy = await getEconomy();
  const pack = economy.packs.find((item) => item.gems === packGems);
  if (!pack) return fail("That pack is not on sale.");

  const cents = packPriceCents(pack, economy);
  const purchase = await prisma.gemPurchase.create({
    data: { userId: user.id, gems: pack.gems, usdCents: cents, discountPct: pack.discountPct },
    select: { id: true },
  });

  const origin = await siteOrigin();
  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } });
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: purchase.id,
      customer_email: account?.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: cents,
            product_data: {
              name: `${formatGems(pack.gems)} gems`,
              description:
                pack.discountPct > 0
                  ? `Breeq gem pack · ${pack.discountPct}% off the list price`
                  : "Breeq gem pack",
            },
          },
        },
      ],
      metadata: { purchaseId: purchase.id, userId: user.id, gems: String(pack.gems) },
      success_url: `${origin}${back}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${back}?checkout=canceled`,
    });
    if (!session.url) throw new Error("Stripe returned no checkout URL.");
    await prisma.gemPurchase.update({ where: { id: purchase.id }, data: { stripeSessionId: session.id } });
    return { url: session.url };
  } catch (error) {
    await prisma.gemPurchase.update({ where: { id: purchase.id }, data: { status: "FAILED" } });
    console.error("stripe checkout failed", error);
    return fail("Could not open the checkout. Try again in a moment.");
  }
}

/** Back from Checkout: credit the pack if Stripe says it is paid (idempotent). */
export async function claimCheckout(sessionId: string): Promise<{ credited: boolean; gems: number; balances: Balances } | Fail> {
  const user = await requireUser();
  if (!stripeConfigured()) return fail("Payments are not set up yet.");
  const purchase = await prisma.gemPurchase.findUnique({
    where: { stripeSessionId: sessionId },
    select: { userId: true },
  });
  if (!purchase || purchase.userId !== user.id) return fail("Purchase not found.");
  const result = await fulfilPurchase(sessionId);
  if (!result) return fail("Purchase not found.");
  revalidateEarn();
  revalidatePath(EARN_TOPUP_PATH);
  return { ...result, balances: await getBalances(user.id) };
}

/** Local development only: gems without a card. */
export async function sandboxTopUp(packGems: number): Promise<{ gems: number; balances: Balances } | Fail> {
  const { user } = await requireEarn();
  if (!earnSandbox()) return fail("The sandbox is off.");
  const economy = await getEconomy();
  const pack = economy.packs.find((item) => item.gems === packGems);
  if (!pack) return fail("That pack is not on sale.");
  await creditGems({ userId: user.id, gems: pack.gems, kind: "TOPUP", note: `${formatGems(pack.gems)} gems (sandbox)` });
  revalidateEarn();
  revalidatePath(EARN_TOPUP_PATH);
  return { gems: pack.gems, balances: await getBalances(user.id) };
}

// --- Withdrawals -------------------------------------------------------------

/** Ask for ETH. The amount leaves the balance now and is sent by an admin. */
export async function requestWithdrawal(input: { eth: number; toAddress: string }): Promise<{ ok: true; balances: Balances } | Fail> {
  const user = await requireUser();
  const economy = await getEconomy();
  const address = input.toAddress.trim();
  if (!isHexAddress(address)) return fail("Enter a valid Ethereum address (0x…, 40 hex characters).");
  const eth = Number(input.eth);
  if (!Number.isFinite(eth) || eth <= 0) return fail("Enter an amount.");
  if (eth < economy.withdrawMinEth) return fail(`Withdrawals start at ${formatEth(economy.withdrawMinEth)}.`);
  const gwei = ethToGwei(eth);

  const pending = await prisma.withdrawal.count({ where: { userId: user.id, status: "PENDING" } });
  if (pending > 0) return fail("You already have a withdrawal on its way. One at a time.");

  await ensureBalanceFields(user.id);
  const debit = await prisma.user.updateMany({
    where: { id: user.id, ethGwei: { gte: gwei } },
    data: { ethGwei: { decrement: gwei } },
  });
  if (debit.count === 0) return fail("That is more than your balance.");

  const withdrawal = await prisma.withdrawal.create({
    data: { userId: user.id, amountGwei: gwei, toAddress: address },
    select: { id: true },
  });
  await prisma.ledgerEntry.create({
    data: { userId: user.id, kind: "WITHDRAW", ethGwei: -gwei, ref: withdrawal.id, note: `Withdrawal to ${address.slice(0, 6)}…${address.slice(-4)}` },
  });
  revalidateEarn();
  return { ok: true, balances: await getBalances(user.id) };
}

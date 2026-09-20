"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { GAME_ROOT_PATH } from "@/lib/auth/paths";
import { ensureBalanceFields } from "@/lib/balances";
import { getBalances, toBalances, type Balances } from "@/lib/earn";
import { formatGems } from "@/lib/economy";
import { fulfilPaymentIntent } from "@/lib/purchases";
import { REVIVE_GEMS, REVIVE_LIVES } from "@/lib/revive";

type Fail = { error: string; need?: number };

/** What the revive moment animates: the gems leaving, the heart landing. */
export type ReviveBought = {
  chapterId: string;
  /** Lives put back on the paddle. */
  lives: number;
  cost: number;
  before: Balances;
  balances: Balances;
  /** Set when a gem pack was paid by card in the same breath: what landed in the bag first. */
  paid?: { gems: number; cents: number };
};

/** The debit and the ledger line, for a user already checked. */
async function heart(userId: string, chapterId: string, title: string): Promise<ReviveBought | Fail> {
  await ensureBalanceFields(userId);
  const before = await getBalances(userId);
  const debit = await prisma.user.updateMany({
    where: { id: userId, gems: { gte: REVIVE_GEMS } },
    data: { gems: { decrement: REVIVE_GEMS } },
  });
  if (debit.count === 0) {
    return { error: `A heart costs ${formatGems(REVIVE_GEMS)} gems.`, need: REVIVE_GEMS - before.gems };
  }
  await prisma.ledgerEntry.create({
    data: { userId, kind: "REVIVE", gems: -REVIVE_GEMS, ref: chapterId, note: `Revive · ${title}` },
  });
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { gems: true, ethGwei: true } });
  revalidatePath(GAME_ROOT_PATH, "layout");
  return { chapterId, lives: REVIVE_LIVES, cost: REVIVE_GEMS, before, balances: toBalances(row) };
}

/**
 * Buy a heart with gems after the last ball of a Story run. One guarded
 * `updateMany` (`gems: { gte }`) so a double tap buys once; the ledger keeps
 * the line. Short on gems, the answer says by how many so the revive sheet
 * can open its checkout. The board itself is revived by the client — the run
 * is deterministic and its outcome client-reported, like every Story run.
 */
export async function buyRevive(chapterId: string): Promise<ReviveBought | Fail> {
  const user = await requireUser();
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true, title: true } });
  if (!chapter) return { error: "Chapter not found." };
  return heart(user.id, chapter.id, chapter.title);
}

/**
 * The revive sheet's checkout: a gem pack was just paid by card inside the
 * sheet. Credit the pack — first one past the `PENDING → PAID` gate, the
 * webhook being the other — then buy the heart with the gems that landed,
 * and answer with one landing. If the heart cannot be paid after all, the
 * gems stay in the bag and the error says so; nothing is charged twice.
 */
export async function claimRevivePayment(paymentIntentId: string, chapterId: string): Promise<ReviveBought | Fail> {
  const user = await requireUser();
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true, title: true } });
  if (!chapter) return { error: "Chapter not found." };
  const purchase = await prisma.gemPurchase.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { userId: true, usdCents: true },
  });
  if (!purchase || purchase.userId !== user.id) return { error: "Purchase not found." };
  const paid = await fulfilPaymentIntent(paymentIntentId);
  if (!paid || paid.gems === 0) return { error: "Stripe has not confirmed the payment yet. Your gems land as soon as it does." };
  const result = await heart(user.id, chapter.id, chapter.title);
  if ("error" in result) return { error: `${formatGems(paid.gems)} gems landed in your bag, but the heart could not be paid. ${result.error}` };
  return { ...result, paid: { gems: paid.gems, cents: purchase.usdCents } };
}

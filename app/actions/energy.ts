"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { GAME_ROOT_PATH } from "@/lib/auth/paths";
import { ensureBalanceFields } from "@/lib/balances";
import { getBalances, toBalances, type Balances } from "@/lib/earn";
import { formatGems } from "@/lib/economy";
import { ENERGY_PLAY_COST, energyPack, type EnergyPack, type EnergyState } from "@/lib/energy";
import { creditEnergy, readEnergy, spendEnergy } from "@/lib/energy-store";
import { fulfilPaymentIntent } from "@/lib/purchases";

/** The ball is served: the cells left the gauge. */
export type RunStarted = { energy: EnergyState; cost: number };
/** The gauge could not pay: what it holds, so the shop opens on the truth. */
export type RunRefused = { error: "Out of energy." | "Chapter not found."; energy: EnergyState };

/**
 * Pay for a Story run. Every run costs `ENERGY_PLAY_COST` cells — first
 * tries, retries and replays alike; the clear pays one back. The debit is one
 * guarded `updateMany`, so two taps cannot serve two balls on one charge.
 * Nothing is revalidated: the client sets the gauge from the answer, and the
 * board is already up.
 */
export async function startStoryRun(chapterId: string): Promise<RunStarted | RunRefused> {
  const user = await requireUser();
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
  if (!chapter) return { error: "Chapter not found.", energy: await readEnergy(user.id) };
  const energy = await spendEnergy(user.id, ENERGY_PLAY_COST);
  if (!energy) return { error: "Out of energy.", energy: await readEnergy(user.id) };
  return { energy, cost: ENERGY_PLAY_COST };
}

/** What the recharge screen animates: the gems leaving, the cells landing. */
export type EnergyBought = {
  pack: EnergyPack;
  before: { energy: EnergyState; balances: Balances };
  energy: EnergyState;
  balances: Balances;
  /** Set when a gem pack was paid by card in the same breath: what landed in the bag first. */
  paid?: { gems: number; cents: number };
};

type BuyFail = { error: string; need?: number };

/** The debit and the credit, for a user already checked. */
async function recharge(userId: string, pack: EnergyPack): Promise<EnergyBought | BuyFail> {
  await ensureBalanceFields(userId);
  const [balancesBefore, energyBefore] = await Promise.all([getBalances(userId), readEnergy(userId)]);
  const debit = await prisma.user.updateMany({
    where: { id: userId, gems: { gte: pack.gems } },
    data: { gems: { decrement: pack.gems } },
  });
  if (debit.count === 0) {
    return { error: `${pack.name} costs ${formatGems(pack.gems)} gems.`, need: pack.gems - balancesBefore.gems };
  }

  const energy = await creditEnergy(userId, pack.cells);
  await prisma.ledgerEntry.create({
    data: { userId, kind: "ENERGY", gems: -pack.gems, ref: pack.id, note: `${pack.name} · +${pack.cells} energy` },
  });
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { gems: true, ethGwei: true } });
  revalidatePath(GAME_ROOT_PATH, "layout");
  return { pack, before: { energy: energyBefore, balances: balancesBefore }, energy, balances: toBalances(row) };
}

/**
 * Buy a recharge with gems. The gems leave atomically (`updateMany` guarded by
 * `gte`), the cells land past the max if need be, and the ledger keeps the
 * line. Short on gems, the answer says by how many so the shop can open.
 */
export async function buyEnergy(packId: string): Promise<EnergyBought | BuyFail> {
  const user = await requireUser();
  const pack = energyPack(packId);
  if (!pack) return { error: "That recharge is not on sale." };
  return recharge(user.id, pack);
}

/**
 * The recharge sheet's checkout: a gem pack was just paid by card inside the
 * sheet (`createGemPayment` → Stripe Elements). Credit the pack — first one
 * past the `PENDING → PAID` gate, the webhook being the other — then buy the
 * recharge with the gems that landed, and answer with one landing. If the
 * recharge cannot be paid after all, the gems stay in the bag and the error
 * says so; nothing is charged twice.
 */
export async function claimEnergyPayment(paymentIntentId: string, packId: string): Promise<EnergyBought | BuyFail> {
  const user = await requireUser();
  const pack = energyPack(packId);
  if (!pack) return { error: "That recharge is not on sale." };
  const purchase = await prisma.gemPurchase.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { userId: true, usdCents: true },
  });
  if (!purchase || purchase.userId !== user.id) return { error: "Purchase not found." };
  const paid = await fulfilPaymentIntent(paymentIntentId);
  if (!paid || paid.gems === 0) return { error: "Stripe has not confirmed the payment yet. Your gems land as soon as it does." };
  const result = await recharge(user.id, pack);
  if ("error" in result) return { error: `${formatGems(paid.gems)} gems landed in your bag, but the recharge could not be paid. ${result.error}` };
  return { ...result, paid: { gems: paid.gems, cents: purchase.usdCents } };
}

/** The gauge as the server sees it now (a surface re-syncing after a long pause). */
export async function fetchEnergy(): Promise<EnergyState> {
  const user = await requireUser();
  return readEnergy(user.id);
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { GAME_ROOT_PATH } from "@/lib/auth/paths";
import { ensureBalanceFields } from "@/lib/balances";
import { ownsSkin, skinById, toWardrobe, type Skin, type Wardrobe } from "@/lib/cosmetics";
import { ensureSkinsField, getWardrobe } from "@/lib/cosmetics-store";
import { getBalances, toBalances, type Balances } from "@/lib/earn";
import { formatGems } from "@/lib/economy";
import { fulfilPaymentIntent } from "@/lib/purchases";

type Fail = { error: string; need?: number };

/** What the unlock screen animates: the gems leaving, the skin landing in the wardrobe. */
export type SkinBought = {
  skin: string;
  before: Balances;
  balances: Balances;
  wardrobe: Wardrobe;
  /** Set when a gem pack was paid by card in the same breath: what landed in the bag first. */
  paid?: { gems: number; cents: number };
};
export type SkinEquipped = { wardrobe: Wardrobe };

const SLOT_FIELD = { paddle: "paddleSkin", ball: "ballSkin" } as const;

/** The debit, the equip and the ledger line, for a user already checked. */
async function unlock(userId: string, skin: Skin): Promise<SkinBought | Fail> {
  await Promise.all([ensureBalanceFields(userId), ensureSkinsField(userId)]);
  const before = await getBalances(userId);
  const debit = await prisma.user.updateMany({
    where: { id: userId, gems: { gte: skin.gems }, NOT: { skins: { has: skin.id } } },
    data: { gems: { decrement: skin.gems }, skins: { push: skin.id }, [SLOT_FIELD[skin.slot]]: skin.id },
  });
  if (debit.count === 0) {
    const wardrobe = await getWardrobe(userId);
    if (ownsSkin(wardrobe, skin)) return { error: "You already own this skin." };
    return { error: `${skin.name} costs ${formatGems(skin.gems)} gems.`, need: skin.gems - before.gems };
  }
  await prisma.ledgerEntry.create({
    data: { userId, kind: "SKIN", gems: -skin.gems, ref: skin.id, note: `${skin.name} · ${skin.slot} skin` },
  });
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { gems: true, ethGwei: true, skins: true, paddleSkin: true, ballSkin: true },
  });
  revalidatePath(GAME_ROOT_PATH, "layout");
  return { skin: skin.id, before, balances: toBalances(row), wardrobe: toWardrobe(row) };
}

/**
 * Buy a skin with gems and wear it. One guarded `updateMany`: the gems must
 * be there and the skin must not be owned yet, so a double tap buys once.
 * The equip rides in the same write; the ledger keeps the line. Short on
 * gems, the answer says by how many so the sheet can open its checkout.
 */
export async function buySkin(skinId: string): Promise<SkinBought | Fail> {
  const user = await requireUser();
  const skin = skinById(skinId);
  if (!skin) return { error: "That skin is not on sale." };
  if (skin.gems === 0) return equipFree(user.id, skin.id);
  return unlock(user.id, skin);
}

/**
 * The unlock sheet's checkout: a gem pack was just paid by card inside the
 * sheet. Credit the pack — first one past the `PENDING → PAID` gate, the
 * webhook being the other — then buy the skin with the gems that landed, and
 * answer with one landing. If the skin cannot be paid after all, the gems
 * stay in the bag and the error says so; nothing is charged twice.
 */
export async function claimSkinPayment(paymentIntentId: string, skinId: string): Promise<SkinBought | Fail> {
  const user = await requireUser();
  const skin = skinById(skinId);
  if (!skin || skin.gems === 0) return { error: "That skin is not on sale." };
  const purchase = await prisma.gemPurchase.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { userId: true, usdCents: true },
  });
  if (!purchase || purchase.userId !== user.id) return { error: "Purchase not found." };
  const paid = await fulfilPaymentIntent(paymentIntentId);
  if (!paid || paid.gems === 0) return { error: "Stripe has not confirmed the payment yet. Your gems land as soon as it does." };
  const result = await unlock(user.id, skin);
  if ("error" in result) return { error: `${formatGems(paid.gems)} gems landed in your bag, but the skin could not be paid. ${result.error}` };
  return { ...result, paid: { gems: paid.gems, cents: purchase.usdCents } };
}

async function equipFree(userId: string, skinId: string): Promise<SkinBought | Fail> {
  const result = await wear(userId, skinId);
  if ("error" in result) return result;
  const balances = await getBalances(userId);
  return { skin: skinId, before: balances, balances, wardrobe: result.wardrobe };
}

async function wear(userId: string, skinId: string): Promise<SkinEquipped | Fail> {
  const skin = skinById(skinId);
  if (!skin) return { error: "That skin does not exist." };
  const wardrobe = await getWardrobe(userId);
  if (!ownsSkin(wardrobe, skin)) return { error: `You do not own ${skin.name} yet.` };
  const row = await prisma.user.update({
    where: { id: userId },
    data: { [SLOT_FIELD[skin.slot]]: skin.id },
    select: { skins: true, paddleSkin: true, ballSkin: true },
  });
  revalidatePath(GAME_ROOT_PATH, "layout");
  return { wardrobe: toWardrobe(row) };
}

/** Wear a skin the player owns (or a free one). */
export async function equipSkin(skinId: string): Promise<SkinEquipped | Fail> {
  const user = await requireUser();
  return wear(user.id, skinId);
}

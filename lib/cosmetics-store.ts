import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { toWardrobe, type Wardrobe } from "@/lib/cosmetics";

/**
 * Make sure a player's document carries `skins` before a purchase filters on
 * it. Accounts created before cosmetics existed have no such key, and every
 * Prisma list filter (`has`, `isEmpty`, `NOT { has }`) adds a "field is set"
 * clause that a missing array never passes — the guarded debit in `buySkin`
 * would refuse a player with the gems. Same repair as `ensureBalanceFields`.
 */
export async function ensureSkinsField(userId: string): Promise<void> {
  await prisma.$runCommandRaw({
    update: "User",
    updates: [{ q: { _id: { $oid: userId }, skins: null }, u: { $set: { skins: [] } } }],
  });
}

/** What the player owns and wears, as the database has it. */
export const getWardrobe = cache(async function getWardrobe(userId: string): Promise<Wardrobe> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { skins: true, paddleSkin: true, ballSkin: true },
  });
  return toWardrobe(row);
});

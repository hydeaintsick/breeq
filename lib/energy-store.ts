import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { ENERGY_CEIL, ENERGY_MAX, energyDayKey, toEnergyState, type EnergyState } from "@/lib/energy";

/**
 * The energy gauge on the player's document: `energy` (cells) and
 * `energyDay` (the UTC day the gauge was last settled on).
 *
 * The midnight recharge is lazy — there is no cron. Every read and write
 * first calls `settleEnergy`, one Mongo update with an aggregation pipeline:
 * if `energyDay` is not today (or missing, for accounts older than the
 * field), the gauge becomes `max(energy, ENERGY_MAX)` and the day is stamped.
 * Cells bought past the max survive the rollover; a gauge under the max is
 * filled. Both `energy` and `energyDay` may be absent on old accounts, so the
 * pipeline uses `$ifNull` — like `ensureBalanceFields`, one write makes the
 * later `$inc` / `{ gte }` guards safe.
 */
export async function settleEnergy(userId: string, at = new Date()): Promise<void> {
  const today = energyDayKey(at);
  await prisma.$runCommandRaw({
    update: "User",
    updates: [
      {
        // `$ne` matches a missing field too: a fresh or pre-energy account settles on first touch.
        q: { _id: { $oid: userId }, energyDay: { $ne: today } },
        u: [
          {
            $set: {
              energy: { $max: [{ $ifNull: ["$energy", ENERGY_MAX] }, ENERGY_MAX] },
              energyDay: today,
            },
          },
        ],
      },
    ],
  });
}

/** The gauge now, settled for today. */
export const getEnergy = cache(async function getEnergy(userId: string): Promise<EnergyState> {
  const at = new Date();
  await settleEnergy(userId, at);
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { energy: true } });
  return toEnergyState(row?.energy, at);
});

/** The same read, uncached: for actions that just changed the gauge. */
export async function readEnergy(userId: string): Promise<EnergyState> {
  const at = new Date();
  await settleEnergy(userId, at);
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { energy: true } });
  return toEnergyState(row?.energy, at);
}

/**
 * Take `cost` cells, atomically: `updateMany` guarded by `{ gte }`. Returns
 * the gauge after, or null when there were not enough cells (nothing moved).
 */
export async function spendEnergy(userId: string, cost: number): Promise<EnergyState | null> {
  const at = new Date();
  await settleEnergy(userId, at);
  const debit = await prisma.user.updateMany({
    where: { id: userId, energy: { gte: cost } },
    data: { energy: { decrement: cost } },
  });
  if (debit.count === 0) return null;
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { energy: true } });
  return toEnergyState(row?.energy, at);
}

/**
 * Give `cells` back, never past the max: a clear's refund. Returns the cells
 * before and after (equal when the gauge was already full).
 */
export async function refundEnergy(userId: string, cells: number): Promise<{ before: number; after: number }> {
  const at = new Date();
  await settleEnergy(userId, at);
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { energy: true } });
  const before = Math.max(0, row?.energy ?? ENERGY_MAX);
  if (before >= ENERGY_MAX) return { before, after: before };
  const gain = Math.min(cells, ENERGY_MAX - before);
  // Guarded on the value just read: a race with another refund leaves at most one behind, never one over.
  const credit = await prisma.user.updateMany({
    where: { id: userId, energy: before },
    data: { energy: { increment: gain } },
  });
  return credit.count === 0 ? { before, after: before } : { before, after: before + gain };
}

/** Bought cells: stack past the max, under the ceiling. Returns the gauge after. */
export async function creditEnergy(userId: string, cells: number): Promise<EnergyState> {
  const at = new Date();
  await settleEnergy(userId, at);
  await prisma.user.updateMany({
    where: { id: userId, energy: { lte: ENERGY_CEIL - cells } },
    data: { energy: { increment: cells } },
  });
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { energy: true } });
  return toEnergyState(row?.energy, at);
}

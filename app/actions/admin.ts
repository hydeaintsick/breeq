"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_EARN_PATH,
  ADMIN_ECONOMY_PATH,
  ADMIN_PLAYERS_PATH,
  ADMIN_WITHDRAWALS_PATH,
  EARN_PATH,
  EARN_TOPUP_PATH,
  EARN_WALLET_PATH,
  GAME_ROOT_PATH,
} from "@/lib/auth/paths";
import { clampNumber, ECONOMY_ID, formatEth, formatGems, parsePacks, type Economy } from "@/lib/economy";
import { creditGems } from "@/lib/purchases";

type Fail = { error: string };

function revalidateEconomy() {
  revalidatePath(ADMIN_ECONOMY_PATH);
  revalidatePath(ADMIN_DASHBOARD_PATH);
  revalidatePath(EARN_PATH);
  revalidatePath(EARN_TOPUP_PATH);
  revalidatePath(EARN_WALLET_PATH);
  revalidatePath(GAME_ROOT_PATH, "layout");
}

/** Save the economy. Every field is clamped to a sane range; packs are re-read from JSON. */
export async function updateEconomy(input: Economy): Promise<{ ok: true } | Fail> {
  await requireAdmin();
  const ticketMin = Math.round(clampNumber(input.ticketMinGems, 1, 100_000, 20));
  const ticketMax = Math.round(clampNumber(input.ticketMaxGems, ticketMin, 1_000_000, Math.max(ticketMin, 500)));
  const data = {
    gemPriceUsd: clampNumber(input.gemPriceUsd, 0.0001, 1000, 0.02),
    ethPriceUsd: clampNumber(input.ethPriceUsd, 1, 1_000_000, 3000),
    winMultiplier: clampNumber(input.winMultiplier, 0.1, 100, 1.5),
    withdrawMinEth: clampNumber(input.withdrawMinEth, 0, 1000, 0.001),
    publishCostGems: Math.round(clampNumber(input.publishCostGems, 0, 1_000_000, 50)),
    ticketMinGems: ticketMin,
    ticketMaxGems: ticketMax,
    ticketDefaultGems: Math.round(clampNumber(input.ticketDefaultGems, ticketMin, ticketMax, ticketMin)),
    packs: parsePacks(input.packs) as unknown as Prisma.InputJsonValue,
  };
  await prisma.economySettings.upsert({
    where: { id: ECONOMY_ID },
    create: { id: ECONOMY_ID, ...data },
    update: data,
  });
  revalidateEconomy();
  return { ok: true };
}

/** A live ETH/USD reference from Coinbase's public spot price. No key needed. */
export async function fetchEthPrice(): Promise<{ usd: number } | Fail> {
  await requireAdmin();
  try {
    const response = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    const payload = (await response.json()) as { data?: { amount?: string } };
    const usd = Number(payload.data?.amount);
    if (!Number.isFinite(usd) || usd <= 0) throw new Error("bad price");
    return { usd };
  } catch {
    return { error: "Could not reach the price feed." };
  }
}

// --- Maps --------------------------------------------------------------------

export async function setMapFeatured(mapId: string, featured: boolean, order?: number): Promise<void> {
  await requireAdmin();
  await prisma.earnMap.update({
    where: { id: mapId },
    data: { featured, ...(order !== undefined ? { featuredOrder: Math.round(clampNumber(order, 0, 999, 0)) } : {}) },
  });
  revalidatePath(ADMIN_EARN_PATH);
  revalidatePath(EARN_PATH);
}

export async function setMapStatus(mapId: string, status: "PUBLISHED" | "HIDDEN"): Promise<void> {
  await requireAdmin();
  await prisma.earnMap.update({ where: { id: mapId }, data: { status } });
  revalidatePath(ADMIN_EARN_PATH);
  revalidatePath(EARN_PATH);
}

// --- Players -----------------------------------------------------------------

export async function grantGems(userId: string, gems: number, note?: string): Promise<{ ok: true } | Fail> {
  const admin = await requireAdmin();
  const amount = Math.round(Number(gems));
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1_000_000) return { error: "Enter a whole number of gems." };
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, gems: true } });
  if (!target) return { error: "Player not found." };
  if (amount < 0 && target.gems + amount < 0) return { error: "That would take the balance below zero." };
  await creditGems({
    userId,
    gems: amount,
    kind: "GRANT",
    note: note?.trim().slice(0, 80) || `${amount > 0 ? "+" : ""}${formatGems(amount)} gems from ${admin.username ?? "admin"}`,
  });
  revalidatePath(ADMIN_PLAYERS_PATH);
  revalidatePath(ADMIN_DASHBOARD_PATH);
  revalidatePath(EARN_PATH);
  revalidatePath(EARN_WALLET_PATH);
  return { ok: true };
}

// --- Withdrawals -------------------------------------------------------------

/** Mark a request paid (with the transaction hash) or send the ETH back to the player. */
export async function resolveWithdrawal(
  withdrawalId: string,
  decision: { status: "PAID"; txHash: string } | { status: "REJECTED"; note?: string },
): Promise<{ ok: true } | Fail> {
  await requireAdmin();
  const row = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!row) return { error: "Withdrawal not found." };
  if (row.status !== "PENDING") return { error: "Already resolved." };

  if (decision.status === "PAID") {
    const hash = decision.txHash.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) return { error: "Enter the transaction hash (0x…, 64 hex characters)." };
    const gate = await prisma.withdrawal.updateMany({
      where: { id: row.id, status: "PENDING" },
      data: { status: "PAID", txHash: hash },
    });
    if (gate.count === 0) return { error: "Already resolved." };
  } else {
    const gate = await prisma.withdrawal.updateMany({
      where: { id: row.id, status: "PENDING" },
      data: { status: "REJECTED", note: decision.note?.trim().slice(0, 120) || null },
    });
    if (gate.count === 0) return { error: "Already resolved." };
    await prisma.$transaction([
      prisma.user.update({ where: { id: row.userId }, data: { ethGwei: { increment: row.amountGwei } } }),
      prisma.ledgerEntry.create({
        data: {
          userId: row.userId,
          kind: "WITHDRAW_REFUND",
          ethGwei: row.amountGwei,
          ref: row.id,
          note: `Withdrawal returned · ${formatEth(Number(row.amountGwei) / 1e9)}`,
        },
      }),
    ]);
  }
  revalidatePath(ADMIN_WITHDRAWALS_PATH);
  revalidatePath(ADMIN_DASHBOARD_PATH);
  revalidatePath(EARN_WALLET_PATH);
  return { ok: true };
}

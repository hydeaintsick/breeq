import type { LedgerKind } from "@prisma/client";
import { ensureBalanceFields } from "@/lib/balances";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * Crediting a paid gem pack. Called by the Stripe webhook and by the top-up
 * page when the player lands back on it — whichever comes first wins, the
 * other finds the purchase already `PAID` and does nothing.
 */
export async function fulfilPurchase(sessionId: string): Promise<{ credited: boolean; gems: number } | null> {
  const purchase = await prisma.gemPurchase.findUnique({ where: { stripeSessionId: sessionId } });
  if (!purchase) return null;
  if (purchase.status === "PAID") return { credited: false, gems: purchase.gems };

  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return { credited: false, gems: 0 };
  }

  await ensureBalanceFields(purchase.userId);
  return prisma.$transaction(async (tx) => {
    // The gate: only the first caller flips PENDING → PAID.
    const gate = await tx.gemPurchase.updateMany({
      where: { id: purchase.id, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (gate.count === 0) return { credited: false, gems: purchase.gems };
    await tx.user.update({ where: { id: purchase.userId }, data: { gems: { increment: purchase.gems } } });
    await tx.ledgerEntry.create({
      data: {
        userId: purchase.userId,
        kind: "TOPUP",
        gems: purchase.gems,
        ref: purchase.id,
        note: `${purchase.gems.toLocaleString("en-US")} gems`,
      },
    });
    return { credited: true, gems: purchase.gems };
  });
}

/** A signed gem movement with its ledger line, outside any purchase. */
export async function creditGems(input: { userId: string; gems: number; kind: LedgerKind; ref?: string; note?: string }) {
  await ensureBalanceFields(input.userId);
  return prisma.$transaction([
    prisma.user.update({ where: { id: input.userId }, data: { gems: { increment: input.gems } } }),
    prisma.ledgerEntry.create({
      data: { userId: input.userId, kind: input.kind, gems: input.gems, ref: input.ref, note: input.note },
    }),
  ]);
}

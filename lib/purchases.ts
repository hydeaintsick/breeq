import type { GemPurchase, LedgerKind } from "@prisma/client";
import { ensureBalanceFields } from "@/lib/balances";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export type Fulfilment = { credited: boolean; gems: number };

/**
 * Crediting a paid gem pack. Called by the Stripe webhook and by the shop
 * sheet the moment Stripe confirms the payment — whichever comes first wins,
 * the other finds the purchase already `PAID` and does nothing.
 */
async function settle(purchase: Pick<GemPurchase, "id" | "userId" | "gems">): Promise<Fulfilment> {
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

/** The in-sheet payment: credit the pack once its PaymentIntent has succeeded. */
export async function fulfilPaymentIntent(paymentIntentId: string): Promise<Fulfilment | null> {
  const purchase = await prisma.gemPurchase.findFirst({ where: { stripePaymentIntentId: paymentIntentId } });
  if (!purchase) return null;
  if (purchase.status === "PAID") return { credited: false, gems: purchase.gems };

  const intent = await stripe().paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== "succeeded") return { credited: false, gems: 0 };
  return settle(purchase);
}

/** The earlier redirect flow: credit the pack once its Checkout Session is paid. */
export async function fulfilPurchase(sessionId: string): Promise<Fulfilment | null> {
  const purchase = await prisma.gemPurchase.findFirst({ where: { stripeSessionId: sessionId } });
  if (!purchase) return null;
  if (purchase.status === "PAID") return { credited: false, gems: purchase.gems };

  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return { credited: false, gems: 0 };
  return settle(purchase);
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

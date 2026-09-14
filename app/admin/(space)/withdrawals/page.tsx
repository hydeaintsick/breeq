import type { Metadata } from "next";
import { AdminWithdrawals, type AdminWithdrawalRow } from "@/components/admin-withdrawals";
import { requireAdmin } from "@/lib/auth/session";
import { formatEth, gweiToEth } from "@/lib/economy";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Withdrawals — Admin",
  description: "Pay ETH out to players.",
};

export default async function AdminWithdrawalsPage() {
  await requireAdmin();
  const [pending, resolved] = await Promise.all([
    prisma.withdrawal.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { username: true, name: true, email: true } } },
    }),
    prisma.withdrawal.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: { user: { select: { username: true, name: true, email: true } } },
    }),
  ]);
  const toRow = (row: (typeof pending)[number]): AdminWithdrawalRow => ({
    id: row.id,
    username: row.user.username ?? row.user.name ?? "player",
    email: row.user.email,
    eth: gweiToEth(row.amountGwei),
    toAddress: row.toAddress,
    status: row.status,
    txHash: row.txHash,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  });
  const owed = pending.reduce((sum, row) => sum + gweiToEth(row.amountGwei), 0);

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Withdrawals</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
        {pending.length} waiting, {formatEth(owed)} in total. Send the ETH from the treasury wallet, paste the
        transaction hash, and mark it paid. Returning a request puts the ETH back on the player&apos;s balance.
      </p>

      <h2 className="mt-8 text-lg font-semibold tracking-tight text-ink">Waiting</h2>
      <AdminWithdrawals rows={pending.map(toRow)} />

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Resolved</h2>
      <AdminWithdrawals rows={resolved.map(toRow)} />
    </section>
  );
}

import type { Metadata } from "next";
import { EarnWallet } from "@/components/earn-wallet";
import { requireEarn } from "@/lib/auth/session";
import { getBalances, getEarnRecord, getEconomy, getLedger, getWithdrawals } from "@/lib/earn";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Wallet — Breeq",
  description: "Your gems, your ETH, and every ticket you played.",
};

export default async function WalletPage() {
  const { user } = await requireEarn();
  const [balances, economy, ledger, withdrawals, record, account] = await Promise.all([
    getBalances(user.id),
    getEconomy(),
    getLedger(user.id),
    getWithdrawals(user.id),
    getEarnRecord(user.id),
    prisma.user.findUnique({ where: { id: user.id }, select: { walletAddress: true } }),
  ]);

  return (
    <EarnWallet
      balances={balances}
      economy={economy}
      ledger={ledger}
      withdrawals={withdrawals}
      record={record}
      walletAddress={account?.walletAddress ?? null}
    />
  );
}

import type { Metadata } from "next";
import { EarnWizard } from "@/components/earn-wizard";
import { requireEarn } from "@/lib/auth/session";
import { getBalances, getEconomy } from "@/lib/earn";

export const metadata: Metadata = {
  title: "Create a map — Breeq",
  description: "Build a wall, let the robot prove it, price the ticket, and put it on sale.",
};

export default async function EarnCreatePage() {
  const { user } = await requireEarn();
  const [economy, balances] = await Promise.all([getEconomy(), getBalances(user.id)]);

  return <EarnWizard author={user.username ?? user.name ?? "player"} economy={economy} gems={balances.gems} />;
}

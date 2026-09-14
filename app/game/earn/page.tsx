import type { Metadata } from "next";
import { EarnStore } from "@/components/earn-store";
import { requireEarn } from "@/lib/auth/session";
import { getEarnStore, isEarnSort, type EarnSort } from "@/lib/earn";

export const metadata: Metadata = {
  title: "Earn — Breeq",
  description: "Walls built by players. Pay a ticket in gems, bring the wall down, get paid in ETH.",
};

export default async function EarnPage({ searchParams }: PageProps<"/game/earn">) {
  const [{ user }, params] = await Promise.all([requireEarn(), searchParams]);
  const raw = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort: EarnSort = isEarnSort(raw) ? raw : "plays";
  const store = await getEarnStore(user.id, sort);

  return <EarnStore key={sort} store={store} sort={sort} />;
}

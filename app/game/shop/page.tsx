import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopPage } from "@/components/shop-page";
import { isShopTab } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Shop",
  description: "Skins for the paddle and the ball, gems, and energy recharges.",
};

/**
 * `/game/shop`: the Shop tab of the dock. Everything it shows — balances,
 * energy, wardrobe, the economy — is already in the game layout's providers;
 * the page only picks the shelf from the URL so the first paint lands on it.
 */
export default async function ShopRoute({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return (
    <Suspense fallback={null}>
      <ShopPage initialTab={isShopTab(tab) ? tab : "skins"} />
    </Suspense>
  );
}

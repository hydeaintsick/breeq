/** The shop's shelves. The tab lives in the URL (`/game/shop?tab=`). */
export type ShopTab = "skins" | "gems" | "energy";

export const SHOP_TABS: readonly { id: ShopTab; label: string }[] = [
  { id: "skins", label: "Skins" },
  { id: "gems", label: "Gems" },
  { id: "energy", label: "Energy" },
];

export function isShopTab(value: unknown): value is ShopTab {
  return SHOP_TABS.some((tab) => tab.id === value);
}

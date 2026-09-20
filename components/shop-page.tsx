"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { useBalances } from "@/components/balances-provider";
import { GemGlyph } from "@/components/currency-glyphs";
import { EnergyShelf } from "@/components/energy-shelf";
import { useGemShop } from "@/components/gem-shop";
import { GemStorefront } from "@/components/gem-storefront";
import { SkinShelf } from "@/components/skin-shelf";
import { playShopTab } from "@/game/breakout/audio";
import { pulseUi } from "@/game/breakout/haptics";
import { formatGems } from "@/lib/economy";
import { isShopTab, SHOP_TABS as TABS, type ShopTab } from "@/lib/shop";

/**
 * The shop: one page, three shelves — skins, gems, energy — under a
 * segmented control. The tab lives in the URL (`?tab=`) so a link can land
 * on a shelf and Back returns to it. Skins is the door: the bag and the gauge
 * are one tab away, and the two checkouts (the gem packs, the recharge sheet)
 * are the ones every other surface uses.
 */
export function ShopPage({ initialTab }: { initialTab: ShopTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fromUrl = params.get("tab");
  const balances = useBalances();
  const shop = useGemShop();

  // The URL leads (Back / forward, a shared link); a tap shows its tab at
  // once and is forgotten as soon as the URL has caught up.
  const urlTab: ShopTab = isShopTab(fromUrl) ? fromUrl : initialTab;
  const [pick, setPick] = useState<{ url: string | null; tab: ShopTab } | null>(null);
  const tab = pick && pick.url === fromUrl ? pick.tab : urlTab;

  function go(next: ShopTab) {
    if (next === tab) return;
    playShopTab();
    pulseUi(5);
    setPick({ url: fromUrl, tab: next });
    router.replace(`${pathname}?tab=${next}`, { scroll: false });
  }

  const active = TABS.findIndex((t) => t.id === tab);

  return (
    <section className="page-gutter shop-page" data-tab={tab}>
      <div className="mx-auto w-full max-w-6xl">
        <header className="shop-head">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Shop</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Your <span className="text-neon">kit</span>.
            </h1>
          </div>
          <button type="button" className="shop-bag glass" onClick={() => shop.open()} aria-label={`${formatGems(balances?.balances.gems ?? 0)} gems in your bag. Get more.`}>
            <GemGlyph />
            <span className="shop-bag-n">{formatGems(balances?.balances.gems ?? 0)}</span>
            <span className="shop-bag-plus" aria-hidden="true">
              +
            </span>
          </button>
        </header>

        <div className="shop-seg" role="tablist" aria-label="Shop sections" style={{ "--n": TABS.length, "--i": active } as CSSProperties}>
          <span className="shop-seg-indicator" aria-hidden="true" />
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`shop-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`shop-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              className="shop-seg-tab"
              onClick={() => go(t.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                const next = TABS[(active + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
                go(next.id);
                document.getElementById(`shop-tab-${next.id}`)?.focus();
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div id={`shop-panel-${tab}`} role="tabpanel" aria-labelledby={`shop-tab-${tab}`} className="shop-panel" key={tab}>
          {tab === "skins" ? <SkinShelf /> : null}
          {tab === "gems" ? (
            shop.economy ? (
              <div className="shop-gems glass">
                <GemStorefront
                  economy={shop.economy}
                  publishableKey={shop.publishableKey}
                  sandbox={shop.sandbox}
                  intro="Gems buy skins, recharges and Earn tickets. Bigger bags cost less per gem."
                  layout="rows"
                />
              </div>
            ) : (
              <p className="text-sm text-ink-muted">The gem shop is not open yet.</p>
            )
          ) : null}
          {tab === "energy" ? <EnergyShelf /> : null}
        </div>
      </div>
    </section>
  );
}

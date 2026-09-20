"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useEnergy } from "@/components/energy-provider";
import { closeGameMenu } from "@/components/game-header";
import { playDockTap } from "@/game/breakout/audio";
import { pulseUi } from "@/game/breakout/haptics";
import { EARN_CREATE_PATH, GAME_MENU_PATH, SHOP_PATH, STORY_PATH, TUTORIAL_PATH } from "@/lib/auth/paths";
import { ENERGY_PLAY_COST } from "@/lib/energy";

/** The two tabs. Play is everything that is not the shop. */
const TABS = [
  { id: "play", href: GAME_MENU_PATH, label: "Play", Icon: PlayGlyph, match: (path: string) => !path.startsWith(SHOP_PATH) },
  { id: "shop", href: SHOP_PATH, label: "Shop", Icon: ShopGlyph, match: (path: string) => path.startsWith(SHOP_PATH) },
] as const;

/**
 * Where the dock shows. Full-screen surfaces (the story, the tutorial, the
 * map wizard) own the whole screen and have their own way out; runs and
 * sheets sit above it (z 70+) and cover it.
 */
export function dockShown(pathname: string): boolean {
  return !(pathname.startsWith(STORY_PATH) || pathname.startsWith(TUTORIAL_PATH) || pathname.startsWith(EARN_CREATE_PATH));
}

/**
 * The dock: a glass pill at the bottom of the game with two tabs, Play and
 * Shop. The active pill slides under the finger; a tab lands with a glass
 * tick and a short pulse. The Shop tab carries a dot while the energy gauge
 * cannot pay a run — the recharge is one tap away. Tapping the tab you are on
 * scrolls its page back to the top.
 */
export function GameDock() {
  const pathname = usePathname();
  const energy = useEnergy();
  const active = Math.max(0, TABS.findIndex((tab) => tab.match(pathname)));
  const nudge = energy !== null && energy.state.energy < ENERGY_PLAY_COST;

  return (
    <nav className="dock" aria-label="Game sections">
      <div className="dock-nav" style={{ "--n": TABS.length, "--i": active } as CSSProperties}>
        <span className="dock-indicator" aria-hidden="true" />
        {TABS.map((tab, index) => {
          const current = index === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="dock-tab"
              aria-current={current ? "page" : undefined}
              onClick={(event) => {
                closeGameMenu();
                if (current) {
                  event.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  return;
                }
                playDockTap(index);
                pulseUi(6);
              }}
            >
              <tab.Icon active={current} />
              <span className="dock-label">{tab.label}</span>
              {tab.id === "shop" && nudge && !current ? <span className="dock-nudge" aria-label="Energy is low" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Three bricks, the ball, the paddle. */
function PlayGlyph({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="dock-icon" aria-hidden="true">
      <rect x="3" y="4" width="5.4" height="3.2" rx="1" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.3" y="4" width="5.4" height="3.2" rx="1" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
      <rect x="15.6" y="4" width="5.4" height="3.2" rx="1" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="13.2" r="1.9" fill="currentColor" />
      <rect x="6.5" y="18.4" width="11" height="2.8" rx="1.4" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** A shopping bag. */
function ShopGlyph({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="dock-icon" aria-hidden="true">
      <path
        d="M5.6 8.4h12.8l1 11.2a1.4 1.4 0 0 1-1.4 1.5H6a1.4 1.4 0 0 1-1.4-1.5z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.22 : 1}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8.8 8.4V7a3.2 3.2 0 0 1 6.4 0v1.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.2 12.2a2.8 2.8 0 0 0 5.6 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

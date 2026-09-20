"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { EnergyChip } from "@/components/energy-chip";
import { GalaxyMap } from "@/components/galaxy-map";
import { HapticsToggle } from "@/components/haptics-toggle";
import { HeaderMenuBackdrop } from "@/components/header-menu-backdrop";
import { LogoMark } from "@/components/logo-mark";
import { LoreBook } from "@/components/lore-book";
import { MenuIcon } from "@/components/menu-icon";
import {
  AccountIcon,
  BookIcon,
  DashboardIcon,
  GalaxyIcon,
  PlayIcon,
  RouteIcon,
  SettingsIcon,
  SignOutIcon,
} from "@/components/nav-icons";
import { RankMeter } from "@/components/rank-meter";
import { SignOutButton } from "@/components/sign-out-button";
import { SoundToggle } from "@/components/sound-toggle";
import { useStoryChrome } from "@/components/story-chrome";
import { SwipeToggle } from "@/components/swipe-toggle";
import { WalletChip } from "@/components/wallet-chip";
import { ACCOUNT_PATH, ADMIN_DASHBOARD_PATH, EARN_PATH, GAME_MENU_PATH, STORY_PATH } from "@/lib/auth/paths";
import type { Progress, StarTally } from "@/lib/progress";

type Pill = "rank" | "wallet" | "energy";
type MenuDoor = "profile" | "controls" | "story";

export function GameHeader({
  progress,
  stars,
  isAdmin = false,
  earn = false,
}: {
  progress: Progress;
  stars: StarTally;
  isAdmin?: boolean;
  /** The player can use Earn: the bag pill joins the level pill. */
  earn?: boolean;
}) {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [door, setDoor] = useState<MenuDoor | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const profileId = `${menuId}-profile`;
  const controlsId = `${menuId}-controls`;
  const storyId = `${menuId}-story`;
  const chrome = useStoryChrome();
  const story = pathname.startsWith(STORY_PATH);
  const open = menuPath === pathname;

  // Two pills, one unfolded at a time: the energy gauge in Story, the bag in
  // Earn, the level elsewhere. A tap on the folded one swaps them; a route
  // change goes back to the default.
  const inEarn = pathname.startsWith(EARN_PATH);
  const second: Pill | null = story ? "energy" : earn ? "wallet" : null;
  const defaultPill: Pill = story ? "energy" : earn && inEarn ? "wallet" : "rank";
  const [pick, setPick] = useState<{ path: string; pill: Pill } | null>(null);
  const picked = second && pick && pick.path === pathname && (pick.pill === "rank" || pick.pill === second) ? pick.pill : null;
  const swapped = picked !== null;
  const pill: Pill = picked ?? defaultPill;
  const showPill = (next: Pill) => setPick({ path: pathname, pill: next });

  const pills = (
    <>
      <RankMeter progress={progress} stars={stars} folded={pill !== "rank"} onUnfold={() => showPill("rank")} />
      {second === "energy" ? <EnergyChip folded={pill !== "energy"} onUnfold={() => showPill("energy")} /> : null}
      {second === "wallet" ? <WalletChip folded={pill !== "wallet"} onUnfold={() => showPill("wallet")} /> : null}
    </>
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuPath(null);
  const toggleMenu = () => setMenuPath((current) => (current === pathname ? null : pathname));
  const toggleDoor = (next: MenuDoor) => setDoor((current) => (current === next ? null : next));

  const { panel, setPanel } = chrome;
  const openPanel = (next: "book" | "map") => {
    setPanel(panel === next ? null : next);
    closeMenu();
  };

  const menuButton = (
    <button
      type="button"
      className={story ? "story-pill-face" : "header-chip"}
      aria-expanded={open}
      aria-controls={menuId}
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={toggleMenu}
    >
      <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      <MenuIcon open={open} />
    </button>
  );

  const dropdown = open ? (
    <div
      id={menuId}
      className="pointer-events-auto relative z-10 mx-auto mt-2 flex w-full max-w-6xl justify-end"
    >
      <div className="glass-sheet header-menu flex flex-col gap-2 p-3">
        <div className="header-menu-doors" role="toolbar" aria-label="Menu sections">
          <button
            type="button"
            className="header-chip"
            aria-expanded={door === "profile"}
            aria-controls={profileId}
            aria-label="Profile"
            onClick={() => toggleDoor("profile")}
          >
            <span className="sr-only">Profile</span>
            <AccountIcon />
          </button>
          <button
            type="button"
            className="header-chip"
            aria-expanded={door === "controls"}
            aria-controls={controlsId}
            aria-label="Controls"
            onClick={() => toggleDoor("controls")}
          >
            <span className="sr-only">Controls</span>
            <SettingsIcon />
          </button>
          {story ? (
            <button
              type="button"
              className="header-chip"
              aria-expanded={door === "story"}
              aria-controls={storyId}
              aria-label="Story"
              onClick={() => toggleDoor("story")}
            >
              <span className="sr-only">Story</span>
              <RouteIcon />
            </button>
          ) : null}
        </div>

        {door === "profile" ? (
          <div id={profileId} className="header-menu-pane flex flex-col gap-1">
            <Link
              href={GAME_MENU_PATH}
              className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
              data-active={pathname === GAME_MENU_PATH}
            >
              <PlayIcon />
              Play
            </Link>
            <Link
              href={ACCOUNT_PATH}
              className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
              data-active={pathname === ACCOUNT_PATH}
            >
              <AccountIcon />
              Account settings
            </Link>
            {isAdmin ? (
              <Link
                href={ADMIN_DASHBOARD_PATH}
                className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
                data-active={pathname.startsWith("/admin")}
              >
                <DashboardIcon />
                Admin space
              </Link>
            ) : null}
            <SignOutButton className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-left">
              <SignOutIcon />
              Sign out
            </SignOutButton>
          </div>
        ) : null}

        {door === "controls" ? (
          <div id={controlsId} className="header-menu-pane flex flex-col gap-1">
            <div className="header-menu-chips">
              <SoundToggle />
              <HapticsToggle variant="chip" />
            </div>
            <SwipeToggle variant="menu" />
          </div>
        ) : null}

        {door === "story" ? (
          <div id={storyId} className="header-menu-pane header-menu-chips">
            <button
              type="button"
              className="header-chip"
              aria-label="Open the book of Kal"
              aria-pressed={panel === "book"}
              onClick={() => openPanel("book")}
            >
              <span className="sr-only">Open the book of Kal</span>
              <BookIcon />
            </button>
            <button
              type="button"
              className="header-chip"
              aria-label="Open the galaxy map"
              aria-pressed={panel === "map"}
              onClick={() => openPanel("map")}
            >
              <span className="sr-only">Open the galaxy map</span>
              <GalaxyIcon />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  const panels =
    story ? (
      <>
        {panel === "book" ? <LoreBook zones={chrome.surface?.zones ?? []} onClose={() => setPanel(null)} /> : null}
        {panel === "map" ? (
          <GalaxyMap
            zones={chrome.surface?.zones ?? []}
            onClose={() => setPanel(null)}
            onTravel={(index) => {
              chrome.surface?.goTo(index);
              setPanel(null);
            }}
          />
        ) : null}
      </>
    ) : null;

  if (!story) {
    return (
      <header className="site-header pointer-events-none fixed inset-x-0 top-0 z-50" data-scrolled={scrolled}>
        <HeaderMenuBackdrop open={open} onClose={closeMenu} />
        <nav
          className="site-nav pointer-events-auto relative z-10 mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 backdrop-blur-[28px] backdrop-saturate-150 sm:px-5"
          aria-label="Game"
        >
          <Link
            href={GAME_MENU_PATH}
            aria-label="Breeq"
            className="relative z-10 flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
          >
            <LogoMark />
            <span aria-hidden="true" className="hidden sm:inline">
              Breeq
            </span>
          </Link>

          <div className="header-pills relative z-10 mx-2 flex min-w-0 flex-1 items-center justify-start gap-2 sm:mx-3" data-swapped={swapped}>
            {pills}
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <div className="header-sound-chip">
              <SoundToggle />
            </div>
            {menuButton}
          </div>
        </nav>
        {dropdown}
      </header>
    );
  }

  return (
    <header className="site-header pointer-events-none fixed inset-x-0 top-0 z-50" data-scrolled={scrolled} data-story="true">
      <HeaderMenuBackdrop open={open} onClose={closeMenu} />
      <div className="story-chrome pointer-events-auto relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-2">
        <nav
          className="site-nav story-pill story-pill-main rounded-full backdrop-blur-[28px] backdrop-saturate-150"
          aria-label="Game"
        >
          <Link
            href={GAME_MENU_PATH}
            aria-label="Breeq"
            className="relative z-10 flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
          >
            <LogoMark />
            <span aria-hidden="true" className="hidden sm:inline">
              Breeq
            </span>
          </Link>
          <div className="header-pills relative z-10 mx-2 flex min-w-0 flex-1 items-center justify-start gap-2 sm:mx-3" data-swapped={swapped}>
            {pills}
          </div>
        </nav>

        <nav
          className="site-nav story-pill story-pill-menu rounded-full backdrop-blur-[28px] backdrop-saturate-150"
          aria-label="Menu"
        >
          {menuButton}
        </nav>
      </div>
      {dropdown}
      {panels}
    </header>
  );
}

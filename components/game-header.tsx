"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
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
  LeaveIcon,
  PlayIcon,
  SettingsIcon,
} from "@/components/nav-icons";
import { RankMeter } from "@/components/rank-meter";
import { SoundToggle } from "@/components/sound-toggle";
import { useStoryChrome } from "@/components/story-chrome";
import { SwipeToggle } from "@/components/swipe-toggle";
import { WalletChip } from "@/components/wallet-chip";
import { ACCOUNT_PATH, ADMIN_DASHBOARD_PATH, EARN_PATH, GAME_MENU_PATH, SHOP_PATH, STORY_PATH } from "@/lib/auth/paths";
import type { Progress, StarTally } from "@/lib/progress";

type Pill = "rank" | "wallet" | "energy";
type MenuDoor = "settings" | "story";

/** The rows a keyboard can land on inside the menu sheet, top to bottom. */
function menuItems(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
}

let dismissMenu = () => {};

/**
 * The dock sits above the menu backdrop, so a Play ↔ Shop tap never hits it.
 * The tab calls this so the sheet does not travel with the layout.
 */
export function closeGameMenu() {
  dismissMenu();
}

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
  const settingsId = `${menuId}-settings`;
  const storyId = `${menuId}-story`;
  const chrome = useStoryChrome();
  const story = pathname.startsWith(STORY_PATH);
  const open = menuPath === pathname;
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  /** The menu was opened from the keyboard with an arrow: land on its first row once it is up. */
  const focusFirst = useRef(false);

  // Two pills, one unfolded at a time: the energy gauge in Story, the bag in
  // Earn and the shop, the level elsewhere. A tap on the folded one swaps
  // them; a route change goes back to the default.
  const inEarn = pathname.startsWith(EARN_PATH) || pathname.startsWith(SHOP_PATH);
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

  const closeMenu = () => {
    setMenuPath(null);
    setDoor(null);
  };

  useEffect(() => {
    dismissMenu = () => {
      setMenuPath(null);
      setDoor(null);
    };
    return () => {
      dismissMenu = () => {};
    };
  }, []);

  // The header lives in the game layout, so it keeps its state across Play ↔
  // Shop. A route change puts the disclosure away.
  useEffect(() => {
    setMenuPath(null);
    setDoor(null);
  }, [pathname]);

  /** Escape: the menu goes, focus comes back to the button that opened it. */
  const escapeMenu = () => {
    closeMenu();
    menuButtonRef.current?.focus();
  };
  const toggleMenu = () => setMenuPath((current) => (current === pathname ? null : pathname));
  const toggleDoor = (next: MenuDoor) => setDoor((current) => (current === next ? null : next));

  // Opened with an arrow key: focus the first row as soon as it exists.
  useEffect(() => {
    if (!open || !focusFirst.current) return;
    focusFirst.current = false;
    menuItems(menuRef.current)[0]?.focus();
  }, [open]);

  // Tabbing out of the header puts the menu away; a pointer tap that moves
  // focus nowhere (Safari never focuses buttons) is left to the backdrop.
  const onHeaderBlur = (event: FocusEvent<HTMLElement>) => {
    if (!open) return;
    const next = event.relatedTarget;
    if (next instanceof Node && !headerRef.current?.contains(next)) closeMenu();
  };

  const onMenuButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (open) {
      const items = menuItems(menuRef.current);
      (event.key === "ArrowDown" ? items[0] : items[items.length - 1])?.focus();
      return;
    }
    focusFirst.current = true;
    setMenuPath(pathname);
  };

  /** Up / Down walk the rows and wrap, Home / End jump; Tab keeps its own order. */
  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    if (key !== "ArrowDown" && key !== "ArrowUp" && key !== "Home" && key !== "End") return;
    const items = menuItems(menuRef.current);
    if (items.length === 0) return;
    const active = document.activeElement instanceof HTMLElement ? items.indexOf(document.activeElement) : -1;
    const last = items.length - 1;
    const next =
      key === "Home" ? 0
      : key === "End" ? last
      : key === "ArrowDown" ? (active < 0 || active === last ? 0 : active + 1)
      : active <= 0 ? last : active - 1;
    event.preventDefault();
    items[next].focus();
  };

  const { panel, setPanel } = chrome;
  const openPanel = (next: "book" | "map") => {
    setPanel(panel === next ? null : next);
    closeMenu();
  };

  const menuButton = (
    <button
      ref={menuButtonRef}
      type="button"
      className={story ? "story-pill-face" : "header-chip"}
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      aria-label="Menu"
      onClick={toggleMenu}
      onKeyDown={onMenuButtonKeyDown}
    >
      <MenuIcon open={open} />
    </button>
  );

  const dropdown = open ? (
    <div
      id={menuId}
      className="pointer-events-auto relative z-10 mx-auto mt-2 flex w-full max-w-6xl justify-end"
    >
      <div
        ref={menuRef}
        className="glass-sheet header-menu flex flex-col gap-1 p-3"
        role="group"
        aria-label="Menu"
        onKeyDown={onMenuKeyDown}
      >
        {/* Top to bottom: where to go, the settings, the account, the admin
            space, and Leave the story last when this is a story surface. */}
        {story ? (
          <>
            <button
              type="button"
              id={`${storyId}-door`}
              className="nav-link flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left"
              aria-expanded={door === "story"}
              aria-controls={storyId}
              data-active={door === "story"}
              onClick={() => toggleDoor("story")}
            >
              <span className="menu-emoji" aria-hidden="true">
                🦎
              </span>
              Story
            </button>
            {door === "story" ? (
              <div id={storyId} role="group" aria-labelledby={`${storyId}-door`} className="header-menu-pane flex flex-col gap-1">
                <button
                  type="button"
                  className="nav-link flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left"
                  aria-haspopup="dialog"
                  data-active={panel === "book"}
                  onClick={() => openPanel("book")}
                >
                  <BookIcon />
                  Book of Kal
                </button>
                <button
                  type="button"
                  className="nav-link flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left"
                  aria-haspopup="dialog"
                  data-active={panel === "map"}
                  onClick={() => openPanel("map")}
                >
                  <GalaxyIcon />
                  Galaxy map
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <Link
            href={GAME_MENU_PATH}
            className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
            data-active={pathname === GAME_MENU_PATH}
            aria-current={pathname === GAME_MENU_PATH ? "page" : undefined}
            onClick={closeMenu}
          >
            <PlayIcon />
            Play
          </Link>
        )}

        <button
          type="button"
          id={`${settingsId}-door`}
          className="nav-link flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left"
          aria-expanded={door === "settings"}
          aria-controls={settingsId}
          data-active={door === "settings"}
          onClick={() => toggleDoor("settings")}
        >
          <SettingsIcon />
          Settings
        </button>
        {door === "settings" ? (
          <div id={settingsId} role="group" aria-labelledby={`${settingsId}-door`} className="header-menu-pane header-menu-switches flex flex-col gap-1">
            <SoundToggle variant="menu" />
            <HapticsToggle variant="menu" />
            <SwipeToggle variant="menu" />
          </div>
        ) : null}

        <Link
          href={ACCOUNT_PATH}
          className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
          data-active={pathname === ACCOUNT_PATH}
          aria-current={pathname === ACCOUNT_PATH ? "page" : undefined}
          onClick={closeMenu}
        >
          <AccountIcon />
          Profile
        </Link>

        {isAdmin ? (
          <Link
            href={ADMIN_DASHBOARD_PATH}
            className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
            data-active={pathname.startsWith("/admin")}
            onClick={closeMenu}
          >
            <DashboardIcon />
            Admin
          </Link>
        ) : null}

        {story ? (
          <>
            <div className="header-menu-rule" role="separator" />
            <Link href={GAME_MENU_PATH} className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3" onClick={closeMenu}>
              <LeaveIcon />
              Leave the story
            </Link>
          </>
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
      <header
        ref={headerRef}
        className="site-header pointer-events-none fixed inset-x-0 top-0 z-50"
        data-scrolled={scrolled}
        onBlur={onHeaderBlur}
      >
        <HeaderMenuBackdrop open={open} onClose={closeMenu} onEscape={escapeMenu} />
        <nav
          className="site-nav pointer-events-auto relative z-10 mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 backdrop-blur-[28px] backdrop-saturate-150 sm:px-5"
          aria-label="Game"
        >
          <Link
            href={GAME_MENU_PATH}
            aria-label="Breeq"
            className="relative z-10 flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
            onClick={closeMenu}
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
    <header
      ref={headerRef}
      className="site-header pointer-events-none fixed inset-x-0 top-0 z-50"
      data-scrolled={scrolled}
      data-story="true"
      onBlur={onHeaderBlur}
    >
      <HeaderMenuBackdrop open={open} onClose={closeMenu} onEscape={escapeMenu} />
      <div className="story-chrome pointer-events-auto relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-2">
        <nav
          className="site-nav story-pill story-pill-main rounded-full backdrop-blur-[28px] backdrop-saturate-150"
          aria-label="Game"
        >
          <Link
            href={GAME_MENU_PATH}
            aria-label="Breeq"
            className="relative z-10 flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
            onClick={closeMenu}
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

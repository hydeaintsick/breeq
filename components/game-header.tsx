"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { GalaxyMap } from "@/components/galaxy-map";
import { HapticsToggle } from "@/components/haptics-toggle";
import { HeaderMenuBackdrop } from "@/components/header-menu-backdrop";
import { LogoMark } from "@/components/logo-mark";
import { LoreBook } from "@/components/lore-book";
import { MenuIcon } from "@/components/menu-icon";
import { AccountIcon, BookIcon, CloseIcon, EditorIcon, GalaxyIcon, RouteIcon, SignOutIcon } from "@/components/nav-icons";
import { RankMeter } from "@/components/rank-meter";
import { SignOutButton } from "@/components/sign-out-button";
import { SoundToggle } from "@/components/sound-toggle";
import { useStoryChrome } from "@/components/story-chrome";
import { SwipeToggle } from "@/components/swipe-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { ACCOUNT_PATH, ADMIN_EDITOR_PATH, GAME_MENU_PATH, STORY_PATH } from "@/lib/auth/paths";
import type { Progress, StarTally } from "@/lib/progress";

export function GameHeader({
  progress,
  stars,
  isAdmin = false,
}: {
  progress: Progress;
  stars: StarTally;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const chrome = useStoryChrome();
  /** Story owns the screen: the game's pill rolls up on the left to make room for the story's. */
  const story = pathname.startsWith(STORY_PATH);
  const mainOpen = !story || chrome.focus === "main";
  // Rolling the game's pill up also folds its dropdown.
  const open = mainOpen && menuPath === pathname;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMenu = () => setMenuPath((current) => (current === pathname ? null : pathname));

  const menuButton = (
    <button
      type="button"
      className="header-chip"
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
      <div className="glass-sheet flex w-full max-w-xs flex-col gap-1 p-3">
        <Link
          href={ACCOUNT_PATH}
          className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
          data-active={pathname === ACCOUNT_PATH}
        >
          <AccountIcon />
          Account settings
        </Link>
        {story ? <ThemeToggle variant="menu" /> : null}
        <HapticsToggle variant="menu" />
        <SwipeToggle variant="menu" />
        {isAdmin ? (
          <Link
            href={ADMIN_EDITOR_PATH}
            className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
            data-active={pathname.startsWith(ADMIN_EDITOR_PATH)}
          >
            <EditorIcon />
            Editor
          </Link>
        ) : null}
        <SignOutButton className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-left">
          <SignOutIcon />
          Sign out
        </SignOutButton>
      </div>
    </div>
  ) : null;

  if (!story) {
    return (
      <header className="site-header pointer-events-none fixed inset-x-0 top-0 z-50" data-scrolled={scrolled}>
        <HeaderMenuBackdrop open={open} onClose={() => setMenuPath(null)} />
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

          <div className="relative z-10 mx-2 flex min-w-0 flex-1 justify-start sm:mx-3">
            <RankMeter progress={progress} stars={stars} />
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <SoundToggle />
            <ThemeToggle />
            {menuButton}
          </div>
        </nav>
        {dropdown}
      </header>
    );
  }

  const storyOpen = chrome.focus === "story";
  const { panel, setPanel, setFocus } = chrome;

  return (
    <header className="site-header pointer-events-none fixed inset-x-0 top-0 z-50" data-scrolled={scrolled} data-story="true">
      <HeaderMenuBackdrop open={open} onClose={() => setMenuPath(null)} />
      <div className="story-chrome pointer-events-auto relative z-10 mx-auto flex max-w-6xl items-center gap-2">
        <nav
          className="site-nav story-pill story-pill-main rounded-full backdrop-blur-[28px] backdrop-saturate-150"
          data-open={mainOpen ? "true" : "false"}
          aria-label="Game"
        >
          {mainOpen ? (
            <>
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
              <div className="relative z-10 mx-2 flex min-w-0 flex-1 justify-start sm:mx-3">
                <RankMeter progress={progress} stars={stars} />
              </div>
              <div className="relative z-10 flex shrink-0 items-center gap-2">{menuButton}</div>
            </>
          ) : (
            <button
              type="button"
              className="story-pill-face"
              aria-label="Unroll the game menu"
              aria-expanded={false}
              onClick={() => setFocus("main")}
            >
              <LogoMark />
            </button>
          )}
        </nav>

        <nav
          className="site-nav story-pill story-pill-story rounded-full backdrop-blur-[28px] backdrop-saturate-150"
          data-open={storyOpen ? "true" : "false"}
          aria-label="Story"
        >
          {storyOpen ? (
            <>
              <button
                type="button"
                className="header-chip"
                aria-label="Open the book of Kal"
                aria-pressed={panel === "book"}
                onClick={() => setPanel(panel === "book" ? null : "book")}
              >
                <span className="sr-only">Open the book of Kal</span>
                <BookIcon />
              </button>
              <button
                type="button"
                className="header-chip"
                aria-label="Open the galaxy map"
                aria-pressed={panel === "map"}
                onClick={() => setPanel(panel === "map" ? null : "map")}
              >
                <span className="sr-only">Open the galaxy map</span>
                <GalaxyIcon />
              </button>
              <SoundToggle />
              <HapticsToggle variant="chip" />
              <Link href={GAME_MENU_PATH} className="header-chip" aria-label="Leave the story">
                <span className="sr-only">Leave the story</span>
                <CloseIcon />
              </Link>
            </>
          ) : (
            <button
              type="button"
              className="story-pill-face"
              aria-label="Unroll the story menu"
              aria-expanded={false}
              onClick={() => setFocus("story")}
            >
              <RouteIcon />
            </button>
          )}
        </nav>
      </div>
      {dropdown}
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
    </header>
  );
}

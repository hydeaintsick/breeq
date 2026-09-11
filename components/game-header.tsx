"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { HapticsToggle } from "@/components/haptics-toggle";
import { HeaderMenuBackdrop } from "@/components/header-menu-backdrop";
import { LogoMark } from "@/components/logo-mark";
import { MenuIcon } from "@/components/menu-icon";
import { AccountIcon, EditorIcon, SignOutIcon } from "@/components/nav-icons";
import { RankMeter } from "@/components/rank-meter";
import { SignOutButton } from "@/components/sign-out-button";
import { SoundToggle } from "@/components/sound-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { ACCOUNT_PATH, ADMIN_EDITOR_PATH, GAME_MENU_PATH } from "@/lib/auth/paths";
import type { Progress } from "@/lib/progress";

export function GameHeader({
  progress,
  isAdmin = false,
}: {
  progress: Progress;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const open = menuPath === pathname;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="site-header pointer-events-none fixed inset-x-0 top-0 z-50"
      data-scrolled={scrolled}
    >
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
          <RankMeter progress={progress} />
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <SoundToggle />
          <ThemeToggle />
          <button
            type="button"
            className="header-chip"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() =>
              setMenuPath((current) => (current === pathname ? null : pathname))
            }
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <MenuIcon open={open} />
          </button>
        </div>
      </nav>

      {open ? (
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
            <HapticsToggle variant="menu" />
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
      ) : null}
    </header>
  );
}

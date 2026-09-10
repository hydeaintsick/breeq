"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { LogoMark } from "@/components/logo-mark";
import { MenuIcon } from "@/components/menu-icon";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ACCOUNT_PATH, GAME_MENU_PATH } from "@/lib/auth/paths";

export function GameHeader() {
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

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPath(null);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className="site-header pointer-events-none fixed inset-x-0 top-0 z-50"
      data-scrolled={scrolled}
    >
      <nav
        className="site-nav pointer-events-auto relative mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 backdrop-blur-[28px] backdrop-saturate-150 sm:px-5"
        aria-label="Game"
      >
        <Link
          href={GAME_MENU_PATH}
          aria-label="Breeq"
          className="relative z-10 flex items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
        >
          <LogoMark />
          <span aria-hidden="true">Breeq</span>
        </Link>

        <div className="relative z-10 flex items-center gap-2">
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
          className="pointer-events-auto mx-auto mt-2 flex w-full max-w-6xl justify-end"
        >
          <div className="glass-sheet flex w-full max-w-xs flex-col gap-1 p-3">
            <Link
              href={ACCOUNT_PATH}
              className="nav-link flex min-h-11 items-center rounded-xl px-3"
              data-active={pathname === ACCOUNT_PATH}
            >
              Account settings
            </Link>
            <SignOutButton className="nav-link flex min-h-11 items-center rounded-xl px-3 text-left" />
          </div>
        </div>
      ) : null}
    </header>
  );
}

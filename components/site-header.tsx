"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";
import { HeaderMenuBackdrop } from "@/components/header-menu-backdrop";
import { LeaderboardIcon, LeaderboardPanel } from "@/components/leaderboard";
import { LogoMark } from "@/components/logo-mark";
import { MenuIcon } from "@/components/menu-icon";
import {
  DashboardIcon,
  ListIcon,
  MailIcon,
  PageIcon,
  PlayIcon,
  ShieldIcon,
} from "@/components/nav-icons";
import { ADMIN_DASHBOARD_PATH, GAME_MENU_PATH } from "@/lib/auth/paths";
import type { Leaderboard } from "@/lib/leaderboard";

const links = [
  { href: "/whitepaper", label: "Whitepaper", Icon: PageIcon },
  { href: "/terms", label: "Terms", Icon: ListIcon },
  { href: "/privacy", label: "Privacy", Icon: ShieldIcon },
  { href: "/contact", label: "Contact", Icon: MailIcon },
] as const;

export function SiteHeader({ board }: { board: Leaderboard }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [ranksOpen, setRanksOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const ranksId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const ranksButtonRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    setRanksOpen(false);
  };
  const isAdmin = session?.user.role === "ADMIN";
  const onHome = pathname === "/";
  const ranks = onHome && ranksOpen;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setRanksOpen(false);
  }, [pathname]);

  const toggleMenu = () => {
    setRanksOpen(false);
    setOpen((current) => !current);
  };
  const toggleRanks = () => {
    setOpen(false);
    setRanksOpen((current) => !current);
  };
  const onEscape = () => {
    const ranksWasOpen = ranks;
    const menuWasOpen = open;
    close();
    if (ranksWasOpen) ranksButtonRef.current?.focus();
    else if (menuWasOpen) menuButtonRef.current?.focus();
  };

  return (
    <header
      className="site-header pointer-events-none fixed inset-x-0 top-0 z-50"
      data-scrolled={scrolled}
    >
      <HeaderMenuBackdrop open={open || ranks} onClose={close} onEscape={onEscape} />
      <nav
        className="site-nav pointer-events-auto relative z-10 mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 backdrop-blur-[28px] backdrop-saturate-150 sm:px-5"
        aria-label="Primary"
      >
        <Link
          href="/"
          aria-label="Breeq"
          className="relative z-10 flex items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
          onClick={close}
        >
          <LogoMark />
          <span aria-hidden="true">Breeq</span>
        </Link>

        <div className="relative z-10 flex items-center gap-2 md:gap-7">
          <div className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                data-active={pathname === link.href}
                onClick={close}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin ? (
              <Link
                href={ADMIN_DASHBOARD_PATH}
                className="nav-link"
                data-active={pathname.startsWith("/admin")}
                onClick={close}
              >
                Admin
              </Link>
            ) : null}
          </div>
          {onHome ? (
            <button
              ref={ranksButtonRef}
              type="button"
              className="header-chip leaderboard-chip"
              aria-expanded={ranks}
              aria-controls={ranks ? ranksId : undefined}
              aria-label="Ranks"
              data-header-menu=""
              data-open={ranks ? "true" : undefined}
              onClick={toggleRanks}
            >
              <LeaderboardIcon />
              <span className="leaderboard-chip-label">Ranks</span>
            </button>
          ) : null}
          <Link href={GAME_MENU_PATH} className="btn-play play-shimmer hidden gap-2 md:inline-flex" onClick={close}>
            <PlayIcon />
            Play
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className="header-chip md:hidden"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            aria-label={open ? "Close menu" : "Open menu"}
            data-header-menu=""
            onClick={toggleMenu}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <MenuIcon open={open} />
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id={menuId}
          className="glass-sheet pointer-events-auto relative z-10 mx-auto mt-2 flex max-w-6xl flex-col gap-1 p-3 md:hidden"
          data-header-menu=""
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
              data-active={pathname === link.href}
              onClick={close}
            >
              <link.Icon />
              {link.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              href={ADMIN_DASHBOARD_PATH}
              className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
              data-active={pathname.startsWith("/admin")}
              onClick={close}
            >
              <DashboardIcon />
              Admin
            </Link>
          ) : null}
          <Link
            href={GAME_MENU_PATH}
            className="btn-play play-shimmer mt-1 min-h-11 w-full gap-2"
            onClick={close}
          >
            <PlayIcon />
            Play
          </Link>
        </div>
      ) : null}
      {ranks ? <LeaderboardPanel id={ranksId} board={board} /> : null}
    </header>
  );
}

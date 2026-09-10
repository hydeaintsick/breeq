"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useId, useState } from "react";
import { HeaderMenuBackdrop } from "@/components/header-menu-backdrop";
import { LogoMark } from "@/components/logo-mark";
import { MenuIcon } from "@/components/menu-icon";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ADMIN_DASHBOARD_PATH, GAME_MENU_PATH } from "@/lib/auth/paths";

const links = [
  { href: "/whitepaper", label: "Whitepaper" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const close = () => setOpen(false);
  const isAdmin = session?.user.role === "ADMIN";

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
      <HeaderMenuBackdrop open={open} onClose={close} />
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

        <div className="relative z-10 hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              data-active={pathname === link.href}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              href={ADMIN_DASHBOARD_PATH}
              className="nav-link"
              data-active={pathname.startsWith("/admin")}
            >
              Admin
            </Link>
          ) : null}
          {session?.user ? (
            <SignOutButton className="nav-link" />
          ) : null}
          <ThemeToggle />
          <Link href={GAME_MENU_PATH} className="btn-play play-shimmer">
            Play
          </Link>
        </div>

        <div className="relative z-10 flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="header-chip"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((current) => !current)}
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
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link flex min-h-11 items-center rounded-xl px-3"
              data-active={pathname === link.href}
              onClick={close}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              href={ADMIN_DASHBOARD_PATH}
              className="nav-link flex min-h-11 items-center rounded-xl px-3"
              data-active={pathname.startsWith("/admin")}
              onClick={close}
            >
              Admin
            </Link>
          ) : null}
          {session?.user ? (
            <SignOutButton className="nav-link flex min-h-11 items-center rounded-xl px-3 text-left" />
          ) : null}
          <Link
            href={GAME_MENU_PATH}
            className="btn-play play-shimmer mt-1 w-full"
            onClick={close}
          >
            Play
          </Link>
        </div>
      ) : null}
    </header>
  );
}

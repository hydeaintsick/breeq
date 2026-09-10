"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { LogoMark } from "@/components/logo-mark";
import { MenuIcon } from "@/components/menu-icon";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ADMIN_DASHBOARD_PATH, GAME_MENU_PATH } from "@/lib/auth/paths";

const links = [
  { href: ADMIN_DASHBOARD_PATH, label: "Dashboard" },
  { href: GAME_MENU_PATH, label: "Play" },
] as const;

export function AdminHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header pointer-events-none fixed inset-x-0 top-0 z-50">
      <nav
        className="site-nav pointer-events-auto relative mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 backdrop-blur-[28px] backdrop-saturate-150 sm:px-5"
        aria-label="Admin"
      >
        <Link
          href={ADMIN_DASHBOARD_PATH}
          aria-label="Breeq admin"
          className="relative z-10 flex items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
          onClick={close}
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
          className="pointer-events-auto mx-auto mt-2 flex w-full max-w-6xl justify-end"
        >
          <div className="glass-sheet flex w-full max-w-xs flex-col gap-1 p-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link flex min-h-11 items-center rounded-xl px-3"
                data-active={
                  link.href === ADMIN_DASHBOARD_PATH
                    ? pathname.startsWith("/admin")
                    : pathname.startsWith("/game")
                }
                onClick={close}
              >
                {link.label}
              </Link>
            ))}
            <SignOutButton className="nav-link flex min-h-11 items-center rounded-xl px-3 text-left" />
          </div>
        </div>
      ) : null}
    </header>
  );
}

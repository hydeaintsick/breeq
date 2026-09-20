"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { HeaderMenuBackdrop } from "@/components/header-menu-backdrop";
import { LogoMark } from "@/components/logo-mark";
import { MenuIcon } from "@/components/menu-icon";
import {
  DashboardIcon,
  EditorIcon,
  GemIcon,
  PeopleIcon,
  PlayIcon,
  SettingsIcon,
  WallIcon,
  WithdrawIcon,
} from "@/components/nav-icons";
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_EARN_PATH,
  ADMIN_ECONOMY_PATH,
  ADMIN_EDITOR_PATH,
  ADMIN_PLAYERS_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_WITHDRAWALS_PATH,
  GAME_MENU_PATH,
} from "@/lib/auth/paths";

const links = [
  { href: ADMIN_DASHBOARD_PATH, label: "Dashboard", match: "exact", Icon: DashboardIcon },
  { href: ADMIN_EDITOR_PATH, label: "Story editor", match: "prefix", Icon: EditorIcon },
  { href: ADMIN_EARN_PATH, label: "Earn maps", match: "prefix", Icon: WallIcon },
  { href: ADMIN_ECONOMY_PATH, label: "Economy", match: "prefix", Icon: GemIcon },
  { href: ADMIN_PLAYERS_PATH, label: "Players", match: "prefix", Icon: PeopleIcon },
  { href: ADMIN_WITHDRAWALS_PATH, label: "Withdrawals", match: "prefix", Icon: WithdrawIcon },
  { href: ADMIN_SETTINGS_PATH, label: "Settings", match: "prefix", Icon: SettingsIcon },
] as const;

export function AdminHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const close = () => setOpen(false);

  return (
    <header className="site-header pointer-events-none fixed inset-x-0 top-0 z-50">
      <HeaderMenuBackdrop open={open} onClose={close} />
      <nav
        className="site-nav pointer-events-auto relative z-10 mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 backdrop-blur-[28px] backdrop-saturate-150 sm:px-5"
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
          <button
            type="button"
            className="header-chip"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            data-header-menu=""
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
          className="pointer-events-none relative z-10 mx-auto mt-2 flex w-full max-w-6xl justify-end"
        >
          <div className="glass-sheet pointer-events-auto flex w-full max-w-xs flex-col gap-1 p-3" data-header-menu="">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-3"
                data-active={
                  link.match === "exact"
                    ? pathname === link.href
                    : pathname.startsWith(link.href)
                }
                onClick={close}
              >
                <link.Icon />
                {link.label}
              </Link>
            ))}
            <Link
              href={GAME_MENU_PATH}
              className="btn-play play-shimmer mt-1 min-h-11 w-full gap-2"
              onClick={close}
            >
              <PlayIcon />
              Play
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  EditorIcon,
  GemIcon,
  PeopleIcon,
  SettingsIcon,
  WallIcon,
  WithdrawIcon,
  BellIcon,
  StarIcon,
} from "@/components/nav-icons";
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_EARN_PATH,
  ADMIN_ECONOMY_PATH,
  ADMIN_EDITOR_PATH,
  ADMIN_PLAYERS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_REVIEWS_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_WITHDRAWALS_PATH,
} from "@/lib/auth/paths";

/**
 * The admin space's menu: a sidebar on wide screens, a scrolling row of
 * pills under the header on a phone. `pending` puts a badge on Withdrawals.
 */
export function AdminNav({ pending = 0 }: { pending?: number }) {
  const pathname = usePathname();
  const links = [
    { href: ADMIN_DASHBOARD_PATH, label: "Dashboard", Icon: DashboardIcon, exact: true },
    { href: ADMIN_EDITOR_PATH, label: "Story editor", Icon: EditorIcon, exact: false },
    { href: ADMIN_EARN_PATH, label: "Earn maps", Icon: WallIcon, exact: false },
    { href: ADMIN_ECONOMY_PATH, label: "Economy", Icon: GemIcon, exact: false },
    { href: ADMIN_PLAYERS_PATH, label: "Players", Icon: PeopleIcon, exact: false },
    { href: ADMIN_NOTIFICATIONS_PATH, label: "Notifications", Icon: BellIcon, exact: false },
    { href: ADMIN_REVIEWS_PATH, label: "Reviews", Icon: StarIcon, exact: false },
    { href: ADMIN_WITHDRAWALS_PATH, label: "Withdrawals", Icon: WithdrawIcon, exact: false, badge: pending },
    { href: ADMIN_SETTINGS_PATH, label: "Settings", Icon: SettingsIcon, exact: false },
  ];

  return (
    <nav className="admin-nav lg:glass" aria-label="Admin space">
      <div className="admin-nav-links">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} className="admin-nav-link" data-active={active} aria-current={active ? "page" : undefined}>
              <link.Icon />
              {link.label}
              {link.badge ? <span className="admin-nav-badge">{link.badge}</span> : null}
            </Link>
          );
        })}
      </div>
      <p className="admin-nav-note">Times in Paris</p>
    </nav>
  );
}

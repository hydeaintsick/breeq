"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Leaderboard } from "@/lib/leaderboard";

export function AppChrome({
  children,
  board,
}: {
  children: React.ReactNode;
  board: Leaderboard;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isGame = pathname.startsWith("/game");
  const hideFooter =
    isAdmin ||
    isGame ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth");

  return (
    <>
      {isAdmin || isGame ? null : <SiteHeader board={board} />}
      <main id="content" className="flex flex-1 flex-col">
        {children}
      </main>
      {hideFooter ? null : <SiteFooter />}
    </>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function AppChrome({ children }: { children: React.ReactNode }) {
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
      {isAdmin || isGame ? null : <SiteHeader />}
      <main id="content" className="flex flex-1 flex-col">
        {children}
      </main>
      {hideFooter ? null : <SiteFooter />}
    </>
  );
}

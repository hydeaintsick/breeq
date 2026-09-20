"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GameDock, dockShown } from "@/components/game-dock";

/**
 * The game's body under the header: the page, and the dock when the page has
 * one. The body pads its bottom for the dock so nothing hides behind it.
 */
export function GameShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dock = dockShown(pathname);
  return (
    <>
      <div className="game-body flex min-h-0 flex-1 flex-col overflow-x-clip" data-dock={dock ? "true" : undefined}>
        {children}
      </div>
      {dock ? <GameDock /> : null}
    </>
  );
}

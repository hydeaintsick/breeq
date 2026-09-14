"use client";

import { useEffect } from "react";
import { enterImmersive, exitImmersive, wantsImmersive } from "@/game/breakout/preview";

/**
 * Hold the screen while the caller is mounted: full screen, locked to
 * portrait, on touch-first devices where the browser allows it. Fullscreen
 * needs a gesture, so the request rides on the first pointer down (the mode
 * card that opened Story usually asked already); leaving the surface gives
 * the screen back. Desktop pointers are left alone.
 */
export function useImmersive(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let asked = false;
    const ask = () => {
      if (asked) return;
      asked = true;
      if (wantsImmersive()) void enterImmersive();
    };
    window.addEventListener("pointerdown", ask, { passive: true });
    window.addEventListener("keydown", ask);
    return () => {
      window.removeEventListener("pointerdown", ask);
      window.removeEventListener("keydown", ask);
      void exitImmersive();
    };
  }, [enabled]);
}

"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { setSwipeAnywhereEnabled } from "@/game/breakout/preview/swipe";
import { SWIPE_COOKIE, SWIPE_MAX_AGE, type SwipePreference } from "@/lib/swipe";

type SwipeContextValue = {
  /** True when a swipe anywhere on the stage steers the paddle. */
  anywhere: boolean;
  setAnywhere: (anywhere: boolean) => void;
  toggle: () => void;
};

const SwipeContext = createContext<SwipeContextValue | null>(null);

function writeSwipeCookie(swipe: SwipePreference) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SWIPE_COOKIE}=${swipe}; Path=/; Max-Age=${SWIPE_MAX_AGE}; SameSite=Lax${secure}`;
}

export function SwipeProvider({
  swipe: initialSwipe,
  children,
}: {
  swipe: SwipePreference;
  children: React.ReactNode;
}) {
  const [anywhere, setAnywhereState] = useState(initialSwipe === "anywhere");
  setSwipeAnywhereEnabled(anywhere);

  const setAnywhere = useCallback((next: boolean) => {
    setAnywhereState(next);
    writeSwipeCookie(next ? "anywhere" : "rail");
    setSwipeAnywhereEnabled(next);
  }, []);

  const toggle = useCallback(() => {
    setAnywhere(!anywhere);
  }, [anywhere, setAnywhere]);

  const value = useMemo(() => ({ anywhere, setAnywhere, toggle }), [anywhere, setAnywhere, toggle]);

  return <SwipeContext.Provider value={value}>{children}</SwipeContext.Provider>;
}

export function useSwipe() {
  const context = useContext(SwipeContext);
  if (!context) {
    throw new Error("useSwipe must be used within SwipeProvider");
  }
  return context;
}

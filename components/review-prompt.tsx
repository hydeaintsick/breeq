"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { acceptReview, markReviewSeen, optOutReview, snoozeReview } from "@/app/actions/review";
import { useBalances } from "@/components/balances-provider";
import { useClaim } from "@/components/claim-provider";
import { usePushPrompt } from "@/components/push-prompt";
import { ReviewPromptSheet, type ReviewPhase } from "@/components/review-sheet";
import { playSheetBack, playSheetBuy } from "@/game/breakout/audio";
import { pulseUi } from "@/game/breakout/haptics";
import { GAME_MENU_PATH } from "@/lib/auth/paths";
import { inBreeqApp } from "@/lib/push-client";
import { PLAY_STORE_URL } from "@/lib/review";

type ReviewApi = {
  /** Open now. `"wait"` until we know if this is the Android app. */
  place: () => "shown" | "wait" | "skip";
  /** Hold the ask until the claim sheet closes. */
  defer: () => "shown" | "wait" | "skip";
};

const ReviewContext = createContext<ReviewApi | null>(null);

export function useReviewPrompt() {
  const value = useContext(ReviewContext);
  if (!value) throw new Error("useReviewPrompt must be used under ReviewPromptProvider");
  return value;
}

/** Hand the listing to the Play app. The shell keeps this page underneath. */
function openPlayStore() {
  const popup = window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
  if (popup) return true;
  if (!inBreeqApp()) return false;
  window.location.assign(PLAY_STORE_URL);
  return true;
}

/**
 * The Play review ask. Due from the server (every N first story clears).
 * The Android app only. Rated and don't-ask-again never arm it again;
 * Not now waits another N clears. A push ask in the same visit goes first.
 */
export function ReviewPromptProvider({
  due,
  gems,
  children,
}: {
  due: boolean;
  gems: number;
  children: ReactNode;
}) {
  const claim = useClaim();
  const push = usePushPrompt();
  const balances = useBalances();
  const pathname = usePathname();
  const appRef = useRef<"unknown" | "yes" | "no">("unknown");
  const [closed, setClosed] = useState(false);
  const [active, setActive] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [phase, setPhase] = useState<ReviewPhase>("ask");
  const [landed, setLanded] = useState(gems);
  const [storeOpen, setStoreOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const logged = useRef(false);
  const dueNow = due && !closed;

  useEffect(() => {
    appRef.current = inBreeqApp() ? "yes" : "no";
  }, []);

  const show = useCallback(() => {
    setPhase("ask");
    setError(null);
    setLanded(gems);
    setStoreOpen(false);
    setActive(true);
  }, [gems]);

  const blocked = useCallback(() => {
    return push.occupying() || push.active || push.settledThisVisit || push.owed;
  }, [push]);

  const place = useCallback((): "shown" | "wait" | "skip" => {
    if (closed) return "skip";
    if (appRef.current === "unknown") return "wait";
    if (appRef.current === "no") return "skip";
    if (blocked()) return "skip";
    if (claim.active) {
      setWaiting(true);
      return "shown";
    }
    show();
    return "shown";
  }, [blocked, claim.active, closed, show]);

  const defer = useCallback((): "shown" | "wait" | "skip" => {
    if (closed) return "skip";
    if (appRef.current === "unknown") return "wait";
    if (appRef.current === "no") return "skip";
    if (blocked()) return "skip";
    setWaiting(true);
    return "shown";
  }, [blocked, closed]);

  useEffect(() => {
    if (!waiting || claim.active) return;
    const id = window.setTimeout(() => {
      setWaiting(false);
      if (appRef.current !== "yes" || blocked()) return;
      show();
    }, 0);
    return () => window.clearTimeout(id);
  }, [blocked, claim.active, show, waiting]);

  useEffect(() => {
    if (!dueNow || active || waiting || appRef.current !== "yes") return;
    if (pathname !== GAME_MENU_PATH) return;
    if (claim.active || blocked()) return;
    const timer = window.setTimeout(() => {
      if (push.occupying()) return;
      show();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [active, blocked, claim.active, dueNow, pathname, push, show, waiting]);

  useEffect(() => {
    if (!active) {
      logged.current = false;
      return;
    }
    if (logged.current || phase !== "ask") return;
    logged.current = true;
    void markReviewSeen();
  }, [active, phase]);

  async function rate() {
    if (lock.current || phase !== "ask") return;
    lock.current = true;
    setPending(true);
    setError(null);
    playSheetBuy();
    pulseUi(12);
    const opened = openPlayStore();
    setStoreOpen(opened);
    try {
      const result = await acceptReview();
      if ("error" in result) {
        setError(opened ? "Google Play opened, but the gems did not land. Tap again." : result.error);
        return;
      }
      setLanded(result.gems);
      balances?.setBalances(result.balances);
      setClosed(true);
      setPhase("thanks");
    } catch {
      setError(opened ? "Google Play opened, but the gems did not land. Tap again." : "Could not add the gems. Try again.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  async function later() {
    if (lock.current || phase !== "ask") return;
    lock.current = true;
    playSheetBack();
    setClosed(true);
    setActive(false);
    setWaiting(false);
    try {
      await snoozeReview();
    } catch {
      // Still closed on this visit. The next one may ask again if the write failed.
    } finally {
      lock.current = false;
    }
  }

  async function never() {
    if (lock.current || phase !== "ask") return;
    lock.current = true;
    playSheetBack();
    setClosed(true);
    setActive(false);
    setWaiting(false);
    try {
      await optOutReview();
    } catch {
      // Closed here either way. A failed write can ask once more next visit.
    } finally {
      lock.current = false;
    }
  }

  function close() {
    playSheetBack();
    setActive(false);
  }

  const api = useMemo<ReviewApi>(() => ({ place, defer }), [defer, place]);

  return (
    <ReviewContext.Provider value={api}>
      {children}
      {active ? (
        <ReviewPromptSheet
          phase={phase}
          gems={phase === "thanks" ? landed : gems}
          pending={pending}
          error={error}
          storeOpen={storeOpen}
          onRate={() => void rate()}
          onLater={() => void later()}
          onNever={() => void never()}
          onClose={close}
        />
      ) : null}
    </ReviewContext.Provider>
  );
}

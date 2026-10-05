"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { recordPushChoice } from "@/app/actions/push";
import { useClaim } from "@/components/claim-provider";
import { CloseIcon } from "@/components/nav-icons";
import { useSheetSwipe } from "@/components/use-sheet-swipe";
import { playSheetAppear, playSheetBack, playSheetBuy } from "@/game/breakout/audio";
import { pulseUi } from "@/game/breakout/haptics";
import { GAME_MENU_PATH } from "@/lib/auth/paths";
import { publicPushAppId } from "@/lib/push";
import {
  configureNativePush,
  inBreeqApp,
  nativePushReady,
  pushCanAsk,
  resumeWebPush,
  subscribePush,
} from "@/lib/push-client";

type Phase = "ask" | "in" | "blocked";

/**
 * Night glass over the victory, after the first story chapter — never the
 * tutorial. One ask. Account is the way back.
 */
export function PushPromptSheet({
  phase,
  pending,
  error,
  preview = false,
  onAccept,
  onLater,
  onClose,
}: {
  phase: Phase;
  pending: boolean;
  error: string | null;
  preview?: boolean;
  onAccept: () => void;
  onLater: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const appeared = useRef(false);

  useEffect(() => {
    if (appeared.current) return;
    appeared.current = true;
    playSheetAppear();
    pulseUi(6);
    sheetRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || pending) return;
      event.preventDefault();
      if (phase === "ask") onLater();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onLater, pending, phase]);

  function dismiss() {
    if (pending) return;
    if (phase === "ask") onLater();
    else onClose();
  }

  const swipe = useSheetSwipe(sheetRef, dismiss);
  const title = phase === "in" ? "You're in." : phase === "blocked" ? "Notifications are blocked." : "Stay in the loop?";
  const line =
    phase === "in"
      ? "We'll write when a new chapter or something worth opening lands. Nothing else."
      : phase === "blocked"
        ? "Breeq can't show them on this device yet. Allow notifications in the system settings, or turn them on later from Account."
        : "Push notifications for new chapters and the occasional update. No ads. You can turn them off any time in Account.";

  return (
    <div className="energy-sheet push-sheet" onClick={dismiss}>
      <div
        ref={sheetRef}
        className="energy-sheet-body"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={swipe.onPointerDown}
        onPointerMove={swipe.onPointerMove}
        onPointerUp={swipe.onPointerUp}
        onPointerCancel={swipe.onPointerCancel}
      >
        <div className="gem-shop-handle" aria-hidden="true" />
        <div className="energy-sheet-head">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">News</p>
            <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
          </div>
          <button type="button" className="header-chip energy-sheet-close" aria-label="Not now" onClick={dismiss}>
            <CloseIcon />
          </button>
        </div>

        <div className="push-mark" aria-hidden="true">
          <span className="push-ball" />
        </div>
        <p className="energy-sheet-copy mt-4">{line}</p>
        {preview && phase === "ask" ? (
          <p className="energy-sheet-fine mt-3">Preview. Players get the phone or browser prompt here. This does not subscribe you.</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {phase === "ask" ? (
          <div className="mt-6 grid gap-3">
            <button type="button" className="btn-play min-h-11 w-full" disabled={pending} onClick={onAccept}>
              {pending ? "One moment…" : "Turn on notifications"}
            </button>
            <button type="button" className="btn-glass story-clear-glass min-h-11 w-full" disabled={pending} onClick={onLater}>
              Not now
            </button>
          </div>
        ) : (
          <button type="button" className="btn-play mt-6 min-h-11 w-full" onClick={onClose}>
            {phase === "in" ? "Keep playing" : "OK"}
          </button>
        )}
      </div>
    </div>
  );
}

type PushApi = {
  /** Open now. False when push cannot be offered yet, or the claim sheet is up (then it waits). */
  place: () => boolean;
  /** Hold the ask until the claim sheet closes. */
  defer: () => boolean;
  /**
   * True in the same turn the sheet is opening, not only after React paints.
   * The review ask reads this so the two sheets never stack.
   */
  occupying: () => boolean;
  active: boolean;
  /** They answered during this visit. The review waits for the next one. */
  settledThisVisit: boolean;
  /** A push ask is still owed on this device. */
  owed: boolean;
};

const PushContext = createContext<PushApi | null>(null);

export function usePushPrompt() {
  const value = useContext(PushContext);
  if (!value) throw new Error("usePushPrompt must be used under PushPromptProvider");
  return value;
}

export function PushPromptProvider({
  userId,
  prompted: promptedFromServer,
  optedIn: optedInFromServer,
  storyClears,
  children,
}: {
  userId: string;
  prompted: boolean;
  optedIn: boolean;
  /** Story chapters cleared. The tutorial does not count. */
  storyClears: number;
  children: ReactNode;
}) {
  const claim = useClaim();
  const pathname = usePathname();
  const [prompted, setPrompted] = useState(promptedFromServer);
  const [optedIn, setOptedIn] = useState(optedInFromServer);
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("ask");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitingOnClaim, setWaitingOnClaim] = useState(false);
  const [settledThisVisit, setSettledThisVisit] = useState(false);
  const appId = publicPushAppId();
  const activeRef = useRef(false);
  const waitingRef = useRef(false);
  const settledRef = useRef(false);
  const promptedRef = useRef(prompted);
  const deviceRef = useRef(false);
  const canAskDevice = typeof window !== "undefined" && pushCanAsk();

  useEffect(() => {
    deviceRef.current = canAskDevice;
  }, [canAskDevice]);

  const settleVisit = useCallback(() => {
    settledRef.current = true;
    promptedRef.current = true;
    setSettledThisVisit(true);
  }, []);

  const occupying = useCallback(() => {
    return (
      activeRef.current ||
      waitingRef.current ||
      settledRef.current ||
      (!promptedRef.current && storyClears >= 1 && deviceRef.current)
    );
  }, [storyClears]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      promptedRef.current = promptedRef.current || promptedFromServer;
      setPrompted((current) => current || promptedFromServer);
      setOptedIn(optedInFromServer);
    }, 0);
    return () => window.clearTimeout(id);
  }, [optedInFromServer, promptedFromServer]);

  useEffect(() => {
    if (appId) configureNativePush(appId);
  }, [appId]);

  useEffect(() => {
    if (!optedIn) return;
    const native = inBreeqApp();
    if (native) {
      if (appId) configureNativePush(appId);
      if (nativePushReady()) window.BreeqAndroid?.linkUser(userId);
      return;
    }
    void resumeWebPush(appId, userId);
  }, [appId, optedIn, userId]);

  const available = useCallback(() => !prompted && pushCanAsk(), [prompted]);

  const place = useCallback(() => {
    if (!available()) return false;
    if (claim.active) {
      waitingRef.current = true;
      setWaitingOnClaim(true);
      return true;
    }
    waitingRef.current = false;
    activeRef.current = true;
    setPhase("ask");
    setError(null);
    setActive(true);
    return true;
  }, [available, claim.active]);

  const defer = useCallback(() => {
    if (!available()) return false;
    waitingRef.current = true;
    setWaitingOnClaim(true);
    return true;
  }, [available]);

  useEffect(() => {
    if (!waitingOnClaim || claim.active || prompted) return;
    const id = window.setTimeout(() => {
      waitingRef.current = false;
      setWaitingOnClaim(false);
      if (!pushCanAsk()) return;
      activeRef.current = true;
      setPhase("ask");
      setError(null);
      setActive(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [claim.active, prompted, waitingOnClaim]);

  // Someone who already passed a story chapter before this existed, or who
  // left the victory before answering. The shelf itself can be mid-run, so
  // the catch-up only happens on Play.
  useEffect(() => {
    if (prompted || active || storyClears < 1) return;
    if (pathname !== GAME_MENU_PATH) return;
    if (claim.active || !pushCanAsk()) return;
    const timer = window.setTimeout(() => {
      activeRef.current = true;
      setPhase("ask");
      setError(null);
      setActive(true);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [active, claim.active, pathname, prompted, storyClears]);

  async function accept() {
    if (pending) return;
    setPending(true);
    setError(null);
    playSheetBuy();
    pulseUi(10);
    try {
      const result = await subscribePush(userId);
      if (result === "on") {
        setOptedIn(true);
        setPrompted(true);
        settleVisit();
        await recordPushChoice(true);
        setPhase("in");
        return;
      }
      if (result === "unsupported") {
        setError("Notifications aren't available on this device yet.");
        return;
      }
      setPrompted(true);
      settleVisit();
      await recordPushChoice(false);
      setPhase("blocked");
    } catch {
      setError("Could not turn notifications on. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function later() {
    if (pending) return;
    playSheetBack();
    activeRef.current = false;
    waitingRef.current = false;
    settleVisit();
    setPrompted(true);
    setActive(false);
    try {
      await recordPushChoice(false);
    } catch {
      // The next visit may ask once more. That is the safe failure.
    }
  }

  function close() {
    playSheetBack();
    activeRef.current = false;
    setActive(false);
  }

  const owed = !prompted && !settledThisVisit && storyClears >= 1 && canAskDevice;
  const api = useMemo<PushApi>(
    () => ({ place, defer, occupying, active, settledThisVisit, owed }),
    [active, defer, occupying, owed, place, settledThisVisit],
  );

  return (
    <PushContext.Provider value={api}>
      {children}
      {active
        ? createPortal(
            <PushPromptSheet
              phase={phase}
              pending={pending}
              error={error}
              onAccept={() => void accept()}
              onLater={() => void later()}
              onClose={close}
            />,
            document.body,
          )
        : null}
    </PushContext.Provider>
  );
}

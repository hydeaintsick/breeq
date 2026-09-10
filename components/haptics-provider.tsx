"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { isHapticsSupported, playHapticCheck, setHapticsEnabled } from "@/game/breakout/haptics";
import { HAPTICS_COOKIE, HAPTICS_MAX_AGE, type HapticsPreference } from "@/lib/haptics";

const subscribeNever = () => () => {};

type HapticsContextValue = {
  enabled: boolean;
  /** False until mounted, and on devices without `navigator.vibrate` (iOS, desktop). */
  supported: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
};

const HapticsContext = createContext<HapticsContextValue | null>(null);

function writeHapticsCookie(haptics: HapticsPreference) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${HAPTICS_COOKIE}=${haptics}; Path=/; Max-Age=${HAPTICS_MAX_AGE}; SameSite=Lax${secure}`;
}

export function HapticsProvider({
  haptics: initialHaptics,
  children,
}: {
  haptics: HapticsPreference;
  children: React.ReactNode;
}) {
  const [enabled, setEnabledState] = useState(initialHaptics === "on");
  // Server and first client paint agree on `false`; the real answer follows hydration.
  const supported = useSyncExternalStore(subscribeNever, isHapticsSupported, () => false);

  useEffect(() => {
    setHapticsEnabled(enabled);
  }, [enabled]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    writeHapticsCookie(next ? "on" : "off");
    setHapticsEnabled(next);
    // Inside the tap, so the browser lets it through.
    if (next) playHapticCheck();
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  const value = useMemo(
    () => ({ enabled, supported, setEnabled, toggle }),
    [enabled, supported, setEnabled, toggle],
  );

  return <HapticsContext.Provider value={value}>{children}</HapticsContext.Provider>;
}

export function useHaptics() {
  const context = useContext(HapticsContext);
  if (!context) {
    throw new Error("useHaptics must be used within HapticsProvider");
  }
  return context;
}

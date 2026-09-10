"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { playSoundCheck, setSoundEnabled } from "@/game/breakout/audio";
import { SOUND_COOKIE, SOUND_MAX_AGE, type SoundPreference } from "@/lib/sound";

type SoundContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

function writeSoundCookie(sound: SoundPreference) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SOUND_COOKIE}=${sound}; Path=/; Max-Age=${SOUND_MAX_AGE}; SameSite=Lax${secure}`;
}

export function SoundProvider({
  sound: initialSound,
  children,
}: {
  sound: SoundPreference;
  children: React.ReactNode;
}) {
  const [enabled, setEnabledState] = useState(initialSound === "on");

  // Keep the audio engine in step with the preference, including on first paint.
  useEffect(() => {
    setSoundEnabled(enabled);
  }, [enabled]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    writeSoundCookie(next ? "on" : "off");
    setSoundEnabled(next);
    // Runs inside the click, which is what the autoplay policy needs to start audio.
    if (next) playSoundCheck();
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  const value = useMemo(() => ({ enabled, setEnabled, toggle }), [enabled, setEnabled, toggle]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within SoundProvider");
  }
  return context;
}

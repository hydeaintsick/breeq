"use client";

import { useEffect, useRef } from "react";
import { useSound } from "@/components/sound-provider";
import { acquireStoryTheme, type StoryThemeHandle } from "@/game/breakout/audio";

/**
 * Plays the story theme while the caller is mounted and the sound preference
 * is on. `quiet` steps the theme aside (a chapter is running); a hidden tab does
 * the same. Turning sound off releases the theme; turning it back on starts it
 * again from inside the toggle's click, which is what the autoplay policy wants.
 */
export function useStoryTheme(quiet: boolean) {
  const { enabled } = useSound();
  const handleRef = useRef<StoryThemeHandle | null>(null);
  const quietRef = useRef(quiet);

  useEffect(() => {
    quietRef.current = quiet;
  }, [quiet]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const handle = acquireStoryTheme();
    handleRef.current = handle;
    handle.setActive(!quietRef.current && document.visibilityState === "visible");

    // A context created before any gesture stays suspended until one arrives.
    const retry = () => handle.start();
    window.addEventListener("pointerdown", retry, { passive: true });
    window.addEventListener("keydown", retry);
    window.addEventListener("click", retry, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      window.removeEventListener("click", retry);
      handleRef.current = null;
      handle.release();
    };
  }, [enabled]);

  useEffect(() => {
    const apply = () => {
      handleRef.current?.setActive(!quiet && document.visibilityState === "visible");
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, [quiet, enabled]);
}

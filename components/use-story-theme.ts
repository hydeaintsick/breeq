"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSound } from "@/components/sound-provider";
import { acquireStoryTheme, acquireTheme, type ThemeHandle, type ThemeScore } from "@/game/breakout/audio";

/**
 * Plays a theme while the caller is mounted and the sound preference is on.
 * `quiet` steps the theme aside (a chapter is running, a run is paused); a
 * hidden tab does the same. Turning sound off releases the theme; turning it
 * back on starts it again from inside the toggle's click, which is what the
 * autoplay policy wants.
 *
 * Themes stack in the player: the surface mounted last is heard, the one
 * under it waits in silence and returns when the top one unmounts — the Earn
 * store hands over to a run and gets the floor back on the clear screen.
 *
 * `null` plays nothing (a run that has not started yet). Returns a setter for
 * the 0..1 intensity that reactive scores (Pursuit) listen to; a no-op on the
 * others.
 */
export function useTheme(score: ThemeScore | null, quiet: boolean): (level: number) => void {
  const acquire = useMemo(() => (score ? () => acquireTheme(score) : null), [score]);
  return useThemeHandle(acquire, quiet);
}

/** The story theme (the player's default or the local override) under the map and the episode sheet. */
export function useStoryTheme(quiet: boolean): void {
  useThemeHandle(acquireStoryTheme, quiet);
}

function useThemeHandle(acquire: (() => ThemeHandle) | null, quiet: boolean): (level: number) => void {
  const { enabled } = useSound();
  const handleRef = useRef<ThemeHandle | null>(null);
  const quietRef = useRef(quiet);
  const intensityRef = useRef(0);

  useEffect(() => {
    quietRef.current = quiet;
  }, [quiet]);

  useEffect(() => {
    if (!enabled || !acquire) {
      return;
    }
    const handle = acquire();
    handleRef.current = handle;
    handle.setActive(!quietRef.current && document.visibilityState === "visible");
    handle.setIntensity(intensityRef.current);

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
  }, [enabled, acquire]);

  useEffect(() => {
    const apply = () => {
      handleRef.current?.setActive(!quiet && document.visibilityState === "visible");
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, [quiet, enabled, acquire]);

  return useCallback((level: number) => {
    intensityRef.current = level;
    handleRef.current?.setIntensity(level);
  }, []);
}

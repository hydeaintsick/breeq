"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { JourneyHue, JourneyNodeState } from "@/game/journey";

/** One zone of the route, as the chrome needs it: the book unseals by slug, the map lights by state. */
export interface StoryZone {
  slug: string;
  title: string;
  /** "00" for the tutorial, "01" … for the episodes. */
  kicker: string;
  state: JourneyNodeState;
  hue: JourneyHue;
}

/** What a mounted story surface hands the chrome. */
export interface StorySurface {
  zones: readonly StoryZone[];
  /** Travel the route to a zone (the galaxy map taps into it). */
  goTo(index: number): void;
}

export type StoryChromeFocus = "main" | "story";
export type StoryChromePanel = "book" | "map" | null;

interface StoryChromeValue {
  surface: StorySurface | null;
  register(surface: StorySurface): () => void;
  /** Which header pill is unrolled: the game's, or the story's. */
  focus: StoryChromeFocus;
  setFocus(focus: StoryChromeFocus): void;
  /** The sheet the story pill opened, if any. */
  panel: StoryChromePanel;
  setPanel(panel: StoryChromePanel): void;
}

const StoryChromeContext = createContext<StoryChromeValue | null>(null);

/**
 * Coordinates the game header and a mounted story surface. The surface
 * registers its zones and a `goTo`; the header renders the story pill (book,
 * map, sound, vibration, exit) from them and tells the surface when one of its
 * sheets covers the map so it can rest.
 */
export function StoryChromeProvider({ children }: { children: ReactNode }) {
  const [surface, setSurface] = useState<StorySurface | null>(null);
  const [focus, setFocus] = useState<StoryChromeFocus>("story");
  const [panel, setPanel] = useState<StoryChromePanel>(null);
  const token = useRef<object | null>(null);

  const register = useCallback((next: StorySurface) => {
    const mine = {};
    const fresh = token.current === null;
    token.current = mine;
    setSurface(next);
    if (fresh) setFocus("story");
    return () => {
      // A re-publish (new zones) unregisters and registers in the same commit:
      // only a release nobody follows tears the chrome down.
      queueMicrotask(() => {
        if (token.current !== mine) return;
        token.current = null;
        setSurface(null);
        setPanel(null);
      });
    };
  }, []);

  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  const value = useMemo<StoryChromeValue>(
    () => ({ surface, register, focus, setFocus, panel, setPanel }),
    [focus, panel, register, surface],
  );

  return <StoryChromeContext.Provider value={value}>{children}</StoryChromeContext.Provider>;
}

export function useStoryChrome(): StoryChromeValue {
  const value = useContext(StoryChromeContext);
  if (!value) throw new Error("useStoryChrome needs a StoryChromeProvider");
  return value;
}

/** Same as `useStoryChrome`, but tolerant of surfaces mounted outside the game layout. */
export function useOptionalStoryChrome(): StoryChromeValue | null {
  return useContext(StoryChromeContext);
}

/**
 * Mount-side hook: publish the route to the chrome while mounted. `zones` is
 * re-published as progress changes; `goTo` is read through a ref so the
 * registration never churns.
 */
export function useStorySurface(zones: readonly StoryZone[], goTo: (index: number) => void): StoryChromeValue | null {
  const chrome = useOptionalStoryChrome();
  const goToRef = useRef(goTo);
  useEffect(() => {
    goToRef.current = goTo;
  });
  const register = chrome?.register;
  useEffect(() => {
    if (!register) return;
    return register({ zones, goTo: (index) => goToRef.current(index) });
  }, [register, zones]);
  return chrome;
}

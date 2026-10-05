"use client";

import { useEffect, useRef } from "react";
import { savePlayReplay } from "@/app/actions/replay";
import { serializeLevel } from "@/game/breakout/engine";
import type { Level } from "@/game/breakout/engine/types";
import type { BreakoutHandle } from "@/game/breakout/preview";

/** Ignore a mount that never really started. */
const MIN_STEPS = 240;

/**
 * While a real game is mounted, store its paddle tape on this account.
 * A save every few seconds, and one more when the board goes away, so a
 * quit still leaves a run an admin can replay.
 */
export function usePlayReplay({
  handle,
  kind,
  title,
  refId,
  level,
}: {
  handle: BreakoutHandle | null;
  kind: "story" | "tutorial" | "earn";
  title: string;
  refId: string | null;
  level: Level;
}) {
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => {
    if (!handle) return;
    const clientKey = crypto.randomUUID();
    let stopped = false;

    const send = (leaving: boolean) => {
      const tape = handle.tape();
      if (!tape || tape.steps < MIN_STEPS) return;
      const state = handle.state();
      const outcome =
        state.phase === "cleared" || state.phase === "over" ? state.ending : leaving ? "quit" : null;
      void savePlayReplay({
        clientKey,
        kind,
        title,
        ref: refId,
        level: serializeLevel(levelRef.current),
        tape,
        outcome,
        score: state.score,
      }).catch(() => null);
    };

    const first = window.setTimeout(() => {
      if (!stopped) send(false);
    }, 4000);
    const interval = window.setInterval(() => {
      if (!stopped) send(false);
    }, 15000);

    return () => {
      stopped = true;
      window.clearTimeout(first);
      window.clearInterval(interval);
      send(true);
    };
  }, [handle, kind, title, refId]);
}

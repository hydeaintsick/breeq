"use client";

import { useEffect, useRef } from "react";
import { recordPlayTime } from "@/app/actions/presence";

/**
 * Counts seconds a live board is actually running: the tab is visible and the
 * run is not paused, on a lesson card, or on an end screen. Flushes in short
 * beats; the server refuses anything faster than wall clock.
 */
export function PlayClock({ active }: { active: boolean }) {
  const activeRef = useRef(active);
  activeRef.current = active;
  const pending = useRef(0);

  useEffect(() => {
    let last = performance.now();
    let fraction = 0;

    const flush = () => {
      const seconds = Math.floor(pending.current);
      if (seconds < 1) return;
      pending.current -= seconds;
      void recordPlayTime(seconds).catch(() => {
        pending.current += seconds;
      });
    };

    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(2000, now - last);
      last = now;
      if (!activeRef.current || document.visibilityState !== "visible") return;
      fraction += dt;
      if (fraction >= 1000) {
        const whole = Math.floor(fraction / 1000);
        fraction -= whole * 1000;
        pending.current += whole;
      }
      if (pending.current >= 30) flush();
    }, 1000);

    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, []);

  useEffect(() => {
    if (active) return;
    const seconds = Math.floor(pending.current);
    if (seconds < 1) return;
    pending.current -= seconds;
    void recordPlayTime(seconds).catch(() => {
      pending.current += seconds;
    });
  }, [active]);

  return null;
}

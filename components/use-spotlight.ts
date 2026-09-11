"use client";

import { useCallback, useLayoutEffect, useMemo, useState, type RefObject } from "react";
import type { BreakoutHandle, CssRect } from "@/game/breakout/preview";
import type { SpotTarget } from "@/lib/discoveries";

const HOLE_PAD = 10;

function pad(rect: CssRect, by: number): CssRect {
  return { x: rect.x - by, y: rect.y - by, width: rect.width + by * 2, height: rect.height + by * 2 };
}

function union(a: CssRect, b: CssRect): CssRect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/**
 * Where the light goes: the union of the targets, in CSS pixels relative to
 * `root`, re-measured when the board settles or the window resizes. With no
 * target the veil collapses to a dot and dims the board evenly.
 */
export function useSpotlight({
  rootRef,
  handleRef,
  targets,
  ready,
}: {
  rootRef: RefObject<HTMLElement | null>;
  handleRef: RefObject<BreakoutHandle | null>;
  /** `null` when nothing is being shown. */
  targets: SpotTarget[] | null;
  /** Flips when the board handle arrives or goes away. */
  ready: boolean;
}) {
  const [hole, setHole] = useState<CssRect | null>(null);
  const [place, setPlace] = useState<"top" | "bottom" | "center">("center");

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root || !targets || targets.length === 0) {
      setHole(null);
      setPlace("center");
      return;
    }
    const base = root.getBoundingClientRect();
    const handle = handleRef.current;
    const canvas = root.querySelector("canvas");
    let rect: CssRect | null = null;
    for (const target of targets) {
      let part: CssRect | null = null;
      if (target.kind === "world") {
        if (handle && canvas) {
          const r = handle.project(target.x, target.y, target.w, target.h);
          const c = canvas.getBoundingClientRect();
          part = { x: r.x + c.left - base.left, y: r.y + c.top - base.top, width: r.width, height: r.height };
        }
      } else {
        const el = root.querySelector<HTMLElement>(target.selector);
        if (el) {
          const r = el.getBoundingClientRect();
          part = { x: r.left - base.left, y: r.top - base.top, width: r.width, height: r.height };
        }
      }
      if (part) rect = rect ? union(rect, part) : part;
    }
    if (!rect) {
      setHole(null);
      setPlace("center");
      return;
    }
    const padded = pad(rect, HOLE_PAD);
    setHole(padded);
    setPlace(padded.y + padded.height / 2 < base.height / 2 ? "bottom" : "top");
  }, [handleRef, rootRef, targets]);

  useLayoutEffect(() => {
    measure();
    if (!targets) return;
    // The board settles its size a frame later; measure again once it has.
    const raf = window.requestAnimationFrame(measure);
    // The mount re-lays the world out ~90ms after a resize settles.
    let timer = 0;
    const onResize = () => {
      measure();
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 160);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [measure, targets, ready]);

  const veilStyle = useMemo(
    () =>
      hole
        ? { left: hole.x, top: hole.y, width: hole.width, height: hole.height }
        : { left: "50%", top: "50%", width: 2, height: 2 },
    [hole],
  );

  return { hole, place, veilStyle };
}

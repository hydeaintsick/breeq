"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { mountGalaxy, type GalaxyFrame, type GalaxyZone } from "@/game/journey";

/** What the Story card hands over when it is tapped. */
export interface StoryDiveStart {
  /** The card's box on screen: the sky opens from it. */
  rect: { top: number; left: number; width: number; height: number };
  zones: readonly GalaxyZone[];
  /** The zone being dived into: where Kal stands. */
  index: number;
  /** The card's disc in screen px and how far it had turned, so the sky continues the card's picture. */
  frame: GalaxyFrame;
  time: number;
}

/** How far the picture scales in, and how long the fall takes. */
const DIVE_SCALE = 4.6;
const DIVE_SECONDS = 1.05;
/** The sky is held at least this long, so a fast route change never cuts the fall short. */
const MIN_MS = 1000;
/** And never longer than this: a slow network shows the route without the dive. */
const MAX_MS = 7000;
const OPEN_MS = 380;
const OUT_MS = 480;

/**
 * The way into Story: the card's sky opens to the whole screen and the galaxy
 * falls toward Kal's zone while the route loads underneath. Lifts once the
 * route has drawn and the fall has run. Canvas 2D at a capped DPR; the card
 * skips it under reduced motion, so it never runs there.
 */
export function StoryDive({
  start,
  arrived,
  onDone,
}: {
  start: StoryDiveStart;
  arrived: boolean;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [late, setLate] = useState(false);
  /** Lift once the route is drawn and the fall has run; lift anyway after a long wait. */
  const out = late || (arrived && ready);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { frame, time, zones, index } = start;
    const handle = mountGalaxy(canvas, zones, {
      compact: true,
      maxDpr: 1.5,
      startTime: time,
      frame: () => ({ cx: frame.cx, cy: frame.cy, R: frame.R }),
    });
    // Two frames: the sky is painted at the card's picture, then the frame opens and the fall starts.
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      setOpen(true);
      raf2 = window.requestAnimationFrame(() => handle.zoomTo(index, DIVE_SCALE, DIVE_SECONDS));
    });
    const held = window.setTimeout(() => setReady(true), MIN_MS);
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(held);
      handle.destroy();
    };
  }, [start]);

  useEffect(() => {
    const id = window.setTimeout(() => setLate(true), MAX_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!out) return;
    const id = window.setTimeout(() => onDoneRef.current(), OUT_MS + 40);
    return () => window.clearTimeout(id);
  }, [out]);

  const { rect } = start;
  const vw = typeof window === "undefined" ? rect.left + rect.width : window.innerWidth;
  const vh = typeof window === "undefined" ? rect.top + rect.height : window.innerHeight;
  const clip = open
    ? "inset(0px 0px 0px 0px round 0px)"
    : `inset(${rect.top}px ${Math.max(0, vw - rect.left - rect.width)}px ${Math.max(0, vh - rect.top - rect.height)}px ${rect.left}px round 1.6rem)`;
  const style = {
    clipPath: clip,
    "--dive-open": `${OPEN_MS}ms`,
    "--dive-out": `${OUT_MS}ms`,
  } as CSSProperties;

  return (
    <div className="story-dive" data-out={out ? "true" : undefined} style={style} aria-hidden="true">
      <canvas ref={canvasRef} className="story-dive-canvas" />
    </div>
  );
}

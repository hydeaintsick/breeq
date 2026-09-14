"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import { useOptionalStoryChrome } from "@/components/story-chrome";
import { enterImmersive, wantsImmersive } from "@/game/breakout/preview";
import { mountGalaxy, type GalaxyHandle } from "@/game/journey";
import type { RouteStand } from "@/lib/story-route";

/**
 * The Story card: Kal's galaxy turning slowly under the copy, the route a lit
 * thread on one arm, Kal's zone pulsing. Tapping it does not cut to a new
 * page: the sky opens from the card and falls toward that zone while the
 * route loads (`StoryDive`), so the menu, the map and the walls read as one
 * place. Under reduced motion, or outside the game chrome, it is a plain link.
 */
export function StoryCard({
  href,
  stand,
  tutorialRequired = false,
}: {
  href: string;
  stand: RouteStand;
  tutorialRequired?: boolean;
}) {
  const router = useRouter();
  const chrome = useOptionalStoryChrome();
  const cardRef = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GalaxyHandle | null>(null);
  const diving = useRef(false);
  const { zones, current } = stand;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || zones.length === 0) return;
    const handle = mountGalaxy(canvas, zones, {
      compact: true,
      // The disc sits in the card's upper half; the route's end hangs just over the copy.
      frame: (w, h) => ({ cx: w / 2, cy: h * 0.31, R: Math.min(w * 0.56, h * 0.3) }),
    });
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
    // Mounted once; zones are pushed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones.length]);

  useEffect(() => {
    handleRef.current?.setZones(zones);
  }, [zones]);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (wantsImmersive()) void enterImmersive();
    if (diving.current) {
      event.preventDefault();
      return;
    }
    const card = cardRef.current;
    const canvas = canvasRef.current;
    const handle = handleRef.current;
    const frame = handle?.frame();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!chrome || !card || !canvas || !handle || !frame || !current || reduced || event.defaultPrevented) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    diving.current = true;
    const rect = card.getBoundingClientRect();
    const sky = canvas.getBoundingClientRect();
    chrome.startDive({
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      zones,
      index: current.index,
      frame: { cx: sky.left + frame.cx, cy: sky.top + frame.cy, R: frame.R },
      time: handle.time(),
    });
    router.push(href);
  };

  const action = tutorialRequired ? "Learn to play" : stand.started ? "Continue" : "Play Story";
  const body = tutorialRequired
    ? "A two-minute tutorial, then Kal's way home: one wall, then the next."
    : "Follow Kal, a galactic gecko, home. One wall, then the next.";
  const where = current ? `Episode ${current.kicker} · ${current.title}` : null;
  const walls =
    current && current.total > 0
      ? current.cleared > 0
        ? `${current.cleared} of ${current.total} walls down`
        : `${current.total} walls`
      : null;
  const label = `${action}. Story. ${body}${where ? ` ${where}.` : ""}${walls ? ` ${walls}.` : ""}`;

  return (
    <div className="relative w-full md:max-w-[22rem]">
      <div className="board-aura" aria-hidden="true" />
      <Link ref={cardRef} href={href} className="mode-card story-card" aria-label={label} onClick={onClick}>
        <div className="story-card-sky" aria-hidden="true">
          <canvas ref={canvasRef} className="story-card-canvas" />
        </div>
        <div className="mode-card-copy">
          <p className="font-mono text-xs tracking-[0.16em] text-accent">The Book of Kal</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Story</h2>
          <p className="mt-2 max-w-[16rem] text-sm leading-6 text-white/75">{body}</p>
          {where ? (
            <p className="mt-1 font-mono text-xs tracking-[0.08em] text-white/60">
              {where}
              {walls ? ` · ${walls}` : ""}
            </p>
          ) : null}
          <span className="mode-card-cta">
            <span className="btn-play play-shimmer pointer-events-none min-h-11">{action}</span>
          </span>
        </div>
      </Link>
    </div>
  );
}

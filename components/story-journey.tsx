"use client";

import Link from "next/link";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import { Chevron } from "@/components/deck";
import { useSound } from "@/components/sound-provider";
import { StarRating } from "@/components/star-rating";
import { mountJourney, type JourneyHandle, type JourneyNodeInput, type JourneyPlacement } from "@/game/journey";

/** Copy for one zone's label card; the canvas draws the medallion. */
export interface JourneyCard {
  kicker: string;
  title: string;
  meta: string;
  action: string;
  locked: boolean;
  hint: string | null;
  /** 0..3, shown once the episode has been started. */
  stars: number | null;
  /** A link instead of an opening sheet (the tutorial). */
  href?: string;
}

export interface StoryJourneyHandle {
  goTo(index: number, options?: { instant?: boolean }): void;
  /** The medallion's box on screen, for the sheet to grow from and shrink back to. */
  anchorRect(index: number): DOMRect | null;
  current(): number;
}

export function StoryJourney({
  ref,
  nodes,
  cards,
  start,
  paused = false,
  keyboard = true,
  onOpen,
  onSettle,
  footer,
}: {
  ref?: Ref<StoryJourneyHandle>;
  nodes: readonly JourneyNodeInput[];
  cards: readonly JourneyCard[];
  /** Node to open on. */
  start: number;
  /** The map is hidden under a sheet: it neither draws nor sounds. */
  paused?: boolean;
  /** Arrow keys turn the map; off while another surface owns the keyboard. */
  keyboard?: boolean;
  /** The focused zone was activated. `anchor` is its medallion, for the morph. */
  onOpen: (index: number, anchor: HTMLElement) => void;
  onSettle?: (index: number) => void;
  footer?: ReactNode;
}) {
  const { enabled: soundOn } = useSound();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<JourneyHandle | null>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hitRefs = useRef<(HTMLElement | null)[]>([]);
  const camRef = useRef(start);
  const [active, setActive] = useState(start);
  const count = nodes.length;

  // Latest callbacks and data for the mount, which lives across renders.
  const onOpenRef = useRef(onOpen);
  const onSettleRef = useRef(onSettle);
  const cardsRef = useRef(cards);
  useEffect(() => {
    onOpenRef.current = onOpen;
    onSettleRef.current = onSettle;
    cardsRef.current = cards;
  });

  /** Where every label sits, written straight to the DOM once per frame. */
  const place = useCallback((cam: number, placements: readonly JourneyPlacement[]) => {
    camRef.current = cam;
    for (const p of placements) {
      const el = nodeRefs.current[p.index];
      if (!el) continue;
      if (!p.visible) {
        el.style.visibility = "hidden";
        continue;
      }
      el.style.visibility = "";
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      const a = Math.abs(p.d);
      const focus = a < 0.5;
      const fade = Math.max(0, Math.min(1, 1.15 - a * 0.9));
      el.style.opacity = fade.toFixed(3);
      if ((el.dataset.focus === "true") !== focus) el.dataset.focus = focus ? "true" : "false";
    }
  }, []);

  // Only refs are read here, so the mount can hold on to it across renders.
  const activate = useCallback((index: number) => {
    const handle = handleRef.current;
    if (!handle) return;
    const card = cardsRef.current[index];
    if (Math.abs(index - camRef.current) >= 0.5) {
      handle.goTo(index);
      return;
    }
    if (!card || card.locked) {
      handle.playLocked();
      return;
    }
    const anchor = hitRefs.current[index];
    if (!anchor) return;
    if (card.href) {
      handle.playOpen();
      anchor.querySelector<HTMLAnchorElement>("a")?.click();
      return;
    }
    handle.playOpen();
    onOpenRef.current(index, anchor);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || count === 0) return;
    const handle = mountJourney(canvas, nodes, {
      start,
      sound: true,
      onFrame: place,
      onSettle: (index) => {
        setActive(index);
        onSettleRef.current?.(index);
      },
      onTap: activate,
    });
    handleRef.current = handle;
    if (paused) handle.pause();
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
    // The map mounts once; nodes and pause state are pushed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    handleRef.current?.setNodes(nodes);
  }, [nodes]);

  useEffect(() => {
    if (paused) handleRef.current?.pause();
    else handleRef.current?.resume();
  }, [paused]);

  // Sound turned on from the header or the pause menu: start inside that click.
  useEffect(() => {
    if (soundOn) handleRef.current?.unlockSound();
  }, [soundOn]);

  useEffect(() => {
    if (paused || !keyboard) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const handle = handleRef.current;
      if (!handle) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handle.goTo(handle.current() + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handle.goTo(handle.current() - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        handle.goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        handle.goTo(count - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, keyboard, paused]);

  useImperativeHandle(
    ref,
    () => ({
      goTo: (index, options) => handleRef.current?.goTo(index, options),
      anchorRect: (index) => hitRefs.current[index]?.getBoundingClientRect() ?? null,
      current: () => handleRef.current?.current() ?? active,
    }),
    [active],
  );

  const dots = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  return (
    <div className="journey" role="group" aria-roledescription="map" aria-label="Story Journey">
      <div className="journey-stage">
        <canvas ref={canvasRef} className="journey-canvas" aria-hidden="true" />
        {nodes.map((node, index) => {
          const card = cards[index];
          if (!card) return null;
          const label = card.locked
            ? `Locked. ${card.title}. ${card.hint ?? card.meta}`
            : `${card.action}. ${card.title}. ${card.meta}`;
          return (
            <div
              key={node.id}
              ref={(el) => {
                nodeRefs.current[index] = el;
              }}
              className="journey-node"
              data-journey-node={index}
              data-state={node.state}
              data-focus={index === start ? "true" : "false"}
              style={{ visibility: "hidden" }}
            >
              <span
                ref={(el) => {
                  hitRefs.current[index] = el;
                }}
                className="journey-hit"
                aria-hidden="true"
              >
                {card.href && !card.locked ? <Link href={card.href} tabIndex={-1} aria-hidden="true" /> : null}
              </span>
              <button
                type="button"
                className="journey-card"
                aria-label={label}
                aria-disabled={card.locked || undefined}
                aria-current={node.state === "current" ? "step" : undefined}
                onClick={(event) => {
                  // Pointer taps are routed by the map itself; this is the keyboard.
                  if (event.detail === 0) activate(index);
                }}
              >
                <span className="journey-card-kicker">{card.kicker}</span>
                <span className="journey-card-title">{card.title}</span>
                <span className="journey-card-meta">{card.locked ? (card.hint ?? card.meta) : card.meta}</span>
                <span className="journey-card-row">
                  <span className={card.locked ? "btn-glass journey-card-cta" : "btn-play journey-card-cta play-shimmer"}>
                    {card.locked ? "Locked" : card.action}
                  </span>
                  {card.stars !== null ? <StarRating value={card.stars} size="sm" /> : null}
                </span>
              </button>
            </div>
          );
        })}
        <div className="journey-scrim" aria-hidden="true" />
      </div>

      <div className="story-page-foot journey-foot">
        {count > 1 ? (
          <div className="story-deck-nav">
            <button
              type="button"
              className="lore-arrow"
              aria-label="Previous zone"
              disabled={active === 0}
              onClick={() => handleRef.current?.goTo(active - 1)}
            >
              <Chevron direction="left" />
            </button>
            <div className="story-dots" role="tablist" aria-label="Zone">
              {dots.map((i) => (
                <button
                  key={nodes[i].id}
                  type="button"
                  className="story-dot"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`${cards[i]?.kicker ?? ""} ${cards[i]?.title ?? ""}`.trim()}
                  onClick={() => handleRef.current?.goTo(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className="lore-arrow"
              aria-label="Next zone"
              disabled={active === count - 1}
              onClick={() => handleRef.current?.goTo(active + 1)}
            >
              <Chevron direction="right" />
            </button>
          </div>
        ) : null}
        {footer}
      </div>
    </div>
  );
}

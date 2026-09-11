"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { STORY_PATH } from "@/lib/auth/paths";

export type LoreEpisode = {
  /** "01" … "08", as printed on the cover. */
  index: string;
  slug: string;
  title: string;
  /** The episode's lore, shown on the open page beside the deck. */
  body: string;
  /** The photo behind every wall of the episode; `null` paints a neon plate. */
  cover: string | null;
};

/** Covers kept in the rack on each side of the open one. */
const SIDE = 3;
/** A press that travels further than this is a drag, not a tap. */
const DRAG_START = 6;
/** Past this share of a cover width, letting go turns the page. */
const TURN_AT = 0.25;
/** A flick this fast (px/ms) turns the page whatever the distance. */
const FLICK = 0.45;

/**
 * Where a cover sits for its distance `d` from the open one (negative = to the
 * left). Fractions of `d` fall out of a drag, so every value is continuous.
 */
function place(d: number) {
  const a = Math.abs(d);
  const s = Math.sign(d);
  const lean = Math.min(a, 1);
  const deep = Math.max(0, a - 1);
  const x = s * (lean * 0.58 + deep * 0.2);
  const rotate = -s * lean * 30;
  const scale = 1 - lean * 0.12 - deep * 0.05;
  const opacity = a > SIDE + 0.6 ? 0 : Math.max(0, 1 - deep * 0.3);
  return {
    transform: `translateX(calc(${x.toFixed(4)} * var(--lore-card))) rotateY(${rotate.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
    opacity,
    zIndex: 20 - Math.round(a),
    dim: lean * 0.4 + deep * 0.12,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** The rack has a little give at both ends, then holds. */
function rubber(pos: number, last: number) {
  if (pos < 0) {
    return pos * 0.32;
  }
  if (pos > last) {
    return last + (pos - last) * 0.32;
  }
  return pos;
}

type Drag = {
  id: number;
  startX: number;
  lastX: number;
  lastT: number;
  velocity: number;
  width: number;
  moved: boolean;
};

export function LoreDeck({ episodes }: { episodes: readonly LoreEpisode[] }) {
  const pageId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const [active, setActive] = useState(0);
  /** Offset from `active`, in covers, while a finger holds the rack. */
  const [shift, setShift] = useState(0);
  const [dragging, setDragging] = useState(false);
  const last = episodes.length - 1;

  const go = useCallback(
    (index: number) => {
      setActive(clamp(index, 0, last));
    },
    [last],
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || dragRef.current) {
      return;
    }
    const cover = stageRef.current?.querySelector<HTMLElement>(".lore-cover");
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
      width: Math.max(cover?.offsetWidth ?? 280, 1),
      moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) {
      return;
    }
    const dx = event.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_START) {
        return;
      }
      drag.moved = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // A pointer the browser no longer knows about: the drag still works from the stage.
      }
      setDragging(true);
    }
    const dt = Math.max(1, event.timeStamp - drag.lastT);
    const step = (event.clientX - drag.lastX) / dt;
    drag.velocity = drag.velocity * 0.6 + step * 0.4;
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    // Pulling right brings the previous cover forward: the rack moves with the hand.
    const pos = rubber(active - dx / drag.width, last);
    setShift(pos - active);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    if (!drag.moved) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    // The tap that ends a drag is not a tap on a cover.
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);

    const travelled = -(event.clientX - drag.startX) / drag.width;
    let next = active;
    if (Math.abs(travelled) >= TURN_AT || Math.abs(drag.velocity) >= FLICK) {
      const direction = Math.abs(travelled) >= TURN_AT ? Math.sign(travelled) : -Math.sign(drag.velocity);
      next = active + direction * Math.max(1, Math.round(Math.abs(travelled)));
    }
    setDragging(false);
    setShift(0);
    go(next);
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        go(active + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        go(active - 1);
        break;
      case "Home":
        event.preventDefault();
        go(0);
        break;
      case "End":
        event.preventDefault();
        go(last);
        break;
      default:
    }
  };

  // A finger that leaves for the page scroll (pointercancel) must not leave the rack half-turned.
  useEffect(() => {
    if (!dragging) {
      return;
    }
    const reset = () => {
      dragRef.current = null;
      setDragging(false);
      setShift(0);
    };
    window.addEventListener("blur", reset);
    return () => window.removeEventListener("blur", reset);
  }, [dragging]);

  const pos = active + shift;
  const open = episodes[active];

  return (
    <>
      <div className="lore-halo" aria-hidden="true">
        {episodes.map((episode, index) => (
          <div key={episode.slug} className="lore-halo-plate" data-on={index === active ? "true" : undefined}>
            {episode.cover ? (
              <Image src={episode.cover} alt="" width={64} height={114} sizes="64px" className="lore-halo-photo" />
            ) : (
              <div className="lore-halo-fallback" />
            )}
          </div>
        ))}
      </div>

      <div className="lore-grid">
        <div
          ref={stageRef}
          className="lore-stage"
          data-dragging={dragging ? "true" : undefined}
          role="group"
          aria-roledescription="carousel"
          aria-label="Episode covers"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          onKeyDown={onKeyDown}
        >
          {episodes.map((episode, index) => {
            const { transform, opacity, zIndex, dim } = place(index - pos);
            const isOpen = index === active;
            const hidden = opacity === 0;
            return (
              <button
                key={episode.slug}
                type="button"
                className="lore-cover"
                data-open={isOpen ? "true" : undefined}
                style={{ transform, opacity, zIndex, visibility: hidden ? "hidden" : undefined, ["--lore-dim" as string]: dim }}
                aria-label={isOpen ? `Episode ${episode.index}, ${episode.title}. Turn the page.` : `Open episode ${episode.index}, ${episode.title}.`}
                aria-current={isOpen ? "true" : undefined}
                aria-hidden={hidden ? "true" : undefined}
                tabIndex={isOpen ? 0 : -1}
                onClick={() => go(isOpen ? index + 1 : index)}
              >
                {episode.cover ? (
                  <Image
                    src={episode.cover}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20rem, (min-width: 640px) 18rem, 64vw"
                    className="object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="lore-cover-fallback" />
                )}
                <span className="lore-cover-copy">
                  <span className="font-mono text-xs tracking-[0.16em] text-accent">Episode {episode.index}</span>
                  <span className="mt-2 block text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
                    {episode.title}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="lore-page">
          <div className="lore-page-nav">
            <button
              type="button"
              className="lore-arrow"
              aria-label="Previous episode"
              disabled={active === 0}
              onClick={() => go(active - 1)}
            >
              <Chevron direction="left" />
            </button>
            <div className="story-dots" role="tablist" aria-label="Episode">
              {episodes.map((episode, index) => (
                <button
                  key={episode.slug}
                  type="button"
                  className="story-dot"
                  role="tab"
                  aria-selected={index === active}
                  aria-controls={pageId}
                  aria-label={`Episode ${episode.index}, ${episode.title}`}
                  onClick={() => go(index)}
                />
              ))}
            </div>
            <button
              type="button"
              className="lore-arrow"
              aria-label="Next episode"
              disabled={active === last}
              onClick={() => go(active + 1)}
            >
              <Chevron direction="right" />
            </button>
          </div>
          <div id={pageId} className="lore-page-text" role="tabpanel" aria-live="polite">
            <div key={open.slug} className="lore-page-leaf">
              <p className="font-mono text-xs tracking-[0.16em] text-accent">
                Episode {open.index} · {active + 1} of {episodes.length}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{open.title}</h3>
              <p className="mt-3 text-base leading-7 text-ink-muted">{open.body}</p>
            </div>
          </div>
          <div className="lore-page-foot">
            <Link href={STORY_PATH} className="btn-play min-h-11">
              Play the story
            </Link>
            <p className="text-sm leading-6 text-ink-muted">
              Eight episodes, seventy-four walls, one new idea at a time. Swipe the covers to leaf through.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d={direction === "left" ? "M14.5 6l-6 6 6 6" : "M9.5 6l6 6-6 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

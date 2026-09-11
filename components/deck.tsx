"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

/**
 * The booklet: a rack of covers fanned around the open one, turned by a drag,
 * a flick, the arrow keys or a tap on a neighbour. The home page leafs through
 * the lore with it; the story shelf picks an episode with it. Both read the same
 * `--deck-card` / `--deck-spread` tokens and paint the same `--deck-dim` shade.
 */

/** Covers kept in the rack on each side of the open one; the last one is fading out. */
export const SIDE = 3;
/** A press that travels further than this is a drag, not a tap. */
const DRAG_START = 6;
/** Past this share of a cover width, letting go turns the page. */
const TURN_AT = 0.25;
/** A flick this fast (px/ms) turns the page whatever the distance. */
const FLICK = 0.45;

export type Placement = {
  transform: string;
  opacity: number;
  zIndex: number;
  /** How deep in the open cover's shade this one sits, 0–1. */
  dim: number;
};

/**
 * Where a cover sits for its distance `d` from the open one (negative = to the
 * left). Fractions of `d` fall out of a drag, so every value is continuous.
 * Covers stay opaque up to two places back (no see-through stack); the third
 * melts away quickly and anything further is not drawn at all.
 */
export function place(d: number): Placement {
  const a = Math.abs(d);
  const s = Math.sign(d);
  const lean = Math.min(a, 1);
  const deep = Math.max(0, a - 1);
  const x = s * (lean * 0.58 + deep * 0.2);
  const rotate = -s * lean * 30;
  const scale = 1 - lean * 0.12 - deep * 0.05;
  const opacity = a <= SIDE - 1 ? 1 : Math.max(0, SIDE - a);
  return {
    transform: `translateX(calc(${x.toFixed(4)} * var(--deck-card) * var(--deck-spread, 1))) rotateY(${rotate.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
    opacity,
    zIndex: 20 - Math.round(a),
    dim: Math.min(1, lean * 0.45 + deep * 0.16),
  };
}

export function coverStyle(p: Placement): CSSProperties {
  return {
    transform: p.transform,
    opacity: p.opacity,
    zIndex: p.zIndex,
    visibility: p.opacity === 0 ? "hidden" : undefined,
    ["--deck-dim" as string]: p.dim,
  };
}

/** The same values as `coverStyle`, written straight to the element mid-drag. */
export function paintCover(el: HTMLElement, p: Placement) {
  el.style.transform = p.transform;
  el.style.opacity = String(p.opacity);
  el.style.zIndex = String(p.zIndex);
  el.style.visibility = p.opacity === 0 ? "hidden" : "";
  el.style.setProperty("--deck-dim", String(p.dim));
}

export function clamp(value: number, min: number, max: number) {
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
  /** Where the rack is under the finger, in covers. */
  pos: number;
};

export function useDeck<Cover extends HTMLElement = HTMLElement>({
  count,
  active,
  onChange,
  onPaint,
}: {
  count: number;
  active: number;
  onChange: (index: number) => void;
  /** Called with the rack's fractional position on every hand-moved frame. */
  onPaint?: (pos: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const coverRefs = useRef<(Cover | null)[]>([]);
  const dragRef = useRef<Drag | null>(null);
  const frameRef = useRef(0);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);
  const last = Math.max(0, count - 1);

  const go = useCallback(
    (index: number) => {
      onChange(clamp(index, 0, last));
    },
    [last, onChange],
  );

  /** The `ref` for the cover at `index`, so the rack knows where each one is. */
  const coverRef = useCallback(
    (index: number) => (node: Cover | null) => {
      coverRefs.current[index] = node;
    },
    [],
  );

  /**
   * Mid-drag the covers are moved by hand, once per frame, without a React
   * render: pointer events can arrive at 120 Hz and a rack of covers with
   * photos is not worth reconciling for every one of them.
   */
  const paint = useCallback(
    (pos: number) => {
      coverRefs.current.forEach((el, index) => {
        if (el) {
          paintCover(el, place(index - pos));
        }
      });
      onPaint?.(pos);
    },
    [onPaint],
  );

  const schedulePaint = useCallback(() => {
    if (frameRef.current) {
      return;
    }
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      const drag = dragRef.current;
      if (drag) {
        paint(drag.pos);
      }
    });
  }, [paint]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || dragRef.current) {
      return;
    }
    const cover = coverRefs.current[active];
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
      width: Math.max(cover?.offsetWidth ?? 280, 1),
      moved: false,
      pos: active,
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
      // Transitions off at once, before the first hand-moved frame lands.
      event.currentTarget.dataset.dragging = "true";
      setDragging(true);
    }
    const dt = Math.max(1, event.timeStamp - drag.lastT);
    const step = (event.clientX - drag.lastX) / dt;
    drag.velocity = drag.velocity * 0.6 + step * 0.4;
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    // Pulling right brings the previous cover forward: the rack moves with the hand.
    drag.pos = rubber(active - dx / drag.width, last);
    schedulePaint();
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
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
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
    next = clamp(next, 0, last);
    // Transitions back on, then the covers glide from under the finger to their slots.
    delete event.currentTarget.dataset.dragging;
    paint(next);
    setDragging(false);
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

  // A finger that leaves for the page scroll (pointercancel) or a tab switch
  // must not leave the rack half-turned.
  useEffect(() => {
    if (!dragging) {
      return;
    }
    const reset = () => {
      dragRef.current = null;
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      delete stageRef.current?.dataset.dragging;
      paint(active);
      setDragging(false);
    };
    window.addEventListener("blur", reset);
    return () => window.removeEventListener("blur", reset);
  }, [active, dragging, paint]);

  useEffect(
    () => () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  return {
    stageRef,
    coverRef,
    dragging,
    last,
    go,
    /** Spread onto the stage element that holds the covers. */
    stageProps: {
      ref: stageRef,
      "data-dragging": dragging ? ("true" as const) : undefined,
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
      onKeyDown,
    },
  };
}

export function Chevron({ direction }: { direction: "left" | "right" }) {
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

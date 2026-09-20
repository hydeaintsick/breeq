"use client";

import { useRef, type PointerEvent, type RefObject } from "react";

/** Pull this far, or flick past it, and the sheet goes. */
const DISMISS_PX = 88;
const DISMISS_FLICK = 0.65;

/**
 * Swipe an action sheet down to close it — from the handle, or from the body
 * when it is already scrolled to the top. Controls keep their own taps; a
 * pull that does not travel far enough snaps back. Shared by the recharge
 * sheet and the unlock sheet; the handlers go on the sheet's scrolling body.
 */
export function useSheetSwipe(sheetRef: RefObject<HTMLDivElement | null>, onDismiss: () => void) {
  const drag = useRef<{
    id: number;
    startY: number;
    lastY: number;
    lastT: number;
    dy: number;
    v: number;
    live: boolean;
  } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const node = sheetRef.current;
    if (!node || node.scrollTop > 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [role='radio']")) return;
    drag.current = {
      id: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      lastT: event.timeStamp,
      dy: 0,
      v: 0,
      live: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    const node = sheetRef.current;
    if (!node) return;
    const dy = event.clientY - d.startY;
    const dt = Math.max(1, event.timeStamp - d.lastT);
    d.v = d.v * 0.55 + (event.clientY - d.lastY) / dt;
    d.lastY = event.clientY;
    d.lastT = event.timeStamp;
    d.dy = dy;
    if (!d.live) {
      if (dy < 12) {
        if (dy < -10) drag.current = null;
        return;
      }
      if (node.scrollTop > 0) {
        drag.current = null;
        return;
      }
      d.live = true;
      node.setPointerCapture(event.pointerId);
      node.dataset.dragging = "true";
    }
    const y = Math.max(0, dy);
    node.style.transform = `translateY(${y}px)`;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    const node = sheetRef.current;
    if (!node) return;
    if (d.live && (d.dy >= DISMISS_PX || (d.dy > 28 && d.v > DISMISS_FLICK))) {
      onDismiss();
      return;
    }
    delete node.dataset.dragging;
    node.style.transition = "transform 280ms var(--ease)";
    node.style.transform = "";
    const done = () => {
      node.style.transition = "";
      node.removeEventListener("transitionend", done);
    };
    node.addEventListener("transitionend", done);
  };

  return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag };
}

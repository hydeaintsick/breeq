"use client";

import { useEffect, useRef } from "react";

/**
 * Light-dismiss for an open header menu. A pointerdown anywhere outside the
 * burger button and its sheet (`[data-header-menu]`) puts the menu away, so
 * does Escape. `onEscape` lets the header hand focus back to the menu button
 * on the keyboard path; a tap leaves focus where the pointer is.
 *
 * This is a document listener, not a positioned overlay: the header is
 * `pointer-events: none` and only as tall as its chrome, so a full-screen
 * child never reliably receives taps on the page underneath.
 */
export function HeaderMenuBackdrop({
  open,
  onClose,
  onEscape,
}: {
  open: boolean;
  onClose: () => void;
  onEscape?: () => void;
}) {
  const onCloseRef = useRef(onClose);
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onCloseRef.current = onClose;
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        (onEscapeRef.current ?? onCloseRef.current)();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const node = event.target;
      const el =
        node instanceof Element ? node : node instanceof Node ? node.parentElement : null;
      if (el?.closest("[data-header-menu]")) {
        return;
      }
      onCloseRef.current();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return null;
}

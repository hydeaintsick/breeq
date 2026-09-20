"use client";

import { useEffect, useRef } from "react";

/**
 * The layer under an open header menu: a tap anywhere outside puts the menu
 * away, so does Escape. `onEscape` lets the header hand focus back to the
 * menu button on the keyboard path; a tap leaves focus where the pointer is.
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

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-auto fixed inset-0 z-0"
      onPointerDown={() => onCloseRef.current()}
    />
  );
}

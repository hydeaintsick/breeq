"use client";

import { useEffect, useRef } from "react";

export function HeaderMenuBackdrop({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
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

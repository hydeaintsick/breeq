"use client";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/nav-icons";

/**
 * A story sheet under the header pills: the book, the galaxy map. Rises from
 * the bottom of the screen and is sent back down with the chevron in its bar
 * (one glyph for "put it away"; the cross above it already means "leave the
 * story"). Escape does the same. The parent unmounts it once it has gone.
 */
export function StoryPanel({
  title,
  subtitle,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const [closing, setClosing] = useState(false);

  const requestClose = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing(true);
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  // The slide down takes its time from the stylesheet; a timer covers a missed animationend.
  useEffect(() => {
    if (!closing) return;
    const id = window.setTimeout(onClose, 420);
    return () => window.clearTimeout(id);
  }, [closing, onClose]);

  return (
    <div
      className="story-panel"
      data-closing={closing ? "true" : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onClose();
      }}
    >
      <div className="story-panel-grip" aria-hidden="true" />
      <div className="story-panel-bar">
        <div className="min-w-0">
          <p id={titleId} className="font-mono text-xs tracking-[0.16em] text-[#a7b4ff]">
            {title}
          </p>
          {subtitle ? <p className="mt-0.5 text-sm text-white/60">{subtitle}</p> : null}
        </div>
        <button type="button" className="story-close" aria-label={closeLabel} onClick={requestClose}>
          <ChevronDownIcon />
        </button>
      </div>
      {children}
    </div>
  );
}

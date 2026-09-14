"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { Chevron } from "@/components/deck";
import { CloseIcon } from "@/components/nav-icons";
import type { StoryZone } from "@/components/story-chrome";
import type { JourneyHue } from "@/game/journey";
import { LORE_BOOK, LORE_EPISODES, type LoreChapter } from "@/lib/lore";

type Leaf = {
  chapter: LoreChapter;
  /** Readable: the prologue always, an episode once its zone is reached. */
  open: boolean;
  /** Why it is sealed, when it is. */
  seal: string | null;
  /** The chapter's plate: the episode's own sky, when it has one. */
  cover: string | null;
  /** The zone's hue, as a CSS color expression. */
  hue: string;
};

const HUE_VAR: Record<JourneyHue, string> = {
  blue: "var(--neon-blue)",
  violet: "var(--neon-violet)",
  pink: "var(--neon-pink)",
  cyan: "var(--neon-cyan)",
  lime: "var(--neon-lime)",
  amber: "var(--neon-amber)",
  steel: "var(--steel)",
};

function leaves(zones: readonly StoryZone[]): Leaf[] {
  const byKey = new Map(zones.map((zone) => [zone.slug, zone] as const));
  const covers = new Map<string, string | null>(LORE_EPISODES.map((episode) => [episode.slug, episode.cover]));
  return LORE_BOOK.map((chapter) => {
    if (chapter.slug === null) return { chapter, open: true, seal: null, cover: null, hue: HUE_VAR.violet };
    const zone = byKey.get(chapter.slug);
    const cover = covers.get(chapter.slug) ?? null;
    const hue = HUE_VAR[zone?.hue ?? "steel"];
    if (!zone) return { chapter, open: false, seal: "Not on the route yet.", cover, hue };
    if (zone.state === "locked") {
      return { chapter, open: false, seal: `Reach zone ${zone.kicker} on the route to unseal this chapter.`, cover, hue };
    }
    return { chapter, open: true, seal: null, cover, hue };
  });
}

/**
 * The book of Kal: the lore as chapters. The prologue is always readable;
 * every other chapter unseals when its zone is reached on the route, so the
 * book is read at the pace the road is walked.
 */
export function LoreBook({ zones, onClose }: { zones: readonly StoryZone[]; onClose: () => void }) {
  const titleId = useId();
  const pageId = useId();
  const pages = useMemo(() => leaves(zones), [zones]);
  const last = pages.length - 1;
  const [active, setActive] = useState(() => {
    let latest = 0;
    pages.forEach((leaf, index) => {
      if (leaf.open) latest = index;
    });
    return latest;
  });
  const pageRef = useRef<HTMLDivElement>(null);
  const leaf = pages[active];
  const openCount = pages.filter((p) => p.open).length;

  useEffect(() => {
    pageRef.current?.scrollTo({ top: 0 });
  }, [active]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActive((i) => Math.min(last, i + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

  return (
    <div className="story-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="story-panel-bar">
        <div className="min-w-0">
          <p id={titleId} className="font-mono text-xs tracking-[0.16em] text-[#a7b4ff]">
            The Book of Kal
          </p>
          <p className="mt-0.5 text-sm text-white/60">
            {openCount - 1} of {last} chapters unsealed
          </p>
        </div>
        <button type="button" className="story-close" aria-label="Close the book" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="lore-book">
        <div className="lore-book-toc" role="tablist" aria-label="Chapters">
          {pages.map((page, index) => (
            <button
              key={page.chapter.numeral}
              type="button"
              role="tab"
              className="lore-book-tab"
              aria-selected={index === active}
              aria-controls={pageId}
              data-sealed={page.open ? undefined : "true"}
              aria-label={`${page.chapter.numeral === "—" ? "Prologue" : `Chapter ${page.chapter.numeral}`}, ${page.chapter.title}${page.open ? "" : ", sealed"}`}
              onClick={() => setActive(index)}
            >
              <span className="lore-book-tab-numeral">{page.chapter.numeral}</span>
              <span className="lore-book-tab-title">{page.chapter.title}</span>
              {page.open ? null : <SealGlyph />}
            </button>
          ))}
        </div>

        <div
          id={pageId}
          ref={pageRef}
          className="lore-book-page"
          role="tabpanel"
          aria-live="polite"
          style={{ "--leaf-hue": leaf.hue, "--leaf-cover": leaf.cover ? `url(${leaf.cover})` : "none" } as CSSProperties}
        >
          <div key={`wash-${leaf.chapter.numeral}`} className="lore-book-wash" aria-hidden="true" data-sealed={leaf.open ? undefined : "true"} />
          <article key={leaf.chapter.numeral} className="lore-book-leaf" data-sealed={leaf.open ? undefined : "true"}>
            <div className="lore-book-plate" data-sealed={leaf.open ? undefined : "true"}>
              {leaf.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- decorative plate, sized by CSS
                <img src={leaf.cover} alt="" className="lore-book-plate-img" loading="lazy" decoding="async" />
              ) : null}
              <span className="lore-book-plate-bloom" />
              <span className="lore-book-plate-numeral">{leaf.chapter.numeral}</span>
            </div>
            <p className="font-mono text-xs tracking-[0.16em] text-[#a7b4ff]">
              {leaf.chapter.numeral === "—" ? "Prologue" : `Chapter ${leaf.chapter.numeral}`}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{leaf.chapter.title}</h2>
            <p className="lore-book-epigraph">{leaf.chapter.epigraph}</p>
            {leaf.open ? (
              leaf.chapter.pages.map((paragraph, index) => (
                <p key={index} className="lore-book-text" data-first={index === 0 ? "true" : undefined}>
                  {paragraph}
                </p>
              ))
            ) : (
              <div className="lore-book-sealed">
                <SealGlyph large />
                <p className="lore-book-text">This chapter is still sealed.</p>
                <p className="text-sm leading-6 text-white/60">{leaf.seal}</p>
              </div>
            )}
          </article>
        </div>

        <div className="lore-book-nav">
          <button
            type="button"
            className="lore-arrow"
            aria-label="Previous chapter"
            disabled={active === 0}
            onClick={() => setActive((i) => Math.max(0, i - 1))}
          >
            <Chevron direction="left" />
          </button>
          <p className="text-sm text-white/60">
            {active + 1} of {pages.length}
          </p>
          <button
            type="button"
            className="lore-arrow"
            aria-label="Next chapter"
            disabled={active === last}
            onClick={() => setActive((i) => Math.min(last, i + 1))}
          >
            <Chevron direction="right" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SealGlyph({ large = false }: { large?: boolean }) {
  const s = large ? 28 : 12;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path d="M5 7.2V5.6a3 3 0 0 1 6 0v1.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="3.6" y="7.2" width="8.8" height="6.2" rx="1.6" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

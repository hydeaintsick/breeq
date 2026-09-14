"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BreakoutPreview } from "@/components/breakout-preview";
import { GemGlyph } from "@/components/currency-glyphs";
import { StarRating } from "@/components/star-rating";
import { applyBackgroundPhoto, parseStoredLevel } from "@/game/breakout/engine";
import { layoutTrail, type JourneyHue } from "@/game/journey";
import { formatGems } from "@/lib/economy";
import { boardPhoto } from "@/lib/photo";
import { SKIP_CHAPTER_GEMS } from "@/lib/progress";
import { chapterIsLocked, chapterLockHint, continueChapterIndex, type StoryChapterCard } from "@/lib/story";

export const HUE_VAR: Record<JourneyHue, string> = {
  blue: "var(--neon-blue)",
  violet: "var(--neon-violet)",
  pink: "var(--neon-pink)",
  cyan: "var(--neon-cyan)",
  lime: "var(--neon-lime)",
  amber: "var(--neon-amber)",
  steel: "var(--steel)",
};

/**
 * An episode's walls as a road winding up the screen, over the episode's own
 * sky. Chapter one at the bottom, the last wall at the top; the part already
 * walked is lit in the zone's hue, Kal's ring pulses on the next wall. Tapping
 * a wall brings it into the dock at the bottom — a live look at the board, the
 * chapter's name and reward, the one Play button.
 */
export function StoryTrail({
  chapters,
  backgroundUrl,
  hue,
  selected,
  onSelect,
  onPlay,
  onSkip,
  live,
  snap,
  keyboard = true,
}: {
  chapters: readonly StoryChapterCard[];
  backgroundUrl: string | null;
  hue: JourneyHue;
  selected: number;
  onSelect: (index: number) => void;
  onPlay: (chapter: StoryChapterCard) => void;
  /** Buy past the wall for gems. Offered under Play on the next open wall only. */
  onSkip?: (chapter: StoryChapterCard) => void;
  /** The sheet has finished opening: the board in the dock may run. */
  live: boolean;
  /** Bumps when the road should re-centre on the selected wall at once (open, back from a run). */
  snap: number;
  /** Arrow keys walk the road; off while a run or another surface owns the keyboard. */
  keyboard?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const layout = useMemo(() => layoutTrail(chapters.length, { width: width || 360 }), [chapters.length, width]);
  const frontier = continueChapterIndex(chapters);
  /** The road is lit up to the next wall to clear (all of it once the episode is done). */
  const litTo = chapters.every((chapter) => chapter.cleared) ? chapters.length - 1 : frontier;
  const lit = layout.reach[litTo] ?? 0;
  const chapter = chapters[selected] ?? chapters[0];
  const selectedLocked = chapter ? chapterIsLocked(chapters, selected) : true;
  const skippable = Boolean(onSkip && chapter && !selectedLocked && !chapter.cleared);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const centerOn = useCallback(
    (index: number, behavior: ScrollBehavior) => {
      const el = scrollRef.current;
      const node = layout.nodes[index];
      if (!el || !node) return;
      const top = Math.max(0, Math.min(layout.height - el.clientHeight, node.y - el.clientHeight * 0.46));
      el.scrollTo({ top, behavior });
    },
    [layout],
  );

  // Open, or back from a run: the road stands on the selected wall at once.
  useLayoutEffect(() => {
    centerOn(selected, "auto");
    // `snap` is the trigger; `selected` is read when it fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerOn, snap, width]);

  const select = (index: number) => {
    onSelect(index);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    centerOn(index, reduced ? "auto" : "smooth");
  };

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowUp" || event.key === "ArrowRight") {
        event.preventDefault();
        select(Math.min(chapters.length - 1, selected + 1));
      } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
        event.preventDefault();
        select(Math.max(0, selected - 1));
      } else if (event.key === "Enter" && chapter && !selectedLocked && (event.target as HTMLElement)?.tagName !== "BUTTON") {
        event.preventDefault();
        onPlay(chapter);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const levels = useMemo(
    () =>
      chapter
        ? [
            applyBackgroundPhoto(
              parseStoredLevel(chapter.level, { id: chapter.id, name: chapter.title, author: "Breeq" }),
              backgroundUrl ? boardPhoto(backgroundUrl) : backgroundUrl,
            ),
          ]
        : [],
    [backgroundUrl, chapter],
  );

  const style = { "--trail-hue": HUE_VAR[hue] } as CSSProperties;
  const hint = chapter ? chapterLockHint(chapters, selected) : null;
  const meta = !chapter
    ? null
    : selectedLocked
      ? hint
      : chapter.cleared
        ? `Cleared · ${chapter.xpReward} XP`
        : `${chapter.xpReward} XP`;

  return (
    <div className="trail" style={style}>
      <div ref={scrollRef} className="trail-scroll" role="listbox" aria-label="Walls" aria-orientation="vertical">
        <div className="trail-road" style={{ height: layout.height }}>
          {width > 0 ? (
            <svg
              className="trail-svg"
              width={layout.width}
              height={layout.height}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              aria-hidden="true"
            >
              <path className="trail-path-dim" d={layout.path} />
              <path
                className="trail-path-glow"
                d={layout.path}
                style={{ strokeDasharray: `${lit} ${layout.length + 10}` }}
              />
              <path
                className="trail-path-lit"
                d={layout.path}
                style={{ strokeDasharray: `${lit} ${layout.length + 10}` }}
              />
            </svg>
          ) : null}
          {width > 0
            ? chapters.map((item, index) => {
                const node = layout.nodes[index];
                const locked = chapterIsLocked(chapters, index);
                const state = locked ? "locked" : item.cleared ? "cleared" : index === frontier ? "current" : "open";
                const label = `${locked ? "Locked" : item.cleared ? "Cleared" : "Next"}. Chapter ${index + 1}, ${item.title}.${
                  item.cleared ? ` ${item.stars} of 3 stars.` : ""
                }`;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    className="trail-node"
                    data-state={state}
                    data-selected={index === selected ? "true" : undefined}
                    aria-selected={index === selected}
                    aria-label={label}
                    style={{ transform: `translate3d(${node.x}px, ${node.y}px, 0)` }}
                    onClick={() => select(index)}
                  >
                    <span className="trail-node-halo" aria-hidden="true" />
                    <span className="trail-node-disc">
                      <span className="trail-node-numeral">{String(index + 1).padStart(2, "0")}</span>
                      {locked ? <LockGlyph /> : null}
                    </span>
                    {item.cleared ? (
                      <span className="trail-node-stars" data-side={node.side > 0 ? "right" : "left"} aria-hidden="true">
                        <StarRating value={item.stars} size="sm" />
                      </span>
                    ) : null}
                  </button>
                );
              })
            : null}
        </div>
      </div>

      {chapter ? (
        <div className="trail-dock" data-locked={selectedLocked ? "true" : undefined} data-skip={skippable ? "true" : undefined}>
          <div className="trail-dock-board" aria-hidden="true">
            {live ? (
              <div className="pointer-events-none absolute inset-0 [&_*]:pointer-events-none" inert>
                <BreakoutPreview
                  key={chapter.id}
                  levels={levels}
                  seed={19 + selected * 13}
                  controls="auto"
                  followQuery={false}
                  fill
                  frozen={selectedLocked}
                  loop={!selectedLocked}
                  showCaption={false}
                  showHud={false}
                />
              </div>
            ) : null}
          </div>
          <div className="trail-dock-copy">
            <p className="font-mono text-xs tracking-[0.16em] text-[#a7b4ff]">Chapter {String(selected + 1).padStart(2, "0")}</p>
            <h3 className="trail-dock-title">{chapter.title}</h3>
            {chapter.intro && !selectedLocked ? <p className="trail-dock-intro">{chapter.intro}</p> : null}
            <p className="trail-dock-meta">
              {meta}
              {chapter.cleared ? <StarRating value={chapter.stars} size="sm" /> : null}
            </p>
          </div>
          <button
            type="button"
            className={selectedLocked ? "btn-glass trail-dock-cta" : "btn-play play-shimmer trail-dock-cta"}
            disabled={selectedLocked}
            aria-label={selectedLocked ? `Locked. ${chapter.title}. ${hint ?? ""}` : `${chapter.cleared ? "Replay" : "Play"} ${chapter.title}`}
            onClick={() => {
              if (!selectedLocked) onPlay(chapter);
            }}
          >
            {selectedLocked ? "Locked" : chapter.cleared ? "Replay" : "Play"}
          </button>
          {skippable ? (
            <button
              type="button"
              className="trail-dock-skip"
              aria-label={`Skip ${chapter.title} for ${formatGems(SKIP_CHAPTER_GEMS)} gems`}
              onClick={() => onSkip?.(chapter)}
            >
              Skip for <GemGlyph /> {formatGems(SKIP_CHAPTER_GEMS)}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LockGlyph() {
  return (
    <svg className="trail-node-lock" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 7.2V5.6a3 3 0 0 1 6 0v1.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="3.6" y="7.2" width="8.8" height="6.2" rx="1.6" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

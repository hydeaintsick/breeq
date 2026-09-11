"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BreakoutPreview } from "@/components/breakout-preview";
import { HapticsToggle } from "@/components/haptics-toggle";
import { PlayCard } from "@/components/play-card";
import { SoundToggle } from "@/components/sound-toggle";
import { StoryClear } from "@/components/story-clear";
import { StoryLose } from "@/components/story-lose";
import { StoryPlay } from "@/components/story-play";
import { useStoryTheme } from "@/components/use-story-theme";
import type { ChapterClearResult } from "@/app/actions/progress";
import { applyBackgroundPhoto, parseStoredLevel } from "@/game/breakout/engine";
import { QUIET_START, TUTORIAL } from "@/game/breakout/levels";
import { GAME_MENU_PATH, STORY_PATH, TUTORIAL_PATH } from "@/lib/auth/paths";
import { ambientPhoto, boardPhoto, screenPhoto } from "@/lib/photo";
import {
  chapterIsLocked,
  chapterLockHint,
  continueChapterIndex,
  episodeIsComplete,
  episodeIsLocked,
  episodeLockHint,
  episodeProgress,
  type StoryChapterCard,
  type StoryEpisodeCard,
} from "@/lib/story";

const FALLBACK_LEVELS = [QUIET_START];
const TUTORIAL_LEVELS = [TUTORIAL];
const TUTORIAL_HINT = "Finish the tutorial first.";

/** The how-to-play slide that sits ahead of the episodes while the tutorial is on. */
export type ShelfTutorial = { done: boolean };

function chapterLabel(cleared: number, total: number) {
  if (total <= 0) {
    return "No chapters";
  }
  if (cleared <= 0) {
    return total === 1 ? "1 chapter" : `${total} chapters`;
  }
  if (total === 1) {
    return "1 of 1 chapter";
  }
  return `${cleared} of ${total} chapters`;
}

function chapterLevels(chapter: StoryChapterCard, backgroundUrl: string | null) {
  return [
    applyBackgroundPhoto(
      parseStoredLevel(chapter.level, {
        id: chapter.id,
        name: chapter.title,
        author: "Breeq",
      }),
      backgroundUrl ? boardPhoto(backgroundUrl) : backgroundUrl,
    ),
  ];
}

function previewLevels(episode: StoryEpisodeCard) {
  return episode.previewLevel
    ? [
        applyBackgroundPhoto(
          parseStoredLevel(episode.previewLevel, {
            id: episode.id,
            name: episode.title,
            author: "Breeq",
          }),
          episode.backgroundUrl ? boardPhoto(episode.backgroundUrl) : episode.backgroundUrl,
        ),
      ]
    : FALLBACK_LEVELS;
}

/** Episode index → rail slide index (the tutorial, when shown, is slide 0). */
function continueIndex(episodes: readonly StoryEpisodeCard[], slug?: string) {
  if (slug) {
    const match = episodes.findIndex((episode) => episode.slug === slug);
    if (match >= 0) {
      return match;
    }
  }
  const playable = episodes.findIndex(
    (episode, index) => !episodeIsLocked(episodes, index) && !episodeIsComplete(episode),
  );
  if (playable >= 0) {
    return playable;
  }
  return Math.max(0, episodes.length - 1);
}

function scrollToSlide(root: HTMLElement, index: number, behavior: ScrollBehavior) {
  const slide = root.querySelector<HTMLElement>(`[data-story-slide="${index}"]`);
  if (!slide || slide.offsetWidth < 8) {
    return false;
  }
  const left = slide.offsetLeft - (root.clientWidth - slide.offsetWidth) / 2;
  root.scrollTo({ left: Math.max(0, left), behavior });
  return true;
}

/**
 * Where the sheet shrinks back to: the card the episode was opened from when it
 * is still on the page, otherwise the card at the episode's slot in the rail
 * (direct `/story/[slug]` visits never clicked a card).
 */
function cardRect(
  rail: HTMLElement | null,
  episodes: readonly StoryEpisodeCard[],
  episode: StoryEpisodeCard,
  card: HTMLElement | null,
  offset: number,
): DOMRect | null {
  if (card?.isConnected) {
    return card.getBoundingClientRect();
  }
  const index = episodes.findIndex((item) => item.id === episode.id) + offset;
  const slide = rail?.querySelector<HTMLElement>(`[data-story-slide="${index}"]`);
  const target = slide?.querySelector<HTMLElement>(".story-rail-frame") ?? slide ?? null;
  if (!target || target.offsetWidth < 8) {
    return null;
  }
  return target.getBoundingClientRect();
}

function openingChapterIndex(episodes: readonly StoryEpisodeCard[], slug?: string) {
  const episode = episodes.find((item) => item.slug === slug);
  if (!episode) {
    return 0;
  }
  const index = episodes.findIndex((item) => item.id === episode.id);
  return episodeIsLocked(episodes, index) ? 0 : continueChapterIndex(episode.chapters);
}

export function StoryShelf({
  episodes,
  initialSlug,
  kicker,
  title,
  body,
  tutorial = null,
}: {
  episodes: StoryEpisodeCard[];
  initialSlug?: string;
  kicker?: string;
  title?: ReactNode;
  body?: string;
  /** Show the how-to-play slide first; episodes stay locked until it is done. */
  tutorial?: ShelfTutorial | null;
}) {
  const router = useRouter();
  const titleId = useId();
  const railRef = useRef<HTMLDivElement>(null);
  const aligned = useRef(false);
  /** Slides ahead of the first episode. */
  const offset = tutorial ? 1 : 0;
  /** The story waits for the tutorial. */
  const gate = tutorial !== null && !tutorial.done;
  const [shelf, setShelf] = useState(episodes);
  const [active, setActive] = useState(() => (gate ? 0 : continueIndex(episodes, initialSlug) + offset));
  const [open, setOpen] = useState<StoryEpisodeCard | null>(() => {
    const episode = episodes.find((item) => item.slug === initialSlug);
    if (!episode || gate) {
      return null;
    }
    const index = episodes.findIndex((item) => item.id === episode.id);
    return episodeIsLocked(episodes, index) ? null : episode;
  });
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const [grown, setGrown] = useState(Boolean(initialSlug));
  /** The sheet is shrinking back onto its card; unmounts when the morph ends. */
  const [closing, setClosing] = useState(false);
  /** The grown sheet hides the whole page: the shelf behind it can rest. */
  const [covered, setCovered] = useState(false);
  const originCardRef = useRef<HTMLElement | null>(null);
  const [playing, setPlaying] = useState<StoryChapterCard | null>(null);
  const [paused, setPaused] = useState(false);
  /** The wall came down: score is known at once, the payout arrives a beat later. */
  const [cleared, setCleared] = useState<{ score: number; result: ChapterClearResult | null } | null>(null);
  const [lost, setLost] = useState<{ score: number; reason: "lives" | "timeout" | "crushed" } | null>(null);
  const [runId, setRunId] = useState(0);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const platesRef = useRef<(HTMLDivElement | null)[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);
  const chapterRailRef = useRef<HTMLDivElement>(null);
  const chapterAligned = useRef(false);
  const [chapterActive, setChapterActive] = useState(() => openingChapterIndex(episodes, initialSlug));
  const chapterTargetRef = useRef(chapterActive);
  const [chapterSnap, setChapterSnap] = useState(0);
  const [chapterReady, setChapterReady] = useState(false);

  // The theme plays under the shelf and the episode sheet, and steps aside for a run.
  useStoryTheme(playing !== null);

  const syncFromRail = useCallback(() => {
    const root = railRef.current;
    if (!root) {
      return;
    }
    const slides = [...root.querySelectorAll<HTMLElement>("[data-story-slide]")];
    if (slides.length === 0) {
      return;
    }
    const mid = root.scrollLeft + root.clientWidth / 2;
    const span = Math.max(root.clientWidth, 1);
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const slide of slides) {
      const index = Number(slide.dataset.storySlide);
      const center = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(center - mid);
      const weight = Math.max(0, 1 - dist / span);
      const plate = platesRef.current[index];
      if (plate) {
        plate.style.opacity = String(weight * weight);
        // Plates that cannot be seen are not composited either.
        plate.style.visibility = weight < 0.03 ? "hidden" : "";
      }
      if (Number.isInteger(index) && dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    }
    setActive((current) => (current === best ? current : best));
  }, []);

  const scrollRail = useCallback((index: number, behavior: ScrollBehavior) => {
    const root = railRef.current;
    if (!root) {
      return;
    }
    scrollToSlide(root, index, behavior);
  }, []);

  const syncFromChapterRail = useCallback(() => {
    if (!chapterAligned.current) {
      return;
    }
    const root = chapterRailRef.current;
    if (!root) {
      return;
    }
    const slides = [...root.querySelectorAll<HTMLElement>("[data-story-slide]")];
    if (slides.length === 0) {
      return;
    }
    const mid = root.scrollLeft + root.clientWidth / 2;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const slide of slides) {
      const index = Number(slide.dataset.storySlide);
      const center = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(center - mid);
      if (Number.isInteger(index) && dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    }
    setChapterActive((current) => (current === best ? current : best));
  }, []);

  const scrollChapterRail = useCallback((index: number, behavior: ScrollBehavior) => {
    const root = chapterRailRef.current;
    if (!root) {
      return;
    }
    scrollToSlide(root, index, behavior);
  }, []);

  useEffect(() => {
    setPortal(document.body);
  }, []);

  useEffect(() => {
    setShelf(episodes);
  }, [episodes]);

  useLayoutEffect(() => {
    if (aligned.current) {
      return;
    }
    scrollRail(active, "auto");
    aligned.current = true;
    syncFromRail();
  }, [active, scrollRail, syncFromRail]);

  useEffect(() => {
    const onResize = () => {
      scrollRail(active, "auto");
      syncFromRail();
      if (open) {
        scrollChapterRail(chapterTargetRef.current, "auto");
        syncFromChapterRail();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, open, scrollChapterRail, scrollRail, syncFromChapterRail, syncFromRail]);

  useEffect(() => {
    const root = railRef.current;
    if (!root) {
      return;
    }
    let frame = 0;
    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncFromRail();
      });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    syncFromRail();
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [shelf.length, syncFromRail]);

  useLayoutEffect(() => {
    if (!open || !grown) {
      if (!open) {
        chapterAligned.current = false;
      }
      return;
    }

    const target = chapterTargetRef.current;
    setChapterActive(target);

    const snap = (done: boolean) => {
      const root = chapterRailRef.current;
      if (!root) {
        return false;
      }
      const ok = scrollToSlide(root, target, "auto");
      if (ok && done) {
        chapterAligned.current = true;
        setChapterReady(true);
      }
      return ok;
    };

    // The sheet body is laid out at screen size from the first frame, so the
    // rail can be aligned and shown while the frame is still growing.
    snap(false);
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      snap(false);
      raf2 = window.requestAnimationFrame(() => snap(true));
    });

    // Once the frame has grown, the page under it is fully hidden: its bloom
    // and live boards can stop working until the sheet comes down.
    const sheet = sheetRef.current;
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== sheet) {
        return;
      }
      if (event.propertyName !== "width" && event.propertyName !== "height" && event.propertyName !== "top") {
        return;
      }
      snap(true);
      setCovered(true);
    };
    sheet?.addEventListener("transitionend", onEnd);
    const fallback = window.setTimeout(() => {
      snap(true);
      setCovered(true);
    }, origin ? 320 : 0);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      sheet?.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [chapterSnap, grown, open, origin]);

  useEffect(() => {
    const root = chapterRailRef.current;
    if (!root || !open) {
      return;
    }
    let frame = 0;
    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncFromChapterRail();
      });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    syncFromChapterRail();
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [open, open?.chapters.length, syncFromChapterRail]);

  useEffect(() => {
    if (!open || closing) {
      return;
    }
    if (!origin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGrown(true);
      return;
    }
    const frame = window.setTimeout(() => setGrown(true), 20);
    return () => window.clearTimeout(frame);
  }, [closing, open, origin]);

  const finishClose = useCallback(() => {
    setPlaying(null);
    setPaused(false);
    setCleared(null);
    setLost(null);
    setOpen(null);
    setGrown(false);
    setOrigin(null);
    setClosing(false);
    setCovered(false);
    if (initialSlug) {
      router.push(STORY_PATH);
    }
  }, [initialSlug, router]);

  /**
   * Close is the opening morph played backwards: the sheet shrinks onto the
   * episode card it grew from (re-measured, the shelf may have moved), then
   * unmounts once the size transition ends.
   */
  const closeSheet = useCallback(() => {
    if (closing) {
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = open ? cardRect(railRef.current, shelf, open, originCardRef.current, offset) : null;
    if (!target || reduced) {
      finishClose();
      return;
    }
    setPlaying(null);
    setPaused(false);
    setCleared(null);
    setLost(null);
    setChapterReady(false);
    setCovered(false);
    setOrigin(target);
    setGrown(false);
    setClosing(true);
  }, [closing, finishClose, offset, open, shelf]);

  useEffect(() => {
    if (!closing) {
      return;
    }
    const sheet = sheetRef.current;
    let done = false;
    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      finishClose();
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== sheet) {
        return;
      }
      if (event.propertyName !== "width" && event.propertyName !== "height" && event.propertyName !== "top") {
        return;
      }
      finish();
    };
    sheet?.addEventListener("transitionend", onEnd);
    const fallback = window.setTimeout(finish, 360);
    return () => {
      sheet?.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [closing, finishClose]);

  useEffect(() => {
    if (!open && !playing) {
      return;
    }
    const html = document.documentElement;
    const previousHtml = html.style.overflow;
    const previousBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = previousHtml;
      document.body.style.overflow = previousBody;
    };
  }, [open, playing]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (playing) {
        if (cleared || lost) {
          setPaused(false);
          setCleared(null);
          setLost(null);
          setPlaying(null);
          return;
        }
        setPaused(true);
        return;
      }
      closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cleared, closeSheet, lost, open, playing]);

  const goTo = useCallback((index: number) => {
    const next = Math.max(0, Math.min(shelf.length - 1 + offset, index));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollRail(next, reduced ? "auto" : "smooth");
  }, [offset, scrollRail, shelf.length]);

  const goToChapter = useCallback((index: number) => {
    if (!open) {
      return;
    }
    const next = Math.max(0, Math.min(open.chapters.length - 1, index));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollChapterRail(next, reduced ? "auto" : "smooth");
  }, [open, scrollChapterRail]);

  useEffect(() => {
    if (playing) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (open) {
          goToChapter(chapterActive + 1);
        } else {
          goTo(active + 1);
        }
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (open) {
          goToChapter(chapterActive - 1);
        } else {
          goTo(active - 1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, chapterActive, goTo, goToChapter, open, playing]);

  function openEpisode(episode: StoryEpisodeCard, card: HTMLElement) {
    const index = shelf.findIndex((item) => item.id === episode.id);
    if (gate || episodeIsLocked(shelf, index)) {
      return;
    }
    const current = shelf[index] ?? episode;
    originCardRef.current = card;
    setOrigin(card.getBoundingClientRect());
    setGrown(false);
    setClosing(false);
    setOpen(current);
    const start = continueChapterIndex(current.chapters);
    chapterTargetRef.current = start;
    setChapterActive(start);
    chapterAligned.current = false;
    setChapterReady(false);
    setChapterSnap((n) => n + 1);
    setPlaying(null);
    setPaused(false);
    setCleared(null);
    setLost(null);
  }

  function markCleared(chapterId: string) {
    const patch = (episode: StoryEpisodeCard) => ({
      ...episode,
      chapters: episode.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, cleared: true } : chapter,
      ),
    });
    setShelf((current) => current.map(patch));
    setOpen((current) => (current ? patch(current) : current));
  }

  function quitRun() {
    if (playing && open) {
      const index = open.chapters.findIndex((chapter) => chapter.id === playing.id);
      const next = cleared && index >= 0 && index < open.chapters.length - 1 ? index + 1 : Math.max(0, index);
      chapterTargetRef.current = next;
      setChapterActive(next);
      chapterAligned.current = false;
      setChapterSnap((n) => n + 1);
    }
    setPaused(false);
    setCleared(null);
    setLost(null);
    setPlaying(null);
  }

  function startChapter(chapter: StoryChapterCard) {
    if (!open) {
      return;
    }
    const index = open.chapters.findIndex((item) => item.id === chapter.id);
    if (chapterIsLocked(open.chapters, index)) {
      return;
    }
    setChapterActive(index);
    setPaused(false);
    setCleared(null);
    setLost(null);
    setRunId(0);
    setPlaying(chapter);
  }

  function retryRun() {
    setPaused(false);
    setCleared(null);
    setLost(null);
    setRunId((n) => n + 1);
  }

  const playingIndex = open && playing ? open.chapters.findIndex((chapter) => chapter.id === playing.id) : -1;
  const nextChapter = playingIndex >= 0 ? (open?.chapters[playingIndex + 1] ?? null) : null;
  const episodeDone = Boolean(open && open.chapters.every((chapter) => chapter.cleared));
  const openProgress = open ? episodeProgress(open) : null;

  const sheetStyle =
    open && origin && !grown
      ? {
          top: origin.top,
          left: origin.left,
          width: origin.width,
          height: origin.height,
        }
      : { top: 0, left: 0, width: "100vw", height: "100svh" };

  return (
    <div className="story-page" data-covered={covered ? "true" : undefined}>
      <StoryAmbient episodes={shelf} offset={offset} platesRef={platesRef} />
      {kicker || title || body ? (
        <header className="story-page-copy">
          {kicker ? (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{kicker}</p>
          ) : null}
          {title ? <h1 className="max-w-2xl font-semibold tracking-tight text-ink">{title}</h1> : null}
          {body ? <p className="story-page-lede max-w-xl text-ink-muted">{body}</p> : null}
        </header>
      ) : null}

      <div
        ref={railRef}
        className="story-rail"
        role="region"
        aria-roledescription="carousel"
        aria-label="Episodes"
      >
        {tutorial ? (
          <div
            className="story-rail-item"
            data-story-slide={0}
            aria-current={active === 0 ? "true" : undefined}
          >
            <div className="story-rail-frame">
              <PlayCard
                href={TUTORIAL_PATH}
                kicker="00"
                title="How to Play"
                body={
                  tutorial.done
                    ? "Done. Replay it any time."
                    : "The paddle, the first two bricks, a zone. About two minutes."
                }
                action={tutorial.done ? "Replay" : "Start"}
                levels={TUTORIAL_LEVELS}
                seed={7}
                fill
                aura={false}
                paused={covered}
              />
            </div>
          </div>
        ) : null}
        {shelf.map((episode, index) => {
          const locked = gate || episodeIsLocked(shelf, index);
          const hint = gate ? TUTORIAL_HINT : episodeLockHint(shelf, index);
          const progress = episodeProgress(episode);
          const slide = index + offset;
          return (
            <div
              key={episode.id}
              className="story-rail-item"
              data-story-slide={slide}
              aria-current={slide === active ? "true" : undefined}
            >
              <div className="story-rail-frame">
                <PlayCard
                  kicker={String(index + 1).padStart(2, "0")}
                  title={episode.title}
                  body={chapterLabel(progress.cleared, progress.total)}
                  action="Play"
                  levels={previewLevels(episode)}
                  seed={11 + index}
                  cover={episode.backgroundUrl}
                  locked={locked}
                  lockedHint={hint ?? undefined}
                  fill
                  aura={false}
                  progress={progress}
                  paused={covered}
                  onSelect={locked ? undefined : (card) => openEpisode(episode, card)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="story-page-foot">
        {shelf.length + offset > 1 ? (
          <div className="story-dots" role="tablist" aria-label="Episode position">
            {tutorial ? (
              <button
                type="button"
                className="story-dot"
                role="tab"
                aria-selected={active === 0}
                aria-label="Tutorial, How to Play"
                onClick={() => goTo(0)}
              />
            ) : null}
            {shelf.map((episode, index) => (
              <button
                key={episode.id}
                type="button"
                className="story-dot"
                role="tab"
                aria-selected={index + offset === active}
                aria-label={`Episode ${index + 1}, ${episode.title}`}
                onClick={() => goTo(index + offset)}
              />
            ))}
          </div>
        ) : null}
        <Link href={GAME_MENU_PATH} className="nav-link inline-flex min-h-11 items-center">
          Back to modes
        </Link>
      </div>

      {portal && open
        ? createPortal(
            <>
              <div
                ref={sheetRef}
                className="story-sheet"
                data-grown={grown}
                data-closing={closing ? "true" : undefined}
                style={sheetStyle}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <div className="pointer-events-none absolute inset-0 [&_*]:pointer-events-none" inert>
                  {open.backgroundUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url("${screenPhoto(open.backgroundUrl).replace(/"/g, "")}")` }}
                    />
                  ) : (
                    <div className="story-sheet-body">
                      <BreakoutFill episode={open} />
                    </div>
                  )}
                </div>
                <div className="story-sheet-scrim" aria-hidden="true" />
                <div className="story-sheet-body">
                  <div className="story-sheet-bar">
                    <p className="min-w-0 text-sm font-medium text-white/80">
                      {openProgress
                        ? `${openProgress.cleared} / ${openProgress.total} chapters`
                        : "Episode"}
                    </p>
                    <button type="button" className="story-close" aria-label="Close episode" onClick={closeSheet}>
                      <CloseGlyph />
                    </button>
                  </div>
                  <header className="story-sheet-copy">
                    <p className="font-mono text-xs tracking-[0.16em] text-accent">Episode</p>
                    <h2 id={titleId} className="font-semibold tracking-tight text-white">
                      {open.title}
                    </h2>
                    <div
                      className="story-campaign mt-3"
                      aria-label={
                        openProgress
                          ? `${openProgress.cleared} of ${openProgress.total} chapters cleared`
                          : undefined
                      }
                    >
                      <div
                        className="rank-bar story-campaign-bar"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={openProgress?.total ?? 0}
                        aria-valuenow={openProgress?.cleared ?? 0}
                      >
                        <span
                          className="rank-bar-fill"
                          style={{ width: `${openProgress?.percent ?? 0}%` }}
                        />
                      </div>
                      <p className="story-page-lede mt-2">
                        {openProgress
                          ? `${openProgress.cleared} of ${openProgress.total} chapters cleared`
                          : null}
                      </p>
                    </div>
                  </header>
                  <div
                    ref={chapterRailRef}
                    className="story-rail"
                    data-ready={chapterReady ? "true" : undefined}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Chapters"
                  >
                    {open.chapters.map((chapter, index) => (
                      <ChapterPlayCard
                        key={chapter.id}
                        chapter={chapter}
                        index={index}
                        active={index === chapterActive}
                        backgroundUrl={open.backgroundUrl}
                      locked={chapterIsLocked(open.chapters, index)}
                      hint={chapterLockHint(open.chapters, index)}
                      live={covered}
                      onPlay={startChapter}
                      />
                    ))}
                  </div>
                  <div className="story-page-foot">
                    {open.chapters.length > 1 ? (
                      <div className="story-dots" role="tablist" aria-label="Chapter position">
                        {open.chapters.map((chapter, index) => (
                          <button
                            key={chapter.id}
                            type="button"
                            className="story-dot"
                            role="tab"
                            aria-selected={index === chapterActive}
                            aria-label={`Chapter ${index + 1}, ${chapter.title}`}
                            onClick={() => goToChapter(index)}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              {playing ? (
                <div className="story-play" role="dialog" aria-modal="true" aria-label={playing.title}>
                  <StoryPlay
                    chapterId={playing.id}
                    title={playing.title}
                    storedLevel={playing.level}
                    backgroundUrl={open.backgroundUrl}
                    seed={17 + runId}
                    paused={paused}
                    onCleared={({ score }) => {
                      setPaused(false);
                      setLost(null);
                      setCleared({ score, result: null });
                      markCleared(playing.id);
                    }}
                    onAwarded={(result) => {
                      setCleared((current) => (current ? { ...current, result } : { score: 0, result }));
                      markCleared(playing.id);
                    }}
                    onOver={({ score, reason }) => {
                      setPaused(false);
                      setCleared(null);
                      setLost({ score, reason });
                    }}
                  />
                  {cleared || lost ? null : (
                    <button
                      type="button"
                      className="story-pause"
                      aria-label="Pause"
                      onClick={() => setPaused(true)}
                    >
                      <CloseGlyph />
                    </button>
                  )}
                  {cleared ? (
                    <StoryClear
                      key={playing.id}
                      title={playing.title}
                      score={cleared.score}
                      result={cleared.result}
                      hasNext={nextChapter !== null}
                      episodeDone={episodeDone}
                      onNext={() => {
                        if (nextChapter) startChapter(nextChapter);
                      }}
                      onClose={quitRun}
                    />
                  ) : null}
                  {lost ? (
                    <StoryLose
                      key={`${playing.id}-${runId}`}
                      title={playing.title}
                      score={lost.score}
                      reason={lost.reason}
                      onRetry={retryRun}
                      onClose={quitRun}
                    />
                  ) : null}
                  {paused && !cleared && !lost ? (
                    <div className="story-pause-menu">
                      <div className="glass w-full max-w-sm p-6 sm:p-8">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Paused</p>
                        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{playing.title}</h3>
                        <div className="mt-8 grid gap-3">
                          <button type="button" className="btn-play min-h-11 w-full" onClick={() => setPaused(false)}>
                            Resume
                          </button>
                          <SoundToggle variant="row" />
                          <HapticsToggle variant="row" />
                          <button type="button" className="btn-glass min-h-11 w-full" onClick={quitRun}>
                            Quit
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>,
            portal,
          )
        : null}
    </div>
  );
}

function StoryAmbient({
  episodes,
  offset,
  platesRef,
}: {
  episodes: readonly StoryEpisodeCard[];
  /** Slides ahead of the first episode (the tutorial); each gets a plain plate. */
  offset: number;
  platesRef: { current: (HTMLDivElement | null)[] };
}) {
  return (
    <div className="story-ambient" aria-hidden="true">
      {Array.from({ length: offset }, (_, index) => (
        <div
          key={`lead-${index}`}
          ref={(node) => {
            platesRef.current[index] = node;
          }}
          className="story-ambient-plate"
        >
          <div className="story-ambient-drift" data-layer="wash" style={{ animationDelay: `${-index * 7}s` }}>
            <div className="story-ambient-fallback" />
          </div>
        </div>
      ))}
      {episodes.map((episode, index) => (
        <div
          key={episode.id}
          ref={(node) => {
            platesRef.current[index + offset] = node;
          }}
          className="story-ambient-plate"
        >
          {episode.backgroundUrl ? (
            <>
              <div className="story-ambient-drift" data-layer="wash" style={{ animationDelay: `${-index * 7}s` }}>
                <img
                  src={ambientPhoto(episode.backgroundUrl)}
                  alt=""
                  className="story-ambient-wash"
                  draggable={false}
                  decoding="async"
                />
              </div>
              <div
                className="story-ambient-drift"
                data-layer="core"
                style={{ animationDelay: `${-index * 7 - 11}s` }}
              >
                <img
                  src={ambientPhoto(episode.backgroundUrl)}
                  alt=""
                  className="story-ambient-core"
                  draggable={false}
                  decoding="async"
                />
              </div>
            </>
          ) : (
            <div className="story-ambient-drift" data-layer="wash" style={{ animationDelay: `${-index * 7}s` }}>
              <div className="story-ambient-fallback" />
            </div>
          )}
        </div>
      ))}
      <div className="story-ambient-scrim" />
    </div>
  );
}

function BreakoutFill({ episode }: { episode: StoryEpisodeCard }) {
  return (
    <BreakoutPreview
      levels={previewLevels(episode)}
      seed={11}
      controls="auto"
      followQuery={false}
      fill
      showCaption={false}
      showHud={false}
    />
  );
}

function ChapterPlayCard({
  chapter,
  index,
  active,
  backgroundUrl,
  locked,
  hint,
  live,
  onPlay,
}: {
  chapter: StoryChapterCard;
  index: number;
  active: boolean;
  backgroundUrl: string | null;
  locked: boolean;
  hint: string | null;
  /** Boards mount only once the sheet has finished growing: the morph stays cheap. */
  live: boolean;
  onPlay: (chapter: StoryChapterCard) => void;
}) {
  const levels = useMemo(
    () => chapterLevels(chapter, backgroundUrl),
    [backgroundUrl, chapter],
  );

  return (
    <div
      className="story-rail-item"
      data-story-slide={index}
      aria-current={active ? "true" : undefined}
    >
      <div className="story-rail-frame">
        <PlayCard
          kicker={String(index + 1).padStart(2, "0")}
          title={chapter.title}
          body={chapter.cleared ? "Cleared" : `${chapter.xpReward} XP`}
          action={chapter.cleared ? "Replay" : "Play"}
          levels={levels}
          seed={19 + index * 13}
          locked={locked}
          lockedHint={hint ?? undefined}
          frozen={locked}
          fill
          aura={false}
          preview={live}
          onSelect={locked ? undefined : () => onPlay(chapter)}
        />
      </div>
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

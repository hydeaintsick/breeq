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
import { StoryJourney, type JourneyCard, type StoryJourneyHandle } from "@/components/story-journey";
import { StoryLose } from "@/components/story-lose";
import { StoryPlay } from "@/components/story-play";
import { SwipeToggle } from "@/components/swipe-toggle";
import { useImmersive } from "@/components/use-immersive";
import { useStoryTheme } from "@/components/use-story-theme";
import type { ChapterClearResult } from "@/app/actions/progress";
import { applyBackgroundPhoto, parseStoredLevel } from "@/game/breakout/engine";
import { starsForClear } from "@/game/breakout/engine/stars";
import { QUIET_START } from "@/game/breakout/levels";
import { hueForEpisode, type JourneyNodeInput, type JourneyNodeState } from "@/game/journey";
import { GAME_MENU_PATH, STORY_PATH, TUTORIAL_PATH } from "@/lib/auth/paths";
import { boardPhoto, nodePhoto, screenPhoto } from "@/lib/photo";
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
const TUTORIAL_HINT = "Finish the tutorial first.";
const EMPTY_DISCOVERIES: readonly string[] = [];

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

/** Episode index → journey node index (the tutorial, when shown, is node 0). */
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
 * Where the sheet shrinks back to: the medallion the episode was opened from
 * when it is still on the page, otherwise the episode's node on the map
 * (direct `/story/[slug]` visits never tapped one).
 */
function cardRect(
  journey: StoryJourneyHandle | null,
  episodes: readonly StoryEpisodeCard[],
  episode: StoryEpisodeCard,
  card: HTMLElement | null,
  offset: number,
): DOMRect | null {
  if (card?.isConnected) {
    const rect = card.getBoundingClientRect();
    if (rect.width >= 8) return rect;
  }
  const index = episodes.findIndex((item) => item.id === episode.id) + offset;
  const rect = journey?.anchorRect(index) ?? null;
  return rect && rect.width >= 8 ? rect : null;
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
  arriveFromTutorial = false,
  discovered = EMPTY_DISCOVERIES,
}: {
  episodes: StoryEpisodeCard[];
  initialSlug?: string;
  kicker?: string;
  title?: ReactNode;
  body?: string;
  /** Show the how-to-play slide first; episodes stay locked until it is done. */
  tutorial?: ShelfTutorial | null;
  /** The player just finished the tutorial: open on its card, then swipe to episode one. */
  arriveFromTutorial?: boolean;
  /** Piece ids already explained to this player; a run stops on the first touch of anything else. */
  discovered?: readonly string[];
}) {
  const router = useRouter();
  const titleId = useId();
  /** Slides ahead of the first episode. */
  const offset = tutorial ? 1 : 0;
  /** The story waits for the tutorial. */
  const gate = tutorial !== null && !tutorial.done;
  const [shelf, setShelf] = useState(episodes);
  /** The node the map opens on. */
  const [start] = useState(() =>
    gate || (arriveFromTutorial && offset > 0) ? 0 : continueIndex(episodes, initialSlug) + offset,
  );
  const journeyRef = useRef<StoryJourneyHandle | null>(null);
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
  /** Pieces explained so far, this session included: the next chapter must not repeat them. */
  const [known, setKnown] = useState<ReadonlySet<string>>(() => new Set(discovered));
  const onDiscovered = useCallback((id: string) => {
    setKnown((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);
  /** The chapter's story beat is up; the board waits underneath until it is tapped away. */
  const [intro, setIntro] = useState(false);
  /** The wall came down: score is known at once, the payout arrives a beat later. */
  const [cleared, setCleared] = useState<{
    score: number;
    stars: 0 | 1 | 2 | 3;
    result: ChapterClearResult | null;
  } | null>(null);
  const [lost, setLost] = useState<{ score: number; reason: "lives" | "timeout" | "crushed" } | null>(null);
  const [runId, setRunId] = useState(0);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const chapterRailRef = useRef<HTMLDivElement>(null);
  const chapterAligned = useRef(false);
  const [chapterActive, setChapterActive] = useState(() => openingChapterIndex(episodes, initialSlug));
  const chapterTargetRef = useRef(chapterActive);
  const [chapterSnap, setChapterSnap] = useState(0);
  const [chapterReady, setChapterReady] = useState(false);

  // The theme plays under the map and the episode sheet, and steps aside for a run.
  useStoryTheme(playing !== null);
  // Story owns the screen: full screen and portrait where the browser allows it.
  useImmersive();

  /** The map: one node per episode, the tutorial ahead of them when it is on. */
  const nodes = useMemo<JourneyNodeInput[]>(() => {
    const list: JourneyNodeInput[] = [];
    if (tutorial) {
      list.push({
        id: "tutorial",
        kicker: "00",
        title: "How to Play",
        state: tutorial.done ? "cleared" : "current",
        stars: 0,
        progress: tutorial.done ? 1 : 0,
        cover: null,
        hue: "steel",
      });
    }
    let frontier = gate;
    shelf.forEach((episode, index) => {
      const locked = gate || episodeIsLocked(shelf, index);
      const progress = episodeProgress(episode);
      const state: JourneyNodeState = locked ? "locked" : episodeIsComplete(episode) ? "cleared" : frontier ? "open" : "current";
      if (state === "current") frontier = true;
      list.push({
        id: episode.id,
        kicker: String(index + 1).padStart(2, "0"),
        title: episode.title,
        state,
        stars: progress.starValue,
        progress: progress.total > 0 ? progress.cleared / progress.total : 0,
        cover: episode.backgroundUrl ? nodePhoto(episode.backgroundUrl) : null,
        hue: hueForEpisode(episode.slug, index),
      });
    });
    return list;
  }, [gate, shelf, tutorial]);

  const cards = useMemo<JourneyCard[]>(() => {
    const list: JourneyCard[] = [];
    if (tutorial) {
      list.push({
        kicker: "Tutorial",
        title: "How to Play",
        meta: tutorial.done ? "Done. Replay it any time." : "The paddle, the first two bricks, a zone. About two minutes.",
        action: tutorial.done ? "Replay" : "Start",
        locked: false,
        hint: null,
        stars: null,
        href: TUTORIAL_PATH,
      });
    }
    shelf.forEach((episode, index) => {
      const locked = gate || episodeIsLocked(shelf, index);
      const progress = episodeProgress(episode);
      list.push({
        kicker: `Episode ${String(index + 1).padStart(2, "0")}`,
        title: episode.title,
        meta: episode.tagline ?? chapterLabel(progress.cleared, progress.total),
        action: episodeIsComplete(episode) ? "Replay" : progress.cleared > 0 ? "Continue" : "Play",
        locked,
        hint: gate ? TUTORIAL_HINT : episodeLockHint(shelf, index),
        stars: progress.cleared > 0 ? progress.starValue : null,
      });
    });
    return list;
  }, [gate, shelf, tutorial]);

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

  useEffect(() => {
    if (!open) {
      return;
    }
    const onResize = () => {
      scrollChapterRail(chapterTargetRef.current, "auto");
      syncFromChapterRail();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, scrollChapterRail, syncFromChapterRail]);

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
    const target = open ? cardRect(journeyRef.current, shelf, open, originCardRef.current, offset) : null;
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
        if (intro) {
          setIntro(false);
          return;
        }
        setPaused(true);
        return;
      }
      closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cleared, closeSheet, intro, lost, open, playing]);

  // Fresh from the tutorial: let the card land, then carry the player on to
  // the first episode, now unlocked. The query is dropped so a reload stays put.
  const arrived = useRef(false);
  useEffect(() => {
    if (!arriveFromTutorial || offset === 0 || arrived.current) {
      return;
    }
    window.history.replaceState(window.history.state, "", STORY_PATH);
    const id = window.setTimeout(() => {
      arrived.current = true;
      journeyRef.current?.goTo(offset);
    }, 700);
    return () => window.clearTimeout(id);
  }, [arriveFromTutorial, offset]);

  const goToChapter = useCallback((index: number) => {
    if (!open) {
      return;
    }
    const next = Math.max(0, Math.min(open.chapters.length - 1, index));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollChapterRail(next, reduced ? "auto" : "smooth");
  }, [open, scrollChapterRail]);

  useEffect(() => {
    if (playing || !open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToChapter(chapterActive + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToChapter(chapterActive - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chapterActive, goToChapter, open, playing]);

  function openNode(node: number, anchor: HTMLElement) {
    const episode = shelf[node - offset];
    if (episode) openEpisode(episode, anchor);
  }

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

  function markCleared(chapterId: string, stars: 0 | 1 | 2 | 3) {
    const patch = (episode: StoryEpisodeCard) => ({
      ...episode,
      chapters: episode.chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, cleared: true, stars: Math.max(chapter.stars, stars) as 0 | 1 | 2 | 3 }
          : chapter,
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
    // The story beat opens the run; a tap dismisses it and serves the ball.
    setIntro(Boolean(chapter.intro));
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
    <div className="story-page story-page-journey" data-covered={covered ? "true" : undefined}>
      {kicker || title || body ? (
        <header className="story-page-copy">
          <div className="story-page-copy-inner">
            {kicker ? (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{kicker}</p>
            ) : null}
            {title ? <h1 className="max-w-2xl font-semibold tracking-tight text-white">{title}</h1> : null}
            {body ? <p className="story-page-lede max-w-xl">{body}</p> : null}
          </div>
        </header>
      ) : null}

      <StoryJourney
        ref={journeyRef}
        nodes={nodes}
        cards={cards}
        start={start}
        paused={covered}
        keyboard={!open && !playing}
        onOpen={openNode}
        footer={
          <Link href={GAME_MENU_PATH} className="nav-link journey-back inline-flex min-h-11 items-center">
            Back to modes
          </Link>
        }
      />

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
                    {open.tagline ? <p className="story-page-lede mt-2">{open.tagline}</p> : null}
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
                    paused={paused || intro}
                    chrome={
                      cleared || lost || intro ? null : (
                        <button
                          type="button"
                          className="story-pause"
                          aria-label="Pause"
                          onClick={() => setPaused(true)}
                        >
                          <CloseGlyph />
                        </button>
                      )
                    }
                    discovered={known}
                    onDiscovered={onDiscovered}
                    onCleared={({ score, paddleHits, livesLeft }) => {
                      const level = parseStoredLevel(playing.level, {
                        id: playing.id,
                        name: playing.title,
                        author: "Breeq",
                      });
                      const nextStars = starsForClear(level, { paddleHits, livesLeft });
                      setPaused(false);
                      setLost(null);
                      setCleared({ score, stars: nextStars, result: null });
                      markCleared(playing.id, nextStars);
                    }}
                    onAwarded={(result) => {
                      const best = result.bestStars ?? result.stars ?? 1;
                      setCleared((current) =>
                        current
                          ? { ...current, result, stars: result.stars ?? current.stars }
                          : { score: 0, stars: best, result },
                      );
                      markCleared(playing.id, best);
                    }}
                    onOver={({ score, reason }) => {
                      setPaused(false);
                      setCleared(null);
                      setLost({ score, reason });
                    }}
                  />
                  {intro && playing.intro && !cleared && !lost ? (
                    <button
                      type="button"
                      className="story-intro"
                      onClick={() => setIntro(false)}
                      aria-label={`Chapter ${playingIndex + 1}, ${playing.title}. ${playing.intro} Tap to begin.`}
                    >
                      <div className="story-intro-body">
                        <p className="story-clear-kicker">Chapter {String(playingIndex + 1).padStart(2, "0")}</p>
                        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{playing.title}</h3>
                        <p className="story-intro-text">{playing.intro}</p>
                        <span className="story-intro-cue">Tap to begin</span>
                      </div>
                    </button>
                  ) : null}
                  {cleared ? (
                    <StoryClear
                      key={playing.id}
                      title={playing.title}
                      score={cleared.score}
                      stars={cleared.stars}
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
                          <SwipeToggle variant="row" />
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

function BreakoutFill({ episode }: { episode: StoryEpisodeCard }) {
  const levels = useMemo(
    () =>
      episode.previewLevel
        ? [
            applyBackgroundPhoto(
              parseStoredLevel(episode.previewLevel, { id: episode.id, name: episode.title, author: "Breeq" }),
              episode.backgroundUrl ? boardPhoto(episode.backgroundUrl) : episode.backgroundUrl,
            ),
          ]
        : FALLBACK_LEVELS,
    [episode],
  );
  return (
    <BreakoutPreview
      levels={levels}
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
          body={chapter.intro ?? (chapter.cleared ? "Cleared" : `${chapter.xpReward} XP`)}
          meta={chapter.intro ? (chapter.cleared ? `Cleared · ${chapter.xpReward} XP` : `${chapter.xpReward} XP`) : undefined}
          action={chapter.cleared ? "Replay" : "Play"}
          levels={levels}
          seed={19 + index * 13}
          locked={locked}
          lockedHint={hint ?? undefined}
          frozen={locked}
          fill
          aura={false}
          preview={live}
          stars={chapter.stars}
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

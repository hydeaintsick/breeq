"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
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
import type { ChapterClearResult } from "@/app/actions/progress";
import { applyBackgroundPhoto, parseStoredLevel } from "@/game/breakout/engine";
import { QUIET_START } from "@/game/breakout/levels";
import { GAME_MENU_PATH, STORY_PATH } from "@/lib/auth/paths";
import {
  episodeIsComplete,
  episodeIsLocked,
  episodeLockHint,
  type StoryChapterCard,
  type StoryEpisodeCard,
} from "@/lib/story";

const FALLBACK_LEVELS = [QUIET_START];

function chapterLabel(count: number) {
  return count === 1 ? "1 chapter" : `${count} chapters`;
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
          episode.backgroundUrl,
        ),
      ]
    : FALLBACK_LEVELS;
}

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

export function StoryShelf({
  episodes,
  storyPercent,
  initialSlug,
  kicker,
  title,
  body,
}: {
  episodes: StoryEpisodeCard[];
  storyPercent: number;
  initialSlug?: string;
  kicker?: string;
  title?: ReactNode;
  body?: string;
}) {
  const router = useRouter();
  const titleId = useId();
  const railRef = useRef<HTMLDivElement>(null);
  const aligned = useRef(false);
  const [shelf, setShelf] = useState(episodes);
  const [active, setActive] = useState(() => continueIndex(episodes, initialSlug));
  const [percent, setPercent] = useState(storyPercent);
  const [open, setOpen] = useState<StoryEpisodeCard | null>(() => {
    const episode = episodes.find((item) => item.slug === initialSlug);
    if (!episode) {
      return null;
    }
    const index = episodes.findIndex((item) => item.id === episode.id);
    return episodeIsLocked(episodes, index) ? null : episode;
  });
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const [grown, setGrown] = useState(Boolean(initialSlug));
  const [playing, setPlaying] = useState<StoryChapterCard | null>(null);
  const [paused, setPaused] = useState(false);
  /** The wall came down: score is known at once, the payout arrives a beat later. */
  const [cleared, setCleared] = useState<{ score: number; result: ChapterClearResult | null } | null>(null);
  const [lost, setLost] = useState<{ score: number; reason: "lives" | "timeout" | "crushed" } | null>(null);
  const [runId, setRunId] = useState(0);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const platesRef = useRef<(HTMLDivElement | null)[]>([]);

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
    const slide = root?.querySelector<HTMLElement>(`[data-story-slide="${index}"]`);
    if (!root || !slide) {
      return;
    }
    const left = slide.offsetLeft - (root.clientWidth - slide.offsetWidth) / 2;
    root.scrollTo({ left: Math.max(0, left), behavior });
  }, []);

  useEffect(() => {
    setPortal(document.body);
  }, []);

  useEffect(() => {
    setShelf(episodes);
  }, [episodes]);

  useEffect(() => {
    setPercent(storyPercent);
  }, [storyPercent]);

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
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, scrollRail, syncFromRail]);

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

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!origin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGrown(true);
      return;
    }
    const frame = window.setTimeout(() => setGrown(true), 20);
    return () => window.clearTimeout(frame);
  }, [open, origin]);

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
      setPlaying(null);
      setPaused(false);
      setOpen(null);
      setGrown(false);
      setOrigin(null);
      if (initialSlug) {
        router.push(STORY_PATH);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cleared, initialSlug, lost, open, playing, router]);

  const goTo = useCallback((index: number) => {
    const next = Math.max(0, Math.min(shelf.length - 1, index));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollRail(next, reduced ? "auto" : "smooth");
  }, [scrollRail, shelf.length]);

  useEffect(() => {
    if (open || playing) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(active + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(active - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo, open, playing]);

  function openEpisode(episode: StoryEpisodeCard, card: HTMLElement) {
    const index = shelf.findIndex((item) => item.id === episode.id);
    if (episodeIsLocked(shelf, index)) {
      return;
    }
    setOrigin(card.getBoundingClientRect());
    setGrown(false);
    setOpen(episode);
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

  function closeSheet() {
    setPlaying(null);
    setPaused(false);
    setCleared(null);
    setLost(null);
    setOpen(null);
    setGrown(false);
    setOrigin(null);
    if (initialSlug) {
      router.push(STORY_PATH);
    }
  }

  function quitRun() {
    setPaused(false);
    setCleared(null);
    setLost(null);
    setPlaying(null);
  }

  function startChapter(chapter: StoryChapterCard) {
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
    <div className="story-page">
      <StoryAmbient episodes={shelf} platesRef={platesRef} />
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
        {shelf.map((episode, index) => {
          const locked = episodeIsLocked(shelf, index);
          const hint = episodeLockHint(shelf, index);
          return (
            <div
              key={episode.id}
              className="story-rail-item"
              data-story-slide={index}
              aria-current={index === active ? "true" : undefined}
            >
              <div className="story-rail-frame">
                <PlayCard
                  kicker={String(index + 1).padStart(2, "0")}
                  title={episode.title}
                  body={chapterLabel(episode.chapterCount)}
                  action="Play"
                  levels={previewLevels(episode)}
                  seed={11 + index}
                  cover={episode.backgroundUrl}
                  locked={locked}
                  lockedHint={hint ?? undefined}
                  fill
                  aura={false}
                  onSelect={locked ? undefined : (card) => openEpisode(episode, card)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="story-page-foot">
        {shelf.length > 1 ? (
          <div className="story-dots" role="tablist" aria-label="Episode position">
            {shelf.map((episode, index) => (
              <button
                key={episode.id}
                type="button"
                className="story-dot"
                role="tab"
                aria-selected={index === active}
                aria-label={`Episode ${index + 1}, ${episode.title}`}
                onClick={() => goTo(index)}
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
                className="story-sheet"
                data-grown={grown}
                style={sheetStyle}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <div className="pointer-events-none absolute inset-0 [&_*]:pointer-events-none" inert>
                  {open.backgroundUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url("${open.backgroundUrl.replace(/"/g, "")}")` }}
                    />
                  ) : (
                    <BreakoutFill episode={open} />
                  )}
                </div>
                <div className="story-sheet-scrim" aria-hidden="true" />
                <div className="story-sheet-bar">
                  <p className="min-w-0 text-sm font-medium text-white/80">Story {percent}%</p>
                  <button type="button" className="story-close" aria-label="Close episode" onClick={closeSheet}>
                    <CloseGlyph />
                  </button>
                </div>
                <div className="story-sheet-body mx-auto w-full max-w-xl">
                  <p className="font-mono text-xs tracking-[0.16em] text-accent">Episode</p>
                  <h2 id={titleId} className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    {open.title}
                  </h2>
                  <div className="story-campaign mt-5" aria-label={`Story progress ${percent} percent`}>
                    <div className="rank-bar story-campaign-bar">
                      <span className="rank-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-white/70">{percent}% of the story cleared</p>
                  </div>
                  <ul className="mt-8 grid gap-3">
                    {open.chapters.map((chapter, index) => (
                      <li key={chapter.id}>
                        <button
                          type="button"
                          className="story-level"
                          onClick={() => startChapter(chapter)}
                        >
                          <span className="font-mono text-xs tracking-[0.16em] text-accent">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-left font-semibold tracking-tight text-white">
                            {chapter.title}
                          </span>
                          <span className="shrink-0 text-sm text-white/70">
                            {chapter.cleared ? "Cleared" : `${chapter.xpReward} XP`}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
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
                    }}
                    onAwarded={(result) => {
                      setPercent(result.storyPercent);
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
  platesRef,
}: {
  episodes: readonly StoryEpisodeCard[];
  platesRef: { current: (HTMLDivElement | null)[] };
}) {
  return (
    <div className="story-ambient" aria-hidden="true">
      {episodes.map((episode, index) => (
        <div
          key={episode.id}
          ref={(node) => {
            platesRef.current[index] = node;
          }}
          className="story-ambient-plate"
        >
          {episode.backgroundUrl ? (
            <>
              <div className="story-ambient-drift" data-layer="wash" style={{ animationDelay: `${-index * 7}s` }}>
                <img
                  src={episode.backgroundUrl}
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
                  src={episode.backgroundUrl}
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

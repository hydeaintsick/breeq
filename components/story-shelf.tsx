"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { BreakoutPreview } from "@/components/breakout-preview";
import { PlayCard } from "@/components/play-card";
import { StoryPlay } from "@/components/story-play";
import { parseStoredLevel } from "@/game/breakout/engine";
import { QUIET_START } from "@/game/breakout/levels";
import { STORY_PATH } from "@/lib/auth/paths";
import type { StoryChapterCard, StoryEpisodeCard } from "@/lib/story";

const FALLBACK_LEVELS = [QUIET_START];

function chapterLabel(count: number) {
  return count === 1 ? "1 chapter" : `${count} chapters`;
}

function previewLevels(episode: StoryEpisodeCard) {
  return episode.previewLevel
    ? [
        parseStoredLevel(episode.previewLevel, {
          id: episode.id,
          name: episode.title,
          author: "Breeq",
        }),
      ]
    : FALLBACK_LEVELS;
}

export function StoryShelf({
  episodes,
  storyPercent,
  initialSlug,
}: {
  episodes: StoryEpisodeCard[];
  storyPercent: number;
  initialSlug?: string;
}) {
  const router = useRouter();
  const titleId = useId();
  const [percent, setPercent] = useState(storyPercent);
  const [open, setOpen] = useState<StoryEpisodeCard | null>(
    () => episodes.find((episode) => episode.slug === initialSlug) ?? null,
  );
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const [grown, setGrown] = useState(Boolean(initialSlug));
  const [playing, setPlaying] = useState<StoryChapterCard | null>(null);
  const [paused, setPaused] = useState(false);
  const [portal, setPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortal(document.body);
  }, []);

  useEffect(() => {
    setPercent(storyPercent);
  }, [storyPercent]);

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
  }, [initialSlug, open, playing, router]);

  function openEpisode(episode: StoryEpisodeCard, card: HTMLElement) {
    setOrigin(card.getBoundingClientRect());
    setGrown(false);
    setOpen(episode);
    setPlaying(null);
    setPaused(false);
  }

  function closeSheet() {
    setPlaying(null);
    setPaused(false);
    setOpen(null);
    setGrown(false);
    setOrigin(null);
    if (initialSlug) {
      router.push(STORY_PATH);
    }
  }

  function quitRun() {
    setPaused(false);
    setPlaying(null);
  }

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
    <>
      <div className="grid w-full justify-items-stretch gap-6 md:grid-cols-2 md:justify-items-start">
        {episodes.map((episode, index) => {
          const locked = episode.chapterCount === 0;
          return (
            <PlayCard
              key={episode.id}
              kicker={String(index + 1).padStart(2, "0")}
              title={episode.title}
              body={chapterLabel(episode.chapterCount)}
              action="Play"
              levels={previewLevels(episode)}
              seed={11 + index}
              cover={episode.backgroundUrl}
              locked={locked}
              lockedHint="No chapters yet."
              onSelect={locked ? undefined : (card) => openEpisode(episode, card)}
            />
          );
        })}
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
                          onClick={() => {
                            setPaused(false);
                            setPlaying(chapter);
                          }}
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
                    seed={17}
                    paused={paused}
                    onCleared={(next) => {
                      setPercent(next);
                      setOpen({
                        ...open,
                        chapters: open.chapters.map((chapter) =>
                          chapter.id === playing.id ? { ...chapter, cleared: true } : chapter,
                        ),
                      });
                    }}
                  />
                  <button
                    type="button"
                    className="story-pause"
                    aria-label="Pause"
                    onClick={() => setPaused(true)}
                  >
                    <CloseGlyph />
                  </button>
                  {paused ? (
                    <div className="story-pause-menu">
                      <div className="glass w-full max-w-sm p-6 sm:p-8">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Paused</p>
                        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{playing.title}</h3>
                        <div className="mt-8 grid gap-3">
                          <button type="button" className="btn-play min-h-11 w-full" onClick={() => setPaused(false)}>
                            Resume
                          </button>
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
    </>
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

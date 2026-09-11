"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { markDiscovered } from "@/app/actions/discoveries";
import { awardChapterClear, type ChapterClearResult } from "@/app/actions/progress";
import { BreakoutPreview } from "@/components/breakout-preview";
import { useSpotlight } from "@/components/use-spotlight";
import { applyBackgroundPhoto, parseStoredLevel } from "@/game/breakout/engine";
import type { GameEvent } from "@/game/breakout/engine/types";
import type { BreakoutHandle } from "@/game/breakout/preview";
import { discoveriesFromEvent, type Discovery } from "@/lib/discoveries";
import { screenPhoto } from "@/lib/photo";

export function StoryPlay({
  chapterId,
  title,
  storedLevel,
  backgroundUrl,
  seed,
  paused,
  discovered,
  onDiscovered,
  onCleared,
  onAwarded,
  onOver,
}: {
  chapterId: string;
  title: string;
  storedLevel: unknown;
  backgroundUrl?: string | null;
  seed: number;
  paused: boolean;
  /**
   * Piece ids the story has already explained. The first time the ball meets a
   * kind that is not in here, the run freezes and a card names it; then it is
   * added and never shown again.
   */
  discovered?: ReadonlySet<string>;
  /** A piece was just explained; the parent keeps the set for the next chapter. */
  onDiscovered?: (id: string) => void;
  /** The wall just came down; fires before the server is asked anything. */
  onCleared?: (info: { score: number; paddleHits: number; livesLeft: number }) => void;
  /** The clear was recorded and XP paid out. */
  onAwarded?: (result: ChapterClearResult) => void;
  /** Lives, time, or the descending wall ended the run. */
  onOver?: (info: { score: number; reason: "lives" | "timeout" | "crushed" }) => void;
}) {
  const levels = useMemo(
    () => [
      applyBackgroundPhoto(
        parseStoredLevel(storedLevel, {
          id: chapterId,
          name: title,
          author: "Breeq",
        }),
        backgroundUrl ? screenPhoto(backgroundUrl) : backgroundUrl,
      ),
    ],
    [backgroundUrl, chapterId, storedLevel, title],
  );
  const level = levels[0];

  // Latest callbacks without remounting the game when the parent re-renders.
  const onClearedRef = useRef(onCleared);
  const onAwardedRef = useRef(onAwarded);
  const onOverRef = useRef(onOver);
  const onDiscoveredRef = useRef(onDiscovered);
  useEffect(() => {
    onClearedRef.current = onCleared;
    onAwardedRef.current = onAwarded;
    onOverRef.current = onOver;
    onDiscoveredRef.current = onDiscovered;
  });

  // What the player already knows. The set only grows; a new id is added the
  // moment its card shows, so no event in the same run can bring it back.
  const knownRef = useRef<Set<string>>(new Set(discovered));
  useEffect(() => {
    if (!discovered) return;
    for (const id of discovered) knownRef.current.add(id);
  }, [discovered]);

  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<BreakoutHandle | null>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  const [lesson, setLesson] = useState<Discovery | null>(null);
  const lessonRef = useRef(lesson);
  const endedRef = useRef(false);
  useEffect(() => {
    lessonRef.current = lesson;
  }, [lesson]);

  const onHandle = useCallback((handle: BreakoutHandle | null) => {
    handleRef.current = handle;
    // A fresh board (retry, next chapter) is a fresh run; the card is already down.
    if (handle) endedRef.current = false;
    setReady(handle !== null);
  }, []);

  // Freeze the world on the spot the first time a kind of piece shows up.
  const onEvent = useCallback(
    (event: GameEvent) => {
      if (lessonRef.current || endedRef.current) return;
      const next = discoveriesFromEvent(event, level).find((item) => !knownRef.current.has(item.lesson.id));
      if (!next) return;
      knownRef.current.add(next.lesson.id);
      handleRef.current?.pause();
      lessonRef.current = next;
      setLesson(next);
      onDiscoveredRef.current?.(next.lesson.id);
      void markDiscovered([next.lesson.id]).catch(() => null);
    },
    [level],
  );

  const dismiss = useCallback(() => {
    lessonRef.current = null;
    setLesson(null);
  }, []);

  useEffect(() => {
    if (!lesson) return;
    actionRef.current?.focus({ preventScroll: true });
  }, [lesson]);

  const handleCleared = useCallback(
    ({
      human,
      score,
      paddleHits,
      livesLeft,
    }: {
      human: boolean;
      score: number;
      paddleHits: number;
      livesLeft: number;
    }) => {
      endedRef.current = true;
      lessonRef.current = null;
      setLesson(null);
      if (!human) {
        return;
      }
      onClearedRef.current?.({ score, paddleHits, livesLeft });
      void awardChapterClear(chapterId, { score, paddleHits, livesLeft }).then((result) => {
        if ("storyPercent" in result) {
          onAwardedRef.current?.(result);
        }
      });
    },
    [chapterId],
  );

  const handleOver = useCallback(
    ({ human, score, reason }: { human: boolean; score: number; reason: "lives" | "timeout" | "crushed" }) => {
      endedRef.current = true;
      lessonRef.current = null;
      setLesson(null);
      if (!human) {
        return;
      }
      onOverRef.current?.({ score, reason });
    },
    [],
  );

  const { hole, place, veilStyle } = useSpotlight({
    rootRef,
    handleRef,
    targets: lesson ? lesson.targets : null,
    ready,
  });

  return (
    <div ref={rootRef} className="absolute inset-0">
      <BreakoutPreview
        levels={levels}
        seed={seed}
        followQuery={false}
        controls="pointer"
        loop={false}
        contain
        thumbRail
        sound
        haptics
        showCaption={false}
        paused={paused || lesson !== null}
        onCleared={handleCleared}
        onOver={handleOver}
        onEvent={onEvent}
        onHandle={onHandle}
      />

      <div
        className="tutorial-veil"
        data-show={lesson ? "true" : "false"}
        data-hole={hole ? "true" : "false"}
        style={veilStyle}
        aria-hidden="true"
      />

      {lesson ? (
        <div key={lesson.lesson.id} className="tutorial-card glass" data-place={place} role="group" aria-live="polite">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{lesson.lesson.kicker}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{lesson.lesson.title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{lesson.lesson.body}</p>
          <button ref={actionRef} type="button" className="btn-play mt-5 min-h-11 w-full" onClick={dismiss}>
            Continue
          </button>
        </div>
      ) : null}
    </div>
  );
}

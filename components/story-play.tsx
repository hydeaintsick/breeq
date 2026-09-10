"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { awardChapterClear, type ChapterClearResult } from "@/app/actions/progress";
import { BreakoutPreview } from "@/components/breakout-preview";
import { applyBackgroundPhoto, parseStoredLevel } from "@/game/breakout/engine";

export function StoryPlay({
  chapterId,
  title,
  storedLevel,
  backgroundUrl,
  seed,
  paused,
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
  /** The wall just came down; fires before the server is asked anything. */
  onCleared?: (info: { score: number }) => void;
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
        backgroundUrl,
      ),
    ],
    [backgroundUrl, chapterId, storedLevel, title],
  );

  // Latest callbacks without remounting the game when the parent re-renders.
  const onClearedRef = useRef(onCleared);
  const onAwardedRef = useRef(onAwarded);
  const onOverRef = useRef(onOver);
  useEffect(() => {
    onClearedRef.current = onCleared;
    onAwardedRef.current = onAwarded;
    onOverRef.current = onOver;
  });

  const handleCleared = useCallback(
    ({ human, score }: { human: boolean; score: number }) => {
      if (!human) {
        return;
      }
      onClearedRef.current?.({ score });
      void awardChapterClear(chapterId).then((result) => {
        if ("storyPercent" in result) {
          onAwardedRef.current?.(result);
        }
      });
    },
    [chapterId],
  );

  const handleOver = useCallback(
    ({ human, score, reason }: { human: boolean; score: number; reason: "lives" | "timeout" | "crushed" }) => {
      if (!human) {
        return;
      }
      onOverRef.current?.({ score, reason });
    },
    [],
  );

  return (
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
      paused={paused}
      onCleared={handleCleared}
      onOver={handleOver}
    />
  );
}

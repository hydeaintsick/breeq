"use client";

import { useCallback, useMemo, useRef } from "react";
import { awardChapterClear } from "@/app/actions/progress";
import { BreakoutPreview } from "@/components/breakout-preview";
import { parseStoredLevel } from "@/game/breakout/engine";

export function StoryPlay({
  chapterId,
  title,
  storedLevel,
  seed,
  paused,
  onCleared,
}: {
  chapterId: string;
  title: string;
  storedLevel: unknown;
  seed: number;
  paused: boolean;
  onCleared?: (percent: number) => void;
}) {
  const levels = useMemo(
    () => [
      parseStoredLevel(storedLevel, {
        id: chapterId,
        name: title,
        author: "Breeq",
      }),
    ],
    [chapterId, storedLevel, title],
  );

  const onClearedRef = useRef(onCleared);
  onClearedRef.current = onCleared;

  const handleCleared = useCallback(
    ({ human }: { human: boolean }) => {
      if (!human) {
        return;
      }
      void awardChapterClear(chapterId).then((result) => {
        if ("storyPercent" in result && typeof result.storyPercent === "number") {
          onClearedRef.current?.(result.storyPercent);
        }
      });
    },
    [chapterId],
  );

  return (
    <BreakoutPreview
      levels={levels}
      seed={seed}
      followQuery={false}
      controls="pointer"
      loop={false}
      contain
      showCaption={false}
      paused={paused}
      onCleared={handleCleared}
    />
  );
}

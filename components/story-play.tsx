"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { awardStoryClear } from "@/app/actions/progress";
import { BreakoutPreview } from "@/components/breakout-preview";
import { parseStoredLevel } from "@/game/breakout/engine";

export function StoryPlay({
  storedLevels,
  seed,
}: {
  storedLevels: readonly unknown[];
  seed: number;
}) {
  const router = useRouter();
  const levels = useMemo(
    () =>
      storedLevels.map((raw, index) =>
        parseStoredLevel(raw, {
          id: `story-${index}`,
          name: "Chapter",
          author: "Breeq",
        }),
      ),
    [storedLevels],
  );
  const onCleared = useCallback(
    ({ human }: { human: boolean }) => {
      if (!human) {
        return;
      }
      void awardStoryClear().then(() => {
        router.refresh();
      });
    },
    [router],
  );

  return (
    <BreakoutPreview
      levels={levels}
      seed={seed}
      followQuery={false}
      controls="hybrid"
      onCleared={onCleared}
    />
  );
}

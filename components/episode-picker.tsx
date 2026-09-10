"use client";

import { PlayCard } from "@/components/play-card";
import { parseStoredLevel } from "@/game/breakout/engine";
import { QUIET_START } from "@/game/breakout/levels";
import { storyEpisodePath } from "@/lib/auth/paths";
import type { StoryEpisodeCard } from "@/lib/story";

const FALLBACK_LEVELS = [QUIET_START];

function chapterLabel(count: number) {
  return count === 1 ? "1 chapter" : `${count} chapters`;
}

export function EpisodePicker({ episodes }: { episodes: StoryEpisodeCard[] }) {
  return (
    <div className="grid w-full justify-items-start gap-6 md:grid-cols-2">
      {episodes.map((episode, index) => {
        const locked = episode.chapterCount === 0;
        const levels = episode.previewLevel
          ? [
              parseStoredLevel(episode.previewLevel, {
                id: episode.id,
                name: episode.title,
                author: "Breeq",
              }),
            ]
          : FALLBACK_LEVELS;

        return (
          <PlayCard
            key={episode.id}
            href={storyEpisodePath(episode.slug)}
            kicker={String(index + 1).padStart(2, "0")}
            title={episode.title}
            body={chapterLabel(episode.chapterCount)}
            action="Play"
            levels={levels}
            seed={11 + index}
            locked={locked}
            lockedHint="No chapters yet."
          />
        );
      })}
    </div>
  );
}

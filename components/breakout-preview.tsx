"use client";

import { useEffect, useRef, useState } from "react";
import { SHOWCASE_LEVELS } from "@/game/breakout/levels";
import type { Level } from "@/game/breakout/engine/types";
import { mountBreakout, type BreakoutHandle, type HudState, type MountOptions } from "@/game/breakout/preview";

const DEFAULT_LEVELS = SHOWCASE_LEVELS;

const SPEED_LABEL: Record<NonNullable<HudState["bonus"]>, string> = {
  slow: "½ slow",
  fast2: "×2 fast",
  fast3: "×3 fast",
};

const MOD_LABEL: Record<NonNullable<HudState["mod"]>, string> = {
  shrink: "shrunk",
  grow: "wide",
  invert: "inverted",
  ice: "iced",
  sticky: "sticky",
};

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function BreakoutPreview({
  levels = DEFAULT_LEVELS,
  start = 0,
  seed,
  controls = "hybrid",
  followQuery = true,
  compact = false,
  fill = false,
  contain = false,
  showCaption = true,
  showHud = true,
  paused = false,
  loop = true,
  onCleared,
}: {
  levels?: readonly Level[];
  start?: number;
  seed?: number;
  controls?: MountOptions["controls"];
  followQuery?: boolean;
  compact?: boolean;
  fill?: boolean;
  contain?: boolean;
  showCaption?: boolean;
  showHud?: boolean;
  paused?: boolean;
  loop?: boolean;
  onCleared?: MountOptions["onCleared"];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<BreakoutHandle | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const first = levels[0] ?? DEFAULT_LEVELS[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || levels.length === 0) {
      return;
    }
    const queryStart = followQuery
      ? Number(new URLSearchParams(window.location.search).get("level") ?? start) || start
      : start;
    const handle = mountBreakout(canvas, [...levels], {
      onHud: setHud,
      onCleared,
      start: queryStart,
      seed,
      controls,
      loop,
    });
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
  }, [levels, start, seed, controls, followQuery, loop, onCleared]);

  useEffect(() => {
    if (paused) {
      handleRef.current?.pause();
    } else {
      handleRef.current?.resume();
    }
  }, [paused]);

  const name = hud?.levelName ?? first.name;
  const author = hud?.author ?? first.author;
  const maxLives = hud?.maxLives ?? first.lives;
  const lives = hud?.lives ?? maxLives;
  const score = (hud?.score ?? 0).toLocaleString("en-US");
  const speed = hud?.bonus ? SPEED_LABEL[hud.bonus] : `×${(hud?.speed ?? 1).toFixed(1)}`;
  const caption = hud?.caption ?? "Autoplay. Move over the board to take the paddle.";

  const hudVisible = showHud && !fill;
  const captionVisible = showCaption && !fill && !contain;

  return (
    <figure
      className={
        contain
          ? "story-play-stage"
          : fill
            ? "absolute inset-0 z-0 h-full w-full max-w-none overflow-hidden"
            : `relative mx-auto w-full ${compact ? "max-w-[18rem]" : "max-w-[22rem]"}`
      }
    >
      {fill || contain ? null : <div className="board-aura" aria-hidden="true" />}
      <div
        className={
          contain
            ? "story-play-board board-stage relative"
            : `board-stage relative mx-auto ${fill ? "board-stage-fill" : "z-10"}`
        }
        role="img"
        aria-label={`A live brick-breaker level called ${name}, built by ${author}: neon glass bricks over a photo, zones and obstacles that bend the ball, a glass paddle, ${maxLives} lives.`}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          style={{ aspectRatio: `${first.width} / ${first.height}` }}
        />

        {hudVisible ? (
          <div className="board-hud" aria-hidden="true">
            <div className="board-hud-name">
              <strong>{name}</strong>
              <span>by {author}</span>
            </div>
            <div className="board-hud-lives">
              {Array.from({ length: maxLives }, (_, i) => (
                <span key={i} className="board-hud-life" data-lost={i >= lives} />
              ))}
            </div>
            <div className="board-hud-stats">
              {hud?.timeLeft !== null && hud?.timeLeft !== undefined ? (
                <span className="board-hud-clock" data-low={hud.timeLeft <= 15}>
                  {clock(hud.timeLeft)}
                </span>
              ) : null}
              <span className="board-hud-score">{score}</span>
              {hud?.mod ? (
                <span className="board-hud-speed" data-mod={hud.mod}>
                  {MOD_LABEL[hud.mod]}
                </span>
              ) : (
                <span className="board-hud-speed" data-bonus={hud?.bonus ?? undefined}>
                  {speed}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {captionVisible ? (
        <figcaption className="relative mt-4 h-5 text-center text-xs tracking-wide text-ink-muted">
          <span key={caption} className="board-caption" data-phase={hud?.phase ?? undefined}>
            {caption}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { SHOWCASE_LEVELS } from "@/game/breakout/levels";
import { mountBreakout, type HudState } from "@/game/breakout/preview";

const LEVELS = SHOWCASE_LEVELS;
const FIRST = LEVELS[0];

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

export function BreakoutPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState<HudState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    // `?level=n` lets you open the page on a given level of the rotation.
    const start = Number(new URLSearchParams(window.location.search).get("level") ?? 0) || 0;
    const handle = mountBreakout(canvas, LEVELS, { onHud: setHud, start });
    return () => handle.destroy();
  }, []);

  const name = hud?.levelName ?? FIRST.name;
  const author = hud?.author ?? FIRST.author;
  const maxLives = hud?.maxLives ?? FIRST.lives;
  const lives = hud?.lives ?? maxLives;
  const score = (hud?.score ?? 0).toLocaleString("en-US");
  const speed = hud?.bonus ? SPEED_LABEL[hud.bonus] : `×${(hud?.speed ?? 1).toFixed(1)}`;
  const caption = hud?.caption ?? "Autoplay. Move over the board to take the paddle.";

  return (
    <figure className="relative mx-auto w-full max-w-[22rem]">
      <div className="board-aura" aria-hidden="true" />
      <div
        className="board-stage relative z-10 mx-auto"
        role="img"
        aria-label={`A live brick-breaker level called ${name}, built by ${author}: neon glass bricks over a photo, zones and obstacles that bend the ball, a glass paddle, ${maxLives} lives.`}
      >
        <canvas
          ref={canvasRef}
          className="block w-full"
          style={{ aspectRatio: `${FIRST.width} / ${FIRST.height}` }}
        />

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
      </div>

      <figcaption className="relative mt-4 h-5 text-center text-xs tracking-wide text-ink-muted">
        <span key={caption} className="board-caption" data-phase={hud?.phase ?? undefined}>
          {caption}
        </span>
      </figcaption>
    </figure>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { FIRST_LIGHT } from "@/game/breakout/levels/first-light";
import { mountBreakout, type HudState } from "@/game/breakout/preview";

const LEVEL = FIRST_LIGHT;

const SPEED_LABEL: Record<NonNullable<HudState["bonus"]>, string> = {
  slow: "½ slow",
  fast2: "×2 fast",
  fast3: "×3 fast",
};

export function BreakoutPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState<HudState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const handle = mountBreakout(canvas, LEVEL, { onHud: setHud });
    return () => handle.destroy();
  }, []);

  const lives = hud?.lives ?? LEVEL.lives;
  const score = (hud?.score ?? 0).toLocaleString("en-US");
  const speed = hud?.bonus ? SPEED_LABEL[hud.bonus] : `×${(hud?.speed ?? 1).toFixed(1)}`;
  const caption = hud?.caption ?? "Autoplay. Move over the board to take the paddle.";

  return (
    <figure className="relative mx-auto w-full max-w-[22rem]">
      <div className="board-aura" aria-hidden="true" />
      <div
        className="board-stage relative z-10 mx-auto"
        role="img"
        aria-label={`A live brick-breaker level called ${LEVEL.name}, built by ${LEVEL.author}: neon glass bricks over a photo, bonus zones that slow the ball or speed it up, a glass paddle, three lives.`}
      >
        <canvas
          ref={canvasRef}
          className="block w-full"
          style={{ aspectRatio: `${LEVEL.width} / ${LEVEL.height}` }}
        />

        <div className="board-hud" aria-hidden="true">
          <div className="board-hud-name">
            <strong>{LEVEL.name}</strong>
            <span>by {LEVEL.author}</span>
          </div>
          <div className="board-hud-lives">
            {Array.from({ length: LEVEL.lives }, (_, i) => (
              <span key={i} className="board-hud-life" data-lost={i >= lives} />
            ))}
          </div>
          <div className="board-hud-stats">
            <span className="board-hud-score">{score}</span>
            <span className="board-hud-speed" data-bonus={hud?.bonus ?? undefined}>
              {speed}
            </span>
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

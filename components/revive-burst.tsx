"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { HeartGlyph } from "@/components/currency-glyphs";
import { createReviveSfx, REVIVE_SURGE_MS } from "@/game/breakout/audio";

/** After the beat, how long the light takes to leave the board, ms. */
const FADE_MS = 900;

/** The sparks the beat throws over the board: angle, reach and size, laid out by hand. */
const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  a: (i * 360) / 18 + ((i * 41) % 13) - 6,
  d: 7 + ((i * 53) % 9) * 0.6,
  s: 0.8 + ((i * 29) % 5) * 0.14,
  delay: ((i * 17) % 7) * 16,
}));

const THEME = { "--energy": "var(--neon-pink)", "--energy-cool": "var(--danger)" } as CSSProperties;

/**
 * The revive moment, over the board: the game over glass lifts as a heart
 * gathers light at the center of the field, then the beat — a flash, three
 * shockwaves, a shower of sparks — and the light leaves, the ball already
 * waiting on the paddle underneath. `onBeat` fires on the beat: the parent
 * revives the engine right then, so the paddle's own ring and the in-key
 * chord land on the same frame. `onDone` when the light is gone. Reduced
 * motion: the beat at once, the light gone in a breath. Never takes a tap.
 */
export function ReviveBurst({ onBeat, onDone }: { onBeat: () => void; onDone: () => void }) {
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const onBeatRef = useRef(onBeat);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onBeatRef.current = onBeat;
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const sfx = createReviveSfx();
    const beatAt = reduced ? 0 : REVIVE_SURGE_MS;
    const timers: number[] = [];
    if (!reduced) sfx.surge();
    timers.push(
      window.setTimeout(() => {
        onBeatRef.current();
      }, beatAt),
    );
    timers.push(window.setTimeout(() => onDoneRef.current(), beatAt + (reduced ? 240 : FADE_MS)));
    return () => {
      for (const id of timers) window.clearTimeout(id);
      sfx.destroy();
    };
  }, [reduced]);

  return (
    <div className="revive-burst" style={THEME} data-reduced={reduced ? "true" : undefined} aria-hidden="true">
      <div className="revive-burst-veil" />
      <div className="revive-burst-core">
        <span className="surge" aria-hidden="true">
          <i className="surge-flash" />
          <i className="surge-ring" style={{ "--k": 0 } as CSSProperties} />
          <i className="surge-ring" style={{ "--k": 1 } as CSSProperties} />
          <i className="surge-ring" style={{ "--k": 2 } as CSSProperties} />
          <i className="surge-wave" style={{ "--k": 0 } as CSSProperties} />
          <i className="surge-wave" style={{ "--k": 1 } as CSSProperties} />
          <i className="surge-wave" style={{ "--k": 2 } as CSSProperties} />
          {SPARKS.map((spark, i) => (
            <i
              key={i}
              className="surge-spark"
              style={{ "--a": `${spark.a}deg`, "--d": `${spark.d}rem`, "--s": spark.s, "--delay": `${spark.delay}ms` } as CSSProperties}
            />
          ))}
        </span>
        <span className="revive-burst-heart">
          <HeartGlyph />
        </span>
      </div>
    </div>
  );
}

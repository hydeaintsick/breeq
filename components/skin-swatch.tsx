"use client";

import type { CSSProperties } from "react";
import type { SkinColor } from "@/game/breakout/preview";
import type { Skin } from "@/lib/cosmetics";

/**
 * A skin's look as CSS, for the shelf: a glass bar for a paddle, a lit ball
 * with its trail for a ball. Drawn from the same `look` the renderer reads,
 * so the card and the board never disagree. Purely decorative — the card's
 * label carries the name.
 */
export function SkinSwatch({ skin, className = "" }: { skin: Skin; className?: string }) {
  if (skin.slot === "paddle") {
    const { top, bottom, rim, glow, stripes } = skin.look;
    const style = {
      "--top": top,
      "--bottom": bottom,
      "--rim": rim,
      "--glow": cssColor(glow),
      ...(stripes && stripes.length > 0 ? { "--stripes": stripeGradient(stripes) } : {}),
    } as CSSProperties;
    return (
      <span className={`skin-swatch ${className}`.trim()} data-slot="paddle" style={style} aria-hidden="true">
        <i className="skin-swatch-glow" />
        <i className="skin-swatch-paddle" data-stripes={stripes && stripes.length > 0 ? "true" : undefined} />
      </span>
    );
  }
  const { core, edge, aura, auraScale = 1, trail, trailTint } = skin.look;
  const style = {
    "--core": core,
    "--edge": cssColor(edge),
    "--aura": cssColor(aura),
    "--aura-scale": auraScale,
    "--trail": cssColor(trailTint),
  } as CSSProperties;
  return (
    <span className={`skin-swatch ${className}`.trim()} data-slot="ball" style={style} aria-hidden="true">
      <i className="skin-swatch-trail" data-trail={trail} />
      <i className="skin-swatch-ball" />
    </span>
  );
}

/** Diagonal bands cycling through the stripe colors, as the renderer paints them. */
function stripeGradient(colors: readonly string[]): string {
  const band = 5;
  const gap = 4;
  const period = colors.length * (band + gap);
  const stops = colors
    .map((color, i) => {
      const start = i * (band + gap);
      return `${color} ${start}px ${start + band}px, transparent ${start + band}px ${start + band + gap}px`;
    })
    .join(", ");
  return `repeating-linear-gradient(115deg, ${stops}) 0 0 / ${period}px ${period}px`;
}

const TOKENS: Record<string, string> = {
  blue: "var(--neon-blue)",
  violet: "var(--neon-violet)",
  pink: "var(--neon-pink)",
  cyan: "var(--neon-cyan)",
  lime: "var(--neon-lime)",
  amber: "var(--neon-amber)",
  steel: "var(--steel)",
  white: "#ffffff",
  danger: "var(--danger)",
  /* The board's speed color moves from blue to pink as the ball heats up; on a swatch it reads as the calm end. */
  speed: "var(--neon-blue)",
};

function cssColor(color: SkinColor): string {
  return TOKENS[color] ?? color;
}

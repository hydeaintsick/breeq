"use client";

/**
 * Preview for the earlier Plinko engine (`game/plinko`). Kept intact but no
 * longer mounted; the site shows `BreakoutPreview`. Its `.plinko-*` styles
 * were retired from `app/globals.css` with the theme change.
 */
import { useEffect, useRef, useState } from "react";
import { VAULT_04 } from "@/game/plinko/maps/vault-04";
import { mountPreview, type HudState } from "@/game/plinko/preview";

const BOARD = VAULT_04;

export function PlinkoPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState<HudState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const handle = mountPreview(canvas, BOARD, { onHud: setHud });
    return () => handle.destroy();
  }, []);

  const reserve = (hud?.reserve ?? 1240).toLocaleString("en-US");
  const caption = hud?.caption ?? "Attacker drops. Stake: 25 gold.";

  return (
    <figure className="relative mx-auto w-full max-w-[22rem]">
      <div className="plinko-aura" aria-hidden="true" />
      <div
        className="plinko-stage glass relative z-10 mx-auto overflow-hidden"
        role="img"
        aria-label="A live vertical trap board. A gold ball drops through pegs, a fan, a trampoline, and nails — sometimes into the void, sometimes into the chest."
      >
        <canvas
          ref={canvasRef}
          className="block w-full"
          style={{ aspectRatio: `${BOARD.width} / ${BOARD.height}` }}
        />

        <div className="plinko-hud" aria-hidden="true">
          <span className="plinko-hud-name">{BOARD.name}</span>
          <span className="plinko-hud-reserve">
            <span className="plinko-hud-label">Reserve</span>
            <span className="plinko-hud-value" data-outcome={hud?.outcome ?? undefined}>
              {reserve}
            </span>
            <span className="plinko-hud-coin" />
          </span>
        </div>
      </div>

      <figcaption className="relative mt-4 h-5 text-center text-xs tracking-wide text-ink-muted">
        <span key={caption} className="plinko-caption" data-outcome={hud?.outcome ?? undefined}>
          {caption}
        </span>
      </figcaption>
    </figure>
  );
}

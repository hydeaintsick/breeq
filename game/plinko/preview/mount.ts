/**
 * Mount the board preview on a canvas. Owns the frame loop and everything
 * browser-specific: device pixel ratio, resize, pausing when off-screen or in
 * a hidden tab, and the reduced-motion fallback.
 */
import { readPalette } from "../assets/palette";
import type { Board } from "../engine";
import { BoardRenderer } from "../render/renderer";
import { PreviewDirector, type DirectorOptions, type HudState } from "./director";

export interface MountOptions extends Omit<DirectorOptions, "onHud"> {
  onHud?: (hud: HudState) => void;
  /** Cap on device pixel ratio. 2 keeps phones sharp without burning battery. */
  maxDpr?: number;
}

export interface PreviewHandle {
  destroy(): void;
}

export function mountPreview(canvas: HTMLCanvasElement, board: Board, options: MountOptions = {}): PreviewHandle {
  const maxDpr = options.maxDpr ?? 2;
  const palette = readPalette();
  const renderer = new BoardRenderer(canvas, board, palette);
  const director = new PreviewDirector(board, options);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frozen = reducedMotion.matches;
  if (frozen) {
    director.freeze();
  }

  let visible = true;
  let hidden = document.visibilityState === "hidden";
  let raf = 0;
  let last = 0;
  let destroyed = false;

  const draw = () => renderer.render(director.scene);

  const frame = (now: number) => {
    raf = 0;
    if (destroyed || frozen || !visible || hidden) {
      return;
    }
    const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    director.update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  };

  const schedule = () => {
    if (!raf && !destroyed && !frozen && visible && !hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  const applyReducedMotion = () => {
    frozen = reducedMotion.matches;
    if (frozen) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      director.freeze();
      draw();
    } else {
      schedule();
    }
  };

  let retryTimer = 0;
  let retries = 0;

  const resize = () => {
    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || board.width;
    const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    renderer.resize(width, dpr).then(
      () => {
        retries = 0;
        if (!destroyed) draw();
      },
      (error: unknown) => {
        // Never leave the board blank in silence: report, then try again.
        console.error("[breeq] board preview failed to build; retrying.", error);
        if (destroyed || retries >= 5) return;
        retries += 1;
        window.clearTimeout(retryTimer);
        retryTimer = window.setTimeout(resize, 600 * retries);
      },
    );
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas.parentElement ?? canvas);
  resize();

  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      schedule();
    },
    { rootMargin: "80px" },
  );
  intersection.observe(canvas);

  const onVisibility = () => {
    hidden = document.visibilityState === "hidden";
    schedule();
  };
  document.addEventListener("visibilitychange", onVisibility);
  reducedMotion.addEventListener("change", applyReducedMotion);

  schedule();

  return {
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(retryTimer);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", applyReducedMotion);
    },
  };
}

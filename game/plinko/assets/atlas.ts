/**
 * Sprite atlas — rasterizes the SVG kit into bitmaps at the exact pixel scale
 * the renderer is drawing at, so every edge stays crisp on 1x, 2x, and 3x
 * screens. Rebuilt on resize, cached in between.
 *
 * A sprite that fails to rasterize degrades to a transparent bitmap and a
 * console warning: one bad asset must never blank the whole board.
 */
import type { Palette } from "./palette";
import { SPRITES, type SpriteName, type SpriteSource } from "./sprites";

export interface Sprite {
  bitmap: HTMLCanvasElement;
  /** World-unit size and anchor, copied from the source. */
  w: number;
  h: number;
  ax: number;
  ay: number;
}

export type Atlas = Record<SpriteName, Sprite>;

/**
 * Rasterize every sprite at `scale` device pixels per world unit.
 * Resolves once all bitmaps are ready.
 */
export async function buildAtlas(palette: Palette, scale: number): Promise<Atlas> {
  const names = Object.keys(SPRITES) as SpriteName[];
  const entries = await Promise.all(
    names.map(async (name) => {
      const source = SPRITES[name];
      try {
        return [name, await rasterize(source, palette, scale)] as const;
      } catch (error) {
        console.warn(`[breeq] sprite "${name}" failed to rasterize; drawing it transparent.`, error);
        return [name, blankSprite(source, scale)] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Atlas;
}

function createBitmap(source: SpriteSource, scale: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(source.w * scale));
  canvas.height = Math.max(1, Math.ceil(source.h * scale));
  return canvas;
}

function blankSprite(source: SpriteSource, scale: number): Sprite {
  return { bitmap: createBitmap(source, scale), w: source.w, h: source.h, ax: source.ax, ay: source.ay };
}

async function rasterize(source: SpriteSource, palette: Palette, scale: number): Promise<Sprite> {
  const markup = source.svg(palette);
  // A data URL has no lifetime to manage and works identically in every engine.
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  const image = await loadImage(url);

  const canvas = createBitmap(source, scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D is not available");
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return { bitmap: canvas, w: source.w, h: source.h, ax: source.ax, ay: source.ay };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => reject(new Error("Sprite load timed out")), 4000);
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Sprite markup could not be decoded"));
    };
    image.src = url;
  });
}

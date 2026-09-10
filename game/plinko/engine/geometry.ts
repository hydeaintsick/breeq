/**
 * Shared geometry derived from pieces. Used by the physics step, the
 * validator, and the renderer so all three agree on where things are.
 */
import type { FanPiece, NailPiece, TrampolinePiece } from "./types";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Axis-aligned box covering every tip of the cluster. */
export function nailHitbox(nail: NailPiece): Rect {
  const h = (nail.count - 1) * nail.pitch + 10;
  const y = nail.y - h / 2;
  return nail.dir === "left"
    ? { x: nail.x - nail.length, y, w: nail.length, h }
    : { x: nail.x, y, w: nail.length, h };
}

/** Individual nail centers, top to bottom. */
export function nailCenters(nail: NailPiece): number[] {
  const start = nail.y - ((nail.count - 1) * nail.pitch) / 2;
  return Array.from({ length: nail.count }, (_, i) => start + i * nail.pitch);
}

/** The volume of moving air. */
export function fanStream(fan: FanPiece): Rect {
  const y = fan.y - fan.spread / 2;
  return fan.dir === "left"
    ? { x: fan.x - fan.reach, y, w: fan.reach, h: fan.spread }
    : { x: fan.x, y, w: fan.reach, h: fan.spread };
}

/** Where the fan housing sits (recessed into the rail). */
export function fanCenter(fan: FanPiece): { x: number; y: number } {
  const inset = 16;
  return { x: fan.dir === "left" ? fan.x - inset : fan.x + inset, y: fan.y };
}

export function trampolineSpan(t: TrampolinePiece): { x0: number; x1: number } {
  return { x0: t.x - t.width / 2, x1: t.x + t.width / 2 };
}

export function pointInRect(x: number, y: number, r: Rect): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function circleIntersectsRect(cx: number, cy: number, radius: number, r: Rect): boolean {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= radius * radius;
}

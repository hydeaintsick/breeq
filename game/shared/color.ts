/**
 * Color helpers for canvas drawing. Legacy comma syntax on purpose: it is the
 * one form every canvas and SVG parser accepts.
 */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseHex(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }
  const value = Number.parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/** `rgba(r, g, b, a)` from an `#rrggbb` color. */
export function alpha(hex: string, a: number): string {
  const c = parseHex(hex);
  return c ? `rgba(${c.r}, ${c.g}, ${c.b}, ${a})` : hex;
}

/** Multiply channels: `factor < 1` darkens, `> 1` lightens (clamped). */
export function shade(hex: string, factor: number): string {
  const c = parseHex(hex);
  if (!c) return hex;
  return `rgb(${clamp(c.r * factor)}, ${clamp(c.g * factor)}, ${clamp(c.b * factor)})`;
}

/** Blend toward white by `k` in [0, 1]. */
export function tint(hex: string, k: number): string {
  const c = parseHex(hex);
  if (!c) return hex;
  return `rgb(${clamp(c.r + (255 - c.r) * k)}, ${clamp(c.g + (255 - c.g) * k)}, ${clamp(c.b + (255 - c.b) * k)})`;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

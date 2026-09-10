/**
 * Palette used by every asset and by the renderer.
 *
 * Values come from the shared design tokens in `app/globals.css`. In the
 * browser we read them from the document so the game and the marketing site
 * can never drift apart; on the server or in tests we fall back to the same
 * literal values the stylesheet declares.
 */
export interface Palette {
  vault: string;
  vaultMid: string;
  gold: string;
  goldBright: string;
  goldDim: string;
  goldDeep: string;
  danger: string;
  ink: string;
  inkMuted: string;
}

const FALLBACK: Palette = {
  vault: "#07080b",
  vaultMid: "#0c0e14",
  gold: "#d4af6a",
  goldBright: "#f3d98a",
  goldDim: "#8a7040",
  goldDeep: "#3a2c14",
  danger: "#c4453c",
  ink: "#f4efe6",
  inkMuted: "#9a9284",
};

const TOKEN_VARS: Record<keyof Palette, string> = {
  vault: "--vault",
  vaultMid: "--vault-mid",
  gold: "--gold",
  goldBright: "--gold-bright",
  goldDim: "--gold-dim",
  goldDeep: "--gold-deep",
  danger: "--danger",
  ink: "--ink",
  inkMuted: "--ink-muted",
};

export function readPalette(root?: Element | null): Palette {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") {
    return FALLBACK;
  }

  const styles = getComputedStyle(root ?? document.documentElement);
  const palette = { ...FALLBACK };

  for (const key of Object.keys(TOKEN_VARS) as (keyof Palette)[]) {
    const value = styles.getPropertyValue(TOKEN_VARS[key]).trim();
    if (value) {
      palette[key] = value;
    }
  }

  return palette;
}

/** Multiply an `#rrggbb` color's channels. `factor < 1` darkens, `> 1` lightens. */
export function shade(hex: string, factor: number): string {
  const rgb = parseHex(hex);
  if (!rgb) {
    return hex;
  }
  const [r, g, b] = rgb.map((c) => clamp255(c * factor));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Return an `rgba(r, g, b, a)` string from an `#rrggbb` color. Legacy comma
 * syntax on purpose: it is the one form every canvas and SVG parser accepts.
 */
export function alpha(hex: string, a: number): string {
  const rgb = parseHex(hex);
  if (!rgb) {
    return hex;
  }
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function clamp255(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

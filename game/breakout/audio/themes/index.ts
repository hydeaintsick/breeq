/**
 * The story themes. `DEFAULT_THEME` is what players hear; the others stay
 * playable for auditioning — `localStorage.setItem("breeq-theme", "lanterns")`
 * and reload — and for a future setting.
 */
import { horizon } from "./horizon";
import { lanterns } from "./lanterns";
import type { ThemeScore } from "./score";

export type { ThemeChord, ThemeGraph, ThemeHit, ThemeParts, ThemeScore } from "./score";

export const THEMES = { lanterns, horizon } as const satisfies Record<string, ThemeScore>;
export type StoryThemeId = keyof typeof THEMES;

export const DEFAULT_THEME: StoryThemeId = "horizon";

const OVERRIDE_KEY = "breeq-theme";

function isThemeId(value: unknown): value is StoryThemeId {
  return typeof value === "string" && value in THEMES;
}

/** The theme to play: the local override when it names a real theme, else the default. */
export function activeTheme(): ThemeScore {
  let id: StoryThemeId = DEFAULT_THEME;
  try {
    const wanted = typeof window !== "undefined" ? window.localStorage.getItem(OVERRIDE_KEY) : null;
    if (isThemeId(wanted)) id = wanted;
  } catch {
    // Storage blocked: the default plays.
  }
  return THEMES[id];
}

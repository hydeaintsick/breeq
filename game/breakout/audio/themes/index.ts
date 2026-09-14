/**
 * The themes. `DEFAULT_THEME` is what the story surfaces play; the other
 * story scores stay playable for auditioning —
 * `localStorage.setItem("breeq-theme", "lanterns")` and reload — and for a
 * future setting. `arcade` belongs to the Earn store and `pursuit(root)` to a
 * paid run; they are picked by their surfaces, not by the override.
 */
import { arcade } from "./arcade";
import { horizon } from "./horizon";
import { lanterns } from "./lanterns";
import type { ThemeScore } from "./score";

export type { ThemeChord, ThemeGraph, ThemeHit, ThemeParts, ThemeScore } from "./score";
export { arcade } from "./arcade";
export { pursuit } from "./pursuit";

export const THEMES = { lanterns, horizon, arcade } as const satisfies Record<string, ThemeScore>;
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

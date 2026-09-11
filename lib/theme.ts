export const THEME_COOKIE = "breeq-theme";
export const THEME_MAX_AGE = 60 * 60 * 24 * 365;

export type Theme = "light" | "dark";

export function parseTheme(value?: string | null): Theme {
  return value === "light" ? "light" : "dark";
}

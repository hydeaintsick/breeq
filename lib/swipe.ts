export const SWIPE_COOKIE = "breeq-swipe";
export const SWIPE_MAX_AGE = 60 * 60 * 24 * 365;

/** `anywhere`: a relative swipe on the stage steers. `rail`: only the thumb strip. */
export type SwipePreference = "anywhere" | "rail";

export function parseSwipe(value?: string | null): SwipePreference {
  return value === "rail" ? "rail" : "anywhere";
}

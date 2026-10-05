/** Play listing the review sheet opens. The Android shell hands this host to the Play app. */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.breeq.breeq";

/** First-time story clears between asks. 0 turns the ask off. */
export const REVIEW_EVERY_DEFAULT = 3;
export const REVIEW_EVERY_MAX = 100;

/** Gems paid once, when they take the 5 stars. */
export const REVIEW_GEMS_DEFAULT = 50;
export const REVIEW_GEMS_MAX = 500;

export type ReviewChoice = "LATER" | "OUT" | "RATED" | null;

/**
 * Whether the sheet should open.
 * `clears` counts story chapters cleared once (the tutorial and replays are not in it).
 * `anchor` is that count when they last chose Not now. Rated and never-again stay closed.
 */
export function reviewDue(input: {
  clears: number;
  every: number;
  status: ReviewChoice;
  anchor: number;
}): boolean {
  const every = input.every;
  if (!Number.isFinite(every) || every < 1) return false;
  if (input.status === "OUT" || input.status === "RATED") return false;
  if (input.clears < every) return false;
  if (input.status === "LATER") return input.clears >= input.anchor + every;
  return true;
}

export function reviewStatusLabel(status: ReviewChoice, seen: number): string {
  if (status === "RATED") return "5 stars";
  if (status === "OUT") return "Never";
  if (status === "LATER") return "Not now";
  if (seen > 0) return "Opened";
  return "Not yet";
}

export function reviewEventLabel(kind: "SEEN" | "LATER" | "OUT" | "RATED"): string {
  switch (kind) {
    case "SEEN":
      return "Opened the sheet";
    case "LATER":
      return "Not now";
    case "OUT":
      return "Don't ask again";
    case "RATED":
      return "Gave 5 stars";
  }
}

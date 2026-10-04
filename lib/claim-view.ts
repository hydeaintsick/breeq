/**
 * The victory the claim sheet has to come back to. Google leaves the page;
 * the clear screen is gone unless we keep this until the player returns.
 * Session storage only — it never leaves the phone.
 */

import type { ChapterClearResult } from "@/app/actions/progress";

const VIEW_KEY = "breeq-claim-view";
const LATER_KEY = "breeq-claim-later";
const MAX_AGE_MS = 15 * 60 * 1000;

export type ClaimView = {
  kind: "tutorial" | "story";
  path: string;
  chapterId: string | null;
  title: string;
  score: number;
  stars: 0 | 1 | 2 | 3;
  result: ChapterClearResult;
  hasNext: boolean;
  episodeDone: boolean;
  kicker?: string;
  note?: string;
  nextLabel?: string;
  closeLabel?: string;
  savedAt: number;
};

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function writeClaimView(view: ClaimView) {
  const box = storage();
  if (!box) return;
  try {
    box.setItem(VIEW_KEY, JSON.stringify(view));
  } catch {
    // A full or blocked store just means the return shows the page, not the victory.
  }
}

export function peekClaimView(): ClaimView | null {
  const box = storage();
  if (!box) return null;
  try {
    const raw = box.getItem(VIEW_KEY);
    if (!raw) return null;
    const view = JSON.parse(raw) as ClaimView;
    if (!view || (view.kind !== "tutorial" && view.kind !== "story") || typeof view.path !== "string") {
      box.removeItem(VIEW_KEY);
      return null;
    }
    if (!view.savedAt || Date.now() - view.savedAt > MAX_AGE_MS) {
      box.removeItem(VIEW_KEY);
      return null;
    }
    if (view.path !== window.location.pathname) return view;
    return view;
  } catch {
    return null;
  }
}

export function clearClaimView() {
  try {
    storage()?.removeItem(VIEW_KEY);
  } catch {
    // Already gone.
  }
}

/** "Not now" hides the celebration prompt until this tab closes. Paying still asks. */
export function claimLater() {
  try {
    return storage()?.getItem(LATER_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberClaimLater() {
  try {
    storage()?.setItem(LATER_KEY, "1");
  } catch {
    // The next clear will ask again. That is the safe failure.
  }
}

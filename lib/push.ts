/**
 * Push prompts and the admin send. The App ID is public; the REST key never
 * lives in this file. OneSignal is one app for the site and the Android shell.
 */

export const PUSH_TITLE_MAX = 65;
export const PUSH_BODY_MAX = 180;

/** Where a tap lands. The apex redirects, so the origin is www. */
export const PUSH_ORIGIN = "https://www.breeq.space";
export const PUSH_DEFAULT_PATH = "/game/menu";

const APP_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Public Safari web push id for this OneSignal app. Chrome, Edge, and Firefox
 * subscribe without it; Safari on macOS does not. Not a secret.
 */
export const PUSH_SAFARI_WEB_ID = "web.onesignal.auto.43666e9c-a8ad-4b1e-8de4-10291bcbdb86";

/** The public App ID, or "" when it is missing or not a UUID. */
export function publicPushAppId() {
  const value = (process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? "").trim();
  return APP_ID_RE.test(value) ? value : "";
}

export function isPushAppId(value: string) {
  return APP_ID_RE.test(value.trim());
}

/**
 * A path on Breeq, or an https URL on breeq.space / www.breeq.space.
 * Anything else is refused so a notification cannot open an outside site.
 */
export function normalizePushUrl(input: string): { url: string } | { error: string } {
  const raw = input.trim();
  if (!raw) return { url: `${PUSH_ORIGIN}${PUSH_DEFAULT_PATH}` };
  if (raw.length > 500) return { error: "That link is too long." };

  if (raw.startsWith("/")) {
    if (raw.startsWith("//") || raw.includes("\\") || raw.includes("://") || /\s/.test(raw)) {
      return { error: "Use a page on breeq.space, like /game/story." };
    }
    return { url: `${PUSH_ORIGIN}${raw}` };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { error: "Use a page on breeq.space, like /game/story." };
  }
  if (url.protocol !== "https:") return { error: "Use a page on breeq.space." };
  const host = url.hostname.toLowerCase();
  if (host !== "breeq.space" && host !== "www.breeq.space") {
    return { error: "Use a page on breeq.space." };
  }
  url.protocol = "https:";
  url.hostname = "www.breeq.space";
  return { url: url.toString() };
}

/** Desktop and Android browsers. iPhone Safari only after the site is installed, which we do not ask for. */
export function webPushLikely() {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (ios && !window.matchMedia("(display-mode: standalone)").matches) return false;
  return true;
}

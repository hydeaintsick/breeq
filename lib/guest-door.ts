/**
 * How a request is allowed to become a guest. Pure: no Prisma.
 * The Android app is the `BreeqApp/` token in the user agent — that survives
 * the apex → www redirect, which drops the install header. The header, when
 * it arrives, is what brings the same phone back after a reinstall.
 * A computer uses `?door=` matching `GUEST_PREVIEW_TOKEN`. Anything else
 * stays on the login page. The door cookie resumes a tester; by itself it
 * opens nothing.
 */

import { CONTINUE_PATH, GAME_MENU_PATH } from "@/lib/auth/paths";

export const INSTALL_HEADER = "x-breeq-install";
export const LAUNCH_HEADER = "x-breeq-launch";
export const DOOR_PARAM = "door";
/** Remembers a tester's install key. Ignored unless the door token is on the URL. */
export const DOOR_COOKIE = "breeq-door";
/**
 * Remembers the app guest when the install header did not arrive.
 * Holds the same hash once the header has been seen, so a later cold start
 * without it stays on that player.
 */
export const APP_COOKIE = "breeq-app";
/** Guest id to attach a Google sign-in to, set just before the redirect. */
export const CLAIM_COOKIE = "breeq-claim";
/** Path to come back to after Google. Relative, under /game or /auth. */
export const CLAIM_BACK_COOKIE = "breeq-claim-back";

const INSTALL_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const DOOR_KEY_PATTERN = /^[a-f0-9]{64}$/;
/** Reserved so a guest can have an email without taking the one null slot Mongo's unique index allows. */
const GUEST_EMAIL_DOMAIN = "@guest.breeq.invalid";

export function guestPlaceholderEmail(installKey: string) {
  return `g.${installKey}${GUEST_EMAIL_DOMAIN}`;
}

export function isGuestPlaceholder(email: string | null | undefined) {
  return Boolean(email?.toLowerCase().endsWith(GUEST_EMAIL_DOMAIN));
}

export function installIdOk(raw: string | null | undefined) {
  return typeof raw === "string" && INSTALL_PATTERN.test(raw.trim());
}

export function doorKeyOk(raw: string | null | undefined) {
  return typeof raw === "string" && DOOR_KEY_PATTERN.test(raw);
}

/** Empty or short tokens never match, so a missing env does not open the door. */
export function previewToken() {
  const token = process.env.GUEST_PREVIEW_TOKEN?.trim() ?? "";
  return token.length >= 16 ? token : null;
}

export function doorQueryMatches(value: string | null | undefined) {
  const token = previewToken();
  return Boolean(token && value && value === token);
}

/** The shell's user agent. A normal browser does not carry it. */
export function isBreeqApp(userAgent: string | null | undefined) {
  return Boolean(userAgent?.includes("BreeqApp/"));
}

/** Install header present: the same phone comes back to the same guest after a reinstall. */
export function isAndroidGuest(userAgent: string | null | undefined, install: string | null | undefined) {
  return isBreeqApp(userAgent) && installIdOk(install?.trim());
}

/** Dev rewrites report localhost. Stay on the host the browser actually used. */
export function requestOrigin(headerList: Headers, fallback: string) {
  const raw = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const host = raw?.split(",")[0]?.trim();
  if (!host) return fallback;
  const protoRaw = headerList.get("x-forwarded-proto") ?? (fallback.startsWith("https://") ? "https" : "http");
  const proto = protoRaw.split(",")[0]?.trim() || "https";
  return `${proto}://${host}`;
}

/**
 * breeq.space 308s to www. Sending the guest there makes the WebView follow
 * another hop and drop the session cookie that was just set.
 */
export function canonicalOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol === "https:" && url.hostname === "breeq.space") {
      url.hostname = "www.breeq.space";
    }
    return url.origin;
  } catch {
    return origin;
  }
}

/** A cold start of the menu, not a tap on the dock. */
export function isAppLaunch(userAgent: string | null | undefined, launch: string | null | undefined) {
  return launch === "1" && isBreeqApp(userAgent);
}

/**
 * A full page load. The dock's hop to the menu is a client navigation
 * (`rsc: 1`) and must stay on the menu.
 */
export function isAppDocument(headerList: Headers) {
  if (headerList.get("rsc") === "1") return false;
  if (headerList.get("next-router-prefetch") === "1") return false;
  return headerList.get("sec-fetch-dest") === "document";
}

/**
 * Where a guest (or a returning cold start) should land. Only same-origin
 * game and auth paths. The menu itself means "start the campaign".
 */
export function safeNext(raw: string | null | undefined) {
  if (!raw) return CONTINUE_PATH;
  const path = raw.split("?")[0] ?? "";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.includes("://")) {
    return CONTINUE_PATH;
  }
  if (path.length > 180) return CONTINUE_PATH;
  if (path !== GAME_MENU_PATH && path !== "/game" && !path.startsWith("/game/") && !path.startsWith("/auth/")) {
    return CONTINUE_PATH;
  }
  if (path === GAME_MENU_PATH || path === "/game") return CONTINUE_PATH;
  return path;
}

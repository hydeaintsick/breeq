/**
 * What we keep about how a player arrived and what they play on.
 * Pure: no Prisma, no PostHog. The admin player page and the presence
 * writer both read these shapes.
 */

import { formatAdminWhen } from "@/lib/admin-time";

const UA_MAX = 240;

export type Platform = "android-app" | "android-web" | "ios" | "desktop" | "other";

export type SignupMethod = "password" | "google" | "wallet" | "guest";

export type DeviceSnapshot = {
  country: string | null;
  platform: Platform;
  os: string | null;
  appVersion: string | null;
  /** Marketing or hardware name when the request carried one. */
  model: string | null;
  locale: string | null;
  userAgent: string | null;
};

/** What the browser can add that a request header cannot. */
export type ClientPresence = {
  screen?: string;
  timezone?: string;
  language?: string;
  touch?: boolean;
  /** From User-Agent Client Hints (`navigator.userAgentData`), when the browser has them. */
  model?: string;
};

export type CleanClientPresence = {
  screen: string | null;
  timezone: string | null;
  language: string | null;
  touch: boolean | null;
  model: string | null;
};

const LOCALE = /^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$/;

/** A real ISO country. Vercel sends `XX` when it cannot tell. */
export function countryCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "XX" || code === "T1") return null;
  return code;
}

function localeTag(raw: string | null | undefined): string | null {
  const tag = raw?.split(",")[0]?.split(";")[0]?.trim() ?? "";
  return LOCALE.test(tag) ? tag.slice(0, 35) : null;
}

/**
 * A phone name we are willing to show. Chrome's reduced agent uses the frozen
 * token `K` in place of a model; that is not hardware.
 */
export function cleanModel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const model = raw.replace(/\s+/g, " ").trim().slice(0, 40);
  if (!model || /^(k|unknown|android|linux|generic|mobile)$/i.test(model)) return null;
  if (!/^[\p{L}\p{N} ._+()-]{2,40}$/u.test(model)) return null;
  return model;
}

/**
 * Hardware name from the user agent. The Android shell appends
 * `BreeqDevice/<manufacturer model>`. Older builds and mobile browsers only
 * have whatever Chrome still puts after the Android version, or "iPhone".
 */
export function modelFromUserAgent(ua: string): string | null {
  const tagged = /BreeqDevice\/(.+)$/.exec(ua);
  if (tagged) return cleanModel(tagged[1]);
  const android = /Android [^;)]*;\s*([^;)]+?)(?:\s+Build\/|[;)])/.exec(ua);
  if (android) return cleanModel(android[1]);
  if (/iPad/i.test(ua)) return "iPad";
  if (/iPod/i.test(ua)) return "iPod";
  if (/iPhone/i.test(ua)) return "iPhone";
  return null;
}

/** Platform, OS, app version (`BreeqApp/<name>+<code>`), and model. */
export function parseUserAgent(uaRaw: string): Pick<DeviceSnapshot, "platform" | "os" | "appVersion" | "model" | "userAgent"> {
  const userAgent = uaRaw.replace(/\s+/g, " ").trim().slice(0, UA_MAX) || null;
  const ua = userAgent ?? "";
  const model = modelFromUserAgent(ua);
  const app = /BreeqApp\/([0-9][0-9A-Za-z.+-]{0,20})/.exec(ua);
  if (app) {
    return { platform: "android-app", os: androidOs(ua), appVersion: app[1], model, userAgent };
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const version = /OS (\d+(?:[_.]\d+)*)/.exec(ua);
    return {
      platform: "ios",
      os: version ? `iOS ${version[1].replace(/_/g, ".")}` : "iOS",
      appVersion: null,
      model,
      userAgent,
    };
  }
  if (/Android/i.test(ua)) {
    return { platform: "android-web", os: androidOs(ua), appVersion: null, model, userAgent };
  }
  if (/Mac OS X|Macintosh/i.test(ua)) {
    const version = /Mac OS X (\d+(?:[_.]\d+)*)/.exec(ua);
    return {
      platform: "desktop",
      os: version ? `macOS ${version[1].replace(/_/g, ".")}` : "macOS",
      appVersion: null,
      model,
      userAgent,
    };
  }
  if (/Windows NT/i.test(ua)) return { platform: "desktop", os: "Windows", appVersion: null, model, userAgent };
  if (/CrOS/i.test(ua)) return { platform: "desktop", os: "ChromeOS", appVersion: null, model, userAgent };
  if (/Linux/i.test(ua)) return { platform: "desktop", os: "Linux", appVersion: null, model, userAgent };
  return { platform: "other", os: null, appVersion: null, model, userAgent };
}

function androidOs(ua: string): string {
  const version = /Android (\d+(?:\.\d+)?)/.exec(ua);
  return version ? `Android ${version[1]}` : "Android";
}

/** Country, locale, and device from the incoming request. */
export function snapshotFromHeaders(headerStore: Headers): DeviceSnapshot {
  return {
    country: countryCode(headerStore.get("x-vercel-ip-country") ?? headerStore.get("cf-ipcountry")),
    locale: localeTag(headerStore.get("accept-language")),
    ...parseUserAgent(headerStore.get("user-agent") ?? ""),
  };
}

/** Drop anything that is not a screen size, an IANA zone, or a language tag. */
export function cleanClientPresence(input: ClientPresence): CleanClientPresence {
  let screen: string | null = null;
  if (typeof input.screen === "string" && /^\d{3,5}x\d{3,5}$/.test(input.screen)) {
    const [width, height] = input.screen.split("x").map(Number);
    if (width >= 200 && height >= 200 && width <= 8000 && height <= 8000) screen = input.screen;
  }
  const timezone =
    typeof input.timezone === "string" && /^[A-Za-z0-9_+-]{1,32}(?:\/[A-Za-z0-9_+-]{1,32}){0,2}$/.test(input.timezone)
      ? input.timezone
      : null;
  const language = localeTag(typeof input.language === "string" ? input.language : null);
  const touch = typeof input.touch === "boolean" ? input.touch : null;
  const model = cleanModel(typeof input.model === "string" ? input.model : null);
  return { screen, timezone, language, touch, model };
}

/** `1.0.1+4` from the shell becomes `1.0.1 (4)`. Older builds stored the name alone. */
export function formatAppVersion(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const tagged = /^(\d+(?:\.\d+){0,2})\+(\d+)$/.exec(raw);
  return tagged ? `${tagged[1]} (${tagged[2]})` : raw;
}

/** What the players table shows: Android app and its version, or Web, plus the phone when we know it. */
export function supportLine(input: {
  platform: string | null | undefined;
  appVersion: string | null | undefined;
  model: string | null | undefined;
}): { channel: string; model: string | null } {
  if (!input.platform) return { channel: "—", model: null };
  const model = input.model ?? (input.platform === "desktop" ? "Desktop" : null);
  if (input.platform === "android-app") {
    const version = formatAppVersion(input.appVersion);
    return { channel: version ? `Android app ${version}` : "Android app", model };
  }
  return { channel: "Web", model };
}

export function platformLabel(platform: string | null | undefined): string {
  switch (platform) {
    case "android-app":
      return "Android app";
    case "android-web":
      return "Android browser";
    case "ios":
      return "iPhone or iPad";
    case "desktop":
      return "Desktop";
    case "other":
      return "Other";
    default:
      return "Unknown";
  }
}

export function signupMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "password":
      return "Email and password";
    case "google":
      return "Google";
    case "wallet":
      return "Wallet";
    case "guest":
      return "Guest";
    default:
      return "—";
  }
}

export function countryName(code: string | null | undefined): string {
  if (!code) return "Unknown";
  try {
    return new Intl.DisplayNames("en-US", { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Regional-indicator flag for an ISO code. Empty when the code is not one. */
export function countryFlag(code: string | null | undefined): string {
  if (!code || !/^[A-Z]{2}$/.test(code)) return "";
  return [...code].map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join("");
}

/** "France (FR)", or "Unknown" when the edge had no country. */
export function countryLabel(code: string | null | undefined): string {
  if (!code) return "Unknown";
  const name = countryName(code);
  return name === code ? code : `${name} (${code})`;
}

/** `2h 05m`, `14m 02s`, or `45s`. */
export function formatPlayTime(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(secs).padStart(2, "0")}s`;
  return `${secs}s`;
}

export function formatWhen(value: Date | null | undefined): string {
  return formatAdminWhen(value);
}

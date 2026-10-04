/**
 * What we keep about how a player arrived and what they play on.
 * Pure: no Prisma, no PostHog. The admin player page and the presence
 * writer both read these shapes.
 */

const UA_MAX = 240;

export type Platform = "android-app" | "android-web" | "ios" | "desktop" | "other";

export type SignupMethod = "password" | "google" | "wallet";

export type DeviceSnapshot = {
  country: string | null;
  platform: Platform;
  os: string | null;
  appVersion: string | null;
  locale: string | null;
  userAgent: string | null;
};

/** What the browser can add that a request header cannot. */
export type ClientPresence = {
  screen?: string;
  timezone?: string;
  language?: string;
  touch?: boolean;
};

export type CleanClientPresence = {
  screen: string | null;
  timezone: string | null;
  language: string | null;
  touch: boolean | null;
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

/** Platform, OS, and the Android app version baked into `BreeqApp/<version>`. */
export function parseUserAgent(uaRaw: string): Pick<DeviceSnapshot, "platform" | "os" | "appVersion" | "userAgent"> {
  const userAgent = uaRaw.replace(/\s+/g, " ").trim().slice(0, UA_MAX) || null;
  const ua = userAgent ?? "";
  const app = /BreeqApp\/([0-9][0-9A-Za-z.+-]{0,20})/.exec(ua);
  if (app) {
    return { platform: "android-app", os: androidOs(ua), appVersion: app[1], userAgent };
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const version = /OS (\d+(?:[_.]\d+)*)/.exec(ua);
    return {
      platform: "ios",
      os: version ? `iOS ${version[1].replace(/_/g, ".")}` : "iOS",
      appVersion: null,
      userAgent,
    };
  }
  if (/Android/i.test(ua)) {
    return { platform: "android-web", os: androidOs(ua), appVersion: null, userAgent };
  }
  if (/Mac OS X|Macintosh/i.test(ua)) {
    const version = /Mac OS X (\d+(?:[_.]\d+)*)/.exec(ua);
    return {
      platform: "desktop",
      os: version ? `macOS ${version[1].replace(/_/g, ".")}` : "macOS",
      appVersion: null,
      userAgent,
    };
  }
  if (/Windows NT/i.test(ua)) return { platform: "desktop", os: "Windows", appVersion: null, userAgent };
  if (/CrOS/i.test(ua)) return { platform: "desktop", os: "ChromeOS", appVersion: null, userAgent };
  if (/Linux/i.test(ua)) return { platform: "desktop", os: "Linux", appVersion: null, userAgent };
  return { platform: "other", os: null, appVersion: null, userAgent };
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
  return { screen, timezone, language, touch };
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
  if (!value) return "—";
  return value.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

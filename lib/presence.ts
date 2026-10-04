import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  cleanClientPresence,
  snapshotFromHeaders,
  type ClientPresence,
  type SignupMethod,
} from "@/lib/acquisition";
import { capturePlayer } from "@/lib/posthog";

/** A beat longer than this is cut down. The client flushes about every 30s. */
const MAX_BEAT_SECONDS = 90;
/** How long after sign-up the screen and time zone still count as the signup device. */
const SIGNUP_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Skip a last-seen write when nothing about the device changed. */
const SEEN_THROTTLE_MS = 5 * 60 * 1000;

export type PlayerProfile = {
  country: string | null;
  platform: string | null;
  os: string | null;
  appVersion: string | null;
  locale: string | null;
  screen: string | null;
  timezone: string | null;
  playSeconds: number;
};

type SeenRow = {
  createdAt: Date;
  signupAt: Date | null;
  signupScreen: string | null;
  signupTimezone: string | null;
  lastSeenAt: Date | null;
  lastCountry: string | null;
  lastPlatform: string | null;
  lastOs: string | null;
  lastAppVersion: string | null;
  lastLocale: string | null;
  lastUserAgent: string | null;
  lastScreen: string | null;
  lastTimezone: string | null;
  lastTouch: boolean | null;
  playSeconds: number;
  username: string | null;
  email: string | null;
};

const seenSelect = {
  createdAt: true,
  signupAt: true,
  signupScreen: true,
  signupTimezone: true,
  lastSeenAt: true,
  lastCountry: true,
  lastPlatform: true,
  lastOs: true,
  lastAppVersion: true,
  lastLocale: true,
  lastUserAgent: true,
  lastScreen: true,
  lastTimezone: true,
  lastTouch: true,
  playSeconds: true,
  username: true,
  email: true,
} as const;

function profileOf(row: SeenRow): PlayerProfile {
  return {
    country: row.lastCountry,
    platform: row.lastPlatform,
    os: row.lastOs,
    appVersion: row.lastAppVersion,
    locale: row.lastLocale,
    screen: row.lastScreen,
    timezone: row.lastTimezone,
    playSeconds: row.playSeconds ?? 0,
  };
}

function personProps(row: Pick<SeenRow, "username" | "email" | "playSeconds">, profile: PlayerProfile) {
  return {
    username: row.username,
    email: row.email,
    country: profile.country,
    platform: profile.platform,
    os: profile.os,
    app_version: profile.appVersion,
    locale: profile.locale,
    screen: profile.screen,
    timezone: profile.timezone,
    play_seconds: profile.playSeconds,
  };
}

/**
 * Write the device, country, and Android app version once, at account
 * creation. Called from all three doors (password, Google, wallet). A second
 * call does not overwrite the first snapshot. Never throws: sign-up must not
 * fail because analytics did.
 */
export async function stampSignup(userId: string, method: SignupMethod): Promise<void> {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { signupAt: true, username: true, email: true, playSeconds: true },
    });
    if (!existing || existing.signupAt) return;

    const snap = snapshotFromHeaders(await headers());
    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        signupAt: now,
        signupMethod: method,
        signupCountry: snap.country,
        signupPlatform: snap.platform,
        signupOs: snap.os,
        signupAppVersion: snap.appVersion,
        signupLocale: snap.locale,
        signupUserAgent: snap.userAgent,
        lastSeenAt: now,
        lastCountry: snap.country,
        lastPlatform: snap.platform,
        lastOs: snap.os,
        lastAppVersion: snap.appVersion,
        lastLocale: snap.locale,
        lastUserAgent: snap.userAgent,
      },
    });
    await capturePlayer(
      userId,
      "signed_up",
      {
        method,
        country: snap.country,
        platform: snap.platform,
        os: snap.os,
        app_version: snap.appVersion,
        locale: snap.locale,
      },
      {
        username: existing.username,
        email: existing.email,
        signup_method: method,
        country: snap.country,
        platform: snap.platform,
        os: snap.os,
        app_version: snap.appVersion,
        locale: snap.locale,
        play_seconds: existing.playSeconds ?? 0,
      },
    );
  } catch (error) {
    console.error("stampSignup failed", error);
  }
}

/**
 * Refresh the latest device. The screen and time zone ride along from the
 * browser; country and app version come from this request. The signup screen
 * is filled once, if this lands within a day of sign-up.
 */
export async function touchPresence(userId: string, input: ClientPresence): Promise<PlayerProfile> {
  const row = await prisma.user.findUnique({ where: { id: userId }, select: seenSelect });
  if (!row) {
    return {
      country: null,
      platform: null,
      os: null,
      appVersion: null,
      locale: null,
      screen: null,
      timezone: null,
      playSeconds: 0,
    };
  }

  const snap = snapshotFromHeaders(await headers());
  const client = cleanClientPresence(input);
  const now = new Date();
  const locale = client.language ?? snap.locale;
  const screen = client.screen ?? row.lastScreen;
  const timezone = client.timezone ?? row.lastTimezone;
  const signupFresh = row.signupAt !== null && now.getTime() - row.signupAt.getTime() < SIGNUP_WINDOW_MS;
  // The auth callback sometimes cannot see the request. If the account is still new
  // and has no signup snapshot, this first game load is close enough to count.
  const backfillSignup = row.signupAt === null && now.getTime() - row.createdAt.getTime() < SIGNUP_WINDOW_MS;
  const fillScreen = Boolean((signupFresh || backfillSignup) && !row.signupScreen && client.screen);
  const fillZone = Boolean((signupFresh || backfillSignup) && !row.signupTimezone && client.timezone);
  const unchanged =
    row.lastCountry === (snap.country ?? row.lastCountry) &&
    row.lastPlatform === snap.platform &&
    row.lastAppVersion === snap.appVersion &&
    row.lastLocale === locale &&
    row.lastScreen === screen &&
    row.lastTimezone === timezone &&
    row.lastTouch === (client.touch ?? row.lastTouch);
  const recent = row.lastSeenAt !== null && now.getTime() - row.lastSeenAt.getTime() < SEEN_THROTTLE_MS;
  if (unchanged && recent && !fillScreen && !fillZone && !backfillSignup) return profileOf(row);

  const next: SeenRow = {
    ...row,
    lastSeenAt: now,
    lastCountry: snap.country ?? row.lastCountry,
    lastPlatform: snap.platform,
    lastOs: snap.os,
    lastAppVersion: snap.appVersion,
    lastLocale: locale,
    lastUserAgent: snap.userAgent,
    lastScreen: screen,
    lastTimezone: timezone,
    lastTouch: client.touch ?? row.lastTouch,
    signupScreen: fillScreen ? client.screen : row.signupScreen,
    signupTimezone: fillZone ? client.timezone : row.signupTimezone,
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastSeenAt: next.lastSeenAt,
      lastCountry: next.lastCountry,
      lastPlatform: next.lastPlatform,
      lastOs: next.lastOs,
      lastAppVersion: next.lastAppVersion,
      lastLocale: next.lastLocale,
      lastUserAgent: next.lastUserAgent,
      lastScreen: next.lastScreen,
      lastTimezone: next.lastTimezone,
      lastTouch: next.lastTouch,
      ...(fillScreen ? { signupScreen: client.screen } : {}),
      ...(fillZone ? { signupTimezone: client.timezone } : {}),
      ...(backfillSignup
        ? {
            signupAt: now,
            signupCountry: snap.country,
            signupPlatform: snap.platform,
            signupOs: snap.os,
            signupAppVersion: snap.appVersion,
            signupLocale: locale,
            signupUserAgent: snap.userAgent,
          }
        : {}),
    },
  });

  const profile = profileOf(next);
  await capturePlayer(
    userId,
    backfillSignup ? "signed_up" : "player_seen",
    {
      platform: profile.platform,
      os: profile.os,
      app_version: profile.appVersion,
      country: profile.country,
      locale: profile.locale,
    },
    personProps(row, profile),
  );
  return profile;
}

/**
 * Add seconds the board was actually running. Each call is capped, and cannot
 * grow faster than wall clock since the previous beat, so a client cannot
 * invent hours. Old accounts have no `playSeconds` key; Mongo skips `$inc` on
 * a missing field, so that key is set to 0 first.
 */
export async function addPlayTime(userId: string, seconds: number): Promise<number> {
  const asked = Math.round(Number(seconds));
  if (!Number.isFinite(asked) || asked <= 0) return 0;
  const beat = Math.min(MAX_BEAT_SECONDS, asked);

  await prisma.$runCommandRaw({
    update: "User",
    updates: [{ q: { _id: { $oid: userId }, playSeconds: null }, u: { $set: { playSeconds: 0 } } }],
  });

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { playSeconds: true, lastPlayAt: true, username: true, email: true },
  });
  if (!row) return 0;

  const now = new Date();
  let credit = beat;
  if (row.lastPlayAt) {
    const elapsed = (now.getTime() - row.lastPlayAt.getTime()) / 1000;
    credit = Math.max(0, Math.min(beat, Math.floor(elapsed + 2)));
  }
  if (credit <= 0) return row.playSeconds ?? 0;

  if (row.lastPlayAt) {
    const updated = await prisma.user.updateMany({
      where: { id: userId, lastPlayAt: row.lastPlayAt },
      data: { playSeconds: { increment: credit }, lastPlayAt: now },
    });
    if (updated.count === 0) return row.playSeconds ?? 0;
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { playSeconds: { increment: credit }, lastPlayAt: now },
    });
  }

  const total = (row.playSeconds ?? 0) + credit;
  await capturePlayer(
    userId,
    "play_time",
    { seconds: credit },
    { username: row.username, email: row.email, play_seconds: total },
  );
  return total;
}

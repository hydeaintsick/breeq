"use client";

import { useEffect } from "react";
import { reportPresence } from "@/app/actions/presence";
import { identifyPlayer } from "@/components/analytics";

type UaData = {
  getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string }>;
};

/**
 * Chromium (including the Android WebView) can name the phone. Safari and
 * desktop Chrome usually cannot; the user agent covers those.
 */
async function readDeviceModel(): Promise<string | undefined> {
  const data = (navigator as Navigator & { userAgentData?: UaData }).userAgentData;
  if (!data?.getHighEntropyValues) return undefined;
  try {
    const hint = await data.getHighEntropyValues(["model"]);
    const model = hint.model?.trim();
    return model || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Once per game-layout load: tell the server the screen, language, time zone,
 * touch, and phone model, then put that on the PostHog person. Country, OS,
 * and the Android app version are read from the request itself.
 */
export function PlayerBeacon({ userId, username }: { userId: string; username: string | null }) {
  useEffect(() => {
    let gone = false;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    void (async () => {
      const model = await readDeviceModel();
      if (gone) return;
      try {
        const profile = await reportPresence({
          screen: `${Math.round(window.screen.width)}x${Math.round(window.screen.height)}`,
          timezone,
          language: navigator.language,
          touch: navigator.maxTouchPoints > 0,
          ...(model ? { model } : {}),
        });
        identifyPlayer(userId, {
          username,
          country: profile.country,
          platform: profile.platform,
          os: profile.os,
          app_version: profile.appVersion,
          device_model: profile.model,
          locale: profile.locale,
          screen: profile.screen,
          timezone: profile.timezone,
          play_seconds: profile.playSeconds,
        });
      } catch {
        identifyPlayer(userId, { username });
      }
    })();
    return () => {
      gone = true;
    };
  }, [userId, username]);

  return null;
}

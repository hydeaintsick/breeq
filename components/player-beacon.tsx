"use client";

import { useEffect } from "react";
import { reportPresence } from "@/app/actions/presence";
import { identifyPlayer } from "@/components/analytics";

/**
 * Once per game-layout load: tell the server the screen, language, time zone,
 * and whether this is a touch device, then put that on the PostHog person.
 * Country, OS, and the Android app version are read from the request itself.
 */
export function PlayerBeacon({ userId, username }: { userId: string; username: string | null }) {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    void reportPresence({
      screen: `${Math.round(window.screen.width)}x${Math.round(window.screen.height)}`,
      timezone,
      language: navigator.language,
      touch: navigator.maxTouchPoints > 0,
    })
      .then((profile) => {
        identifyPlayer(userId, {
          username,
          country: profile.country,
          platform: profile.platform,
          os: profile.os,
          app_version: profile.appVersion,
          locale: profile.locale,
          screen: profile.screen,
          timezone: profile.timezone,
          play_seconds: profile.playSeconds,
        });
      })
      .catch(() => {
        identifyPlayer(userId, { username });
      });
  }, [userId, username]);

  return null;
}

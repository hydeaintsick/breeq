"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { HapticsProvider } from "@/components/haptics-provider";
import { SoundProvider } from "@/components/sound-provider";
import { SwipeProvider } from "@/components/swipe-provider";
import { ThemeProvider } from "@/components/theme-provider";
import type { HapticsPreference } from "@/lib/haptics";
import type { SoundPreference } from "@/lib/sound";
import type { SwipePreference } from "@/lib/swipe";
import type { Theme } from "@/lib/theme";

export function Providers({
  children,
  session,
  theme,
  sound,
  haptics,
  swipe,
}: {
  children: React.ReactNode;
  session: Session | null;
  theme: Theme;
  sound: SoundPreference;
  haptics: HapticsPreference;
  swipe: SwipePreference;
}) {
  return (
    <ThemeProvider theme={theme}>
      <SoundProvider sound={sound}>
        <HapticsProvider haptics={haptics}>
          <SwipeProvider swipe={swipe}>
            <SessionProvider session={session}>{children}</SessionProvider>
          </SwipeProvider>
        </HapticsProvider>
      </SoundProvider>
    </ThemeProvider>
  );
}

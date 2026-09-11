import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/auth";
import { AppChrome } from "@/components/app-chrome";
import { Providers } from "@/components/providers";
import { HAPTICS_COOKIE, parseHaptics } from "@/lib/haptics";
import { parseSound, SOUND_COOKIE } from "@/lib/sound";
import { parseSwipe, SWIPE_COOKIE } from "@/lib/swipe";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Breeq",
    template: "%s · Breeq",
  },
  description:
    "A brick breaker built by players, for players. Design a wall over your own photo, place bonus zones, and dare everyone else to clear it.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const jar = await cookies();
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);
  const sound = parseSound(jar.get(SOUND_COOKIE)?.value);
  const haptics = parseHaptics(jar.get(HAPTICS_COOKIE)?.value);
  const swipe = parseSwipe(jar.get(SWIPE_COOKIE)?.value);

  return (
    <html
      lang="en"
      data-theme={theme}
      data-authed={session ? "true" : undefined}
      style={{ colorScheme: theme }}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <Providers session={session} theme={theme} sound={sound} haptics={haptics} swipe={swipe}>
          <Suspense fallback={null}>
            <AppChrome>{children}</AppChrome>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}

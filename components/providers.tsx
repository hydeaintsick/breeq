"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ThemeProvider } from "@/components/theme-provider";
import type { Theme } from "@/lib/theme";

export function Providers({
  children,
  session,
  theme,
}: {
  children: React.ReactNode;
  session: Session | null;
  theme: Theme;
}) {
  return (
    <ThemeProvider theme={theme}>
      <SessionProvider session={session}>{children}</SessionProvider>
    </ThemeProvider>
  );
}

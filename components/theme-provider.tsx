"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { THEME_COOKIE, THEME_MAX_AGE, type Theme } from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function writeThemeCookie(theme: Theme) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${THEME_MAX_AGE}; SameSite=Lax${secure}`;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  writeThemeCookie(theme);
}

export function ThemeProvider({
  theme: initialTheme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

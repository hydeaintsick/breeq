"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const night = theme === "dark";

  return (
    <button
      type="button"
      className="header-chip"
      aria-pressed={night}
      aria-label={night ? "Use day mode" : "Use night mode"}
      onClick={toggle}
    >
      <span className="sr-only">
        {night ? "Use day mode" : "Use night mode"}
      </span>
      {night ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M13.2 10.1A5.6 5.6 0 0 1 6 2.8 5.7 5.7 0 1 0 13.2 10.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.6v1.4M8 13v1.4M1.6 8h1.4M13 8h1.4M3.2 3.2l1 1M11.8 11.8l1 1M12.8 3.2l-1 1M4.2 11.8l-1 1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

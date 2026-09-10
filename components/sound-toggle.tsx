"use client";

import { useSound } from "@/components/sound-provider";

/**
 * Sound on/off. `chip` is the 44px header button next to the theme toggle;
 * `row` is a full-width glass button for the pause menu.
 */
export function SoundToggle({ variant = "chip" }: { variant?: "chip" | "row" }) {
  const { enabled, toggle } = useSound();
  const label = enabled ? "Turn sound off" : "Turn sound on";

  if (variant === "row") {
    return (
      <button
        type="button"
        className="btn-glass min-h-11 w-full"
        aria-pressed={enabled}
        aria-label={label}
        onClick={toggle}
      >
        {enabled ? <SoundOnIcon /> : <SoundOffIcon />}
        {enabled ? "Sound on" : "Sound off"}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="header-chip"
      aria-pressed={enabled}
      aria-label={label}
      onClick={toggle}
    >
      <span className="sr-only">{label}</span>
      {enabled ? <SoundOnIcon /> : <SoundOffIcon />}
    </button>
  );
}

function SoundOnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M2.6 6.1h2.2L8 3.4v9.2L4.8 9.9H2.6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M10.3 5.7a3.3 3.3 0 0 1 0 4.6M12.3 3.9a5.9 5.9 0 0 1 0 8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M2.6 6.1h2.2L8 3.4v9.2L4.8 9.9H2.6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M10.4 6.4l3.2 3.2M13.6 6.4l-3.2 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

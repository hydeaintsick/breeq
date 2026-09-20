"use client";

import { useSound } from "@/components/sound-provider";

/**
 * Sound on/off. `chip` is the 44px header button; `row` is a full-width glass
 * button for the pause menu and the settings; `menu` is a text row for the
 * header dropdown, where the chip has no room on the narrowest phones.
 */
export function SoundToggle({ variant = "chip" }: { variant?: "chip" | "row" | "menu" }) {
  const { enabled, toggle } = useSound();
  const label = enabled ? "Turn sound off" : "Turn sound on";

  if (variant === "menu") {
    // A switch named by its visible label; the state is `aria-checked`, the
    // "On / Off" text only repeats it for sighted players.
    return (
      <button
        type="button"
        role="switch"
        className="nav-link flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left"
        aria-checked={enabled}
        onClick={toggle}
      >
        <span className="flex items-center gap-2.5">
          {enabled ? <SoundOnIcon /> : <SoundOffIcon />}
          Sound
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.12em]" aria-hidden="true">
          {enabled ? "On" : "Off"}
        </span>
      </button>
    );
  }

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

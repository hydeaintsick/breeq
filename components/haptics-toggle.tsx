"use client";

import { useHaptics } from "@/components/haptics-provider";

/**
 * Vibration on/off. Renders nothing where the device cannot vibrate (iOS,
 * desktop), so the player never sees a switch that does nothing.
 * `row` is a full-width glass button for the pause menu; `menu` is a text row
 * for the header dropdown.
 */
export function HapticsToggle({ variant = "row" }: { variant?: "row" | "menu" }) {
  const { enabled, supported, toggle } = useHaptics();
  if (!supported) return null;
  const label = enabled ? "Turn vibration off" : "Turn vibration on";

  if (variant === "menu") {
    return (
      <button
        type="button"
        className="nav-link flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-left"
        aria-pressed={enabled}
        aria-label={label}
        onClick={toggle}
      >
        <span>Vibration</span>
        <span className="text-xs font-medium uppercase tracking-[0.12em]">{enabled ? "On" : "Off"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn-glass min-h-11 w-full"
      aria-pressed={enabled}
      aria-label={label}
      onClick={toggle}
    >
      <VibrationIcon off={!enabled} />
      {enabled ? "Vibration on" : "Vibration off"}
    </button>
  );
}

function VibrationIcon({ off }: { off: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="5.2"
        y="2.6"
        width="5.6"
        height="10.8"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {off ? (
        <path d="M2.2 13.8L13.8 2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      ) : (
        <path
          d="M2.6 5.6v4.8M13.4 5.6v4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

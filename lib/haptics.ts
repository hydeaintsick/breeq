export const HAPTICS_COOKIE = "breeq-haptics";
export const HAPTICS_MAX_AGE = 60 * 60 * 24 * 365;

export type HapticsPreference = "on" | "off";

export function parseHaptics(value?: string | null): HapticsPreference {
  return value === "off" ? "off" : "on";
}

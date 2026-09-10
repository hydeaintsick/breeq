export const SOUND_COOKIE = "breeq-sound";
export const SOUND_MAX_AGE = 60 * 60 * 24 * 365;

export type SoundPreference = "on" | "off";

export function parseSound(value?: string | null): SoundPreference {
  return value === "off" ? "off" : "on";
}

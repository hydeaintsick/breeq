/** Longest story beat a chapter may carry: one or two sentences on a phone screen. */
export const CHAPTER_INTRO_MAX = 240;

/** Collapse whitespace; an empty result means "no story text". */
export function normalizeIntro(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

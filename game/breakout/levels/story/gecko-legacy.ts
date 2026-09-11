/**
 * Episode 1 — Gecko Legacy is hand-made in the admin editor; its walls live
 * only in the database. The story copy for it lives here so the opener speaks
 * in the same voice as the seeded episodes. The seed writes these lines only
 * where the chapter has no text yet: an edit in the editor always wins.
 */
export const GECKO_LEGACY_COPY = {
  slug: "gecko-legacy",
  tagline: "Kal wakes up on a world that is not his own.",
  chapters: {
    "a-light-behind-the-window":
      "Something glows behind the glass of the pod. Kal does what every gecko does first: he climbs toward it.",
    "chasing-the-light":
      "The light moves along the wall. Kal follows it, and the wall gives way under his feet.",
    "a-lizard-is-born":
      "Grey dust, thin air, a sky he does not know. Kal is out of the shell, and he is alone.",
    "crispy-party":
      "Bugs crackle around the pod's beacon, drawn by the same light. Kal eats. Tomorrow, he leaves.",
  },
} as const;

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { TUTORIAL_PIECES } from "@/lib/discoveries";

/**
 * Piece ids the story has already explained to this player. A finished
 * tutorial counts for the pieces it teaches by hand, so the first episode does
 * not stop the player on a glass brick again.
 */
export const getDiscoveries = cache(async function getDiscoveries(userId: string): Promise<string[]> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { discoveries: true, tutorialDoneAt: true },
  });
  const known = new Set<string>(row?.discoveries ?? []);
  if (row?.tutorialDoneAt) {
    for (const id of TUTORIAL_PIECES) known.add(id);
  }
  return [...known];
});

"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { LESSON_IDS } from "@/lib/discoveries";

/**
 * The story just explained these pieces to the player. Saved once; the run
 * never stops on them again, on any device. Unknown ids are ignored.
 */
export async function markDiscovered(ids: string[]): Promise<{ discoveries: string[] }> {
  const user = await requireUser();
  const wanted = ids.filter((id) => LESSON_IDS.has(id));
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { discoveries: true },
  });
  const known = new Set(row?.discoveries ?? []);
  const fresh = wanted.filter((id) => !known.has(id));
  if (fresh.length === 0) {
    return { discoveries: [...known] };
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { discoveries: { push: fresh } },
    select: { discoveries: true },
  });
  return { discoveries: updated.discoveries };
}

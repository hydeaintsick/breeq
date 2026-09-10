"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { progressFromXp, XP_PER_STORY_CLEAR } from "@/lib/progress";

export async function awardStoryClear() {
  const user = await requireUser();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { xp: { increment: XP_PER_STORY_CLEAR } },
    select: { xp: true },
  });

  return progressFromXp(updated.xp);
}

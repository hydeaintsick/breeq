"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ADMIN_DASHBOARD_PATH, GAME_ROOT_PATH } from "@/lib/auth/paths";
import { SITE_SETTINGS_ID } from "@/lib/tutorial";

/** Admin: open or close Earn for everyone. */
export async function setEarnEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
  await requireAdmin();
  const row = await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, earnEnabled: enabled },
    update: { earnEnabled: enabled },
    select: { earnEnabled: true },
  });
  revalidatePath(ADMIN_DASHBOARD_PATH);
  revalidatePath(GAME_ROOT_PATH, "layout");
  return { enabled: row.earnEnabled };
}

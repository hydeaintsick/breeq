"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { ADMIN_NOTIFICATIONS_PATH, GAME_ROOT_PATH } from "@/lib/auth/paths";
import { sendOneSignalPush } from "@/lib/onesignal";
import { normalizePushUrl, PUSH_BODY_MAX, PUSH_TITLE_MAX } from "@/lib/push";

/** Remember the answer so the sheet does not ask again. Account can still change it. */
export async function recordPushChoice(optIn: boolean): Promise<{ optIn: boolean }> {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { pushPromptedAt: new Date(), pushOptIn: optIn },
  });
  revalidatePath(GAME_ROOT_PATH, "layout");
  return { optIn };
}

export async function sendPushNotification(input: {
  title: string;
  body: string;
  url: string;
}): Promise<{ error: string } | { sent: true; recipients: number | null }> {
  const admin = await requireAdmin();
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || title.length > PUSH_TITLE_MAX) {
    return { error: `Write a title, up to ${PUSH_TITLE_MAX} characters.` };
  }
  if (!body || body.length > PUSH_BODY_MAX) {
    return { error: `Write a message, up to ${PUSH_BODY_MAX} characters.` };
  }
  const target = normalizePushUrl(input.url);
  if ("error" in target) return { error: target.error };

  const author =
    admin.username ||
    admin.name ||
    "Admin";
  const result = await sendOneSignalPush({ title, body, url: target.url });
  await prisma.pushMessage.create({
    data: {
      title,
      body,
      url: target.url,
      author,
      onesignalId: "id" in result ? result.id : null,
      recipients: "id" in result ? result.recipients : null,
      error: "error" in result ? result.error : null,
    },
  });
  revalidatePath(ADMIN_NOTIFICATIONS_PATH);
  if ("error" in result) return { error: result.error };
  return { sent: true, recipients: result.recipients };
}

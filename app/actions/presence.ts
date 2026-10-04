"use server";

import { requireUser } from "@/lib/auth/session";
import type { ClientPresence } from "@/lib/acquisition";
import { addPlayTime, touchPresence, type PlayerProfile } from "@/lib/presence";

/** The game layout reports the screen, language, and time zone once it is open. */
export async function reportPresence(input: ClientPresence): Promise<PlayerProfile> {
  const user = await requireUser();
  return touchPresence(user.id, input ?? {});
}

/** A live board hands in the seconds it just ran. The server caps the beat. */
export async function recordPlayTime(seconds: number): Promise<void> {
  const user = await requireUser();
  await addPlayTime(user.id, seconds);
}

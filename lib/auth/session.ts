import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  GAME_MENU_PATH,
  LOGIN_PATH,
} from "@/lib/auth/paths";

export const getSession = cache(async () => auth());

export async function requireUser() {
  const session = await getSession();

  if (!session?.user) {
    redirect(LOGIN_PATH);
  }

  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect(GAME_MENU_PATH);
  }

  return user;
}

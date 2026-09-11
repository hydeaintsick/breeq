export type Role = "PLAYER" | "ADMIN";

export const AFTER_AUTH_PATH = "/auth/continue";
export const GAME_MENU_PATH = "/game/menu";
export const STORY_PATH = "/game/story";
export const TUTORIAL_PATH = "/game/tutorial";
export const EARN_PATH = "/game/earn";
export const ACCOUNT_PATH = "/game/account";
export const ADMIN_DASHBOARD_PATH = "/admin/dashboard";
export const ADMIN_EDITOR_PATH = "/admin/editor";
export const LOGIN_PATH = "/login";

export function storyEpisodePath(slug: string) {
  return `${STORY_PATH}/${slug}`;
}

export function homePath(role: Role | string | undefined) {
  return role === "ADMIN" ? ADMIN_DASHBOARD_PATH : GAME_MENU_PATH;
}

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  const list = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return list.includes(email.toLowerCase());
}

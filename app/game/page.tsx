import { redirect } from "next/navigation";
import { GAME_MENU_PATH } from "@/lib/auth/paths";

/** `/game` is the Play tab: it lands on the game menu. */
export default function GamePage() {
  redirect(GAME_MENU_PATH);
}

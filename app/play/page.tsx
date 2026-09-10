import { redirect } from "next/navigation";
import { GAME_MENU_PATH } from "@/lib/auth/paths";

export default function PlayPage() {
  redirect(GAME_MENU_PATH);
}

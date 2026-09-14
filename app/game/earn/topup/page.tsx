import { redirect } from "next/navigation";
import { EARN_PATH } from "@/lib/auth/paths";

/**
 * The shop is a sheet over the game now, not a page. Old links and Checkout
 * sessions created before the change still land here: hand them to the store,
 * where the sheet opens by itself and claims the session.
 */
export default async function TopUpPage({ searchParams }: PageProps<"/game/earn/topup">) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const session = Array.isArray(params.session_id) ? params.session_id[0] : params.session_id;
  if (session) query.set("session_id", session);
  if (params.canceled === "1" || params.checkout === "canceled") query.set("checkout", "canceled");
  const qs = query.toString();
  redirect(qs ? `${EARN_PATH}?${qs}` : EARN_PATH);
}

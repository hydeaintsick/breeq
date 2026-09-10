import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { homePath, LOGIN_PATH } from "@/lib/auth/paths";

export default async function AuthContinuePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect(LOGIN_PATH);
  }

  redirect(homePath(session.user.role));
}

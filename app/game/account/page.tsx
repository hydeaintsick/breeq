import type { Metadata } from "next";
import { AccountForm } from "@/components/account-form";
import { PlaySettings } from "@/components/play-settings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account",
  description: "Your Breeq account and play controls.",
};

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      username: true,
      email: true,
      walletAddress: true,
      name: true,
      passwordHash: true,
      passwordSetAt: true,
      updatedAt: true,
      accounts: { select: { provider: true } },
    },
  });

  const username = user?.username ?? sessionUser.username ?? sessionUser.name ?? "Player";
  const providers = new Set(user?.accounts.map((account) => account.provider));
  const hasPassword = Boolean(user?.passwordHash);
  const methods = [
    hasPassword ? "Password" : null,
    user?.walletAddress || providers.has("metamask") ? "MetaMask" : null,
    providers.has("google") ? "Google" : null,
  ].filter((value): value is string => Boolean(value));
  const passwordSetAt =
    user?.passwordSetAt?.toISOString() ??
    (user && hasPassword ? user.updatedAt.toISOString() : null);

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-xl flex-col justify-center px-6 pb-20 pt-28">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Account
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">
        Settings
      </h1>
      <p className="mt-4 text-base leading-7 text-ink-muted">
        How you show up on the shelf, and how the paddle follows your finger. Sign out lives in the menu.
      </p>

      <AccountForm
        username={username}
        email={user?.email ?? ""}
        wallet={user?.walletAddress ?? null}
        methods={methods}
        hasPassword={hasPassword}
        passwordSetAt={passwordSetAt}
        hasOtherMethods={Boolean(
          user?.walletAddress || providers.has("metamask") || providers.has("google"),
        )}
      />

      <div className="mt-4">
        <PlaySettings />
      </div>
    </section>
  );
}

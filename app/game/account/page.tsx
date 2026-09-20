import type { Metadata } from "next";
import Link from "next/link";
import { AccountForm } from "@/components/account-form";
import { SignOutIcon } from "@/components/nav-icons";
import { PlaySettings } from "@/components/play-settings";
import { SignOutButton } from "@/components/sign-out-button";
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
    <section className="page-gutter flex min-h-[100svh] flex-col justify-center pb-32 pt-28">
      <div className="mx-auto flex w-full max-w-xl flex-col justify-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Account
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">
        Settings
      </h1>
      <p className="mt-4 text-base leading-7 text-ink-muted">
        How you show up on the shelf, and how the paddle follows your finger.
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

      <div className="mt-4 grid gap-4">
        <PlaySettings />
        <div className="glass grid gap-4 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Session</p>
          <h2 className="text-xl font-semibold tracking-tight text-ink">Sign out</h2>
          <p className="text-sm leading-6 text-ink-muted">
            Leave this device. Your walls, gems and progress stay on the account.
          </p>
          <SignOutButton className="btn-glass w-fit">
            <SignOutIcon />
            Sign out
          </SignOutButton>
        </div>
      </div>
      <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
        <Link href="/terms" className="hover:text-ink">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-ink">
          Privacy
        </Link>
      </p>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account",
  description: "Your Breeq account.",
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
      accounts: { select: { provider: true } },
    },
  });

  const username = user?.username ?? sessionUser.username ?? sessionUser.name ?? "Player";
  const providers = new Set(user?.accounts.map((account) => account.provider));
  const methods = [
    user?.email ? "Email" : null,
    user?.walletAddress || providers.has("metamask") ? "MetaMask" : null,
    providers.has("google") ? "Google" : null,
  ].filter(Boolean);

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-xl flex-col justify-center px-6 pb-20 pt-28">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Account
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">
        Settings
      </h1>
      <p className="mt-4 text-base leading-7 text-ink-muted">
        How you show up on the shelf. Sign out lives in the menu.
      </p>

      <dl className="glass mt-10 grid gap-5 p-6 sm:p-8">
        <div className="grid gap-2">
          <dt className="text-sm text-ink-muted">Username</dt>
          <dd className="field flex items-center">{username}</dd>
        </div>
        <div className="grid gap-2">
          <dt className="text-sm text-ink-muted">Email</dt>
          <dd className="field flex items-center">{user?.email ?? "Not set"}</dd>
        </div>
        <div className="grid gap-2">
          <dt className="text-sm text-ink-muted">Wallet</dt>
          <dd className="field flex items-center font-mono text-sm">
            {user?.walletAddress ? truncateWallet(user.walletAddress) : "Not linked"}
          </dd>
        </div>
        <div className="grid gap-2">
          <dt className="text-sm text-ink-muted">Sign-in methods</dt>
          <dd className="field flex items-center">
            {methods.length > 0 ? methods.join(" · ") : "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function truncateWallet(address: string) {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

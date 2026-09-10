import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin",
  description: "Breeq admin dashboard.",
};

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const label = user.username ?? user.name ?? "Admin";

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col justify-center px-6 pb-20 pt-28">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Admin
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Dashboard
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-ink-muted">
        Signed in as {label}. Open the menu to jump into the game, or stay here
        as the admin tools land.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        <li className="glass p-6">
          <p className="font-mono text-xs tracking-[0.16em] text-accent">01</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">
            Players
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Accounts, roles, and wallets will show up here.
          </p>
        </li>
        <li className="glass p-6">
          <p className="font-mono text-xs tracking-[0.16em] text-accent">02</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">
            Walls
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Published levels and the publish queue will live on this board.
          </p>
        </li>
      </ul>
    </section>
  );
}

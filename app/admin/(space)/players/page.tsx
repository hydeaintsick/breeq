import type { Metadata } from "next";
import { AdminPlayers, type AdminPlayerRow } from "@/components/admin-players";
import { requireAdmin } from "@/lib/auth/session";
import { gweiToEth } from "@/lib/economy";
import { prisma } from "@/lib/prisma";
import { progressFromXp } from "@/lib/progress";

export const metadata: Metadata = {
  title: "Players — Admin",
  description: "Accounts, balances, grants.",
};

export default async function AdminPlayersPage({ searchParams }: PageProps<"/admin/players">) {
  await requireAdmin();
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      xp: true,
      gems: true,
      ethGwei: true,
      createdAt: true,
      _count: { select: { earnRuns: true, earnMaps: true } },
    },
  });

  const rows: AdminPlayerRow[] = users.map((user) => ({
    id: user.id,
    username: user.username ?? user.name ?? "player",
    email: user.email,
    role: user.role,
    level: progressFromXp(user.xp).level,
    gems: user.gems,
    eth: gweiToEth(user.ethGwei),
    runs: user._count.earnRuns,
    maps: user._count.earnMaps,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Players</h1>
      <form className="mt-6 flex max-w-md gap-2" role="search">
        <input
          name="q"
          defaultValue={q}
          className="field min-w-0 flex-1"
          placeholder="Search by username or email"
          aria-label="Search players"
        />
        <button type="submit" className="btn-glass min-h-11">
          Search
        </button>
      </form>
      <p className="mt-3 text-xs text-ink-muted">
        {q ? `${rows.length} match${rows.length === 1 ? "" : "es"} for “${q}”` : "The latest 60 accounts."} Grants
        add or remove gems and show up in the player&apos;s activity.
      </p>
      <AdminPlayers rows={rows} />
    </section>
  );
}

import type { Metadata } from "next";
import { AdminPlayers, type AdminPlayerRow } from "@/components/admin-players";
import { countryName, formatPlayTime, modelFromUserAgent, supportLine } from "@/lib/acquisition";
import { requireAdmin } from "@/lib/auth/session";
import { isGuestPlaceholder } from "@/lib/guest-door";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Players — Admin",
  description: "Accounts, play time, country, and how they play.",
};

function countryCell(code: string | null) {
  if (!code) return "—";
  const name = countryName(code);
  return name === "Unknown" ? code : name;
}

export default async function AdminPlayersPage({ searchParams }: PageProps<"/admin/players">) {
  const admin = await requireAdmin();
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
      createdAt: true,
      playSeconds: true,
      signupCountry: true,
      signupPlatform: true,
      signupAppVersion: true,
      signupModel: true,
      signupUserAgent: true,
      lastSeenAt: true,
      lastCountry: true,
      lastPlatform: true,
      lastAppVersion: true,
      lastModel: true,
      lastUserAgent: true,
    },
  });

  const rows: AdminPlayerRow[] = users.map((user) => {
    const seen = user.lastSeenAt != null;
    const support = supportLine({
      platform: seen ? user.lastPlatform : user.signupPlatform,
      appVersion: seen ? user.lastAppVersion : user.signupAppVersion,
      model:
        (seen ? user.lastModel : user.signupModel) ??
        modelFromUserAgent((seen ? user.lastUserAgent : user.signupUserAgent) ?? ""),
    });
    return {
      id: user.id,
      username: user.username ?? user.name ?? "player",
      email: isGuestPlaceholder(user.email) ? null : user.email,
      role: user.role,
      joined: user.createdAt.toLocaleDateString("en-US"),
      playTime: formatPlayTime(user.playSeconds ?? 0),
      country: countryCell(user.lastCountry ?? user.signupCountry),
      channel: support.channel,
      device: support.model,
    };
  });

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
        {q ? `${rows.length} match${rows.length === 1 ? "" : "es"} for “${q}”. ` : "The latest 60 accounts. "}
        Open a player for balances, grants, and the full device record. Delete removes the account so it never counts.
      </p>
      <AdminPlayers rows={rows} selfId={admin.id} />
    </section>
  );
}

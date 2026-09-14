import type { Metadata } from "next";
import Link from "next/link";
import { AdminEarnMaps, type AdminMapRow } from "@/components/admin-earn-maps";
import { requireAdmin } from "@/lib/auth/session";
import { EARN_PATH } from "@/lib/auth/paths";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Earn maps — Admin",
  description: "Feature, hide, and watch player-built maps.",
};

export default async function AdminEarnPage() {
  await requireAdmin();
  const maps = await prisma.earnMap.findMany({
    orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { plays: "desc" }],
    take: 200,
    select: {
      id: true,
      title: true,
      ticketGems: true,
      difficulty: true,
      difficultyLabel: true,
      plays: true,
      wins: true,
      featured: true,
      featuredOrder: true,
      status: true,
      createdAt: true,
      author: { select: { username: true, name: true } },
    },
  });
  const rows: AdminMapRow[] = maps.map((map) => ({
    id: map.id,
    title: map.title,
    author: map.author.username ?? map.author.name ?? "player",
    ticketGems: map.ticketGems,
    difficulty: map.difficulty,
    difficultyLabel: map.difficultyLabel,
    plays: map.plays,
    wins: map.wins,
    featured: map.featured,
    featuredOrder: map.featuredOrder,
    status: map.status,
    createdAt: map.createdAt.toISOString(),
  }));
  const featured = rows.filter((row) => row.featured && row.status === "PUBLISHED").length;

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Earn maps</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
        {rows.length.toLocaleString("en-US")} maps, {featured} featured. Featured maps fill the top row of the{" "}
        <Link href={EARN_PATH} className="underline decoration-hairline underline-offset-4">
          store
        </Link>{" "}
        in the order below; hidden maps stay in the database but leave the store.
      </p>
      <AdminEarnMaps rows={rows} />
    </section>
  );
}

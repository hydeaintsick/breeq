import type { Metadata } from "next";
import Link from "next/link";
import { AdminReviews } from "@/components/admin-reviews";
import { requireAdmin } from "@/lib/auth/session";
import { ADMIN_PLAYERS_PATH, ADMIN_REVIEWS_PATH } from "@/lib/auth/paths";
import { countedAccount } from "@/lib/admin-stats";
import { formatAdminWhen } from "@/lib/admin-time";
import { formatGems } from "@/lib/economy";
import { reviewEventLabel, reviewStatusLabel, type ReviewChoice } from "@/lib/review";
import { getSiteSettings } from "@/lib/tutorial";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Reviews — Admin",
  description: "Who saw the Play review ask, and who took the gems.",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Opened" },
  { id: "rated", label: "5 stars" },
  { id: "later", label: "Not now" },
  { id: "out", label: "Never" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

function readFilter(value: string | string[] | undefined): Filter {
  const raw = Array.isArray(value) ? value[0] : value;
  return FILTERS.some((item) => item.id === raw) ? (raw as Filter) : "all";
}

function playerWhere(filter: Filter) {
  const engaged = {
    OR: [{ reviewSeen: { gt: 0 } }, { reviewStatus: { in: ["LATER" as const, "OUT" as const, "RATED" as const] } }],
  };
  const status =
    filter === "rated"
      ? { reviewStatus: "RATED" as const }
      : filter === "later"
        ? { reviewStatus: "LATER" as const }
        : filter === "out"
          ? { reviewStatus: "OUT" as const }
          : filter === "open"
            ? {
                reviewSeen: { gt: 0 },
                OR: [{ reviewStatus: null }, { reviewStatus: { isSet: false as const } }],
              }
            : engaged;
  return { AND: [countedAccount, status] };
}

function latestWhen(dates: Array<Date | null | undefined>) {
  const stamped = dates.filter((date): date is Date => date instanceof Date);
  if (stamped.length === 0) return null;
  return stamped.reduce((latest, date) => (date > latest ? date : latest));
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filter = readFilter(params.status);
  const [settings, opened, rated, later, never, sums, players, events] = await Promise.all([
    getSiteSettings(),
    prisma.user.count({ where: { AND: [countedAccount, { reviewSeen: { gt: 0 } }] } }),
    prisma.user.count({ where: { AND: [countedAccount, { reviewStatus: "RATED" }] } }),
    prisma.user.count({ where: { AND: [countedAccount, { reviewStatus: "LATER" }] } }),
    prisma.user.count({ where: { AND: [countedAccount, { reviewStatus: "OUT" }] } }),
    prisma.user.aggregate({
      where: countedAccount,
      _sum: { reviewReward: true, reviewSeen: true, reviewLater: true },
    }),
    prisma.user.findMany({
      where: playerWhere(filter),
      orderBy: { reviewSeenAt: "desc" },
      take: 80,
      select: {
        id: true,
        username: true,
        name: true,
        reviewStatus: true,
        reviewSeen: true,
        reviewLater: true,
        reviewReward: true,
        reviewSeenAt: true,
        reviewLaterAt: true,
        reviewRatedAt: true,
        reviewOptOutAt: true,
        _count: { select: { chapterClears: true } },
      },
    }),
    prisma.reviewEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        kind: true,
        clears: true,
        gems: true,
        createdAt: true,
        user: { select: { id: true, username: true, name: true } },
      },
    }),
  ]);

  const gemsPaid = sums._sum.reviewReward ?? 0;
  const impressions = sums._sum.reviewSeen ?? 0;
  const snoozes = sums._sum.reviewLater ?? 0;

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Reviews</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
        The Android app asks for a Play Store review after a run of new story chapters. The tutorial and replays do
        not count. <strong className="font-medium text-ink">5 stars</strong> is the tap that opens Google Play and pays
        the gems — Play does not tell us whether the review was posted. Not now waits another N chapters. Don&apos;t ask
        again, or a rating, and that player never sees it again.
      </p>

      <div className="stat-grid mt-8">
        <Stat label="Opened" value={opened.toLocaleString("en-US")} sub={`${impressions.toLocaleString("en-US")} times`} />
        <Stat label="5 stars" value={rated.toLocaleString("en-US")} sub={`${formatGems(gemsPaid)} gems paid`} />
        <Stat label="Not now" value={later.toLocaleString("en-US")} sub={`${snoozes.toLocaleString("en-US")} taps`} />
        <Stat label="Never" value={never.toLocaleString("en-US")} />
      </div>

      <AdminReviews every={settings.reviewEvery} gems={settings.reviewGems} />

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const href = item.id === "all" ? ADMIN_REVIEWS_PATH : `${ADMIN_REVIEWS_PATH}?status=${item.id}`;
          const on = filter === item.id;
          return (
            <Link
              key={item.id}
              href={href}
              className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm"
              aria-current={on ? "page" : undefined}
              style={{
                borderColor: on ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--hairline)",
                color: on ? "var(--accent)" : "var(--ink)",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {players.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">No one in this view yet.</p>
      ) : (
        <div className="admin-table-wrap mt-4">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Chapters</th>
                <th>Seen</th>
                <th>Not now</th>
                <th>Status</th>
                <th>Gems</th>
                <th>Last</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const status = (player.reviewStatus ?? null) as ReviewChoice;
                const when = latestWhen([
                  player.reviewSeenAt,
                  player.reviewLaterAt,
                  player.reviewRatedAt,
                  player.reviewOptOutAt,
                ]);
                return (
                  <tr key={player.id}>
                    <td>
                      <Link href={`${ADMIN_PLAYERS_PATH}/${player.id}`} className="underline decoration-hairline underline-offset-4">
                        {player.username ?? player.name ?? "player"}
                      </Link>
                    </td>
                    <td className="tabular-nums">{player._count.chapterClears.toLocaleString("en-US")}</td>
                    <td className="tabular-nums">{(player.reviewSeen ?? 0).toLocaleString("en-US")}</td>
                    <td className="tabular-nums">{(player.reviewLater ?? 0).toLocaleString("en-US")}</td>
                    <td>{reviewStatusLabel(status, player.reviewSeen ?? 0)}</td>
                    <td className="tabular-nums">{status === "RATED" ? formatGems(player.reviewReward ?? 0) : "—"}</td>
                    <td className="whitespace-nowrap text-ink-muted">{formatAdminWhen(when)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {players.length === 80 ? <p className="mt-3 text-xs text-ink-muted">Latest 80.</p> : null}

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Latest steps</h2>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">Nothing recorded yet.</p>
      ) : (
        <div className="admin-table-wrap mt-3">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Player</th>
                <th>Step</th>
                <th>Chapters</th>
                <th>Gems</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap text-ink-muted">{formatAdminWhen(event.createdAt)}</td>
                  <td>
                    <Link
                      href={`${ADMIN_PLAYERS_PATH}/${event.user.id}`}
                      className="underline decoration-hairline underline-offset-4"
                    >
                      {event.user.username ?? event.user.name ?? "player"}
                    </Link>
                  </td>
                  <td>{reviewEventLabel(event.kind)}</td>
                  <td className="tabular-nums">{event.clears.toLocaleString("en-US")}</td>
                  <td className="tabular-nums">{event.gems > 0 ? formatGems(event.gems) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat glass">
      <p className="stat-label">{label}</p>
      <p className="stat-n">{value}</p>
      {sub ? <p className="mt-1 text-xs text-ink-muted">{sub}</p> : null}
    </div>
  );
}

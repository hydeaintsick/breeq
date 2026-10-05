import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { AdminPlayers, type AdminPlayerRow } from "@/components/admin-players";
import { countryFlag, countryName, formatPlayTime, modelFromUserAgent, supportLine } from "@/lib/acquisition";
import { formatAdminWhen } from "@/lib/admin-time";
import {
  activityCuts,
  countryWhere,
  parseCountryParam,
  seenWhere,
  tallyCountries,
} from "@/lib/admin-brief";
import { countedAccount } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth/session";
import { ADMIN_PLAYERS_PATH } from "@/lib/auth/paths";
import { formatUsd } from "@/lib/economy";
import { isGuestPlaceholder } from "@/lib/guest-door";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Players — Admin",
  description: "Accounts, play time, country, and how they play.",
};

function n(value: number) {
  return value.toLocaleString("en-US");
}

function later(a: Date | null, b: Date | null) {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() >= b.getTime() ? a : b;
}

function countryCell(code: string | null) {
  if (!code) return "—";
  const name = countryName(code);
  return name === "Unknown" ? code : name;
}

function playersHref(q: string, country: string | null) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (country) params.set("country", country);
  const text = params.toString();
  return text ? `${ADMIN_PLAYERS_PATH}?${text}` : ADMIN_PLAYERS_PATH;
}

export default async function AdminPlayersPage({ searchParams }: PageProps<"/admin/players">) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const country = parseCountryParam(Array.isArray(params.country) ? params.country[0] : params.country);
  const { activeCut, playingCut } = activityCuts();

  const filters: Prisma.UserWhereInput[] = [countedAccount];
  if (q) {
    filters.push({
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { partner: { contains: q, mode: "insensitive" } },
        { partnerEmail: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (country) filters.push(countryWhere(country));
  const where: Prisma.UserWhereInput = { AND: filters };

  const [users, total, deposited, active, playing, countryRows] = await Promise.all([
    prisma.user.findMany({
      where,
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
        lastPlayAt: true,
        lastCountry: true,
        lastPlatform: true,
        lastAppVersion: true,
        lastModel: true,
        lastUserAgent: true,
        partner: true,
        partnerEmail: true,
      },
    }),
    prisma.user.count({ where }),
    prisma.gemPurchase.aggregate({
      where: { status: "PAID", user: { is: where } },
      _sum: { usdCents: true },
    }),
    prisma.user.count({ where: { AND: [where, seenWhere(activeCut)] } }),
    prisma.user.count({ where: { AND: [where, { lastPlayAt: { gte: playingCut } }] } }),
    prisma.user.findMany({
      where: countedAccount,
      select: { lastCountry: true, signupCountry: true },
    }),
  ]);

  const purchases =
    users.length === 0
      ? []
      : await prisma.gemPurchase.findMany({
          where: { status: "PAID", userId: { in: users.map((user) => user.id) } },
          select: { userId: true, usdCents: true },
        });
  const spent = new Map<string, number>();
  for (const purchase of purchases) {
    spent.set(purchase.userId, (spent.get(purchase.userId) ?? 0) + purchase.usdCents);
  }

  const rows: AdminPlayerRow[] = users.map((user) => {
    const support = supportLine({
      platform: user.lastSeenAt != null ? user.lastPlatform : user.signupPlatform,
      appVersion: user.lastSeenAt != null ? user.lastAppVersion : user.signupAppVersion,
      model:
        (user.lastSeenAt != null ? user.lastModel : user.signupModel) ??
        modelFromUserAgent((user.lastSeenAt != null ? user.lastUserAgent : user.signupUserAgent) ?? ""),
    });
    const cents = spent.get(user.id) ?? 0;
    return {
      id: user.id,
      username: user.username ?? user.name ?? "player",
      email: isGuestPlaceholder(user.email) ? null : user.email,
      partner: user.partner,
      partnerEmail: user.partnerEmail,
      role: user.role,
      joined: formatAdminWhen(user.createdAt),
      seen: formatAdminWhen(later(user.lastSeenAt, user.lastPlayAt)),
      playing: user.lastPlayAt != null && user.lastPlayAt.getTime() >= playingCut.getTime(),
      deposited: cents > 0 ? formatUsd(cents / 100) : null,
      playTime: formatPlayTime(user.playSeconds ?? 0),
      country: countryCell(user.lastCountry ?? user.signupCountry),
      channel: support.channel,
      device: support.model,
    };
  });

  const tallies = tallyCountries(countryRows);
  const named = tallies.filter((row) => row.code).length;
  let chips = tallies.slice(0, 8);
  if (country) {
    const selected = country === "unknown" ? null : country;
    if (!chips.some((row) => (row.code ?? "unknown") === country)) {
      chips = [...chips, tallies.find((row) => row.code === selected) ?? { code: selected, players: 0 }];
    }
  }
  const place = country === "unknown" ? "Unknown" : country ? countryName(country) : null;
  const shown =
    rows.length === total
      ? `${n(total)} account${total === 1 ? "" : "s"}`
      : `Showing ${n(rows.length)} of ${n(total)}`;

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Players</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">
        Who is here, who paid, and where they play from.
      </p>

      <div className="stat-grid mt-6">
        <div className="stat glass">
          <p className="stat-label">Accounts</p>
          <p className="stat-n text-ink">{n(total)}</p>
          <p className="stat-sub">{place || q ? "Matching this filter" : "Counted accounts"}</p>
        </div>
        <div className="stat glass">
          <p className="stat-label">Deposited</p>
          <p className="stat-n text-ink">{formatUsd((deposited._sum.usdCents ?? 0) / 100)}</p>
          <p className="stat-sub">Paid gem packs</p>
        </div>
        <div className="stat glass">
          <p className="stat-label">Active, 24h</p>
          <p className="stat-n text-ink">{n(active)}</p>
          <p className="stat-sub">Opened the game or played</p>
        </div>
        <div className="stat glass">
          <p className="stat-label">Playing now</p>
          <p className="stat-n text-ink">{n(playing)}</p>
          <p className="stat-sub">A board in the last 3 minutes</p>
        </div>
      </div>

      <p className="mt-8 text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
        By country{named > 0 ? ` · ${n(named)}` : ""}
      </p>
      <div className="admin-chips mt-3">
        <Link href={playersHref(q, null)} className="admin-chip" data-active={country ? "false" : "true"} aria-current={country ? undefined : "page"}>
          All
        </Link>
        {chips.map((chip) => {
          const key = chip.code ?? "unknown";
          const active = country === key;
          const flag = countryFlag(chip.code);
          return (
            <Link
              key={key}
              href={playersHref(q, key)}
              className="admin-chip"
              data-active={active ? "true" : "false"}
              aria-current={active ? "page" : undefined}
            >
              {flag ? <span aria-hidden="true">{flag}</span> : null}
              {countryName(chip.code)}
              <span className="tabular-nums">{n(chip.players)}</span>
            </Link>
          );
        })}
      </div>

      <form className="mt-6 grid max-w-md gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" role="search" action={ADMIN_PLAYERS_PATH}>
        {country ? <input type="hidden" name="country" value={country} /> : null}
        <input
          name="q"
          defaultValue={q}
          className="field w-full min-w-0"
          placeholder="Search by username, email, or partner"
          aria-label="Search players"
        />
        <button type="submit" className="btn-glass min-h-11">
          Search
        </button>
      </form>
      <p className="mt-3 text-xs text-ink-muted">
        {place ? `${place}. ` : ""}
        {q ? `${shown} for “${q}”. ` : `${shown}. `}
        Open a player for balances, grants, and the full device record. Delete removes the account so it never counts.
      </p>
      <AdminPlayers rows={rows} selfId={admin.id} />
    </section>
  );
}

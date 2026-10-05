import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActivityList } from "@/components/admin-activity-list";
import { AdminGrant } from "@/components/admin-grant";
import { BoltGlyph, EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { requireAdmin } from "@/lib/auth/session";
import { ADMIN_PLAYERS_PATH } from "@/lib/auth/paths";
import {
  countryLabel,
  formatAppVersion,
  formatPlayTime,
  modelFromUserAgent,
  platformLabel,
  signupMethodLabel,
} from "@/lib/acquisition";
import { PLAYER_PLAY_LIMIT, recentPlayForUser } from "@/lib/admin-activity";
import { formatAdminWhen } from "@/lib/admin-time";
import { gweiToEth, formatEth, formatGems } from "@/lib/economy";
import { isGuestPlaceholder } from "@/lib/guest-door";
import { readEnergy } from "@/lib/energy-store";
import { prisma } from "@/lib/prisma";
import { progressFromXp } from "@/lib/progress";
import { getSiteSettings } from "@/lib/tutorial";
import { reviewEventLabel, reviewStatusLabel, type ReviewChoice } from "@/lib/review";

export const metadata: Metadata = {
  title: "Player — Admin",
  description: "One account: device, country, play time, balances.",
};

const LEDGER: Record<string, string> = {
  TOPUP: "Gems bought",
  PUBLISH: "Map published",
  TICKET: "Ticket",
  PAYOUT: "Win paid out",
  WITHDRAW: "Withdrawal",
  WITHDRAW_REFUND: "Withdrawal returned",
  GRANT: "Gems from Breeq",
  SKIP: "Chapter skipped",
  REFERRAL: "Friend joined",
  ENERGY: "Energy recharge",
  SKIN: "Skin unlocked",
  REVIVE: "Revive",
  REVIEW: "Play review",
};

function isObjectId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

function screenLabel(value: string | null) {
  return value ? value.replace("x", "×") : "—";
}

function phoneLabel(stored: string | null, ua: string | null) {
  return stored ?? modelFromUserAgent(ua ?? "") ?? "—";
}

function appVersionLabel(stored: string | null, seen: boolean) {
  return formatAppVersion(stored) ?? (seen ? "Web" : "—");
}

export default async function AdminPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const [user, wins, paidPacks, settings, reviewEvents, play] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
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
        signupAt: true,
        signupMethod: true,
        signupCountry: true,
        signupPlatform: true,
        signupOs: true,
        signupAppVersion: true,
        signupModel: true,
        signupLocale: true,
        signupUserAgent: true,
        signupScreen: true,
        signupTimezone: true,
        partner: true,
        partnerEmail: true,
        partnerAt: true,
        lastSeenAt: true,
        lastCountry: true,
        lastPlatform: true,
        lastOs: true,
        lastAppVersion: true,
        lastModel: true,
        lastLocale: true,
        lastUserAgent: true,
        lastScreen: true,
        lastTimezone: true,
        lastTouch: true,
        playSeconds: true,
        deletedAt: true,
        reviewStatus: true,
        reviewSeen: true,
        reviewLater: true,
        reviewReward: true,
        reviewAnchor: true,
        reviewSeenAt: true,
        reviewLaterAt: true,
        reviewRatedAt: true,
        reviewOptOutAt: true,
        referredBy: {
          select: { via: true, referrer: { select: { id: true, username: true, name: true } } },
        },
        _count: { select: { earnRuns: true, earnMaps: true, chapterClears: true, referralsMade: true } },
        ledger: {
          orderBy: { createdAt: "desc" },
          take: 12,
          select: { id: true, kind: true, gems: true, ethGwei: true, note: true, createdAt: true },
        },
      },
    }),
    prisma.earnRun.count({ where: { userId: id, outcome: "WON" } }),
    prisma.gemPurchase.count({ where: { userId: id, status: "PAID" } }),
    getSiteSettings(),
    prisma.reviewEvent.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, kind: true, clears: true, gems: true, createdAt: true },
    }),
    recentPlayForUser(id),
  ]);

  if (!user) notFound();

  const energy = await readEnergy(user.id);
  const progress = progressFromXp(user.xp);
  const username = user.username ?? user.name ?? "player";
  const referrer = user.referredBy?.referrer;

  const signupRows = [
    { label: "Signed up with", value: signupMethodLabel(user.signupMethod) },
    { label: "Partner", value: user.partner ?? "—" },
    { label: "Partner email", value: user.partnerEmail ?? "—" },
    { label: "Tagged", value: user.partnerAt ? formatAdminWhen(user.partnerAt) : "—" },
    { label: "Country", value: countryLabel(user.signupCountry) },
    { label: "Device", value: platformLabel(user.signupPlatform) },
    { label: "System", value: user.signupOs ?? "—" },
    { label: "Model", value: phoneLabel(user.signupModel, user.signupUserAgent) },
    { label: "App version", value: appVersionLabel(user.signupAppVersion, user.signupAt != null) },
    { label: "Language", value: user.signupLocale ?? "—" },
    { label: "Screen", value: screenLabel(user.signupScreen) },
    { label: "Time zone", value: user.signupTimezone ?? "—" },
  ];

  const latestRows = [
    { label: "Last seen", value: formatAdminWhen(user.lastSeenAt) },
    { label: "Country", value: countryLabel(user.lastCountry) },
    { label: "Device", value: platformLabel(user.lastPlatform) },
    { label: "System", value: user.lastOs ?? "—" },
    { label: "Model", value: phoneLabel(user.lastModel, user.lastUserAgent) },
    { label: "App version", value: appVersionLabel(user.lastAppVersion, user.lastSeenAt != null) },
    { label: "Language", value: user.lastLocale ?? "—" },
    { label: "Screen", value: screenLabel(user.lastScreen) },
    { label: "Time zone", value: user.lastTimezone ?? "—" },
    { label: "Input", value: user.lastTouch === null ? "—" : user.lastTouch ? "Touch" : "Pointer" },
  ];

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <p className="mt-3">
        <Link href={ADMIN_PLAYERS_PATH} className="inline-flex min-h-11 items-center text-sm text-ink-muted underline decoration-hairline underline-offset-4">
          Players
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {username}
        {user.role === "ADMIN" ? (
          <span className="ml-3 align-middle font-mono text-xs tracking-[0.12em] text-accent">ADMIN</span>
        ) : null}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        {user.email && !isGuestPlaceholder(user.email) ? user.email : "No email yet"} · joined {formatAdminWhen(user.createdAt)}
        {referrer ? (
          <>
            {" "}
            · invited by{" "}
            <Link href={`${ADMIN_PLAYERS_PATH}/${referrer.id}`} className="underline decoration-hairline underline-offset-4">
              {referrer.username ?? referrer.name ?? "a player"}
            </Link>
            {user.referredBy?.via ? ` via ${user.referredBy.via}` : ""}
          </>
        ) : null}
      </p>

      <div className="stat-grid mt-8">
        <Stat label="Level" value={String(progress.level)} sub={`${progress.xp.toLocaleString("en-US")} XP`} />
        <Stat
          label="Gems"
          value={
            <span className="inline-flex items-center gap-1.5">
              <GemGlyph /> {formatGems(user.gems)}
            </span>
          }
        />
        <Stat
          label="ETH"
          value={
            <span className="inline-flex items-center gap-1.5">
              <EthGlyph /> {formatEth(gweiToEth(user.ethGwei), { unit: false })}
            </span>
          }
        />
        <Stat label="Play time" value={formatPlayTime(user.playSeconds)} sub="Story, tutorial, and Earn" />
        <Stat
          label="Energy"
          value={
            <span className="inline-flex items-center gap-1.5">
              <BoltGlyph /> {energy.energy}
            </span>
          }
          sub={settings.energyEnabled ? `of ${energy.max}` : "Off for everyone"}
        />
        <Stat label="Story clears" value={user._count.chapterClears.toLocaleString("en-US")} />
        <Stat
          label="Earn tickets"
          value={user._count.earnRuns.toLocaleString("en-US")}
          sub={`${wins.toLocaleString("en-US")} won`}
        />
        <Stat
          label="Maps"
          value={user._count.earnMaps.toLocaleString("en-US")}
          sub={`${paidPacks.toLocaleString("en-US")} gem packs · ${user._count.referralsMade.toLocaleString("en-US")} friends`}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <DeviceCard title="At sign-up" empty={!user.signupAt} rows={signupRows} agent={user.signupUserAgent} />
        <DeviceCard title="Latest device" empty={!user.lastSeenAt} rows={latestRows} agent={user.lastUserAgent} />
      </div>

      <ReviewCard
        status={(user.reviewStatus ?? null) as ReviewChoice}
        seen={user.reviewSeen ?? 0}
        later={user.reviewLater ?? 0}
        reward={user.reviewReward ?? 0}
        anchor={user.reviewAnchor ?? 0}
        clears={user._count.chapterClears}
        every={settings.reviewEvery}
        seenAt={user.reviewSeenAt}
        laterAt={user.reviewLaterAt}
        ratedAt={user.reviewRatedAt}
        optOutAt={user.reviewOptOutAt}
        events={reviewEvents}
      />

      {user.deletedAt ? (
        <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-muted">
          Removed from admin stats on {formatAdminWhen(user.deletedAt)}. The account and its history are still stored.
        </p>
      ) : (
        <div className="mt-4">
          <AdminGrant userId={user.id} />
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Recent play</h2>
      <p className="mt-1 text-sm leading-6 text-ink-muted">
        The latest {PLAYER_PLAY_LIMIT} levels cleared, runs lost, and Earn tickets.
      </p>
      {play.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No runs yet.</p>
      ) : (
        <AdminActivityList items={play} linked={false} />
      )}

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Recent activity</h2>
      {user.ledger.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No balance changes yet.</p>
      ) : (
        <div className="admin-table-wrap mt-3">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>What</th>
                <th>Gems</th>
                <th>ETH</th>
              </tr>
            </thead>
            <tbody>
              {user.ledger.map((line) => (
                <tr key={line.id}>
                  <td className="whitespace-nowrap text-ink-muted">{formatAdminWhen(line.createdAt)}</td>
                  <td>
                    <p>{LEDGER[line.kind] ?? line.kind}</p>
                    {line.note ? <p className="text-xs text-ink-muted">{line.note}</p> : null}
                  </td>
                  <td className="tabular-nums">{line.gems === 0 ? "—" : formatGems(line.gems)}</td>
                  <td className="tabular-nums">
                    {line.ethGwei === BigInt(0) ? "—" : formatEth(gweiToEth(line.ethGwei), { unit: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="stat glass">
      <p className="stat-label">{label}</p>
      <p className="stat-n">{value}</p>
      {sub ? <p className="mt-1 text-xs text-ink-muted">{sub}</p> : null}
    </div>
  );
}

function ReviewCard({
  status,
  seen,
  later,
  reward,
  anchor,
  clears,
  every,
  seenAt,
  laterAt,
  ratedAt,
  optOutAt,
  events,
}: {
  status: ReviewChoice;
  seen: number;
  later: number;
  reward: number;
  anchor: number;
  clears: number;
  every: number;
  seenAt: Date | null;
  laterAt: Date | null;
  ratedAt: Date | null;
  optOutAt: Date | null;
  events: { id: string; kind: "SEEN" | "LATER" | "OUT" | "RATED"; clears: number; gems: number; createdAt: Date }[];
}) {
  const rows = [
    { label: "Status", value: reviewStatusLabel(status, seen) },
    { label: "Seen", value: seen === 0 ? "—" : `${seen.toLocaleString("en-US")} · ${formatAdminWhen(seenAt)}` },
    { label: "Not now", value: later === 0 ? "—" : `${later.toLocaleString("en-US")} · ${formatAdminWhen(laterAt)}` },
    { label: "5 stars", value: ratedAt ? `${formatGems(reward)} gems · ${formatAdminWhen(ratedAt)}` : "—" },
    { label: "Don't ask again", value: optOutAt ? formatAdminWhen(optOutAt) : "—" },
    {
      label: "Next ask",
      value:
        status === "RATED" || status === "OUT"
          ? "Never"
          : every < 1
            ? "Off"
            : status === "LATER"
              ? clears >= anchor + every
                ? "Due now"
                : `After ${anchor + every} chapters`
              : clears >= every
                ? "Due now"
                : `After ${every} chapters`,
    },
  ];

  return (
    <div className="glass mt-4 p-5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Play review</h2>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-xs text-ink-muted">{row.label}</dt>
            <dd className="mt-0.5 text-sm text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      {events.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">No steps recorded.</p>
      ) : (
        <div className="admin-table-wrap mt-4">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Step</th>
                <th>Chapters</th>
                <th>Gems</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap text-ink-muted">{formatAdminWhen(event.createdAt)}</td>
                  <td>{reviewEventLabel(event.kind)}</td>
                  <td className="tabular-nums">{event.clears.toLocaleString("en-US")}</td>
                  <td className="tabular-nums">{event.gems > 0 ? formatGems(event.gems) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeviceCard({
  title,
  empty,
  rows,
  agent,
}: {
  title: string;
  empty: boolean;
  rows: { label: string; value: string }[];
  agent: string | null;
}) {
  return (
    <div className="glass p-5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      {empty ? (
        <p className="mt-3 text-sm text-ink-muted">Not recorded. Accounts from before this was kept stay blank.</p>
      ) : (
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-xs text-ink-muted">{row.label}</dt>
              <dd className="mt-0.5 break-words text-sm text-ink">{row.value}</dd>
            </div>
          ))}
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs text-ink-muted">User agent</dt>
            <dd className="mt-0.5 break-words font-mono text-xs leading-5 text-ink-muted">{agent ?? "—"}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

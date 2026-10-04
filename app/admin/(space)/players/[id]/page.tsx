import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminGrant } from "@/components/admin-grant";
import { BoltGlyph, EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { requireAdmin } from "@/lib/auth/session";
import { ADMIN_PLAYERS_PATH } from "@/lib/auth/paths";
import {
  countryLabel,
  formatPlayTime,
  formatWhen,
  modelFromUserAgent,
  platformLabel,
  signupMethodLabel,
} from "@/lib/acquisition";
import { gweiToEth, formatEth, formatGems } from "@/lib/economy";
import { readEnergy } from "@/lib/energy-store";
import { prisma } from "@/lib/prisma";
import { progressFromXp } from "@/lib/progress";
import { getSiteSettings } from "@/lib/tutorial";

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

export default async function AdminPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const [user, wins, paidPacks, settings] = await Promise.all([
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
  ]);

  if (!user) notFound();

  const energy = await readEnergy(user.id);
  const progress = progressFromXp(user.xp);
  const username = user.username ?? user.name ?? "player";
  const referrer = user.referredBy?.referrer;

  const signupRows = [
    { label: "Signed up with", value: signupMethodLabel(user.signupMethod) },
    { label: "Country", value: countryLabel(user.signupCountry) },
    { label: "Device", value: platformLabel(user.signupPlatform) },
    { label: "System", value: user.signupOs ?? "—" },
    { label: "Model", value: phoneLabel(user.signupModel, user.signupUserAgent) },
    { label: "Android app", value: user.signupAppVersion ?? (user.signupAt ? "Web" : "—") },
    { label: "Language", value: user.signupLocale ?? "—" },
    { label: "Screen", value: screenLabel(user.signupScreen) },
    { label: "Time zone", value: user.signupTimezone ?? "—" },
  ];

  const latestRows = [
    { label: "Last seen", value: formatWhen(user.lastSeenAt) },
    { label: "Country", value: countryLabel(user.lastCountry) },
    { label: "Device", value: platformLabel(user.lastPlatform) },
    { label: "System", value: user.lastOs ?? "—" },
    { label: "Model", value: phoneLabel(user.lastModel, user.lastUserAgent) },
    { label: "Android app", value: user.lastAppVersion ?? (user.lastSeenAt ? "Web" : "—") },
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
        {user.email ?? "No email"} · joined {formatWhen(user.createdAt)}
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

      <div className="mt-4">
        <AdminGrant userId={user.id} />
      </div>

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
                  <td className="whitespace-nowrap text-ink-muted">{formatWhen(line.createdAt)}</td>
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

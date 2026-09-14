import type { Metadata } from "next";
import Link from "next/link";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { requireAdmin } from "@/lib/auth/session";
import {
  ADMIN_EARN_PATH,
  ADMIN_ECONOMY_PATH,
  ADMIN_EDITOR_PATH,
  ADMIN_PLAYERS_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_WITHDRAWALS_PATH,
  EARN_PATH,
} from "@/lib/auth/paths";
import { formatEth, formatGems, formatUsd } from "@/lib/economy";
import { getAdminStats, SERIES_DAYS } from "@/lib/admin-stats";
import { getSiteSettings } from "@/lib/tutorial";

export const metadata: Metadata = {
  title: "Admin — Breeq",
  description: "Breeq admin dashboard.",
};

function n(value: number) {
  return value.toLocaleString("en-US");
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const [stats, settings] = await Promise.all([getAdminStats(), getSiteSettings()]);
  const label = user.username ?? user.name ?? "Admin";
  const winRate = stats.earn.runs > 0 ? Math.round((stats.earn.wins / stats.earn.runs) * 100) : 0;

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Dashboard</h1>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        Signed in as {label}. Earn is {settings.earnEnabled ? "on" : "off"}, the tutorial is{" "}
        {settings.tutorialEnabled ? "on" : "off"} —{" "}
        <Link href={ADMIN_SETTINGS_PATH} className="underline decoration-hairline underline-offset-4">
          change that in Settings
        </Link>
        .
      </p>

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Players</h2>
      <div className="stat-grid mt-3">
        <Stat label="Signed up" value={n(stats.players.total)} sub={`+${n(stats.players.week)} this week`} />
        <Stat label="Story walls cleared" value={n(stats.story.clears)} sub={`${n(stats.story.chapters)} chapters live`} />
        <div className="stat glass col-span-2">
          <p className="stat-label">Sign-ups, last {SERIES_DAYS} days</p>
          <Spark series={stats.players.series} />
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Earn</h2>
      <div className="stat-grid mt-3">
        <Stat label="Maps on sale" value={n(stats.earn.maps)} href={ADMIN_EARN_PATH} />
        <Stat label="Tickets played" value={n(stats.earn.runs)} sub={`+${n(stats.earn.runsWeek)} this week · ${winRate}% won`} />
        <Stat
          label="Gems spent on tickets"
          value={
            <>
              <GemGlyph /> {formatGems(stats.earn.ticketsGems)}
            </>
          }
        />
        <Stat
          label="ETH paid to players"
          value={
            <>
              <EthGlyph /> {formatEth(stats.earn.payoutEth, { unit: false })}
            </>
          }
        />
        <div className="stat glass col-span-2">
          <p className="stat-label">Tickets, last {SERIES_DAYS} days</p>
          <Spark series={stats.earn.series} />
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Money</h2>
      <div className="stat-grid mt-3">
        <Stat label="Deposits (Stripe)" value={formatUsd(stats.money.usd)} sub={`${formatUsd(stats.money.usdWeek)} this week · ${n(stats.money.purchases)} packs`} />
        <Stat
          label="Gems sold"
          value={
            <>
              <GemGlyph /> {formatGems(stats.money.gemsSold)}
            </>
          }
          sub={`${formatGems(stats.money.gemsInCirculation)} in players' bags`}
        />
        <Stat
          label="ETH owed to players"
          value={
            <>
              <EthGlyph /> {formatEth(stats.money.ethOwed, { unit: false })}
            </>
          }
          sub="Balances not yet withdrawn"
        />
        <Stat
          label="Withdrawals pending"
          value={n(stats.withdrawals.pending)}
          sub={`${formatEth(stats.withdrawals.pendingEth)} waiting · ${formatEth(stats.withdrawals.paidEth)} sent`}
          href={ADMIN_WITHDRAWALS_PATH}
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Go to</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        <Jump href={ADMIN_EDITOR_PATH} title="Story editor" body="Episodes and chapters. One chapter is one wall." />
        <Jump href={ADMIN_EARN_PATH} title="Earn maps" body="Feature the best walls, hide the rest." />
        <Jump href={ADMIN_ECONOMY_PATH} title="Economy" body="Gem price, ETH reference, payout multiplier, packs and discounts." />
        <Jump href={ADMIN_PLAYERS_PATH} title="Players" body="Accounts, balances, and gem grants." />
        <Jump href={ADMIN_WITHDRAWALS_PATH} title="Withdrawals" body="Pay requests out and record the transaction." />
        <Jump href={EARN_PATH} title="Open the store" body="See Earn the way players do." />
      </ul>
    </section>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: React.ReactNode; sub?: string; href?: string }) {
  const body = (
    <>
      <p className="stat-label">{label}</p>
      <p className="stat-n inline-flex items-center gap-1.5 text-ink">{value}</p>
      {sub ? <p className="stat-sub">{sub}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="stat glass block">
      {body}
    </Link>
  ) : (
    <div className="stat glass">{body}</div>
  );
}

function Spark({ series }: { series: number[] }) {
  const max = Math.max(1, ...series);
  return (
    <div className="spark mt-3" aria-label={`Daily counts: ${series.join(", ")}`}>
      {series.map((value, index) => (
        <span key={index} style={{ height: `${Math.max(3, (value / max) * 100)}%` }} title={String(value)} />
      ))}
    </div>
  );
}

function Jump({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <li>
      <Link href={href} className="glass block p-5">
        <p className="text-base font-semibold tracking-tight text-ink">{title}</p>
        <p className="mt-1 text-sm leading-6 text-ink-muted">{body}</p>
      </Link>
    </li>
  );
}

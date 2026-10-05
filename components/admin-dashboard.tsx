import type { ReactNode } from "react";
import Link from "next/link";
import { AdminActivityList } from "@/components/admin-activity-list";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { countryFlag, countryName, formatPlayTime } from "@/lib/acquisition";
import { ADMIN_ACTIVITY_LIMIT, type AdminActivity } from "@/lib/admin-activity";
import { formatLag, formatShare, type AdminBrief } from "@/lib/admin-brief";
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

const PLATFORM_COLOR: Record<string, string> = {
  "android-app": "var(--neon-blue)",
  "android-web": "var(--neon-cyan)",
  ios: "var(--neon-violet)",
  desktop: "var(--neon-amber)",
  other: "var(--neon-pink)",
  unknown: "var(--steel)",
};

function n(value: number) {
  return value.toLocaleString("en-US");
}

function formatUsdTight(usd: number) {
  if (usd > 0 && usd < 0.01) {
    return usd.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
  return formatUsd(usd);
}

function axisUsd(value: number) {
  if (value === 0) return "$0";
  if (value >= 1000) return `$${Math.round(value).toLocaleString("en-US")}`;
  if (value >= 100) return `$${Math.round(value)}`;
  return formatUsd(value);
}

export function AdminDashboard({
  label,
  earnEnabled,
  energyEnabled,
  tutorialEnabled,
  brief,
  activity,
}: {
  label: string;
  earnEnabled: boolean;
  energyEnabled: boolean;
  tutorialEnabled: boolean;
  brief: AdminBrief;
  activity: AdminActivity[];
}) {
  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Dashboard</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">
        Signed in as {label}. Earn is {earnEnabled ? "on" : "off"}, energy is {energyEnabled ? "on" : "off"}, the
        tutorial is {tutorialEnabled ? "on" : "off"} —{" "}
        <Link href={ADMIN_SETTINGS_PATH} className="underline decoration-hairline underline-offset-4">
          change that in Settings
        </Link>
        .
      </p>

      <Books brief={brief} />
      <Growth brief={brief} />
      <Where brief={brief} />
      <Earn brief={brief} />

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Activity</h2>
      <p className="mt-1 text-sm leading-6 text-ink-muted">
        The latest {ADMIN_ACTIVITY_LIMIT}. A level cleared, a run lost, an Earn ticket, a sign-up, or a gem pack.
      </p>
      {activity.length === 0 ? <p className="mt-3 text-sm text-ink-muted">Nothing yet.</p> : <AdminActivityList items={activity} />}

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

function Books({ brief }: { brief: AdminBrief }) {
  const { books, price } = brief;
  return (
    <>
      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">The books</h2>
      <p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">
        What Stripe collected, what players still hold, and what has already left.
      </p>
      <div className="glass brief-panel mt-4">
        <div className="stat-grid">
          <Stat plain label="Collected" value={formatUsd(books.collected)} sub={`${formatUsd(books.collectedWeek)} this week`} />
          <Stat
            plain
            label="Left"
            tone={books.left != null && books.left < 0 ? "danger" : undefined}
            value={books.left == null ? "—" : formatUsd(books.left)}
            sub={books.left == null ? "Needs an ETH reference price" : "After bags and withdrawals"}
          />
          <Stat
            plain
            label="In bags"
            value={
              <>
                <EthGlyph /> {formatEth(books.bagsEth, { unit: false })}
              </>
            }
            sub={price.priced ? formatUsd(books.bagsUsd) : "Reference price not set"}
          />
          <Stat
            plain
            href={ADMIN_WITHDRAWALS_PATH}
            label="To send"
            value={n(books.waitingCount)}
            sub={
              price.priced
                ? `${formatEth(books.waitingEth)} · ${formatUsd(books.waitingUsd)}`
                : formatEth(books.waitingEth)
            }
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-ink">{booksSentence(brief)}</p>
        {price.priced ? (
          <Tracks
            rows={[
              { label: "Collected", usd: books.collected, color: "var(--neon-blue)" },
              { label: "In bags", usd: books.bagsUsd, color: "var(--neon-amber)" },
              { label: "To send", usd: books.waitingUsd, color: "var(--neon-pink)" },
              { label: "Sent", usd: books.sentUsd, color: "var(--neon-violet)" },
            ]}
          />
        ) : (
          <p className="mt-3 text-sm text-ink-muted">Sent {formatEth(books.sentEth)}.</p>
        )}
        <BriefChart
          id="brief-cash"
          title="Cash in, last 30 days"
          total={formatUsd(books.collectedMonth)}
          series={books.cashSeries}
          labels={brief.days}
          color="var(--neon-blue)"
          formatAxis={axisUsd}
          formatPoint={formatUsd}
        />
        <p className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-muted">
          <GemGlyph />
          <span>{formatGems(books.gemsSold)} sold</span>
          <span aria-hidden="true">·</span>
          <span>{formatGems(books.gemsInBags)} still in bags</span>
        </p>
        <p className="mt-2 text-xs leading-5 text-ink-muted">
          ETH uses the reference price
          {price.priced ? `, ${formatUsd(price.ethUsd)} per ETH` : ""}.{" "}
          <Link href={ADMIN_ECONOMY_PATH} className="underline decoration-hairline underline-offset-4">
            Change it in Economy
          </Link>
          . Requesting a withdrawal takes the ETH out of the bag, so the amount to send is counted on its own.
        </p>
      </div>
    </>
  );
}

function booksSentence(brief: AdminBrief) {
  const { books, price } = brief;
  if (!price.priced) return "Set an ETH reference price to value the bags and the withdrawals in dollars.";
  const quiet = books.collected === 0 && books.bagsEth === 0 && books.waitingEth === 0 && books.sentEth === 0;
  if (quiet) return "No card payments yet, and no ETH on the books.";
  if (books.left != null && books.left < 0) {
    return `ETH on the books is worth ${formatUsd(Math.abs(books.left))} more than Stripe has collected, at the reference price.`;
  }
  return `After the bags and the withdrawals, ${formatUsd(books.left ?? 0)} of what Stripe collected is still uncommitted, at the reference price.`;
}

function Growth({ brief }: { brief: AdminBrief }) {
  const { growth } = brief;
  return (
    <>
      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Growth</h2>
      <p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">Who arrived, who came back, and who paid.</p>
      <div className="stat-grid six mt-4">
        <Stat
          href={ADMIN_PLAYERS_PATH}
          label="Players"
          value={n(growth.players)}
          sub={`+${n(growth.week)} this week · ${n(growth.guests)} guests`}
        />
        <Stat label="New, 30 days" value={n(growth.month)} sub="Accounts created" />
        <Stat label="Active, 24h" value={n(growth.active)} sub="Opened the game or played" />
        <Stat label="Playing now" value={n(growth.playing)} sub="A board in the last 3 minutes" />
        <Stat
          label="Checkout"
          value={formatShare(growth.buyers, growth.players)}
          sub={`${n(growth.buyers)} of ${n(growth.players)} bought a pack`}
        />
        <Stat
          label="Time to first pack"
          value={growth.lagMs == null ? "—" : formatLag(growth.lagMs)}
          sub={growth.buyers > 0 ? "Median, from sign-up" : "No pack sold yet"}
        />
      </div>
      <div className="glass brief-panel mt-3">
        <BriefChart
          id="brief-signups"
          title="Sign-ups, last 30 days"
          total={n(growth.month)}
          series={growth.series}
          labels={brief.days}
          color="var(--neon-violet)"
          formatAxis={n}
          formatPoint={n}
        />
        <p className="mt-3 text-sm text-ink-muted">
          {n(growth.clears)} cleared · {n(growth.losses)} lost · {formatPlayTime(growth.playSeconds)} played
        </p>
      </div>
    </>
  );
}

function Where({ brief }: { brief: AdminBrief }) {
  return (
    <>
      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Where they play</h2>
      <p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">
        Home country from the latest connection, and the device they signed up on.
      </p>
      <div className="brief-split">
        <Countries brief={brief} />
        <Arrival brief={brief} />
      </div>
    </>
  );
}

function Countries({ brief }: { brief: AdminBrief }) {
  const { countries } = brief;
  const max = Math.max(1, ...countries.rows.map((row) => row.players));
  return (
    <article className="glass brief-panel">
      <h3 className="text-base font-semibold tracking-tight text-ink">Countries</h3>
      <div className="brief-facts">
        <p>
          <span>Countries</span>
          <strong>{n(countries.count)}</strong>
        </p>
        <p>
          <span>Top country</span>
          <strong>{countries.top ? countryName(countries.top.code) : "—"}</strong>
          {countries.top ? (
            <em>
              {n(countries.top.players)} {countries.top.players === 1 ? "player" : "players"}
            </em>
          ) : (
            <em>No country yet</em>
          )}
        </p>
        <p>
          <span>Best revenue / player</span>
          <strong>{countries.best ? formatUsdTight(countries.best.usdPer) : "—"}</strong>
          {countries.best ? (
            <em>
              {countryName(countries.best.code)} · {n(countries.best.players)}{" "}
              {countries.best.players === 1 ? "player" : "players"}
            </em>
          ) : (
            <em>No pack in a known country</em>
          )}
        </p>
      </div>
      {countries.rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">No country on file yet.</p>
      ) : (
        <div className="mt-2">
          {countries.rows.map((row) => {
            const flag = countryFlag(row.code);
            return (
              <Link
                key={row.code ?? "unknown"}
                href={`${ADMIN_PLAYERS_PATH}?country=${row.code ?? "unknown"}`}
                className="brief-country-row"
              >
                <span className="brief-country-top">
                  <span className="brief-country-name">
                    {flag ? (
                      <span aria-hidden="true" className="mr-1.5">
                        {flag}
                      </span>
                    ) : null}
                    {countryName(row.code)}
                  </span>
                  <span className="brief-country-n">
                    {n(row.players)}
                    {row.usd > 0 ? ` · ${formatUsdTight(row.usd)}` : ""}
                  </span>
                </span>
                <span className="brief-country-bar" aria-hidden="true">
                  <span style={{ width: `${(row.players / max) * 100}%` }} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </article>
  );
}

function Arrival({ brief }: { brief: AdminBrief }) {
  const { arrival } = brief;
  const players = arrival.platforms.reduce((total, slice) => total + slice.count, 0);
  return (
    <article className="glass brief-panel">
      <h3 className="text-base font-semibold tracking-tight text-ink">Arrival</h3>
      <p className="mt-1 text-sm leading-6 text-ink-muted">Device and door recorded when the account was created.</p>
      {arrival.platforms.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">No device on file yet.</p>
      ) : (
        <>
          <Share parts={arrival.platforms.map((slice) => ({ ...slice, color: PLATFORM_COLOR[slice.key] ?? "var(--steel)" }))} />
          <ul className="brief-legend">
            {arrival.platforms.map((slice) => (
              <li key={slice.key}>
                <i style={{ background: PLATFORM_COLOR[slice.key] ?? "var(--steel)" }} />
                <span>{slice.label}</span>
                <span className="brief-legend-n">
                  {n(slice.count)}
                  <span className="brief-legend-pct">{formatShare(slice.count, players)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {arrival.methods.length > 0 ? (
        <>
          <h4 className="brief-kicker">Sign-up</h4>
          {arrival.methods.map((slice) => (
            <div key={slice.key} className="brief-line">
              <span>{slice.label}</span>
              <span>{n(slice.count)}</span>
            </div>
          ))}
        </>
      ) : null}

      <h4 className="brief-kicker">Doors</h4>
      {arrival.partners.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">No partner door yet.</p>
      ) : (
        arrival.partners.map((partner) => (
          <Link key={partner.name} href={`${ADMIN_PLAYERS_PATH}?q=${encodeURIComponent(partner.name)}`} className="brief-line">
            <span>{partner.name}</span>
            <span>{n(partner.count)}</span>
          </Link>
        ))
      )}
      <p className="mt-3 text-sm text-ink-muted">{referralLine(arrival.referrals)}</p>
    </article>
  );
}

function referralLine(count: number) {
  if (count === 0) return "No one has arrived through a share link yet.";
  if (count === 1) return "1 player signed up through a share link.";
  return `${n(count)} players signed up through a share link.`;
}

function Earn({ brief }: { brief: AdminBrief }) {
  const { earn } = brief;
  return (
    <>
      <h2 className="mt-10 text-lg font-semibold tracking-tight text-ink">Earn</h2>
      <p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">Tickets played against the ETH credited to winners.</p>
      <div className="glass brief-panel mt-4">
        <div className="stat-grid">
          <Stat plain href={ADMIN_EARN_PATH} label="Maps on sale" value={n(earn.maps)} />
          <Stat
            plain
            label="Tickets"
            value={n(earn.runs)}
            sub={`+${n(earn.runsWeek)} this week · ${formatGems(earn.ticketsGems)} gems`}
          />
          <Stat
            plain
            label="Won"
            value={earn.runs > 0 ? formatShare(earn.wins, earn.runs) : "—"}
            sub={earn.runs > 0 ? `${n(earn.wins)} won · ${n(earn.losses)} lost` : "No tickets yet"}
          />
          <Stat
            plain
            label="ETH credited"
            value={
              <>
                <EthGlyph /> {formatEth(earn.payoutEth, { unit: false })}
              </>
            }
            sub="Added to bags on a win"
          />
        </div>
        {earn.runs === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No tickets yet.</p>
        ) : (
          <>
            <Share
              parts={[
                { key: "won", count: earn.wins, color: "var(--neon-lime)" },
                { key: "lost", count: earn.losses, color: "var(--danger)" },
                { key: "open", count: earn.open, color: "var(--steel)" },
              ]}
            />
            <p className="mt-2 text-sm text-ink-muted">
              {formatShare(earn.wins, earn.runs)} won · {formatShare(earn.losses, earn.runs)} lost
              {earn.open > 0 ? ` · ${formatShare(earn.open, earn.runs)} still open` : ""}
            </p>
          </>
        )}
        <BriefChart
          id="brief-tickets"
          title="Tickets, last 30 days"
          total={n(earn.series.reduce((total, value) => total + value, 0))}
          series={earn.series}
          labels={brief.days}
          color="var(--neon-cyan)"
          formatAxis={n}
          formatPoint={n}
        />
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  href,
  tone,
  plain,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  href?: string;
  tone?: "danger";
  plain?: boolean;
}) {
  const body = (
    <>
      <p className="stat-label">{label}</p>
      <p className={`stat-n inline-flex min-w-0 flex-wrap items-center gap-1.5 ${tone === "danger" ? "text-danger" : "text-ink"}`}>
        {value}
      </p>
      {sub ? <p className="stat-sub">{sub}</p> : null}
    </>
  );
  const className = `${plain ? "stat" : "stat glass"}${href ? " block" : ""}`;
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function Tracks({ rows }: { rows: { label: string; usd: number; color: string }[] }) {
  const max = Math.max(...rows.map((row) => row.usd), 0);
  if (max <= 0) return null;
  return (
    <div className="brief-track">
      {rows.map((row) => (
        <div key={row.label} className="brief-track-row">
          <span>{row.label}</span>
          <span className="brief-track-bar" aria-hidden="true">
            <span style={{ width: `${Math.max(0, (row.usd / max) * 100)}%`, background: row.color }} />
          </span>
          <span>{formatUsd(row.usd)}</span>
        </div>
      ))}
    </div>
  );
}

function Share({ parts }: { parts: { key: string; count: number; color: string }[] }) {
  const total = parts.reduce((sum, part) => sum + part.count, 0);
  if (total <= 0) return null;
  return (
    <div className="brief-share mt-4" aria-hidden="true">
      {parts
        .filter((part) => part.count > 0)
        .map((part) => (
          <i key={part.key} style={{ width: `${(part.count / total) * 100}%`, background: part.color }} />
        ))}
    </div>
  );
}

function BriefChart({
  id,
  title,
  total,
  series,
  labels,
  color,
  formatAxis,
  formatPoint,
}: {
  id: string;
  title: string;
  total: string;
  series: number[];
  labels: string[];
  color: string;
  formatAxis: (value: number) => string;
  formatPoint: (value: number) => string;
}) {
  const width = 100;
  const height = 36;
  const max = Math.max(...series, 0);
  const span = max === 0 ? 1 : max;
  const last = Math.max(0, series.length - 1);
  const points = series.map((value, index) => {
    const x = series.length <= 1 ? width / 2 : (index / last) * width;
    const y = height - 1 - (value / span) * (height - 2);
    return [x, y] as const;
  });
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point[0].toFixed(2)} ${point[1].toFixed(2)}`).join(" ");
  const area =
    points.length > 0
      ? `${line} L${points[points.length - 1][0].toFixed(2)} ${height} L${points[0][0].toFixed(2)} ${height} Z`
      : "";
  const axis = axisLabels(labels);

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="stat-label">{title}</p>
        <p className="text-sm font-semibold tabular-nums text-ink">{total}</p>
      </div>
      <div className="brief-chart">
        <div className="brief-chart-y">
          <span>{formatAxis(max)}</span>
          <span>{formatAxis(0)}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${title}: ${total}`}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.38" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.33, 0.66].map((mark) => (
            <line
              key={mark}
              x1="0"
              x2={width}
              y1={height * mark}
              y2={height * mark}
              stroke="var(--hairline)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {area ? <path d={area} fill={`url(#${id})`} /> : null}
          {line ? (
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        <div className="brief-chart-x">
          {axis.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
      <details className="brief-details">
        <summary>Daily figures</summary>
        <ol>
          {series.map((value, index) => (
            <li key={labels[index] ?? index}>
              <span>{labels[index]}</span>
              <span>{formatPoint(value)}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

function axisLabels(labels: string[]) {
  if (labels.length <= 1) return labels;
  const mid = labels[Math.floor((labels.length - 1) / 2)];
  return [...new Set([labels[0], mid, labels[labels.length - 1]])];
}

function Jump({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <li>
      <Link href={href} className="glass block min-h-11 p-5">
        <p className="text-base font-semibold tracking-tight text-ink">{title}</p>
        <p className="mt-1 text-sm leading-6 text-ink-muted">{body}</p>
      </Link>
    </li>
  );
}

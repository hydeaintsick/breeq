/**
 * The Earn economy, as numbers.
 *
 * Two balances per player: gems (bought, spent on tickets and publishing)
 * and ETH (won, withdrawn). An admin fixes the USD price of a gem and a
 * reference ETH price; a win pays `winMultiplier` × the ticket's USD value,
 * converted to ETH at that reference and locked in when the ticket is paid.
 *
 * ETH is stored in gwei as a BigInt (1 ETH = 1e9 gwei): integer math in the
 * database, atomic increments, and no floating balances. Everything here is
 * pure; the database side is `lib/earn.ts`.
 */

export const ECONOMY_ID = "economy";
export const GWEI_PER_ETH = 1_000_000_000n;

export type GemPack = {
  gems: number;
  /** 0–90. Taken off the list price (gems × gem price). */
  discountPct: number;
  /** A short badge: "Most popular", "Best value". Empty for none. */
  tag: string;
};

export type Economy = {
  gemPriceUsd: number;
  ethPriceUsd: number;
  winMultiplier: number;
  withdrawMinEth: number;
  publishCostGems: number;
  ticketMinGems: number;
  ticketMaxGems: number;
  ticketDefaultGems: number;
  packs: GemPack[];
};

/** The first packs: five bags, the discount grows with the bag. */
export const DEFAULT_PACKS: GemPack[] = [
  { gems: 100, discountPct: 0, tag: "" },
  { gems: 250, discountPct: 5, tag: "" },
  { gems: 500, discountPct: 10, tag: "Most popular" },
  { gems: 1000, discountPct: 15, tag: "" },
  { gems: 10000, discountPct: 25, tag: "Best value" },
];

/** With these, a default ticket (100 gems = $2) wins $3, about 0.001 ETH. */
export const DEFAULT_ECONOMY: Economy = {
  gemPriceUsd: 0.02,
  ethPriceUsd: 3000,
  winMultiplier: 1.5,
  withdrawMinEth: 0.001,
  publishCostGems: 50,
  ticketMinGems: 20,
  ticketMaxGems: 500,
  ticketDefaultGems: 100,
  packs: DEFAULT_PACKS,
};

/** Stripe's smallest charge is $0.50. */
export const MIN_CHARGE_CENTS = 50;

export function clampNumber(value: unknown, lo: number, hi: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

/** Read packs out of the stored JSON; anything malformed falls back to the defaults. */
export function parsePacks(raw: unknown): GemPack[] {
  if (!Array.isArray(raw)) return DEFAULT_PACKS;
  const packs: GemPack[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    const gems = Math.round(clampNumber(record.gems, 1, 1_000_000, 0));
    if (gems <= 0) continue;
    packs.push({
      gems,
      discountPct: clampNumber(record.discountPct, 0, 90, 0),
      tag: typeof record.tag === "string" ? record.tag.slice(0, 24) : "",
    });
  }
  packs.sort((a, b) => a.gems - b.gems);
  return packs.length > 0 ? packs : DEFAULT_PACKS;
}

/** List price of a pack in cents before the discount. */
export function packListCents(gems: number, economy: Pick<Economy, "gemPriceUsd">) {
  return Math.round(gems * economy.gemPriceUsd * 100);
}

/** What the player pays for a pack, in cents, never under Stripe's minimum. */
export function packPriceCents(pack: GemPack, economy: Pick<Economy, "gemPriceUsd">) {
  const list = packListCents(pack.gems, economy);
  const priced = Math.round(list * (1 - pack.discountPct / 100));
  return Math.max(MIN_CHARGE_CENTS, priced);
}

/** Effective USD per gem for a pack, for the "you save" line. */
export function packUnitUsd(pack: GemPack, economy: Pick<Economy, "gemPriceUsd">) {
  return packPriceCents(pack, economy) / 100 / pack.gems;
}

export type Payout = {
  /** USD the win pays. */
  usd: number;
  /** Same, in ETH at the reference price. */
  eth: number;
  /** Same, in gwei — what is credited. */
  gwei: bigint;
};

/** What clearing a map with this ticket pays, at today's numbers. */
export function payoutFor(
  ticketGems: number,
  economy: Pick<Economy, "gemPriceUsd" | "ethPriceUsd" | "winMultiplier">,
): Payout {
  const usd = ticketGems * economy.gemPriceUsd * economy.winMultiplier;
  const eth = economy.ethPriceUsd > 0 ? usd / economy.ethPriceUsd : 0;
  return { usd, eth, gwei: ethToGwei(eth) };
}

export function ticketUsd(ticketGems: number, economy: Pick<Economy, "gemPriceUsd">) {
  return ticketGems * economy.gemPriceUsd;
}

export function clampTicket(value: unknown, economy: Pick<Economy, "ticketMinGems" | "ticketMaxGems" | "ticketDefaultGems">) {
  return Math.round(clampNumber(value, economy.ticketMinGems, economy.ticketMaxGems, economy.ticketDefaultGems));
}

// --- ETH units ---------------------------------------------------------------

export function ethToGwei(eth: number): bigint {
  if (!Number.isFinite(eth) || eth <= 0) return 0n;
  return BigInt(Math.round(eth * 1e9));
}

export function gweiToEth(gwei: bigint | number | string): number {
  return Number(BigInt(gwei)) / 1e9;
}

/** "0.0010 ETH" style: four decimals for small sums, fewer as they grow. */
export function formatEth(eth: number, options: { unit?: boolean } = {}) {
  const abs = Math.abs(eth);
  const digits = abs === 0 ? 3 : abs < 0.01 ? 4 : abs < 1 ? 4 : 3;
  const text = eth.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return options.unit === false ? text : `${text} ETH`;
}

export function formatGwei(gwei: bigint | number | string, options: { unit?: boolean } = {}) {
  return formatEth(gweiToEth(gwei), options);
}

export function formatUsd(usd: number) {
  return usd.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCents(cents: number) {
  return formatUsd(cents / 100);
}

export function formatGems(gems: number) {
  return Math.round(gems).toLocaleString("en-US");
}

/** TikTok-style counts: 12.4K, 1.2M. */
export function formatCount(n: number) {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function isHexAddress(value: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

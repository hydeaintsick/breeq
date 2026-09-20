/**
 * Energy: the Story mode's daily budget of runs, Duolingo's hearts in a
 * reactor's clothes. Pure rules — no Prisma, no DOM — shared by the server
 * actions, the header pill, the play button, the end screens and the shop.
 *
 * The gauge holds `ENERGY_MAX` cells. A run costs `ENERGY_PLAY_COST`, a clear
 * gives `ENERGY_CLEAR_REFUND` back (never past the max). Full at 00:00 UTC for
 * everyone at once — six cells, so a day is three runs if every ball is lost
 * and five if every wall comes down. Cells bought with gems stack past the max
 * and survive the midnight recharge, which only ever tops up to the max.
 */

/** Cells in a full gauge. */
export const ENERGY_MAX = 6;
/** Cells a run takes when the ball is served. */
export const ENERGY_PLAY_COST = 2;
/** Cells a clear gives back (only while the gauge is under the max). */
export const ENERGY_CLEAR_REFUND = 1;
/**
 * A sanity ceiling on the gauge, far above anything a player buys: bought
 * cells always land (clamped here, never refused), so a recharge can never
 * take gems and give nothing back.
 */
export const ENERGY_CEIL = 9999;

/** What every surface reads: the cells now, the max, and when the free recharge lands. */
export type EnergyState = {
  energy: number;
  max: number;
  /** ISO time of the next 00:00 UTC. */
  resetAt: string;
};

/** A recharge on sale for gems. `cells` stack past the max. */
export type EnergyPack = {
  id: "spark" | "charge" | "overdrive";
  cells: number;
  gems: number;
  name: string;
  /** One line under the name. */
  line: string;
  /** A short badge, or empty. */
  tag: string;
};

export const ENERGY_PACKS: readonly EnergyPack[] = [
  { id: "spark", cells: 2, gems: 20, name: "Spark", line: "One more run, right now.", tag: "" },
  { id: "charge", cells: 6, gems: 50, name: "Full charge", line: "A whole day's worth of cells.", tag: "Most popular" },
  { id: "overdrive", cells: 12, gems: 90, name: "Overdrive", line: "Two days of runs, banked past the max.", tag: "Best value" },
];

export function energyPack(id: unknown): EnergyPack | null {
  return ENERGY_PACKS.find((pack) => pack.id === id) ?? null;
}

/** `YYYY-MM-DD` of the UTC day `at` falls in: the key a recharge is filed under. */
export function energyDayKey(at = new Date()): string {
  return at.toISOString().slice(0, 10);
}

/** The next 00:00 UTC after `at`. */
export function nextEnergyReset(at = new Date()): Date {
  const next = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate() + 1));
  return next;
}

export function toEnergyState(energy: number | null | undefined, at = new Date()): EnergyState {
  return {
    energy: Math.max(0, Math.min(ENERGY_CEIL, Math.floor(energy ?? ENERGY_MAX))),
    max: ENERGY_MAX,
    resetAt: nextEnergyReset(at).toISOString(),
  };
}

/** True when a run can be served. */
export function canSpendEnergy(state: Pick<EnergyState, "energy">, cost = ENERGY_PLAY_COST): boolean {
  return state.energy >= cost;
}

/** Full runs left in the gauge at the current cost. */
export function runsLeft(energy: number, cost = ENERGY_PLAY_COST): number {
  return Math.max(0, Math.floor(energy / cost));
}

/**
 * The client's view of the midnight recharge: once `resetAt` is behind us the
 * gauge reads full (never below what it already held) and the next reset is a
 * day on. The server does the same on its next read, so nothing is owed.
 */
export function rolledEnergy(state: EnergyState, now = new Date()): EnergyState {
  if (new Date(state.resetAt).getTime() > now.getTime()) return state;
  return { energy: Math.max(state.energy, state.max), max: state.max, resetAt: nextEnergyReset(now).toISOString() };
}

/** "5h 12m", "42m", "<1m": the wait until `resetAt`. */
export function formatEnergyWait(resetAt: string, now = new Date()): string {
  const ms = new Date(resetAt).getTime() - now.getTime();
  if (ms <= 0) return "now";
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 1) return "<1m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** "05:12:33": the wait until `resetAt`, for a live clock. */
export function formatEnergyClock(resetAt: string, now = new Date()): string {
  const ms = Math.max(0, new Date(resetAt).getTime() - now.getTime());
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

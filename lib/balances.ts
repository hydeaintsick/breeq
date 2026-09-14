import { prisma } from "@/lib/prisma";

/**
 * Make sure a player's document carries `gems` and `ethGwei` before any
 * `increment` / `decrement` touches them.
 *
 * Accounts created before the Earn fields existed hold no such keys (or a
 * `null` left by an older write). Prisma reads both as the default 0, but
 * Mongo's `$inc` quietly skips them and a `{ gte }` filter never matches — so
 * a top-up would credit nothing and a ticket could never be bought. In Mongo
 * `{ field: null }` matches missing and null alike; one `$set` per such key,
 * a no-op once the numbers exist, keeps every balance write atomic.
 */
export async function ensureBalanceFields(userId: string): Promise<void> {
  await prisma.$runCommandRaw({
    update: "User",
    updates: [
      {
        q: { _id: { $oid: userId }, gems: null },
        u: { $set: { gems: 0 } },
      },
      {
        q: { _id: { $oid: userId }, ethGwei: null },
        u: { $set: { ethGwei: { $numberLong: "0" } } },
      },
    ],
  });
}

/** The same repair for every account at once (one-off backfill, admin tools). */
export async function ensureAllBalanceFields(): Promise<void> {
  await prisma.$runCommandRaw({
    update: "User",
    updates: [
      { q: { gems: null }, u: { $set: { gems: 0 } }, multi: true },
      { q: { ethGwei: null }, u: { $set: { ethGwei: { $numberLong: "0" } } }, multi: true },
    ],
  });
}

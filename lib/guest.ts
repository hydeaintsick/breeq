import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/auth/paths";
import { guestUsername, isStockGuestHandle } from "@/lib/auth/username";
import { stampSignup } from "@/lib/presence";
import { applyPartner } from "@/lib/partner";
import { applyReferral } from "@/lib/referrals";
import { doorKeyOk, guestPlaceholderEmail, isGuestPlaceholder } from "@/lib/guest-door";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export type GuestUser = {
  id: string;
  role: Role;
  username: string | null;
  name: string | null;
  email: string | null;
};

/** One-way hash of the raw Android install id. The raw value is never stored. */
export function hashInstall(raw: string) {
  return createHash("sha256").update(raw.trim()).digest("hex");
}

export function newDoorKey() {
  return randomBytes(32).toString("hex");
}

export function sessionCookie() {
  const secure = (process.env.AUTH_URL ?? "").startsWith("https://");
  return {
    secure,
    name: `${secure ? "__Secure-" : ""}authjs.session-token`,
    maxAge: SESSION_MAX_AGE,
  };
}

/** Auth.js session for a user we just found or created. Salt is the cookie name. */
export async function sessionTokenFor(user: GuestUser) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is missing");
  }
  const cookie = sessionCookie();
  return encode({
    token: {
      sub: user.id,
      role: user.role,
      username: user.username,
      name: user.name,
      email: isGuestPlaceholder(user.email) ? null : user.email,
    },
    secret,
    salt: cookie.name,
    maxAge: cookie.maxAge,
  });
}

/**
 * A guest still has nothing but this phone: no email, no password, no Google.
 * Saving any of those is what a payment is allowed to sit on.
 */
export async function isUnclaimed(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      signupMethod: true,
      passwordHash: true,
      email: true,
      accounts: { where: { provider: "google" }, select: { id: true }, take: 1 },
    },
  });
  if (!user || user.signupMethod !== "guest") return false;
  if (user.passwordHash || !isGuestPlaceholder(user.email)) return false;
  return user.accounts.length === 0;
}

/**
 * Guests minted as "player" pick up an animal handle the next time the menu
 * or the account page asks. A name they chose themselves stays.
 */
export async function repairGuestUsername(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, name: true, email: true, signupMethod: true },
  });
  if (!user) return null;

  const current = user.username ?? "";
  const generic =
    user.signupMethod === "guest" &&
    isGuestPlaceholder(user.email) &&
    (current.length === 0 || isStockGuestHandle(current));
  if (!generic) return user.username;

  const next = await guestUsername();
  const renamed = await prisma.user.updateMany({
    where: { id: userId, username: user.username },
    data: {
      username: next,
      name: !user.name || user.name === "Player" || user.name === current ? next : user.name,
    },
  });
  if (renamed.count > 0) return next;

  const again = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  return again?.username ?? next;
}

/** The same install key always comes back to the same user. */
export async function resumeOrCreateGuest(installKey: string): Promise<GuestUser> {
  if (!doorKeyOk(installKey)) {
    throw new Error("install key is not a hash");
  }

  const existing = await prisma.user.findFirst({
    where: { installKey },
    select: { id: true, role: true, username: true, name: true, email: true },
  });
  if (existing) return existing;

  const username = await guestUsername();
  try {
    const created = await prisma.user.create({
      data: {
        username,
        name: username,
        role: "PLAYER",
        installKey,
        // Email is unique, and Mongo stores a missing one as null — only one
        // account in the database could exist without an address. A placeholder
        // on a reserved domain keeps the slot free until they claim a real one.
        email: guestPlaceholderEmail(installKey),
      },
      select: { id: true, role: true, username: true, name: true, email: true },
    });
    await stampSignup(created.id, "guest");
    await applyPartner(created.id);
    return created;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const again = await prisma.user.findFirst({
        where: { installKey },
        select: { id: true, role: true, username: true, name: true, email: true },
      });
      if (again) return again;
    }
    throw error;
  }
}

type GoogleLink = {
  guestId: string;
  email: string;
  providerAccountId: string;
  type: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
};

/**
 * Hang this Google account on the guest. If it already belongs to someone
 * else, leave the guest session where it is and say so — never swap roads.
 */
export async function attachGoogleClaim(input: GoogleLink): Promise<"linked" | "taken" | "skip"> {
  const email = input.email.trim().toLowerCase();
  const guest = await prisma.user.findUnique({
    where: { id: input.guestId },
    select: { id: true },
  });
  if (!guest || !email || !input.providerAccountId) return "skip";

  const existing = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: input.providerAccountId,
      },
    },
    select: { userId: true },
  });
  if (existing && existing.userId !== guest.id) return "taken";

  const owner = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (owner && owner.id !== guest.id) return "taken";

  if (!existing) {
    try {
      await prisma.account.create({
        data: {
          userId: guest.id,
          type: input.type || "oidc",
          provider: "google",
          providerAccountId: input.providerAccountId,
          access_token: input.access_token ?? null,
          refresh_token: input.refresh_token ?? null,
          expires_at: input.expires_at ?? null,
          token_type: input.token_type ?? null,
          scope: input.scope ?? null,
          id_token: input.id_token ?? null,
          session_state: input.session_state ?? null,
        },
      });
    } catch {
      return "taken";
    }
  }

  if (!owner) {
    await prisma.user.update({
      where: { id: guest.id },
      data: { email, emailVerified: new Date() },
    });
  }

  await applyReferral(guest.id);
  await applyPartner(guest.id);
  return "linked";
}

/** Fields we copy off the Auth.js account object. Tokens stay optional. */
export function googleLinkFromAccount(
  guestId: string,
  email: string,
  account: {
    type?: string;
    providerAccountId?: string;
    access_token?: string | null;
    refresh_token?: string | null;
    expires_at?: number | null;
    token_type?: string | null;
    scope?: string | null;
    id_token?: string | null;
    session_state?: string | null;
  },
): GoogleLink | null {
  if (!account.providerAccountId) return null;
  const state = account.session_state;
  return {
    guestId,
    email,
    providerAccountId: account.providerAccountId,
    type: account.type ?? "oidc",
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expires_at: account.expires_at,
    token_type: account.token_type,
    scope: account.scope,
    id_token: account.id_token,
    session_state: typeof state === "string" ? state : null,
  };
}

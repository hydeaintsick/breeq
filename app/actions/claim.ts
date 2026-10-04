"use server";

import { hash } from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { CLAIM_BACK_COOKIE, CLAIM_COOKIE, isGuestPlaceholder, safeNext } from "@/lib/guest-door";
import { isUnclaimed, sessionCookie } from "@/lib/guest";
import { applyReferral } from "@/lib/referrals";

function claimCookieOptions() {
  const { secure } = sessionCookie();
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 10 * 60,
  };
}

/** Remember which guest a Google round-trip should attach to, and where to return. */
export async function beginGoogleClaim(back: string): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();
  if (!(await isUnclaimed(user.id))) {
    return { error: "This road is already saved." };
  }

  const jar = await cookies();
  const options = claimCookieOptions();
  jar.set(CLAIM_COOKIE, user.id, options);
  jar.set(CLAIM_BACK_COOKIE, safeNext(back), options);
  return { ok: true };
}

/** Drop the claim cookies so the next Google sign-in opens that account instead. */
export async function cancelGoogleClaim(): Promise<{ ok: true }> {
  const jar = await cookies();
  jar.delete(CLAIM_COOKIE);
  jar.delete(CLAIM_BACK_COOKIE);
  return { ok: true };
}

/**
 * Put an email and password on the guest. Same user id, same progress.
 * An email that already has a road is refused; the guest stays signed in.
 */
export async function claimWithPassword(input: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { error: string } | { taken: true }> {
  const user = await requireUser();
  if (!(await isUnclaimed(user.id))) {
    return { error: "This road is already saved." };
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email.includes("@") || email.length > 254 || isGuestPlaceholder(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true },
  });
  if (!current || !isGuestPlaceholder(current.email)) {
    return { error: "This road is already saved." };
  }

  const owner = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (owner && owner.id !== user.id) {
    return { taken: true };
  }

  const passwordHash = await hash(password, 12);
  const updated = await prisma.user.updateMany({
    where: { id: user.id, email: current.email, passwordHash: null },
    data: { email, passwordHash, passwordSetAt: new Date() },
  });
  if (updated.count === 0) {
    return { error: "Could not save this road. Try again." };
  }

  await applyReferral(user.id);
  return { ok: true };
}

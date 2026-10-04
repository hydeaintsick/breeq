import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Partner attribution. A click on `/p/<partner>?origin_user_email=` is a
 * top-level visit, so the cookie is first-party (an iframe on Plypto cannot
 * keep one). Sign-up, and a click from someone already signed in, copy it
 * onto the user once.
 */

export const PARTNER_COOKIE = "breeq-partner";
export const PARTNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isPartnerSlug(value: string): boolean {
  return SLUG.test(value);
}

/** A partner-supplied address, or null when it is missing or not an email. */
export function partnerEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !EMAIL.test(email)) return null;
  return email;
}

export function partnerCookieValue(partner: string, email: string | null) {
  // The cookie API encodes the value. An email has no colon, so this splits cleanly on the way back.
  return email ? `${partner}:${email}` : partner;
}

export function parsePartnerCookie(raw: string | undefined): { partner: string; email: string | null } | null {
  if (!raw) return null;
  const colon = raw.indexOf(":");
  const partner = (colon === -1 ? raw : raw.slice(0, colon)).trim().toLowerCase();
  if (!isPartnerSlug(partner)) return null;
  if (colon === -1) return { partner, email: null };
  return { partner, email: partnerEmail(raw.slice(colon + 1)) };
}

/** `/p/plypto?origin_user_email=` — the click Plypto should open. */
export function partnerPath(partner: string, email?: string | null) {
  const safe = partnerEmail(email);
  return safe ? `/p/${partner}?origin_user_email=${encodeURIComponent(safe)}` : `/p/${partner}`;
}

type Attribution = { partner: string; email: string | null };

/**
 * Write the attribution once. A different partner already stored is left
 * alone. A later click from the same partner can fill an email that was missing.
 * Returns false when there is no such user.
 */
export async function stampPartner(userId: string, attribution: Attribution): Promise<boolean> {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { partner: true, partnerEmail: true, partnerAt: true },
  });
  if (!current) return false;
  if (current.partner && current.partner !== attribution.partner) return true;

  const email = current.partnerEmail ?? attribution.email;
  if (current.partner === attribution.partner && current.partnerEmail === email) return true;

  await prisma.user.update({
    where: { id: userId },
    data: {
      partner: attribution.partner,
      partnerEmail: email,
      partnerAt: current.partnerAt ?? new Date(),
    },
  });
  return true;
}

/** Copy the partner cookie onto this account, then drop the cookie. Never throws. */
export async function applyPartner(userId: string): Promise<void> {
  let jar: Awaited<ReturnType<typeof cookies>>;
  try {
    jar = await cookies();
  } catch {
    return;
  }
  const parsed = parsePartnerCookie(jar.get(PARTNER_COOKIE)?.value);
  if (!parsed) return;

  try {
    const found = await stampPartner(userId, parsed);
    if (!found) return;
  } catch (error) {
    console.error("applyPartner failed", error);
    return;
  }

  try {
    jar.delete(PARTNER_COOKIE);
  } catch {
    // Read-only cookie store: the cookie expires on its own.
  }
}

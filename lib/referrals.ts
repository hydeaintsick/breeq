import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { creditGems } from "@/lib/purchases";
import {
  isReferralCode,
  isShareSource,
  REFERRAL_CODE_ALPHABET,
  REFERRAL_CODE_LENGTH,
  REFERRAL_COOKIE,
  REFERRAL_GEMS,
  REFERRAL_MAX_PAID,
  type ShareSource,
} from "@/lib/share";

function newCode() {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
    code += REFERRAL_CODE_ALPHABET[randomInt(REFERRAL_CODE_ALPHABET.length)];
  }
  return code;
}

async function userByCode(code: string) {
  return prisma.user.findFirst({
    where: { referralCode: code },
    select: { id: true, referralCode: true, username: true, name: true },
  });
}

/**
 * The player's share code, minted on first use. The raw update only writes
 * where the field is still null or missing (accounts predate the field), so two
 * concurrent first calls agree on one code. The code space is 31^8; a fresh
 * code is still checked against the table before it is written.
 */
export async function getReferralCode(userId: string): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (row?.referralCode) return row.referralCode;
    if (!row) throw new Error("getReferralCode: unknown user");
    const code = newCode();
    if (await userByCode(code)) continue;
    await prisma.$runCommandRaw({
      update: "User",
      updates: [
        {
          q: { _id: { $oid: userId }, referralCode: null },
          u: { $set: { referralCode: code } },
        },
      ],
    });
  }
  throw new Error("getReferralCode: could not mint a code");
}

export type Referrer = { id: string; code: string; username: string | null; name: string | null };

/** The player behind a share code, or null for anything that is not a live code. */
export async function findReferrer(codeRaw: string | null | undefined): Promise<Referrer | null> {
  const code = (codeRaw ?? "").trim().toLowerCase();
  if (!isReferralCode(code)) return null;
  const user = await userByCode(code);
  if (!user?.referralCode) return null;
  return { id: user.id, code: user.referralCode, username: user.username, name: user.name };
}

export function referralCookieValue(code: string, via: ShareSource | null) {
  return via ? `${code}:${via}` : code;
}

function parseReferralCookie(raw: string | undefined): { code: string; via: ShareSource | null } | null {
  if (!raw) return null;
  const [code = "", via] = raw.split(":");
  if (!isReferralCode(code)) return null;
  return { code, via: isShareSource(via) ? via : null };
}

/**
 * Pay the referrer of a brand-new account, if a referral cookie came along.
 * Called right after the user row exists, from every sign-up path (email,
 * Google, wallet). Never throws: a missing or stale cookie, a self-referral or
 * an account already referred all end quietly. The unique `referredId` is the
 * gate, so a double call pays once. Past `REFERRAL_MAX_PAID` paid sign-ups the
 * referral is still recorded (gems 0) but nothing is credited.
 */
export async function applyReferral(newUserId: string): Promise<void> {
  let jar: Awaited<ReturnType<typeof cookies>>;
  try {
    jar = await cookies();
  } catch {
    return;
  }
  const parsed = parseReferralCookie(jar.get(REFERRAL_COOKIE)?.value);
  if (!parsed) return;

  try {
    const referrer = await userByCode(parsed.code);
    if (!referrer || referrer.id === newUserId) return;

    const paidSoFar = await prisma.referral.count({
      where: { referrerId: referrer.id, gems: { gt: 0 } },
    });
    const gems = paidSoFar < REFERRAL_MAX_PAID ? REFERRAL_GEMS : 0;

    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: newUserId,
        gems,
        via: parsed.via,
      },
    });
    if (gems > 0) {
      const joined = await prisma.user.findUnique({
        where: { id: newUserId },
        select: { username: true },
      });
      await creditGems({
        userId: referrer.id,
        gems,
        kind: "REFERRAL",
        ref: referral.id,
        note: joined?.username ? `@${joined.username} joined` : "A friend joined",
      });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    console.error("applyReferral failed", error);
    return;
  }

  try {
    jar.delete(REFERRAL_COOKIE);
  } catch {
    // Read-only cookie store (some Auth.js callbacks): the cookie expires on its own.
  }
}

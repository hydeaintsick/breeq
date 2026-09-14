import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH } from "@/lib/auth/paths";
import { findReferrer, referralCookieValue } from "@/lib/referrals";
import { isShareSource, REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE } from "@/lib/share";

/**
 * The public door in every share link. A live code drops the referral cookie
 * and lands on sign-in with the inviter named; anything else goes home. The
 * cookie is `Lax`, so it survives the Google round trip (a top-level redirect).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const referrer = await findReferrer(code);

  if (!referrer) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  const viaRaw = request.nextUrl.searchParams.get("via");
  const via = isShareSource(viaRaw) ? viaRaw : null;
  const target = new URL(LOGIN_PATH, request.nextUrl);
  target.searchParams.set("invite", referrer.code);

  const response = NextResponse.redirect(target);
  response.cookies.set(REFERRAL_COOKIE, referralCookieValue(referrer.code, via), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  });
  return response;
}

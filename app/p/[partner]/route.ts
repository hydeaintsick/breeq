import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { GAME_MENU_PATH, LOGIN_PATH } from "@/lib/auth/paths";
import {
  isPartnerSlug,
  PARTNER_COOKIE,
  PARTNER_COOKIE_MAX_AGE,
  partnerCookieValue,
  partnerEmail,
  stampPartner,
} from "@/lib/partner";

/**
 * The click Plypto opens. Sets the partner cookie and lands on sign-in.
 * Someone already signed in is tagged immediately and sent into the game.
 * The email stays in the cookie, not in the address they land on.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ partner: string }> }) {
  const { partner: raw } = await params;
  const partner = raw.trim().toLowerCase();
  if (!isPartnerSlug(partner)) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  const email = partnerEmail(
    request.nextUrl.searchParams.get("origin_user_email") ?? request.nextUrl.searchParams.get("email"),
  );

  const session = await auth();
  if (session?.user?.id) {
    await stampPartner(session.user.id, { partner, email });
    const response = NextResponse.redirect(new URL(GAME_MENU_PATH, request.nextUrl));
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const target = new URL(LOGIN_PATH, request.nextUrl);
  target.searchParams.set("utm_source", partner);
  target.searchParams.set("utm_medium", "partner");
  const response = NextResponse.redirect(target);
  response.cookies.set(PARTNER_COOKIE, partnerCookieValue(partner, email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PARTNER_COOKIE_MAX_AGE,
  });
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

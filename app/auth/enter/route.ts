import { NextResponse, type NextRequest } from "next/server";
import { CONTINUE_PATH, LOGIN_PATH } from "@/lib/auth/paths";
import {
  DOOR_COOKIE,
  DOOR_PARAM,
  INSTALL_HEADER,
  doorKeyOk,
  doorQueryMatches,
  isAndroidGuest,
  requestOrigin,
  safeNext,
} from "@/lib/guest-door";
import { hashInstall, newDoorKey, resumeOrCreateGuest, sessionCookie, sessionTokenFor } from "@/lib/guest";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * The only door that mints a guest. The proxy rewrites an Android cold start
 * (install header on the request) or `?door=<token>` here, so the header is
 * still on this request. A bare visit redirects to the login page.
 */
export async function GET(request: NextRequest) {
  const userAgent = request.headers.get("user-agent");
  const install = request.headers.get(INSTALL_HEADER)?.trim() ?? "";
  const door = doorQueryMatches(request.nextUrl.searchParams.get(DOOR_PARAM));
  const android = isAndroidGuest(userAgent, install);

  if (!door && !android) {
    return NextResponse.redirect(new URL(LOGIN_PATH, requestOrigin(request.headers, request.nextUrl.origin)));
  }

  const origin = requestOrigin(request.headers, request.nextUrl.origin);
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const launch = request.nextUrl.searchParams.get("launch") === "1";
  const dest = launch ? CONTINUE_PATH : next;

  const session = await auth();
  if (session?.user) {
    return NextResponse.redirect(new URL(dest, origin));
  }

  let installKey: string | null = null;
  let rememberDoor = false;
  if (android) {
    installKey = hashInstall(install);
  } else {
    const saved = request.cookies.get(DOOR_COOKIE)?.value ?? null;
    installKey = doorKeyOk(saved) ? saved : newDoorKey();
    rememberDoor = true;
  }

  if (!installKey) {
    return NextResponse.redirect(new URL(LOGIN_PATH, origin));
  }

  try {
    const user = await resumeOrCreateGuest(installKey);
    const token = await sessionTokenFor(user);
    const cookie = sessionCookie();
    const response = NextResponse.redirect(new URL(dest, origin));
    response.cookies.set(cookie.name, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: cookie.secure,
      path: "/",
      maxAge: cookie.maxAge,
    });
    if (rememberDoor) {
      response.cookies.set(DOOR_COOKIE, installKey, {
        httpOnly: true,
        sameSite: "lax",
        secure: cookie.secure,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return response;
  } catch (error) {
    console.error("guest enter failed", error);
    return NextResponse.redirect(new URL(LOGIN_PATH, origin));
  }
}

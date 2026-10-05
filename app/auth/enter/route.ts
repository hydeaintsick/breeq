import { NextResponse, type NextRequest } from "next/server";
import { CONTINUE_PATH, LOGIN_PATH } from "@/lib/auth/paths";
import {
  APP_COOKIE,
  DOOR_COOKIE,
  DOOR_PARAM,
  INSTALL_HEADER,
  canonicalOrigin,
  doorKeyOk,
  doorQueryMatches,
  isAndroidGuest,
  isBreeqApp,
  requestOrigin,
  safeNext,
} from "@/lib/guest-door";
import { hashInstall, newDoorKey, resumeOrCreateGuest, sessionCookie, sessionTokenFor } from "@/lib/guest";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * The only door that mints a guest. The app arrives here on a cold start
 * (`BreeqApp/` in the user agent, install header when the redirect kept it)
 * or the proxy rewrites a signed-out game page here. A computer uses
 * `?door=<token>`. A bare visit redirects to the login page.
 */
export async function GET(request: NextRequest) {
  const userAgent = request.headers.get("user-agent");
  const install = request.headers.get(INSTALL_HEADER)?.trim() ?? "";
  const door = doorQueryMatches(request.nextUrl.searchParams.get(DOOR_PARAM));
  const app = isBreeqApp(userAgent);
  const android = isAndroidGuest(userAgent, install);

  const origin = canonicalOrigin(requestOrigin(request.headers, request.nextUrl.origin));

  if (!door && !app) {
    return NextResponse.redirect(new URL(LOGIN_PATH, origin));
  }

  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const launch = request.nextUrl.searchParams.get("launch") === "1";
  const dest = launch ? CONTINUE_PATH : next;

  const session = await auth();
  if (session?.user) {
    return NextResponse.redirect(new URL(dest, origin));
  }

  let installKey: string | null = null;
  let rememberDoor = false;
  let rememberApp = false;
  if (android) {
    installKey = hashInstall(install);
    rememberApp = true;
  } else if (app) {
    const saved = request.cookies.get(APP_COOKIE)?.value ?? null;
    installKey = doorKeyOk(saved) ? saved : newDoorKey();
    rememberApp = true;
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
    if (rememberApp) {
      response.cookies.set(APP_COOKIE, installKey, {
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

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  CONTINUE_PATH,
  ENTER_PATH,
  GAME_MENU_PATH,
  LOGIN_PATH,
  homePath,
} from "@/lib/auth/paths";
import {
  DOOR_PARAM,
  INSTALL_HEADER,
  LAUNCH_HEADER,
  doorQueryMatches,
  isAndroidGuest,
  isAppLaunch,
} from "@/lib/guest-door";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const isLoggedIn = Boolean(req.auth?.user);
  const userAgent = req.headers.get("user-agent");

  // Partner previews (Plypto and the like). Public, unindexed, and allowed
  // to be framed. The header lets the root layout skip the leaderboard read.
  if (pathname === "/embed" || pathname.startsWith("/embed/")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-breeq-embed", "1");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // The guest mint reads the install header. A redirect would drop it.
  if (pathname === ENTER_PATH) {
    return NextResponse.next();
  }

  if (pathname === LOGIN_PATH || pathname.startsWith("/login/")) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(homePath(role), req.nextUrl));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/auth/")) {
    if (!isLoggedIn) {
      const url = new URL(LOGIN_PATH, req.nextUrl);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/game")) {
    if (!isLoggedIn) {
      const install = req.headers.get(INSTALL_HEADER);
      const guest =
        isAndroidGuest(userAgent, install) || doorQueryMatches(req.nextUrl.searchParams.get(DOOR_PARAM));
      if (guest) {
        const url = req.nextUrl.clone();
        url.pathname = ENTER_PATH;
        url.searchParams.set("next", pathname);
        if (isAppLaunch(userAgent, req.headers.get(LAUNCH_HEADER))) {
          url.searchParams.set("launch", "1");
        }
        return NextResponse.rewrite(url);
      }
      const url = new URL(LOGIN_PATH, req.nextUrl);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Cold start only. A tap on the menu inside the app has no launch header.
    if (
      pathname === GAME_MENU_PATH &&
      isAppLaunch(userAgent, req.headers.get(LAUNCH_HEADER))
    ) {
      return NextResponse.redirect(new URL(CONTINUE_PATH, req.nextUrl));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const url = new URL(LOGIN_PATH, req.nextUrl);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL(GAME_MENU_PATH, req.nextUrl));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/login/:path*", "/game/:path*", "/admin/:path*", "/auth/:path*", "/embed", "/embed/:path*"],
};

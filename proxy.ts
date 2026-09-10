import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  GAME_MENU_PATH,
  LOGIN_PATH,
  homePath,
} from "@/lib/auth/paths";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const isLoggedIn = Boolean(req.auth?.user);

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
      const url = new URL(LOGIN_PATH, req.nextUrl);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
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
  matcher: ["/login", "/login/:path*", "/game/:path*", "/admin/:path*", "/auth/:path*"],
};

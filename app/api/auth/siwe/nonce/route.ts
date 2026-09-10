import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { SIWE_NONCE_COOKIE } from "@/lib/auth/siwe";

export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  const response = NextResponse.json({ nonce });

  response.cookies.set(SIWE_NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}

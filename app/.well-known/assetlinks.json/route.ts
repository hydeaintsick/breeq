import { NextResponse } from "next/server";

/** The Android app's id (android/app/build.gradle.kts → applicationId). */
const ANDROID_PACKAGE = "space.breeq.app";

/**
 * Digital Asset Links: tells Android the Breeq app may open https://breeq.space
 * links (referrals, story episodes) directly. Lists the SHA-256 of every
 * certificate the app is signed with — the upload key printed by
 * `pnpm android:release` and, once on Play, the app-signing key from
 * Play Console → Setup → App signing. `ANDROID_CERT_SHA256` takes both,
 * comma-separated. Empty until then: the file is served, verification fails
 * quietly, links stay in the browser.
 */
export function GET() {
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value));

  const statements = fingerprints.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: ANDROID_PACKAGE,
            sha256_cert_fingerprints: fingerprints,
          },
        },
      ]
    : [];

  return NextResponse.json(statements, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}

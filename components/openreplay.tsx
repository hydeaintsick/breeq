"use client";

import { useEffect } from "react";
import { isGuestPlaceholder } from "@/lib/guest-door";

const KEY = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY?.trim();
const INGEST = process.env.NEXT_PUBLIC_OPENREPLAY_INGEST_POINT?.trim();

/**
 * Query keys that must not land in a replay URL: Stripe's return secrets,
 * the guest door token, and a partner's email.
 * The tracker's own list (password, token, jwt, …) is repeated because a
 * custom sanitizer replaces that default.
 */
const STRIPPED_QUERY = new Set([
  "jwt",
  "password",
  "reset-password",
  "invitation",
  "secret",
  "token",
  "payment_intent",
  "payment_intent_client_secret",
  "client_secret",
  "session_id",
  "redirect_status",
  "door",
  "origin_user_email",
  "email",
]);

type Tracker = typeof import("@openreplay/tracker").tracker;

let ready: Promise<Tracker | null> | null = null;
let pendingLabel: string | null = null;

/** Email when the account has a real one. Otherwise the username. */
export function replayLabel(email: string | null | undefined, username: string | null | undefined): string | null {
  const mail = email?.trim();
  if (mail && mail.includes("@") && !isGuestPlaceholder(mail)) return mail;
  const handle = username?.trim();
  return handle || null;
}

function sanitizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (STRIPPED_QUERY.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

/** Loads the tracker on the first call, and only when a project key is set. */
function client(): Promise<Tracker | null> {
  if (!KEY || typeof window === "undefined") return Promise.resolve(null);
  if (!ready) {
    ready = import("@openreplay/tracker")
      .then(async ({ tracker }) => {
        tracker.configure({
          projectKey: KEY,
          ...(INGEST ? { ingestPoint: INGEST } : {}),
          // Local http cannot start a session unless secure mode is off.
          __DISABLE_SECURE_MODE: window.location.protocol !== "https:",
          urls: { urlSanitizer: sanitizeUrl },
          // The board is a canvas. Snapshots hitch the frame and replay as a blur.
          // Runs are replayed from the engine instead.
          canvas: { disableCanvas: true },
        });
        const started = await tracker.start(pendingLabel ? { userID: pendingLabel } : undefined);
        if (!started.success) {
          console.error("openreplay start failed", started.reason);
          return null;
        }
        return tracker;
      })
      .catch((error: unknown) => {
        console.error("openreplay start failed", error);
        ready = null;
        return null;
      });
  }
  return ready;
}

/**
 * Session replay. No-op until `NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY` is set.
 * A signed-in visit is labeled with the email, or the username when there is none.
 */
export function OpenReplay({ email, username }: { email: string | null; username: string | null }) {
  const label = replayLabel(email, username);

  useEffect(() => {
    pendingLabel = label;
    let gone = false;
    void client().then((tracker) => {
      if (gone || !tracker || !label) return;
      tracker.setUserID(label);
    });
    return () => {
      gone = true;
    };
  }, [label]);

  return null;
}

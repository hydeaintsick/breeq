"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

/** Stripe sends these back on the return URL. They do not belong in analytics. */
const HIDDEN_QUERY = new Set(["payment_intent", "payment_intent_client_secret", "session_id", "redirect_status"]);

type Client = typeof import("posthog-js").default;

let ready: Promise<Client | null> | null = null;

/** Loads PostHog on the first call, and only when a project key is set. */
function client(): Promise<Client | null> {
  if (!KEY || typeof window === "undefined") return Promise.resolve(null);
  if (!ready) {
    ready = import("posthog-js").then((mod) => {
      const posthog = mod.default;
      posthog.init(KEY, {
        api_host: HOST,
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: false,
        disable_session_recording: true,
      });
      return posthog;
    });
  }
  return ready;
}

type Traits = Record<string, string | number | boolean | null | undefined>;

function compact(traits: Traits): Record<string, string | number | boolean> {
  const properties: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(traits)) {
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") properties[key] = value;
  }
  return properties;
}

/** Tie later events to this account. No-op until the PostHog key is set. */
export function identifyPlayer(distinctId: string, traits: Traits = {}): void {
  if (!distinctId) return;
  void client().then((posthog) => {
    posthog?.identify(distinctId, compact(traits));
  });
}

/**
 * Page views for acquisition, and an identify once a session exists.
 * Anonymous visitors stay anonymous (`person_profiles: identified_only`):
 * a person profile starts at sign-up.
 */
export function Analytics({
  userId,
  username,
  email,
}: {
  userId: string | null;
  username: string | null;
  email: string | null;
}) {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const kept = new URLSearchParams();
    search.forEach((value, key) => {
      if (!HIDDEN_QUERY.has(key)) kept.set(key, value);
    });
    const query = kept.toString();
    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
    void client().then((posthog) => {
      posthog?.capture("$pageview", { $current_url: url });
    });
  }, [pathname, search]);

  useEffect(() => {
    if (!userId) return;
    identifyPlayer(userId, { username, email });
  }, [email, userId, username]);

  return null;
}

import { PostHog } from "posthog-node";

/**
 * Server-side PostHog. No-op when `NEXT_PUBLIC_POSTHOG_KEY` is empty, so local
 * play and a deploy without the key keep working. The browser uses the same
 * key (`components/analytics.tsx`). EU cloud unless `NEXT_PUBLIC_POSTHOG_HOST`
 * says otherwise.
 */

type Props = Record<string, string | number | boolean | null | undefined>;

const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

let client: PostHog | null | undefined;

function posthog(): PostHog | null {
  if (client !== undefined) return client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    client = null;
    return null;
  }
  client = new PostHog(key, { host: HOST });
  return client;
}

function compact(input: Props): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

/** Identify the player and, when `event` is set, capture that event. Failures stay in the log. */
export async function capturePlayer(
  distinctId: string,
  event: string | null,
  properties: Props = {},
  person: Props = {},
): Promise<void> {
  const ph = posthog();
  if (!ph || !distinctId) return;
  try {
    const traits = compact(person);
    if (Object.keys(traits).length > 0) ph.identify({ distinctId, properties: traits });
    if (event) ph.capture({ distinctId, event, properties: compact(properties) });
    await ph.flush();
  } catch (error) {
    console.error("posthog capture failed", error);
  }
}

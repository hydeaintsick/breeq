import { publicPushAppId } from "@/lib/push";

const ENDPOINT = "https://api.onesignal.com/notifications";

export type OneSignalSend = {
  title: string;
  body: string;
  url: string;
};

export type OneSignalResult =
  | { id: string; recipients: number | null }
  | { error: string };

/** Which env names are still empty. The values themselves stay on the server. */
export function pushCredentials() {
  const appId = publicPushAppId();
  const key = (process.env.ONESIGNAL_REST_API_KEY ?? "").trim();
  const missing: string[] = [];
  if (!appId) missing.push("NEXT_PUBLIC_ONESIGNAL_APP_ID");
  if (!key.startsWith("os_v2_app_")) missing.push("ONESIGNAL_REST_API_KEY");
  return { appId, key, ready: missing.length === 0, missing };
}

function errorText(errors: unknown): string {
  if (!errors) return "OneSignal refused the notification.";
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) return errors.map(String).join(" ");
  if (typeof errors === "object") return Object.values(errors as Record<string, unknown>).map(String).join(" ");
  return "OneSignal refused the notification.";
}

/** Broadcast to everyone who accepted push, on the web and in the Android app. */
export async function sendOneSignalPush(message: OneSignalSend): Promise<OneSignalResult> {
  const { appId, key, ready } = pushCredentials();
  if (!ready) return { error: "OneSignal is not configured yet." };

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${key}`,
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: "push",
        included_segments: ["Subscribed Users"],
        headings: { en: message.title },
        contents: { en: message.body },
        url: message.url,
        name: message.title.slice(0, 128),
      }),
    });
  } catch {
    return { error: "Could not reach OneSignal. Try again." };
  }

  let payload: { id?: string; recipients?: number; errors?: unknown } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    payload = {};
  }

  if (!response.ok || !payload.id) {
    const text = errorText(payload.errors);
    if (/not subscribed|no subscribed|all included players are not subscribed/i.test(text)) {
      return { error: "No one has turned notifications on yet." };
    }
    return { error: text.slice(0, 240) || "OneSignal refused the notification." };
  }

  return {
    id: payload.id,
    recipients: typeof payload.recipients === "number" ? payload.recipients : null,
  };
}

import { isPushAppId, publicPushAppId, PUSH_SAFARI_WEB_ID, webPushLikely } from "@/lib/push";

const USER_ID = /^[a-f0-9]{24}$/i;

type OneSignalSdk = {
  init: (options: {
    appId: string;
    safari_web_id: string;
    serviceWorkerPath: string;
    serviceWorkerParam: { scope: string };
    notifyButton: { enable: boolean };
    allowLocalhostAsSecureOrigin: boolean;
    promptOptions: { slidedown: { prompts: { type: "push"; autoPrompt: boolean }[] } };
  }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<boolean | void>;
    isPushSupported: () => boolean;
    permission: boolean;
  };
  User: {
    PushSubscription: {
      optOut: () => Promise<void> | void;
    };
  };
};

type Bridge = NonNullable<Window["BreeqAndroid"]>;

function bridge(): Bridge | null {
  if (typeof window === "undefined") return null;
  return window.BreeqAndroid ?? null;
}

export function inBreeqApp() {
  return bridge() !== null;
}

/** Tell the Android shell the App ID, when this build was made before the id existed. */
export function configureNativePush(appId: string) {
  const native = bridge();
  if (!native || !isPushAppId(appId)) return false;
  return native.configure(appId);
}

export function nativePushReady() {
  return Boolean(bridge()?.notificationsReady());
}

let sdkPromise: Promise<OneSignalSdk | null> | null = null;

function loadSdk(appId: string): Promise<OneSignalSdk | null> {
  if (!isPushAppId(appId)) return Promise.resolve(null);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve) => {
    let settled = false;
    const finish = (sdk: OneSignalSdk | null) => {
      if (settled) return;
      settled = true;
      resolve(sdk);
    };
    const timer = window.setTimeout(() => finish(null), 15_000);
    const host = window as Window & { OneSignalDeferred?: Array<(oneSignal: OneSignalSdk) => void> };
    host.OneSignalDeferred = host.OneSignalDeferred || [];
    host.OneSignalDeferred.push(async (OneSignal) => {
      window.clearTimeout(timer);
      try {
        await OneSignal.init({
          appId,
          safari_web_id: PUSH_SAFARI_WEB_ID,
          serviceWorkerPath: "OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/" },
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
          promptOptions: { slidedown: { prompts: [{ type: "push", autoPrompt: false }] } },
        });
        finish(OneSignal);
      } catch {
        finish(null);
      }
    });
    if (document.querySelector("script[data-breeq-onesignal]")) return;
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.dataset.breeqOnesignal = "1";
    script.onerror = () => finish(null);
    document.head.appendChild(script);
  });
  return sdkPromise;
}

async function loginWeb(appId: string, userId: string) {
  if (!USER_ID.test(userId)) return null;
  const sdk = await loadSdk(appId);
  if (!sdk) return null;
  try {
    await sdk.login(userId);
  } catch {
    return null;
  }
  return sdk;
}

/** Keep a player who already said yes attached to their account. No prompt. */
export async function resumeWebPush(appId: string, userId: string) {
  if (inBreeqApp()) return;
  await loginWeb(appId, userId);
}

export async function subscribePush(userId: string): Promise<"on" | "off" | "unsupported"> {
  const native = bridge();
  const appId = publicPushAppId();
  if (native) {
    if (appId) native.configure(appId);
    if (!native.notificationsReady()) return "unsupported";
    const accepted = await new Promise<boolean>((resolve) => {
      const timer = window.setTimeout(() => resolve(false), 90_000);
      window.__breeqPushResult = (value) => {
        window.clearTimeout(timer);
        window.__breeqPushResult = undefined;
        resolve(value);
      };
      native.enableNotifications(userId);
    });
    return accepted ? "on" : "off";
  }

  if (!appId || !webPushLikely()) return "unsupported";
  const sdk = await loginWeb(appId, userId);
  if (!sdk || !sdk.Notifications.isPushSupported()) return "unsupported";
  try {
    await sdk.Notifications.requestPermission();
  } catch {
    return "off";
  }
  if (sdk.Notifications.permission || (typeof Notification !== "undefined" && Notification.permission === "granted")) {
    return "on";
  }
  return "off";
}

export async function unsubscribePush() {
  const native = bridge();
  if (native) {
    native.disableNotifications();
    return;
  }
  const appId = publicPushAppId();
  if (!appId) return;
  const sdk = await loadSdk(appId);
  try {
    await sdk?.User.PushSubscription.optOut();
  } catch {
    // Account stays the source of truth either way.
  }
}

/** The sheet can be offered: the Android shell is ready, or this browser can do web push. */
export function pushCanAsk() {
  if (typeof window === "undefined") return false;
  if (inBreeqApp()) return nativePushReady();
  return Boolean(publicPushAppId()) && webPushLikely();
}

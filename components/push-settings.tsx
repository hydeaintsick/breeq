"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { recordPushChoice } from "@/app/actions/push";
import { playSheetBack, playSheetBuy } from "@/game/breakout/audio";
import { pulseUi } from "@/game/breakout/haptics";
import { publicPushAppId, webPushLikely } from "@/lib/push";
import { configureNativePush, inBreeqApp, nativePushReady, subscribePush, unsubscribePush } from "@/lib/push-client";

function pushSupported() {
  const appId = publicPushAppId();
  if (inBreeqApp()) {
    if (appId) configureNativePush(appId);
    return nativePushReady();
  }
  return Boolean(appId) && webPushLikely();
}

/**
 * The way back after Not now, and the way off. Hidden when this device cannot
 * receive a push (no App ID, or a browser without web push).
 */
export function PushSettings({ userId, optedIn }: { userId: string; optedIn: boolean }) {
  const router = useRouter();
  const visible = useSyncExternalStore(
    () => () => {},
    pushSupported,
    () => false,
  );
  const [on, setOn] = useState(optedIn);
  const [seen, setSeen] = useState(optedIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (optedIn !== seen) {
    setSeen(optedIn);
    setOn(optedIn);
  }

  if (!visible) return null;

  async function turnOn() {
    setBusy(true);
    setError(null);
    playSheetBuy();
    pulseUi(8);
    try {
      const result = await subscribePush(userId);
      if (result !== "on") {
        setError(
          result === "unsupported"
            ? "Notifications aren't available on this device."
            : "Notifications are blocked in the system settings.",
        );
        return;
      }
      setOn(true);
      await recordPushChoice(true);
      router.refresh();
    } catch {
      setError("Could not turn notifications on. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError(null);
    playSheetBack();
    try {
      await unsubscribePush();
      setOn(false);
      await recordPushChoice(false);
      router.refresh();
    } catch {
      setError("Could not turn notifications off. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass grid gap-4 p-6 sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">News</p>
      <h2 className="text-xl font-semibold tracking-tight text-ink">Notifications</h2>
      <p className="text-sm leading-6 text-ink-muted">
        New chapters and the occasional update. No ads. {on ? "They are on for this device." : "They are off."}
      </p>
      <button
        type="button"
        className="btn-glass min-h-11 w-full sm:w-fit"
        disabled={busy}
        onClick={() => void (on ? turnOff() : turnOn())}
      >
        {busy ? "One moment…" : on ? "Turn off" : "Turn on notifications"}
      </button>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

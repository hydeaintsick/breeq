"use client";

import { useOptimistic, useTransition } from "react";
import { setEarnEnabled } from "@/app/actions/settings";

/** Admin switch: is Earn on the play menu and open to players who unlock it? */
export function EarnSetting({ enabled }: { enabled: boolean }) {
  const [pending, start] = useTransition();
  const [shown, setShown] = useOptimistic(enabled);

  const toggle = () => {
    const next = !shown;
    start(async () => {
      setShown(next);
      await setEarnEnabled(next);
    });
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <span
        className="inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-medium uppercase tracking-[0.14em]"
        style={{
          borderColor: shown ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--hairline)",
          color: shown ? "var(--accent)" : "var(--ink-muted)",
        }}
        aria-live="polite"
      >
        {shown ? "On" : "Off"}
      </span>
      <button
        type="button"
        className={`${shown ? "btn-glass" : "btn-play"} min-h-11`}
        onClick={toggle}
        disabled={pending}
        aria-pressed={shown}
      >
        {shown ? "Turn Earn off" : "Turn Earn on"}
      </button>
    </div>
  );
}

"use client";

import { HapticsToggle } from "@/components/haptics-toggle";
import { SoundToggle } from "@/components/sound-toggle";
import { SwipeToggle } from "@/components/swipe-toggle";

export function PlaySettings() {
  return (
    <div className="glass grid gap-4 p-6 sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Play</p>
      <h2 className="text-xl font-semibold tracking-tight text-ink">Controls</h2>
      <p className="text-sm leading-6 text-ink-muted">
        Sound, vibration, and whether a swipe anywhere on the screen moves the paddle, or only the rail under the board.
      </p>
      <div className="grid gap-3">
        <SoundToggle variant="row" />
        <HapticsToggle variant="row" />
        <SwipeToggle variant="row" />
      </div>
    </div>
  );
}

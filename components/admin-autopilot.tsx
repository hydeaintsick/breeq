"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BreakoutHandle } from "@/game/breakout/preview";

const AdminContext = createContext(false);

/** The signed-in player is an admin. Seeded by the game layout; false everywhere else. */
export function PlayAdminProvider({ admin, children }: { admin: boolean; children: ReactNode }) {
  return <AdminContext.Provider value={admin}>{children}</AdminContext.Provider>;
}

type Pilot = { on: boolean; toggle: () => void };

const PilotContext = createContext<Pilot | null>(null);

/**
 * Holds the autopilot switch for one live run and pushes it to the board.
 * Renders nothing extra for a player: the buttons below only exist for an admin.
 */
export function AutopilotProvider({ handle, children }: { handle: BreakoutHandle | null; children: ReactNode }) {
  const admin = useContext(AdminContext);
  const [on, setOn] = useState(false);
  const toggle = useCallback(() => setOn((current) => !current), []);

  useEffect(() => {
    if (!admin) return;
    handle?.setAutopilot(on);
  }, [admin, handle, on]);

  const value = useMemo(() => ({ on, toggle }), [on, toggle]);
  if (!admin) return children;
  return <PilotContext.Provider value={value}>{children}</PilotContext.Provider>;
}

/** `hud` sits in the board's top band, next to pause. `row` is the pause-menu switch. */
export function AutopilotButton({ variant }: { variant: "hud" | "row" }) {
  const pilot = useContext(PilotContext);
  if (!pilot) return null;

  if (variant === "row") {
    return (
      <button type="button" className="btn-glass story-auto-row min-h-11 w-full" aria-pressed={pilot.on} onClick={pilot.toggle}>
        <AutopilotLamp />
        {pilot.on ? "Autopilot on" : "Autopilot off"}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="story-auto"
      aria-pressed={pilot.on}
      aria-label={pilot.on ? "Turn autopilot off" : "Turn autopilot on"}
      onClick={pilot.toggle}
    >
      <AutopilotLamp />
    </button>
  );
}

/** Off is a quiet ring. On is a lime lamp with two sparks. */
function AutopilotLamp() {
  return (
    <span className="story-auto-lamp" aria-hidden="true">
      <span className="story-auto-spark" />
      <span className="story-auto-spark" />
    </span>
  );
}

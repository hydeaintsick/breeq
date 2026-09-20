"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EnergySheet, type EnergySheetReason } from "@/components/energy-sheet";
import { rolledEnergy, type EnergyState } from "@/lib/energy";

/** Why the recharge sheet came up: it picks the copy and the CTA after a purchase. */
export type EnergyOpen = {
  reason?: EnergySheetReason;
  /** The gauge can pay again: the sheet's primary button serves the run the player was after. */
  onReady?: () => void;
};

interface EnergyContext {
  state: EnergyState;
  /** Push what the server just returned so every surface (the header pill first) shows it now. */
  setState: (next: EnergyState) => void;
  /** Slide the recharge sheet up over the current page. */
  open: (options?: EnergyOpen) => void;
  close: () => void;
  isOpen: boolean;
}

const Ctx = createContext<EnergyContext | null>(null);

/**
 * The gem shop leaves the page for Stripe. When the recharge sheet sent the
 * player there, it is remembered here so it comes back up over the page once
 * the pack has landed — the cells are one more tap.
 */
const INTENT_KEY = "breeq-energy-intent";
const INTENT_TTL_MS = 15 * 60 * 1000;

export function writeEnergyIntent(): void {
  try {
    window.sessionStorage.setItem(INTENT_KEY, String(Date.now()));
  } catch {
    // Private mode without storage: the shop still opens, the sheet just will not come back after Stripe.
  }
}

function readEnergyIntent(): boolean {
  try {
    const raw = window.sessionStorage.getItem(INTENT_KEY);
    window.sessionStorage.removeItem(INTENT_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < INTENT_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * The player's energy, shared by the game header, the episode sheet, the play
 * button and the end screens. The layout seeds it from the server (settled for
 * today); a run start, a clear or a recharge publishes what the server handed
 * back, and a fresh server render resets it to the truth. At 00:00 UTC the
 * gauge reads full on its own and the page re-fetches.
 */
export function EnergyProvider({ initial, children }: { initial: EnergyState; children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) {
    setSeen(initial);
    setState(initial);
  }
  const [sheet, setSheet] = useState<{ reason: EnergySheetReason; hasReady: boolean } | null>(null);
  const onReadyRef = useRef<(() => void) | undefined>(undefined);

  const open = useCallback((options: EnergyOpen = {}) => {
    onReadyRef.current = options.onReady;
    setSheet({ reason: options.reason ?? "browse", hasReady: options.onReady !== undefined });
  }, []);
  const close = useCallback(() => {
    onReadyRef.current = undefined;
    setSheet(null);
  }, []);
  const ready = useCallback(() => {
    const fn = onReadyRef.current;
    onReadyRef.current = undefined;
    setSheet(null);
    fn?.();
  }, []);

  // Midnight: the gauge fills by itself, then the server confirms.
  useEffect(() => {
    const roll = () => {
      const next = rolledEnergy(state);
      if (next !== state) {
        setState(next);
        router.refresh();
      }
    };
    const wait = Math.max(250, new Date(state.resetAt).getTime() - Date.now() + 500);
    // Timers past ~24.8 days overflow; a day fits, but clamp anyway.
    const id = window.setTimeout(roll, Math.min(wait, 2_147_000_000));
    const onVisible = () => {
      if (document.visibilityState === "visible") roll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, state]);

  // Back from the shop with a recharge in mind: the sheet comes back up.
  useEffect(() => {
    if (!readEnergyIntent()) return;
    // Restoring a surface the player left mid-flow: read once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSheet({ reason: "browse", hasReady: false });
  }, []);

  const value = useMemo<EnergyContext>(
    () => ({ state, setState, open, close, isOpen: sheet !== null }),
    [close, open, sheet, state],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {sheet ? <EnergySheet reason={sheet.reason} hasReady={sheet.hasReady} onReady={ready} onClose={close} /> : null}
    </Ctx.Provider>
  );
}

/** The shared energy, or null outside the game layout (admin, marketing). */
export function useEnergy(): EnergyContext | null {
  return useContext(Ctx);
}

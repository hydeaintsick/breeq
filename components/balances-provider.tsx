"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Balances } from "@/lib/earn";

interface BalancesContext {
  balances: Balances;
  /** Push what the server just returned so every surface (the header pill first) shows it now. */
  setBalances: (next: Balances) => void;
}

const Ctx = createContext<BalancesContext | null>(null);

/**
 * The player's gems and ETH, shared by the game header and the Earn surfaces.
 * The layout seeds it from the server; a store, a run, or a top-up publishes
 * the balances the server hands back so the header pill moves at once, and a
 * fresh server render (after `router.refresh()`) resets it to the truth.
 */
export function BalancesProvider({ initial, children }: { initial: Balances; children: ReactNode }) {
  const [balances, setBalances] = useState(initial);
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) {
    setSeen(initial);
    setBalances(initial);
  }
  const value = useMemo(() => ({ balances, setBalances }), [balances]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The shared balances, or null outside the game layout (admin, marketing). */
export function useBalances(): BalancesContext | null {
  return useContext(Ctx);
}

/**
 * Mirror a surface's own balances into the shared ones whenever they change.
 * The surfaces keep their local state (it drives their own UI) and this keeps
 * the header pill honest without prop drilling.
 */
export function usePublishBalances(balances: Balances): void {
  const publish = useContext(Ctx)?.setBalances;
  useEffect(() => {
    publish?.(balances);
  }, [balances, publish]);
}

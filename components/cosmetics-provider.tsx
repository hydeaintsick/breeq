"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { SkinSet } from "@/game/breakout/preview";
import { skinSetOf, type Wardrobe } from "@/lib/cosmetics";

interface CosmeticsContext {
  wardrobe: Wardrobe;
  /** Push what the server just returned so every board on screen wears it now. */
  setWardrobe: (next: Wardrobe) => void;
  /** The looks the boards should draw, memoized so a mount only re-skins when something changed. */
  skins: SkinSet;
}

const Ctx = createContext<CosmeticsContext | null>(null);

/**
 * What the player owns and wears, shared by every board in the game layout:
 * the story walls, the Earn cards, the shop's try-on board. The layout seeds
 * it from the server; a purchase or an equip publishes the wardrobe the
 * server hands back, and a fresh server render resets it to the truth.
 */
export function CosmeticsProvider({ initial, children }: { initial: Wardrobe; children: ReactNode }) {
  const [wardrobe, setWardrobe] = useState(initial);
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) {
    setSeen(initial);
    setWardrobe(initial);
  }
  const skins = useMemo(() => skinSetOf(wardrobe), [wardrobe]);
  const value = useMemo(() => ({ wardrobe, setWardrobe, skins }), [wardrobe, skins]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The shared wardrobe, or null outside the game layout (marketing, admin). */
export function useCosmetics(): CosmeticsContext | null {
  return useContext(Ctx);
}

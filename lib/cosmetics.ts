/**
 * Cosmetics: the skins on sale for gems, and what a player owns and wears.
 * Pure — no Prisma, no DOM — shared by the shop, the actions and the board.
 * The looks themselves are engine data (`game/breakout/render/skins.ts`); this
 * file is the storefront: names, prices, rarity, and the wardrobe rules.
 *
 * Two slots, one skin worn per slot. Free skins are owned by everyone and are
 * never written to the database; a bought skin is one id in `User.skins`.
 */
import { DEFAULT_BALL_LOOK, DEFAULT_PADDLE_LOOK, type BallLook, type PaddleLook, type SkinSet } from "@/game/breakout/render/skins";

export type SkinSlot = "paddle" | "ball";
export type SkinRarity = "common" | "rare" | "epic" | "legendary";

interface SkinBase {
  id: string;
  name: string;
  /** One line under the name. */
  line: string;
  rarity: SkinRarity;
  /** Price in gems; 0 is free and owned by everyone. */
  gems: number;
}

export type PaddleSkin = SkinBase & { slot: "paddle"; look: PaddleLook };
export type BallSkin = SkinBase & { slot: "ball"; look: BallLook };
export type Skin = PaddleSkin | BallSkin;

export const SKIN_SLOTS: readonly { id: SkinSlot; label: string }[] = [
  { id: "paddle", label: "Paddles" },
  { id: "ball", label: "Balls" },
];

export const RARITY_LABEL: Record<SkinRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/** The catalog. Order is the shelf order: free first, then by price. */
export const SKINS: readonly Skin[] = [
  // --- Paddles -------------------------------------------------------------
  { id: "paddle-glass", slot: "paddle", name: "Glass", line: "The one every wall was proven with.", rarity: "common", gems: 0, look: DEFAULT_PADDLE_LOOK },
  {
    id: "paddle-frost",
    slot: "paddle",
    name: "Frost",
    line: "Pale ice, a cyan glow.",
    rarity: "common",
    gems: 90,
    look: { top: "rgba(232, 250, 255, 0.98)", bottom: "rgba(140, 225, 245, 0.85)", rim: "rgba(255, 255, 255, 0.8)", glow: "cyan" },
  },
  {
    id: "paddle-ember",
    slot: "paddle",
    name: "Ember",
    line: "Amber running into pink.",
    rarity: "rare",
    gems: 180,
    look: { top: "#ffd27a", bottom: "#ff4fa3", rim: "rgba(255, 255, 255, 0.85)", glow: "amber" },
  },
  {
    id: "paddle-obsidian",
    slot: "paddle",
    name: "Obsidian",
    line: "Dark glass, a cyan edge.",
    rarity: "rare",
    gems: 180,
    look: { top: "#2a2e40", bottom: "#0b0d1a", rim: "#22d3ee", glow: "cyan" },
  },
  {
    id: "paddle-slipstream",
    slot: "paddle",
    name: "Slipstream",
    line: "White glass, lime racing bands.",
    rarity: "rare",
    gems: 220,
    look: { top: "rgba(255, 255, 255, 0.96)", bottom: "rgba(225, 230, 245, 0.88)", rim: "rgba(255, 255, 255, 0.8)", glow: "lime", stripes: ["rgba(163, 230, 53, 0.9)"] },
  },
  {
    id: "paddle-aurora",
    slot: "paddle",
    name: "Aurora",
    line: "Cyan melting into violet.",
    rarity: "epic",
    gems: 400,
    look: { top: "#22d3ee", bottom: "#8b5cf6", rim: "rgba(255, 255, 255, 0.9)", glow: "violet" },
  },
  {
    id: "paddle-void",
    slot: "paddle",
    name: "Void",
    line: "Near black. A pink hairline is all you see.",
    rarity: "epic",
    gems: 450,
    look: { top: "#14162a", bottom: "#05060c", rim: "#ff4fa3", glow: "pink" },
  },
  {
    id: "paddle-prism",
    slot: "paddle",
    name: "Prism",
    line: "Every neon at once, in bands.",
    rarity: "legendary",
    gems: 900,
    look: {
      top: "rgba(255, 255, 255, 0.98)",
      bottom: "rgba(235, 238, 250, 0.9)",
      rim: "rgba(255, 255, 255, 0.95)",
      glow: "speed",
      stripes: ["#4f7cff", "#8b5cf6", "#ff4fa3", "#22d3ee", "#a3e635", "#ffb020"],
    },
  },

  // --- Balls ---------------------------------------------------------------
  { id: "ball-comet", slot: "ball", name: "Comet", line: "White heart, a tail in the board's color.", rarity: "common", gems: 0, look: DEFAULT_BALL_LOOK },
  {
    id: "ball-ghost",
    slot: "ball",
    name: "Ghost",
    line: "No tail. Just the light.",
    rarity: "common",
    gems: 90,
    look: { core: "#eafaff", edge: "cyan", aura: "white", auraScale: 1.15, trail: "none", trailTint: "white" },
  },
  {
    id: "ball-ribbon",
    slot: "ball",
    name: "Ribbon",
    line: "A thin cyan line drawn behind it.",
    rarity: "rare",
    gems: 180,
    look: { core: "#ffffff", edge: "cyan", aura: "cyan", trail: "ribbon", trailTint: "cyan" },
  },
  {
    id: "ball-acid",
    slot: "ball",
    name: "Acid",
    line: "Lime through and through.",
    rarity: "rare",
    gems: 180,
    look: { core: "#f6ffe0", edge: "lime", aura: "lime", trail: "comet", trailTint: "lime" },
  },
  {
    id: "ball-ember",
    slot: "ball",
    name: "Ember",
    line: "Pink sparks that sink as they die.",
    rarity: "rare",
    gems: 220,
    look: { core: "#fff3e6", edge: "pink", aura: "pink", trail: "embers", trailTint: "pink" },
  },
  {
    id: "ball-sparkler",
    slot: "ball",
    name: "Sparkler",
    line: "Amber sparks thrown off every frame.",
    rarity: "epic",
    gems: 400,
    look: { core: "#ffffff", edge: "amber", aura: "amber", auraScale: 1.1, trail: "sparks", trailTint: "amber" },
  },
  {
    id: "ball-eclipse",
    slot: "ball",
    name: "Eclipse",
    line: "A dark heart in a white corona.",
    rarity: "epic",
    gems: 450,
    look: { core: "#1c1f2b", edge: "white", aura: "white", auraScale: 1.25, trail: "ribbon", trailTint: "white" },
  },
  {
    id: "ball-nova",
    slot: "ball",
    name: "Nova",
    line: "Violet heart, sparks in the board's color.",
    rarity: "legendary",
    gems: 900,
    look: { core: "#ffffff", edge: "violet", aura: "violet", auraScale: 1.35, trail: "sparks", trailTint: "speed" },
  },
];

export function skinById(id: unknown): Skin | null {
  if (typeof id !== "string") return null;
  return SKINS.find((skin) => skin.id === id) ?? null;
}

export function skinsFor(slot: SkinSlot): Skin[] {
  return SKINS.filter((skin) => skin.slot === slot);
}

/** The free skin of a slot: what "nothing equipped" means. */
export function defaultSkin(slot: SkinSlot): Skin {
  return SKINS.find((skin) => skin.slot === slot && skin.gems === 0) as Skin;
}

/** What a player owns and wears. */
export type Wardrobe = {
  /** Bought skin ids (free ones are implied). */
  owned: string[];
  equipped: Record<SkinSlot, string>;
};

export const DEFAULT_WARDROBE: Wardrobe = {
  owned: [],
  equipped: { paddle: defaultSkin("paddle").id, ball: defaultSkin("ball").id },
};

/** Build a wardrobe from what the database holds, falling back to the free skins. */
export function toWardrobe(row: { skins?: string[] | null; paddleSkin?: string | null; ballSkin?: string | null } | null | undefined): Wardrobe {
  const owned = (row?.skins ?? []).filter((id) => skinById(id) !== null);
  const pick = (slot: SkinSlot, id: string | null | undefined) => {
    const skin = skinById(id);
    if (skin && skin.slot === slot && (skin.gems === 0 || owned.includes(skin.id))) return skin.id;
    return defaultSkin(slot).id;
  };
  return { owned, equipped: { paddle: pick("paddle", row?.paddleSkin), ball: pick("ball", row?.ballSkin) } };
}

export function ownsSkin(wardrobe: Pick<Wardrobe, "owned">, skin: Skin): boolean {
  return skin.gems === 0 || wardrobe.owned.includes(skin.id);
}

/** The looks the board should draw for this wardrobe. */
export function skinSetOf(wardrobe: Wardrobe): SkinSet {
  const paddle = skinById(wardrobe.equipped.paddle);
  const ball = skinById(wardrobe.equipped.ball);
  return {
    paddle: paddle?.slot === "paddle" ? paddle.look : DEFAULT_PADDLE_LOOK,
    ball: ball?.slot === "ball" ? ball.look : DEFAULT_BALL_LOOK,
  };
}

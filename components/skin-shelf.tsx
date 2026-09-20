"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { equipSkin, type SkinBought } from "@/app/actions/cosmetics";
import { useBalances } from "@/components/balances-provider";
import { BreakoutPreview } from "@/components/breakout-preview";
import { useCosmetics } from "@/components/cosmetics-provider";
import { GemGlyph } from "@/components/currency-glyphs";
import { SkinSheet } from "@/components/skin-sheet";
import { SkinSwatch } from "@/components/skin-swatch";
import { playShopTab, playSkinEquip } from "@/game/breakout/audio";
import { pulseUi } from "@/game/breakout/haptics";
import { FITTING_ROOM } from "@/game/breakout/levels";
import { ownsSkin, RARITY_LABEL, skinById, skinsFor, skinSetOf, SKIN_SLOTS, type Skin, type SkinSlot } from "@/lib/cosmetics";
import { formatGems } from "@/lib/economy";

const LEVELS = [FITTING_ROOM];

/**
 * The wardrobe: a live board wearing what the player is trying on, the two
 * slots, and the shelf. Tapping a skin puts it on the board at once — owned
 * or not — and the action bar says what one more tap does: wear it, unlock it
 * for gems, or get the gems that are missing. A purchase wears the skin in
 * the same write, so the board never shows something the player does not
 * have for longer than a tap.
 */
export function SkinShelf() {
  const cosmetics = useCosmetics();
  const balances = useBalances();
  const wardrobe = cosmetics?.wardrobe ?? { owned: [], equipped: { paddle: "paddle-glass", ball: "ball-comet" } };
  const gems = balances?.balances.gems ?? 0;

  const [slot, setSlot] = useState<SkinSlot>("paddle");
  /** What is on the board, per slot: starts as what is worn. */
  const [trying, setTrying] = useState<Record<SkinSlot, string>>(wardrobe.equipped);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The skin that just landed: its card gets the stamp. */
  const [just, setJust] = useState<string | null>(null);
  /** The skin the unlock sheet is open for. */
  const [sheet, setSheet] = useState<Skin | null>(null);

  // A fresh wardrobe from the server (another tab, a refresh) resets the try-on to what is worn.
  const [seen, setSeen] = useState(wardrobe.equipped);
  if (wardrobe.equipped !== seen) {
    setSeen(wardrobe.equipped);
    setTrying(wardrobe.equipped);
  }

  const shelf = useMemo(() => skinsFor(slot), [slot]);
  const picked = skinById(trying[slot]) ?? shelf[0];
  const worn = wardrobe.equipped[slot] === picked.id;
  const owned = ownsSkin(wardrobe, picked);
  const need = Math.max(0, picked.gems - gems);
  const previewSkins = useMemo(() => skinSetOf({ owned: wardrobe.owned, equipped: trying }), [trying, wardrobe.owned]);

  const stampTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(stampTimer.current), []);
  const stamp = useCallback((id: string) => {
    setJust(id);
    window.clearTimeout(stampTimer.current);
    stampTimer.current = window.setTimeout(() => setJust(null), 1600);
  }, []);

  function pickSlot(next: SkinSlot) {
    if (next === slot) return;
    playShopTab();
    pulseUi(5);
    setError(null);
    setSlot(next);
  }

  function tryOn(skin: Skin) {
    if (trying[skin.slot] === skin.id) return;
    playShopTab();
    pulseUi(5);
    setError(null);
    setTrying((prev) => ({ ...prev, [skin.slot]: skin.id }));
  }

  /** Wear an owned skin at once; a skin on sale opens the unlock sheet (gems, or the card checkout). */
  async function act() {
    if (busy || worn) return;
    setError(null);
    if (!owned) {
      pulseUi(6);
      setSheet(picked);
      return;
    }
    setBusy(true);
    try {
      const result = await equipSkin(picked.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      playSkinEquip();
      pulseUi([8, 30, 8]);
      cosmetics?.setWardrobe(result.wardrobe);
    } catch {
      setError("Could not reach the shop. Try again.");
    } finally {
      setBusy(false);
    }
  }

  /** The sheet's purchase landed: the wardrobe and the bag follow, the card gets its stamp. */
  const landed = useCallback(
    (result: SkinBought) => {
      pulseUi([10, 40, 10, 40, 20]);
      cosmetics?.setWardrobe(result.wardrobe);
      balances?.setBalances(result.balances);
      stamp(result.skin);
    },
    [balances, cosmetics, stamp],
  );

  const cta = busy ? (
    "One moment…"
  ) : worn ? (
    "Wearing"
  ) : owned ? (
    `Wear ${picked.name}`
  ) : (
    <>
      Unlock for <GemGlyph className="gem-glyph skin-action-gem" /> {formatGems(picked.gems)}
    </>
  );

  return (
    <div className="skin-shelf" data-slot={slot}>
      {/* The action bar is a sibling of the glass, not a child: a blurred
          ancestor would pin a fixed bar inside itself. */}
      <div className="fitting-col">
      <section className="fitting-room glass" aria-label="Fitting room">
        <div className="fitting-board" aria-label={`The board wearing ${picked.name}`}>
          <BreakoutPreview
            levels={LEVELS}
            seed={11}
            followQuery={false}
            controls="auto"
            fill
            showHud={false}
            showCaption={false}
            skins={previewSkins}
          />
          <span className="fitting-live" aria-hidden="true">
            Live
          </span>
        </div>
        <div className="fitting-copy">
          <p className="fitting-kicker" data-rarity={picked.rarity}>
            <span className="fitting-rarity-dot" aria-hidden="true" />
            {RARITY_LABEL[picked.rarity]} · {picked.slot === "paddle" ? "Paddle" : "Ball"}
          </p>
          <h2 className="fitting-name">{picked.name}</h2>
          <p className="fitting-line">{picked.line}</p>
          <p className="fitting-status" aria-live="polite">
            {worn ? (
              <span className="fitting-owned">Wearing now</span>
            ) : owned ? (
              <span className="fitting-owned">In your wardrobe</span>
            ) : (
              <>
                <GemGlyph /> {formatGems(picked.gems)}
                {need > 0 ? <span className="fitting-short"> · {formatGems(need)} short</span> : null}
              </>
            )}
          </p>
        </div>
      </section>

        <div className="skin-action" data-worn={worn ? "true" : undefined}>
          <div className="skin-action-copy" aria-hidden="true">
            <SkinSwatch skin={picked} className="skin-action-swatch" />
            <span className="skin-action-name">{picked.name}</span>
          </div>
          <button
            type="button"
            className={worn ? "btn-glass skin-action-cta" : "btn-play skin-action-cta"}
            disabled={busy || worn}
            aria-disabled={worn || undefined}
            onClick={() => void act()}
          >
            {cta}
          </button>
          {error ? (
            <p className="skin-action-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="shop-seg shop-seg-slots" role="tablist" aria-label="Skin slot" style={{ "--n": SKIN_SLOTS.length, "--i": SKIN_SLOTS.findIndex((s) => s.id === slot) } as React.CSSProperties}>
        <span className="shop-seg-indicator" aria-hidden="true" />
        {SKIN_SLOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`slot-tab-${s.id}`}
            aria-selected={slot === s.id}
            aria-controls={`slot-panel-${s.id}`}
            tabIndex={slot === s.id ? 0 : -1}
            className="shop-seg-tab"
            onClick={() => pickSlot(s.id)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              const i = SKIN_SLOTS.findIndex((x) => x.id === slot);
              const nextIndex = (i + (event.key === "ArrowRight" ? 1 : SKIN_SLOTS.length - 1)) % SKIN_SLOTS.length;
              pickSlot(SKIN_SLOTS[nextIndex].id);
              document.getElementById(`slot-tab-${SKIN_SLOTS[nextIndex].id}`)?.focus();
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <ul id={`slot-panel-${slot}`} role="tabpanel" aria-labelledby={`slot-tab-${slot}`} className="skin-grid" key={slot}>
        {shelf.map((skin, index) => {
          const has = ownsSkin(wardrobe, skin);
          const on = wardrobe.equipped[skin.slot] === skin.id;
          const isTrying = trying[skin.slot] === skin.id;
          const short = !has && skin.gems > gems;
          return (
            <li key={skin.id} style={{ "--i": index } as React.CSSProperties}>
              <button
                type="button"
                className="skin-card"
                data-rarity={skin.rarity}
                data-owned={has ? "true" : undefined}
                data-on={on ? "true" : undefined}
                data-short={short ? "true" : undefined}
                data-just={just === skin.id ? "true" : undefined}
                aria-pressed={isTrying}
                aria-label={`${skin.name}, ${RARITY_LABEL[skin.rarity]}. ${on ? "Wearing." : has ? "Owned." : `${formatGems(skin.gems)} gems.`}${isTrying ? " On the board." : ""}`}
                onClick={() => tryOn(skin)}
              >
                <SkinSwatch skin={skin} className="skin-card-swatch" />
                <span className="skin-card-name">{skin.name}</span>
                <span className="skin-card-meta">
                  {on ? (
                    <span className="skin-card-on">Wearing</span>
                  ) : has ? (
                    <span className="skin-card-owned">Owned</span>
                  ) : (
                    <span className="skin-card-price">
                      <GemGlyph /> {formatGems(skin.gems)}
                    </span>
                  )}
                </span>
                <span className="skin-card-rarity" aria-hidden="true">
                  {RARITY_LABEL[skin.rarity]}
                </span>
                <span className="skin-card-stamp" aria-hidden="true">
                  Unlocked
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {sheet ? <SkinSheet key={sheet.id} skin={sheet} onLanded={landed} onClose={() => setSheet(null)} /> : null}
    </div>
  );
}

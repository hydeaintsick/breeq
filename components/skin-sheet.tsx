"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { buySkin, claimSkinPayment, type SkinBought } from "@/app/actions/cosmetics";
import { abandonGemPayment, createGemPayment, sandboxTopUp, type GemPayment } from "@/app/actions/earn";
import { useBalances } from "@/components/balances-provider";
import { GemGlyph } from "@/components/currency-glyphs";
import { GemBag, bagTierFor } from "@/components/gem-bag";
import { GemPay } from "@/components/gem-pay";
import { useGemShop } from "@/components/gem-shop";
import { ChevronLeftIcon, CloseIcon } from "@/components/nav-icons";
import { SkinSwatch } from "@/components/skin-swatch";
import { useSheetSwipe } from "@/components/use-sheet-swipe";
import { playSheetAppear, playSheetBack, playSheetBuy, playSkinReveal, playSkinStamp, SKIN_REVEAL_MS } from "@/game/breakout/audio";
import { pulseUi } from "@/game/breakout/haptics";
import { RARITY_LABEL, type Skin, type SkinRarity } from "@/lib/cosmetics";
import { formatCents, formatGems, packListCents, packPriceCents, type GemPack } from "@/lib/economy";

type Step = "confirm" | "pay" | "landed";

/** Timeline of the landing, ms from the purchase. */
const T = {
  /** The wardrobe starts spinning up. */
  charge: 140,
  /** The reveal: `SKIN_REVEAL_MS` after the spin-up starts, on the voice's beat. */
  burst: 140 + SKIN_REVEAL_MS,
  stamp: 140 + SKIN_REVEAL_MS + 180,
  done: 140 + SKIN_REVEAL_MS + 520,
  buttonsAfter: 300,
} as const;

/** The sparks the reveal throws: angle, reach and size, laid out by hand so the burst is the same every time. */
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  a: (i * 360) / 14 + ((i * 37) % 11) - 5,
  d: 4 + ((i * 53) % 7) * 0.4,
  s: 0.7 + ((i * 29) % 5) * 0.12,
  delay: ((i * 17) % 6) * 18,
}));

/** The neon each rarity lands in: the sheet's bloom, the receipt's glow, the sparks. */
const RARITY_NEON: Record<SkinRarity, [string, string]> = {
  common: ["var(--neon-blue)", "var(--neon-cyan)"],
  rare: ["var(--neon-cyan)", "var(--neon-blue)"],
  epic: ["var(--neon-violet)", "var(--neon-pink)"],
  legendary: ["var(--neon-amber)", "var(--neon-pink)"],
};

/** The checkout step: the skin wanted, the gem pack that pays for it, the Stripe intent for that pack. */
type Checkout = {
  gemPack: GemPack;
  payment: GemPayment | null;
  loading: boolean;
  error: string | null;
};

/** The smallest gem pack that covers the shortfall — the one the checkout opens on. */
function gemPackFor(packs: GemPack[], shortfall: number): GemPack {
  return packs.find((pack) => pack.gems >= shortfall) ?? packs[packs.length - 1];
}

/**
 * The unlock sheet — where every skin on sale leads — is a wizard in two
 * steps and a landing, the recharge sheet's twin. The skin large at the top
 * with its rarity, the price and what stays in the bag; one tap unlocks it
 * when the bag can pay. When it cannot, the sheet slides to the checkout:
 * the gem pack that covers it, the skin debited from that pack, and Apple
 * Pay, Google Pay or a card right there, never leaving the page. The gems
 * land and the skin is bought in the same breath, then the wardrobe takes
 * the reveal: spin-up, flash, the skin worn, and the player is back on the
 * shelf wearing it one tap later.
 */
export function SkinSheet({ skin, onLanded, onClose }: { skin: Skin; onLanded: (result: SkinBought) => void; onClose: () => void }) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const balances = useBalances();
  const shop = useGemShop();
  const gems = balances?.balances.gems ?? 0;
  const gemPacks = shop.economy?.packs ?? [];
  const stripeReady = shop.publishableKey !== null && shop.economy !== null;
  const sandbox = !stripeReady && shop.sandbox && shop.economy !== null;
  const short = Math.max(0, skin.gems - gems);

  const [step, setStep] = useState<Step>("confirm");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [landed, setLanded] = useState<SkinBought | null>(null);

  const [neon, neonCool] = RARITY_NEON[skin.rarity];
  const theme = { "--energy": neon, "--energy-cool": neonCool } as CSSProperties;

  const go = useCallback((next: Step, direction: "fwd" | "back") => {
    setDir(direction);
    setStep(next);
  }, []);

  // The page behind holds still; focus starts on the sheet; the sheet announces itself.
  useEffect(() => {
    playSheetAppear();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  // Every step starts at the top of the sheet.
  useEffect(() => {
    sheetRef.current?.scrollTo({ top: 0, left: 0 });
  }, [step]);

  /** Leave the checkout: the intent is canceled so it can never charge later. */
  const leaveCheckout = useCallback(() => {
    const id = checkout?.payment?.paymentIntentId;
    if (id) void abandonGemPayment(id).catch(() => {});
    setCheckout(null);
  }, [checkout]);

  const dismiss = useCallback(() => {
    playSheetBack();
    leaveCheckout();
    onClose();
  }, [leaveCheckout, onClose]);

  const swipe = useSheetSwipe(sheetRef, dismiss);

  // Escape: back one step from the checkout, closed from the confirmation and the landing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      if (step === "pay") back();
      else dismiss();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  /** The skin landed (paid in gems, or by card and gems at once): the wardrobe takes the reveal. */
  const land = useCallback(
    (result: SkinBought) => {
      onLanded(result);
      setCheckout(null);
      setLanded(result);
      go("landed", "fwd");
    },
    [go, onLanded],
  );

  /** Open a Stripe intent for the gem pack (the card form keys on it). */
  async function openPayment(gemPack: GemPack) {
    if (!stripeReady) {
      setCheckout({ gemPack, payment: null, loading: false, error: sandbox ? null : "Payments are not set up yet." });
      return;
    }
    setCheckout({ gemPack, payment: null, loading: true, error: null });
    try {
      const result = await createGemPayment(gemPack.gems);
      setCheckout((current) => {
        // The player moved on (back, or another pack) while Stripe answered: drop this intent.
        if (!current || current.gemPack.gems !== gemPack.gems || !current.loading) {
          if (!("error" in result)) void abandonGemPayment(result.paymentIntentId).catch(() => {});
          return current;
        }
        if ("error" in result) return { ...current, loading: false, error: result.error };
        return { ...current, loading: false, payment: result };
      });
    } catch {
      setCheckout((current) => (current ? { ...current, loading: false, error: "Could not start the payment. Try again." } : current));
    }
  }

  /** Unlock: the bag pays, or the sheet slides to the checkout. */
  async function unlock() {
    playSheetBuy();
    pulseUi(6);
    setError(null);
    if (short > 0) {
      if (gemPacks.length === 0) {
        setError("Gems are not on sale right now.");
        return;
      }
      go("pay", "fwd");
      void openPayment(gemPackFor(gemPacks, short));
      return;
    }
    setBusy(true);
    try {
      const result = await buySkin(skin.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      land(result);
    } catch {
      setError("Could not reach the shop. Try again.");
    } finally {
      setBusy(false);
    }
  }

  /** Another gem pack: a new intent for the new amount, the old one canceled. */
  function pickGemPack(gemPack: GemPack) {
    if (!checkout || checkout.gemPack.gems === gemPack.gems) return;
    playSheetBuy();
    const previous = checkout.payment?.paymentIntentId;
    if (previous) void abandonGemPayment(previous).catch(() => {});
    void openPayment(gemPack);
  }

  function back() {
    playSheetBack();
    leaveCheckout();
    go("confirm", "back");
  }

  /** Stripe confirmed the intent in the sheet: gems land, the skin is bought, the wardrobe opens. */
  const paid = useCallback(
    async (paymentIntentId: string): Promise<string | null> => {
      try {
        const result = await claimSkinPayment(paymentIntentId, skin.id);
        if ("error" in result) return result.error;
        land(result);
        return null;
      } catch {
        return "Paid — but the skin could not be confirmed yet. Your gems land as soon as Stripe's confirmation arrives.";
      }
    },
    [land, skin.id],
  );

  /** Dev only: the pack for free, then the skin, as one landing. */
  async function sandboxPay() {
    if (!checkout || !shop.economy) return;
    playSheetBuy();
    setCheckout({ ...checkout, loading: true, error: null });
    try {
      const topUp = await sandboxTopUp(checkout.gemPack.gems);
      if ("error" in topUp) {
        setCheckout({ ...checkout, loading: false, error: topUp.error });
        return;
      }
      const result = await buySkin(skin.id);
      if ("error" in result) {
        balances?.setBalances(topUp.balances);
        setCheckout({ ...checkout, loading: false, error: result.error });
        return;
      }
      land({ ...result, paid: { gems: checkout.gemPack.gems, cents: packPriceCents(checkout.gemPack, shop.economy) } });
    } catch {
      setCheckout({ ...checkout, loading: false, error: "Could not unlock. Try again." });
    }
  }

  const paying = step === "pay" && checkout !== null;
  const slotLabel = skin.slot === "paddle" ? "Paddle" : "Ball";
  const coverPack = short > 0 && gemPacks.length > 0 ? gemPackFor(gemPacks, short) : null;

  const sheet = (
    <div className="energy-sheet skin-sheet" data-rarity={skin.rarity} style={theme} onClick={step === "pay" ? back : dismiss}>
      <div
        ref={sheetRef}
        className="energy-sheet-body skin-sheet-body"
        data-step={step}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={swipe.onPointerDown}
        onPointerMove={swipe.onPointerMove}
        onPointerUp={swipe.onPointerUp}
        onPointerCancel={swipe.onPointerCancel}
      >
        <div className="gem-shop-handle" aria-hidden="true" />
        {step === "landed" && landed ? (
          <>
            <button type="button" className="header-chip energy-sheet-close energy-sheet-close-abs" aria-label="Close" onClick={dismiss}>
              <span className="sr-only">Close</span>
              <CloseIcon />
            </button>
            <SkinLanded skin={skin} bought={landed} onDone={dismiss} />
          </>
        ) : (
          <>
            <ol className="wizard-dots" aria-label={`Step ${paying ? 2 : 1} of 2`}>
              <li data-on="true" />
              <li data-on={paying ? "true" : undefined} />
            </ol>
            <div className="energy-sheet-head">
              {paying ? (
                <button type="button" className="header-chip energy-sheet-close energy-sheet-back" aria-label="Back to the skin" onClick={back}>
                  <ChevronLeftIcon />
                </button>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{paying ? `${slotLabel} · Checkout` : `${slotLabel} · ${RARITY_LABEL[skin.rarity]}`}</p>
                <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Unlock <span className="text-neon">{skin.name}</span>
                </h2>
              </div>
              <button type="button" className="header-chip energy-sheet-close" aria-label="Close" onClick={dismiss}>
                <span className="sr-only">Close</span>
                <CloseIcon />
              </button>
            </div>

            {paying && checkout && shop.economy ? (
              <div key="pay" className="energy-wizard" data-dir={dir}>
                <SkinCheckout
                  skin={skin}
                  checkout={checkout}
                  gems={gems}
                  gemPacks={gemPacks}
                  economy={shop.economy}
                  publishableKey={shop.publishableKey}
                  sandbox={sandbox}
                  onPick={pickGemPack}
                  onPaid={paid}
                  onSandboxPay={() => void sandboxPay()}
                />
              </div>
            ) : (
              <div key="confirm" className="energy-wizard" data-dir={dir}>
                <div className="energy-core skin-sheet-hero">
                  <SkinSwatch skin={skin} className="skin-sheet-swatch" />
                  <p className="energy-core-line">
                    <span className="skin-sheet-rarity" data-rarity={skin.rarity}>
                      <span className="fitting-rarity-dot" aria-hidden="true" />
                      {RARITY_LABEL[skin.rarity]}
                    </span>
                    <span className="energy-core-dot" aria-hidden="true">
                      ·
                    </span>
                    {skin.line}
                  </p>
                </div>

                <div className="energy-receipt skin-receipt" role="group" aria-label="What you get">
                  <div className="energy-receipt-row">
                    <SkinSwatch skin={skin} className="skin-receipt-swatch" />
                    <span className="energy-receipt-copy">
                      <span className="energy-receipt-name">{skin.name}</span>
                      <span className="energy-receipt-sub">
                        {slotLabel} skin · worn as soon as it lands
                      </span>
                    </span>
                    <span className="energy-receipt-amount" data-debit="true">
                      <GemGlyph /> −{formatGems(skin.gems)}
                    </span>
                  </div>
                  <p className="energy-receipt-left">
                    <span>{short > 0 ? `You have ${formatGems(gems)} — short by` : "Left in your bag after the unlock"}</span>
                    <b>
                      <GemGlyph /> {formatGems(short > 0 ? short : gems - skin.gems)}
                    </b>
                  </p>
                </div>

                {error ? (
                  <p className="mt-3 text-sm text-danger" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="button"
                  className="btn-play skin-sheet-cta"
                  disabled={busy}
                  aria-label={
                    short > 0
                      ? `Unlock ${skin.name} for ${formatGems(skin.gems)} gems. You are ${formatGems(short)} gems short. Pay by card${coverPack && shop.economy ? `, ${formatCents(packPriceCents(coverPack, shop.economy))}` : ""}.`
                      : `Unlock ${skin.name} for ${formatGems(skin.gems)} gems`
                  }
                  onClick={() => void unlock()}
                >
                  {busy ? (
                    "Unlocking…"
                  ) : short > 0 && coverPack && shop.economy ? (
                    <>
                      <span>Unlock for {formatCents(packPriceCents(coverPack, shop.economy))}</span>
                      <span className="skin-sheet-cta-sub">
                        +<GemGlyph /> {formatGems(coverPack.gems)} gems · {formatGems(gems + coverPack.gems - skin.gems)} left over
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        Unlock for <GemGlyph className="gem-glyph skin-action-gem" /> {formatGems(skin.gems)}
                      </span>
                    </>
                  )}
                </button>

                <p className="energy-sheet-fine">
                  Skins are yours for good, on every board you play. Gems are a game currency with no cash value and cannot be refunded once spent.
                </p>

                <button type="button" className="btn-glass story-clear-glass energy-sheet-later" onClick={dismiss}>
                  Not now
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

/**
 * Step two: the receipt — the skin, the gem pack that pays for it (any of the
 * packs, the smallest that covers the shortfall picked), what stays in the
 * bag — then Apple Pay / Google Pay / the card, right here.
 */
function SkinCheckout({
  skin,
  checkout,
  gems,
  gemPacks,
  economy,
  publishableKey,
  sandbox,
  onPick,
  onPaid,
  onSandboxPay,
}: {
  skin: Skin;
  checkout: Checkout;
  gems: number;
  gemPacks: GemPack[];
  economy: NonNullable<ReturnType<typeof useGemShop>["economy"]>;
  publishableKey: string | null;
  sandbox: boolean;
  onPick: (gemPack: GemPack) => void;
  onPaid: (paymentIntentId: string) => Promise<string | null>;
  onSandboxPay: () => void;
}) {
  const { gemPack, payment, loading, error } = checkout;
  const price = packPriceCents(gemPack, economy);
  const list = packListCents(gemPack.gems, economy);
  const left = gems + gemPack.gems - skin.gems;
  const tier = bagTierFor(Math.max(0, gemPacks.findIndex((item) => item.gems === gemPack.gems)), gemPacks.length);

  const receipt = (
    <div className="energy-receipt skin-receipt" role="group" aria-label="What you get">
      <div className="energy-receipt-row">
        <SkinSwatch skin={skin} className="skin-receipt-swatch" />
        <span className="energy-receipt-copy">
          <span className="energy-receipt-name">{skin.name}</span>
          <span className="energy-receipt-sub">
            {skin.slot === "paddle" ? "Paddle" : "Ball"} · {RARITY_LABEL[skin.rarity]}
          </span>
        </span>
        <span className="energy-receipt-amount" data-debit="true">
          <GemGlyph /> −{formatGems(skin.gems)}
        </span>
      </div>
      <div className="energy-receipt-row">
        <span className="energy-receipt-bag" aria-hidden="true">
          <GemBag tier={tier} />
        </span>
        <span className="energy-receipt-copy">
          <span className="energy-receipt-name">
            <GemGlyph /> {formatGems(gemPack.gems)} gems
          </span>
          <span className="energy-receipt-sub">
            {gemPack.discountPct > 0 ? `Gem pack · ${gemPack.discountPct}% off` : "Gem pack"}
            {gems > 0 ? ` · you have ${formatGems(gems)}` : ""}
          </span>
        </span>
        <span className="energy-receipt-amount">
          {price < list ? <s>{formatCents(list)}</s> : null}
          {formatCents(price)}
        </span>
      </div>
      <div className="energy-gem-picks" role="radiogroup" aria-label="Gem pack">
        {gemPacks.map((item) => {
          const on = item.gems === gemPack.gems;
          const covers = gems + item.gems >= skin.gems;
          return (
            <button
              key={item.gems}
              type="button"
              role="radio"
              aria-checked={on}
              className="energy-gem-pick"
              data-on={on ? "true" : undefined}
              disabled={!covers || loading}
              onClick={() => onPick(item)}
            >
              <span className="energy-gem-pick-gems">
                <GemGlyph /> {formatGems(item.gems)}
              </span>
              <span className="energy-gem-pick-price">{formatCents(packPriceCents(item, economy))}</span>
            </button>
          );
        })}
      </div>
      <p className="energy-receipt-left">
        Left in your bag after the unlock
        <b>
          <GemGlyph /> {formatGems(left)}
        </b>
      </p>
      <p className="energy-receipt-total">
        <span className="energy-receipt-total-label">
          You pay today
          <small>
            {formatGems(gemPack.gems)} gems · {formatCents(price)}
          </small>
        </span>
        <b>{formatCents(price)}</b>
      </p>
    </div>
  );

  if (payment && publishableKey) {
    return (
      <GemPay
        key={payment.paymentIntentId}
        publishableKey={publishableKey}
        payment={payment}
        pack={gemPack}
        tier={tier}
        listCents={list}
        night
        summary={receipt}
        onPaid={onPaid}
      />
    );
  }

  return (
    <div className="pay-step">
      {receipt}
      {error ? (
        <p className="text-sm leading-6 text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <div className="pay-loading" aria-live="polite" aria-busy="true">
          <span className="pay-loading-bar" />
          <span className="pay-loading-bar" />
          <span className="pay-loading-line">Preparing secure payment…</span>
        </div>
      ) : null}
      {sandbox && !loading ? (
        <>
          <p className="font-mono text-xs tracking-[0.08em] text-accent">Sandbox: the pack is free while Stripe is off.</p>
          <button type="button" className="btn-play pay-cta" onClick={onSandboxPay}>
            Get {formatGems(gemPack.gems)} gems and unlock
          </button>
        </>
      ) : null}
    </div>
  );
}

/**
 * The skin has landed. The wardrobe spins up — the swatch dims and tightens,
 * rings close in — then the reveal: a flash, shockwaves, sparks thrown from
 * the swatch, a shake; "Unlocked" stamps, and the skin sits lit, worn. A tap
 * skips; reduced motion starts at the end.
 */
function SkinLanded({ skin, bought, onDone }: { skin: Skin; bought: SkinBought; onDone: () => void }) {
  const [stageAnim, setStage] = useState<"charge" | "burst" | "stamp" | "done">("charge");
  const [skipped, setSkipped] = useState(false);
  const [buttonsTimed, setButtons] = useState(false);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  const skip = reduced || skipped;
  const stage = skip ? "done" : stageAnim;
  const buttons = skip || buttonsTimed;
  const burst = stage !== "charge";

  useEffect(() => {
    if (skip) return;
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        playSkinReveal();
        pulseUi([8, 40, 8, 40, 12]);
      }, T.charge),
    );
    timers.push(
      window.setTimeout(() => {
        setStage("burst");
        pulseUi([24, 20, 40]);
      }, T.burst),
    );
    timers.push(
      window.setTimeout(() => {
        setStage("stamp");
        playSkinStamp();
      }, T.stamp),
    );
    timers.push(window.setTimeout(() => setStage("done"), T.done));
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [skip]);

  useEffect(() => {
    if (stage !== "done" || buttons) return;
    const id = window.setTimeout(() => setButtons(true), T.buttonsAfter);
    return () => window.clearTimeout(id);
  }, [buttons, stage]);

  const paid = bought.paid;

  return (
    <div
      className="energy-landed skin-landed"
      data-stage={stage}
      data-burst={burst ? "true" : undefined}
      data-skip={skip ? "true" : undefined}
      role="group"
      aria-label={`${skin.name} unlocked and worn. ${formatGems(bought.balances.gems)} gems left in the bag.`}
      onClick={() => setSkipped(true)}
    >
      <p className="story-clear-kicker">{skin.slot === "paddle" ? "Paddle" : "Ball"} unlocked</p>
      <h2 className="energy-landed-title">{skin.name}</h2>

      <div className="story-clear-xp" data-stage={stage === "charge" || stage === "burst" ? "hidden" : "stamp"}>
        <span className="story-clear-stamp energy-landed-stamp skin-landed-stamp">Wearing now</span>
      </div>

      <div className="energy-core energy-landed-core skin-landed-core" data-live={stage === "stamp" || stage === "done"}>
        <span className="surge" aria-hidden="true">
          <i className="surge-flash" />
          <i className="surge-ring" style={{ "--k": 0 } as CSSProperties} />
          <i className="surge-ring" style={{ "--k": 1 } as CSSProperties} />
          <i className="surge-ring" style={{ "--k": 2 } as CSSProperties} />
          <i className="surge-wave" style={{ "--k": 0 } as CSSProperties} />
          <i className="surge-wave" style={{ "--k": 1 } as CSSProperties} />
          <i className="surge-wave" style={{ "--k": 2 } as CSSProperties} />
          {SPARKS.map((spark, i) => (
            <i
              key={i}
              className="surge-spark"
              style={{ "--a": `${spark.a}deg`, "--d": `${spark.d}rem`, "--s": spark.s, "--delay": `${spark.delay}ms` } as CSSProperties}
            />
          ))}
        </span>
        <SkinSwatch skin={skin} className="skin-sheet-swatch skin-landed-swatch" />
        <p className="energy-core-line" data-show={stage === "done"}>
          <span className="skin-sheet-rarity" data-rarity={skin.rarity}>
            <span className="fitting-rarity-dot" aria-hidden="true" />
            {RARITY_LABEL[skin.rarity]}
          </span>
          <span className="energy-core-dot" aria-hidden="true">
            ·
          </span>
          {skin.line}
        </p>
      </div>

      <p className="story-clear-note mt-3">
        {paid ? (
          <>
            Paid {formatCents(paid.cents)} · <GemGlyph /> +{formatGems(paid.gems)} landed, −{formatGems(skin.gems)} for {skin.name} · {formatGems(bought.balances.gems)} left in the bag
          </>
        ) : (
          <>
            <GemGlyph /> −{formatGems(skin.gems)} · {formatGems(bought.balances.gems)} left in the bag
          </>
        )}
      </p>

      <div className="story-clear-actions energy-landed-actions" data-show={buttons}>
        <button type="button" className="btn-play" onClick={onDone}>
          Back to the shelf
        </button>
      </div>
    </div>
  );
}

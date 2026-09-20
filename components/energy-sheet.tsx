"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { abandonGemPayment, createGemPayment, sandboxTopUp, type GemPayment } from "@/app/actions/earn";
import { buyEnergy, claimEnergyPayment, type EnergyBought } from "@/app/actions/energy";
import { useBalances } from "@/components/balances-provider";
import { BoltGlyph, GemGlyph } from "@/components/currency-glyphs";
import { clearEnergyIntent, useEnergy, writeEnergyIntent } from "@/components/energy-provider";
import { EnergyGauge } from "@/components/energy-gauge";
import { GemBag, bagTierFor } from "@/components/gem-bag";
import { GemPay } from "@/components/gem-pay";
import { useGemShop } from "@/components/gem-shop";
import { ChevronLeftIcon, CloseIcon } from "@/components/nav-icons";
import { createEnergySfx, ENERGY_SURGE_MS, playSheetBack, playSheetBuy, type EnergySfx } from "@/game/breakout/audio";
import { isHapticsEnabled, isHapticsSupported } from "@/game/breakout/haptics";
import { formatCents, formatGems, packListCents, packPriceCents, type GemPack } from "@/lib/economy";
import {
  ENERGY_CLEAR_REFUND,
  ENERGY_PACKS,
  ENERGY_PLAY_COST,
  formatEnergyClock,
  runsLeft,
  type EnergyPack,
} from "@/lib/energy";

export type EnergySheetReason = "play" | "retry" | "browse";

/** Timeline of the landing, ms from the purchase. */
const T = {
  /** The reactor starts spinning up. */
  charge: 140,
  /** The blast: `ENERGY_SURGE_MS` after the spin-up starts, on the voice's beat. */
  burst: 140 + ENERGY_SURGE_MS,
  stamp: 140 + ENERGY_SURGE_MS + 160,
  fillStart: 140 + ENERGY_SURGE_MS + 420,
  /** Per cell. */
  cellGap: 110,
  buttonsAfter: 320,
} as const;

/** The sparks the blast throws: angle, reach and size, laid out by hand so the burst is the same every time. */
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  a: (i * 360) / 14 + ((i * 37) % 11) - 5,
  d: 4.2 + ((i * 53) % 7) * 0.45,
  s: 0.7 + ((i * 29) % 5) * 0.12,
  delay: ((i * 17) % 6) * 18,
}));

function pulse(pattern: number | number[]) {
  if (!isHapticsEnabled() || !isHapticsSupported()) return;
  navigator.vibrate(pattern);
}

/** A live clock to the next free recharge. */
export function EnergyClock({ resetAt, className = "" }: { resetAt: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time className={`energy-clock ${className}`.trim()} dateTime={resetAt}>
      {formatEnergyClock(resetAt, new Date(now))}
    </time>
  );
}

const COPY: Record<EnergySheetReason, { title: [string, string]; line: string }> = {
  play: {
    title: ["Out of", "energy"],
    line: `Every run takes ${ENERGY_PLAY_COST} cells and a clear gives ${ENERGY_CLEAR_REFUND} back. The core is drained — recharge now, or it refills for free at midnight UTC.`,
  },
  retry: {
    title: ["Out of", "energy"],
    line: `One more try takes ${ENERGY_PLAY_COST} cells. The core is drained — recharge now, or it refills for free at midnight UTC.`,
  },
  browse: {
    title: ["Recharge the", "core"],
    line: `Every run takes ${ENERGY_PLAY_COST} cells and a clear gives ${ENERGY_CLEAR_REFUND} back. Cells you buy stack past the max and stay through midnight.`,
  },
};

type Step = "packs" | "pay" | "landed";

/** The checkout step: the recharge wanted, the gem pack that pays for it, the Stripe intent for that pack. */
type Checkout = {
  pack: EnergyPack;
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
 * The recharge sheet — where an empty gauge always leads — is a wizard in
 * two steps and a landing. The core at the top, a clock to the free recharge,
 * three packs paid in gems; one the bag can pay lands at once. One it cannot
 * slides the sheet to the checkout: the gem pack that covers it, the recharge
 * debited from that pack, what stays in the bag — and Apple Pay, Google Pay or
 * a card right there, never leaving the page. The gems land and the recharge
 * is bought in the same breath, then the core takes the surge: spin-up,
 * blast, the cells igniting up the scale, and the run the player was after is
 * one tap away.
 */
export function EnergySheet({
  reason,
  hasReady,
  onReady,
  onClose,
}: {
  reason: EnergySheetReason;
  /** A run is waiting on the other side: the landing's primary button serves it. */
  hasReady: boolean;
  onReady: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const energy = useEnergy();
  const balances = useBalances();
  const shop = useGemShop();
  const gems = balances?.balances.gems ?? 0;
  const state = energy?.state ?? { energy: 0, max: 6, resetAt: new Date().toISOString() };
  const gemPacks = shop.economy?.packs ?? [];
  const stripeReady = shop.publishableKey !== null && shop.economy !== null;
  const sandbox = !stripeReady && shop.sandbox && shop.economy !== null;

  const [step, setStep] = useState<Step>("packs");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [landed, setLanded] = useState<EnergyBought | null>(null);

  const depleted = state.energy < ENERGY_PLAY_COST;
  const copy = depleted && reason === "browse" ? COPY.play : COPY[reason];

  const go = useCallback((next: Step, direction: "fwd" | "back") => {
    setDir(direction);
    setStep(next);
  }, []);

  // The page behind holds still; focus starts on the sheet.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  // Every step starts at the top of the sheet, flush left (a slide mid-flight can leave it scrolled).
  useEffect(() => {
    sheetRef.current?.scrollTo({ top: 0, left: 0 });
  }, [step]);

  /** Leave the checkout: the intent is canceled so it can never charge later. */
  const leaveCheckout = useCallback(() => {
    const id = checkout?.payment?.paymentIntentId;
    if (id) void abandonGemPayment(id).catch(() => {});
    clearEnergyIntent();
    setCheckout(null);
  }, [checkout]);

  const dismiss = useCallback(() => {
    playSheetBack();
    leaveCheckout();
    onClose();
  }, [leaveCheckout, onClose]);

  // Escape: back one step from the checkout, closed from the packs; the landing is left alone.
  useEffect(() => {
    if (step === "landed") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      if (step === "pay") back();
      else dismiss();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  /** A recharge landed (paid in gems, or by card and gems at once): the core takes the surge. */
  const setBalances = balances?.setBalances;
  const land = useCallback(
    (result: EnergyBought) => {
      setBalances?.(result.balances);
      clearEnergyIntent();
      setCheckout(null);
      setLanded(result);
      go("landed", "fwd");
    },
    [go, setBalances],
  );

  /** Open a Stripe intent for the gem pack (the card form keys on it). */
  async function openPayment(pack: EnergyPack, gemPack: GemPack) {
    if (!stripeReady) {
      setCheckout({ pack, gemPack, payment: null, loading: false, error: sandbox ? null : "Payments are not set up yet." });
      return;
    }
    setCheckout({ pack, gemPack, payment: null, loading: true, error: null });
    try {
      const result = await createGemPayment(gemPack.gems);
      setCheckout((current) => {
        // The player moved on (back, or another pack) while Stripe answered: drop this intent.
        if (!current || current.pack.id !== pack.id || current.gemPack.gems !== gemPack.gems || !current.loading) {
          if (!("error" in result)) void abandonGemPayment(result.paymentIntentId).catch(() => {});
          return current;
        }
        if ("error" in result) return { ...current, loading: false, error: result.error };
        // A bank page would leave the site: the note brings this sheet back over the landing.
        writeEnergyIntent();
        return { ...current, loading: false, payment: result };
      });
    } catch {
      setCheckout((current) => (current ? { ...current, loading: false, error: "Could not start the payment. Try again." } : current));
    }
  }

  /** Buy: the bag pays, or the sheet slides to the checkout. */
  async function buy(pack: EnergyPack) {
    playSheetBuy();
    setError(null);
    if (gems < pack.gems) {
      if (gemPacks.length === 0) {
        setError("Gems are not on sale right now.");
        return;
      }
      go("pay", "fwd");
      void openPayment(pack, gemPackFor(gemPacks, pack.gems - gems));
      return;
    }
    setBusy(pack.id);
    try {
      const result = await buyEnergy(pack.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      land(result);
    } catch {
      setError("Could not recharge. Try again.");
    } finally {
      setBusy(null);
    }
  }

  /** Another gem pack: a new intent for the new amount, the old one canceled. */
  function pickGemPack(gemPack: GemPack) {
    if (!checkout || checkout.gemPack.gems === gemPack.gems) return;
    playSheetBuy();
    const previous = checkout.payment?.paymentIntentId;
    if (previous) void abandonGemPayment(previous).catch(() => {});
    void openPayment(checkout.pack, gemPack);
  }

  function back() {
    playSheetBack();
    leaveCheckout();
    go("packs", "back");
  }

  /** Stripe confirmed the intent in the sheet: gems land, the recharge is bought, the core surges. */
  const paid = useCallback(
    async (paymentIntentId: string): Promise<string | null> => {
      if (!checkout) return "The checkout was closed.";
      try {
        const result = await claimEnergyPayment(paymentIntentId, checkout.pack.id);
        if ("error" in result) return result.error;
        land(result);
        return null;
      } catch {
        return "Paid — but the recharge could not be confirmed yet. Your gems land as soon as Stripe's confirmation arrives.";
      }
    },
    [checkout, land],
  );

  /** Dev only: the pack for free, then the recharge, as one landing. */
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
      const result = await buyEnergy(checkout.pack.id);
      if ("error" in result) {
        balances?.setBalances(topUp.balances);
        setCheckout({ ...checkout, loading: false, error: result.error });
        return;
      }
      land({ ...result, paid: { gems: checkout.gemPack.gems, cents: packPriceCents(checkout.gemPack, shop.economy) } });
    } catch {
      setCheckout({ ...checkout, loading: false, error: "Could not recharge. Try again." });
    }
  }

  const paying = step === "pay" && checkout !== null;

  return (
    <div
      className="energy-sheet"
      data-depleted={depleted ? "true" : undefined}
      onClick={step === "landed" ? undefined : step === "pay" ? back : dismiss}
    >
      <div
        ref={sheetRef}
        className="energy-sheet-body"
        data-step={step}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="gem-shop-handle" aria-hidden="true" />
        {step === "landed" && landed ? (
          <EnergyLanded
            bought={landed}
            hasReady={hasReady}
            onReady={onReady}
            onDone={dismiss}
            onMore={() => {
              playSheetBuy();
              energy?.setState(landed.energy);
              setLanded(null);
              go("packs", "back");
            }}
            onCount={() => energy?.setState(landed.energy)}
          />
        ) : (
          <>
            <ol className="wizard-dots" aria-label={`Step ${paying ? 2 : 1} of 2`}>
              <li data-on="true" />
              <li data-on={paying ? "true" : undefined} />
            </ol>
            <div className="energy-sheet-head">
              {paying ? (
                <button type="button" className="header-chip energy-sheet-close energy-sheet-back" aria-label="Back to the recharges" onClick={back}>
                  <ChevronLeftIcon />
                </button>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{paying ? "Energy · Checkout" : "Energy"}</p>
                <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {paying && checkout ? (
                    <>
                      Power up <span className="text-neon">{checkout.pack.name}</span>
                    </>
                  ) : (
                    <>
                      {copy.title[0]} <span className="text-neon">{copy.title[1]}</span>
                    </>
                  )}
                </h2>
              </div>
              <button type="button" className="header-chip energy-sheet-close" aria-label="Close" onClick={dismiss}>
                <span className="sr-only">Close</span>
                <CloseIcon />
              </button>
            </div>

            {paying && checkout && shop.economy ? (
              <div key="pay" className="energy-wizard" data-dir={dir}>
                <EnergyCheckout
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
              <div key="packs" className="energy-wizard" data-dir={dir}>
                <div className="energy-core" data-depleted={depleted ? "true" : undefined}>
                  <EnergyGauge energy={state.energy} max={state.max} size="lg" />
                  <p className="energy-core-line">
                    {depleted
                      ? "No run left today"
                      : `${runsLeft(state.energy)} ${runsLeft(state.energy) === 1 ? "run" : "runs"} left`}
                    <span className="energy-core-dot" aria-hidden="true">
                      ·
                    </span>
                    <span className="energy-core-clock">
                      Free recharge in <EnergyClock resetAt={state.resetAt} />
                    </span>
                  </p>
                </div>

                <p className="energy-sheet-copy">{copy.line}</p>

                {error ? (
                  <p className="mt-3 text-sm text-danger" role="alert">
                    {error}
                  </p>
                ) : null}

                <ul className="energy-packs" aria-label="Recharges">
                  {ENERGY_PACKS.map((pack) => {
                    const short = gems < pack.gems;
                    return (
                      <li key={pack.id} className="energy-pack" data-tag={pack.tag || undefined} data-short={short ? "true" : undefined}>
                        {pack.tag ? <span className="pack-tag">{pack.tag}</span> : null}
                        <EnergyPackArt pack={pack} />
                        <span className="energy-pack-copy">
                          <span className="energy-pack-name">{pack.name}</span>
                          <span className="energy-pack-cells">
                            +{pack.cells} {pack.cells === 1 ? "cell" : "cells"}
                            <span className="energy-pack-runs"> · {runsLeft(pack.cells)} {runsLeft(pack.cells) === 1 ? "run" : "runs"}</span>
                          </span>
                          <span className="energy-pack-line">{pack.line}</span>
                        </span>
                        <button
                          type="button"
                          className={`energy-pack-cta ${short ? "btn-glass story-clear-glass" : "btn-play"}`}
                          disabled={busy !== null}
                          aria-label={
                            short
                              ? `${pack.name}: ${pack.cells} cells for ${formatGems(pack.gems)} gems. You are ${formatGems(pack.gems - gems)} gems short. Pay by card.`
                              : `Buy ${pack.name}: ${pack.cells} cells for ${formatGems(pack.gems)} gems`
                          }
                          onClick={() => void buy(pack)}
                        >
                          {busy === pack.id ? (
                            "Charging…"
                          ) : (
                            <>
                              <GemGlyph /> {formatGems(pack.gems)}
                              {short ? <span className="energy-pack-cta-sub">Get it</span> : null}
                            </>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <p className="energy-sheet-fine">
                  You have <GemGlyph /> {formatGems(gems)}. Cells you buy stack past the max and are never taken by the midnight recharge.
                </p>

                <button type="button" className="btn-glass story-clear-glass energy-sheet-later" onClick={dismiss}>
                  {depleted ? "Wait for midnight" : "Not now"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** The pack's art: a stack of cells the size of the pack, the bolt riding it. */
function EnergyPackArt({ pack }: { pack: EnergyPack }) {
  return (
    <span className="energy-pack-art" aria-hidden="true" data-cells={pack.cells}>
      {Array.from({ length: Math.min(6, pack.cells) }, (_, i) => (
        <i key={i} style={{ "--cell-i": i } as CSSProperties} />
      ))}
      <BoltGlyph className="bolt-glyph energy-pack-bolt" />
    </span>
  );
}

/**
 * Step two: the receipt — the recharge, the gem pack that pays for it (any of
 * the packs, the smallest that covers the shortfall picked), what stays in
 * the bag — then Apple Pay / Google Pay / the card, right here.
 */
function EnergyCheckout({
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
  const { pack, gemPack, payment, loading, error } = checkout;
  const price = packPriceCents(gemPack, economy);
  const list = packListCents(gemPack.gems, economy);
  const left = gems + gemPack.gems - pack.gems;
  const tier = bagTierFor(Math.max(0, gemPacks.findIndex((item) => item.gems === gemPack.gems)), gemPacks.length);

  const receipt = (
    <div className="energy-receipt" role="group" aria-label="What you get">
      <div className="energy-receipt-row">
        <EnergyPackArt pack={pack} />
        <span className="energy-receipt-copy">
          <span className="energy-receipt-name">{pack.name}</span>
          <span className="energy-pack-cells">
            +{pack.cells} {pack.cells === 1 ? "cell" : "cells"}
            <span className="energy-pack-runs"> · {runsLeft(pack.cells)} {runsLeft(pack.cells) === 1 ? "run" : "runs"}</span>
          </span>
        </span>
        <span className="energy-receipt-amount" data-debit="true">
          <GemGlyph /> −{formatGems(pack.gems)}
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
          const covers = gems + item.gems >= pack.gems;
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
        Left in your bag after the recharge
        <b>
          <GemGlyph /> {formatGems(left)}
        </b>
      </p>
      <p className="energy-receipt-total">
        <span className="energy-receipt-total-label">
          You pay today
          <small>{formatGems(gemPack.gems)} gems · {formatCents(price)}</small>
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
            Get {formatGems(gemPack.gems)} gems and power up
          </button>
        </>
      ) : null}
    </div>
  );
}

/**
 * The recharge has landed. The reactor spins up — the bolt gathers light,
 * rings close in — then the blast: a flash, shockwaves, sparks thrown from
 * the core, a shake; the "+N" stamps, the cells ignite one after the other up
 * the scale, a chord when the gauge reaches the max — and the run the player
 * was after is the primary button. A tap skips; reduced motion starts at the
 * end.
 */
function EnergyLanded({
  bought,
  hasReady,
  onReady,
  onDone,
  onMore,
  onCount,
}: {
  bought: EnergyBought;
  hasReady: boolean;
  onReady: () => void;
  onDone: () => void;
  onMore: () => void;
  /** The cells have started landing: the header pill may move now. */
  onCount: () => void;
}) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const from = bought.before.energy.energy;
  const to = bought.energy.energy;
  const max = bought.energy.max;
  const [skipped, setSkipped] = useState(false);
  const [stageAnim, setStage] = useState<"charge" | "burst" | "stamp" | "fill" | "done">("charge");
  const [shownAnim, setShown] = useState(from);
  const [buttonsTimed, setButtons] = useState(false);
  const sfxRef = useRef<EnergySfx | null>(null);
  const counted = useRef(false);
  // Read through a ref: the parent re-renders when the count lands in the
  // provider, and a fresh callback identity must not restart the animation.
  const onCountRef = useRef(onCount);
  useEffect(() => {
    onCountRef.current = onCount;
  }, [onCount]);

  const skip = reduced || skipped;
  const stage = skip ? "done" : stageAnim;
  const shown = skip ? to : shownAnim;
  const buttons = skip || buttonsTimed;
  const burst = stage !== "charge";

  useEffect(() => {
    const sfx = createEnergySfx();
    sfxRef.current = sfx;
    return () => {
      sfxRef.current = null;
      sfx.destroy();
    };
  }, []);

  useEffect(() => {
    if (skip) {
      if (!counted.current) {
        counted.current = true;
        onCountRef.current();
        sfxRef.current?.full();
      }
      return;
    }
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        sfxRef.current?.surge();
        pulse([8, 40, 8, 40, 12]);
      }, T.charge),
    );
    timers.push(
      window.setTimeout(() => {
        setStage("burst");
        pulse([30, 20, 60]);
      }, T.burst),
    );
    timers.push(
      window.setTimeout(() => {
        setStage("stamp");
        sfxRef.current?.stamp();
      }, T.stamp),
    );
    timers.push(
      window.setTimeout(() => {
        setStage("fill");
        if (!counted.current) {
          counted.current = true;
          onCountRef.current();
        }
      }, T.fillStart),
    );
    const cells = Math.max(0, to - from);
    for (let i = 1; i <= cells; i += 1) {
      timers.push(
        window.setTimeout(() => {
          const value = from + i;
          setShown(value);
          sfxRef.current?.charge(value / max);
          pulse(value >= max ? [10, 30, 16] : 9);
          if (i === cells) {
            if (value >= max) sfxRef.current?.full();
            setStage("done");
          }
        }, T.fillStart + i * T.cellGap),
      );
    }
    if (cells === 0) timers.push(window.setTimeout(() => setStage("done"), T.fillStart + 200));
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [from, max, skip, to]);

  useEffect(() => {
    if (stage !== "done" || buttons) return;
    const id = window.setTimeout(() => setButtons(true), T.buttonsAfter);
    return () => window.clearTimeout(id);
  }, [buttons, stage]);

  const paid = bought.paid;

  return (
    <div
      className="energy-landed"
      data-stage={stage}
      data-burst={burst ? "true" : undefined}
      data-skip={skip ? "true" : undefined}
      role="group"
      aria-label={`Recharged: ${bought.pack.cells} cells added. Energy ${to} of ${max}.`}
      onClick={() => setSkipped(true)}
    >
      <p className="story-clear-kicker">Core recharged</p>
      <h2 className="energy-landed-title">{bought.pack.name}</h2>

      <div className="story-clear-xp" data-stage={stage === "charge" || stage === "burst" ? "hidden" : "stamp"}>
        <span className="story-clear-stamp energy-landed-stamp">
          <BoltGlyph /> +{bought.pack.cells}
        </span>
      </div>

      <div className="energy-core energy-landed-core" data-live={stage === "fill" || stage === "done"}>
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
        <EnergyGauge energy={shown} max={max} size="lg" />
        <p className="energy-core-line" data-show={stage === "done"}>
          {runsLeft(shown)} {runsLeft(shown) === 1 ? "run" : "runs"} ready
        </p>
      </div>

      <p className="story-clear-note mt-3">
        {paid ? (
          <>
            Paid {formatCents(paid.cents)} · <GemGlyph /> +{formatGems(paid.gems)} landed, −{formatGems(bought.pack.gems)} for {bought.pack.name} ·{" "}
            {formatGems(bought.balances.gems)} left in the bag
          </>
        ) : (
          <>
            <GemGlyph /> −{formatGems(bought.pack.gems)} · {formatGems(bought.balances.gems)} left in the bag
          </>
        )}
      </p>

      <div className="story-clear-actions energy-landed-actions" data-show={buttons}>
        {hasReady ? (
          <button
            type="button"
            className="btn-play min-h-12 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onReady();
            }}
          >
            <span className="inline-flex items-center gap-2">
              Play now
              <span className="play-cost">
                <BoltGlyph /> {ENERGY_PLAY_COST}
              </span>
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-play min-h-12 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onDone();
            }}
          >
            Back to the story
          </button>
        )}
        <button
          type="button"
          className="btn-glass story-clear-glass min-h-12 w-full"
          onClick={(e) => {
            e.stopPropagation();
            onMore();
          }}
        >
          Buy more
        </button>
      </div>
    </div>
  );
}

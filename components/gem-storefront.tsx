"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { abandonGemPayment, claimCheckout, claimPayment, createGemPayment, sandboxTopUp, type GemPayment } from "@/app/actions/earn";
import { useBalances } from "@/components/balances-provider";
import { GemGlyph } from "@/components/currency-glyphs";
import { GemBag, bagTierFor } from "@/components/gem-bag";
import { GemPay } from "@/components/gem-pay";
import { PackLanded } from "@/components/pack-landed";
import { playSheetBack, playSheetBuy } from "@/game/breakout/audio";
import type { Balances } from "@/lib/earn";
import { formatCents, formatEth, formatGems, packListCents, packPriceCents, packUnitUsd, type Economy, type GemPack } from "@/lib/economy";

/** What Stripe left in the URL when a payment had to leave the page. */
export type StripeReturn = {
  /** A Checkout Session opened before payments moved into the sheet. */
  sessionId: string | null;
  /** A PaymentIntent confirmed on a bank's page. */
  paymentIntentId: string | null;
  /** Stripe's verdict on that redirect: `succeeded`, `failed`… */
  redirectStatus: string | null;
  canceled: boolean;
};

export type GemStep = "packs" | "pay";

type Step = { kind: "packs" } | { kind: "pay"; pack: GemPack; payment: GemPayment };

/**
 * The gem storefront, from the packs to the landing. Picking a pack turns it
 * into the payment step — Apple Pay, Google Pay or a card, confirmed right
 * here — and the pack lands without the page changing. The gem shop sheet
 * wraps it in a sheet; the shop page lays it out flat. Leaving the payment
 * step (back, unmount) cancels the intent so it can never charge later.
 */
export function GemStorefront({
  economy,
  publishableKey,
  sandbox,
  ret = null,
  intro = "Gems buy tickets, recharges and skins. Bigger bags cost less per gem.",
  layout = "grid",
  onStep,
  onLandedClose,
}: {
  economy: Economy;
  /** Stripe's publishable key, or `null` when payments are not set up. */
  publishableKey: string | null;
  /** Dev only: packs are free while Stripe is off. */
  sandbox: boolean;
  /** A payment that came back through the URL, to be claimed. */
  ret?: StripeReturn | null;
  intro?: ReactNode;
  /** `grid`: bags in a grid (the sheet). `rows`: one pack a row — art, gems and price, the Buy button — like the recharges (the shop page). */
  layout?: "grid" | "rows";
  /** The step changed: the host may retitle itself. */
  onStep?: (step: GemStep) => void;
  /** The landing was closed. The sheet closes with it; the page just shows the packs again. */
  onLandedClose?: () => void;
}) {
  const shared = useBalances();
  const publish = shared?.setBalances;
  const stripeReady = publishableKey !== null;

  const [step, setStep] = useState<Step>({ kind: "packs" });
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Stripe's verdict on a redirect is in the URL: anything but success is a message, not a claim.
  const redirectProblem =
    ret?.paymentIntentId && ret.redirectStatus && ret.redirectStatus !== "succeeded"
      ? ret.redirectStatus === "failed"
        ? "The payment did not go through. Nothing was charged."
        : "The payment is still pending with your bank. Your gems land as soon as it clears."
      : null;
  const claimable = Boolean(ret && (ret.sessionId || ret.paymentIntentId) && !redirectProblem);
  const [claiming, setClaiming] = useState(claimable);
  const claimed = useRef(false);
  /** A pack has landed: the celebration owns the screen until the player leaves it. */
  const [landed, setLanded] = useState<{ gems: number; from: number; balances: Balances; viaStripe: boolean } | null>(null);

  const onStepRef = useRef(onStep);
  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);
  useEffect(() => {
    onStepRef.current?.(step.kind);
  }, [step.kind]);

  const land = useCallback((gems: number, next: Balances, viaStripe: boolean) => {
    setStep({ kind: "packs" });
    setLanded({ gems, from: Math.max(0, next.gems - gems), balances: next, viaStripe });
  }, []);
  // The counter on the celebration has started: now the header pill rolls too.
  const onCount = useCallback(() => {
    if (landed) publish?.(landed.balances);
  }, [landed, publish]);

  // Back from a bank page or an old Checkout Session: ask the server to credit
  // it (the webhook may already have — either way the pack is shown landing once).
  useEffect(() => {
    if (!ret || !claimable || claimed.current) return;
    claimed.current = true;
    const { sessionId, paymentIntentId } = ret;
    const claim = paymentIntentId ? claimPayment(paymentIntentId) : claimCheckout(sessionId as string);
    void claim
      .then((result) => {
        if ("error" in result) {
          setError(result.error);
          return;
        }
        if (result.gems > 0) land(result.gems, result.balances, true);
        else publish?.(result.balances);
      })
      .catch(() => setError("Could not confirm the purchase yet. Your gems will land as soon as Stripe confirms."))
      .finally(() => setClaiming(false));
  }, [claimable, land, publish, ret]);

  // An intent left open when the storefront goes (sheet closed, page left) is canceled.
  const openIntent = useRef<string | null>(null);
  useEffect(() => {
    openIntent.current = step.kind === "pay" ? step.payment.paymentIntentId : null;
  }, [step]);
  useEffect(
    () => () => {
      const id = openIntent.current;
      if (id) void abandonGemPayment(id).catch(() => {});
    },
    [],
  );

  /** Leave the payment step: the intent is canceled so it can never charge later. */
  const back = useCallback(() => {
    playSheetBack();
    setError(null);
    if (step.kind !== "pay") return;
    void abandonGemPayment(step.payment.paymentIntentId).catch(() => {});
    setStep({ kind: "packs" });
  }, [step]);

  async function buy(pack: GemPack) {
    playSheetBuy();
    setBusy(pack.gems);
    setError(null);
    try {
      if (!stripeReady && sandbox) {
        const result = await sandboxTopUp(pack.gems);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        land(result.gems, result.balances, false);
        return;
      }
      const result = await createGemPayment(pack.gems);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setStep({ kind: "pay", pack, payment: result });
    } catch {
      setError("Could not start the payment. Try again.");
    } finally {
      setBusy(null);
    }
  }

  /** Stripe confirmed the intent here: credit it and celebrate. */
  const paid = useCallback(
    async (paymentIntentId: string): Promise<string | null> => {
      try {
        const result = await claimPayment(paymentIntentId);
        if ("error" in result) return result.error;
        if (result.gems > 0) land(result.gems, result.balances, true);
        else publish?.(result.balances);
        return null;
      } catch {
        return "Paid — but the gems could not be confirmed yet. They land as soon as Stripe's confirmation arrives.";
      }
    },
    [land, publish],
  );

  const packs = economy.packs;

  return (
    <>
      {step.kind === "pay" && publishableKey ? (
        <GemPay
          key={step.payment.paymentIntentId}
          publishableKey={publishableKey}
          payment={step.payment}
          pack={step.pack}
          tier={bagTierFor(Math.max(0, packs.findIndex((pack) => pack.gems === step.pack.gems)), packs.length)}
          listCents={packListCents(step.pack.gems, economy)}
          onPaid={paid}
          onBack={back}
        />
      ) : (
        <>
          {intro ? <p className="text-sm leading-6 text-ink-muted">{intro}</p> : null}

          {claiming ? (
            <p className="mt-4 text-sm text-ink-muted" aria-live="polite">
              Confirming your purchase with Stripe…
            </p>
          ) : null}
          {ret?.canceled && !landed ? <p className="mt-4 text-sm text-ink-muted">Checkout canceled. Nothing was charged.</p> : null}
          {error ?? redirectProblem ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              {error ?? redirectProblem}
            </p>
          ) : null}
          {!stripeReady && !sandbox ? (
            <div className="glass mt-4 p-4 text-sm leading-6 text-ink-muted">
              Payments are not set up yet. Come back soon — the packs below show the prices.
            </div>
          ) : null}
          {!stripeReady && sandbox ? (
            <p className="mt-4 font-mono text-xs tracking-[0.08em] text-accent">Sandbox: packs are free while Stripe is off.</p>
          ) : null}

          <div className="pack-grid mt-6" data-layout={layout}>
            {packs.map((pack, index) => {
              const price = packPriceCents(pack, economy);
              const list = packListCents(pack.gems, economy);
              const tag = pack.tag;
              const disabled = (!stripeReady && !sandbox) || busy !== null;
              const save = pack.discountPct > 0 ? `Save ${pack.discountPct}%` : `${(packUnitUsd(pack, economy) * 100).toFixed(1)}¢ a gem`;
              return (
                <button
                  key={pack.gems}
                  type="button"
                  className="pack glass"
                  data-tag={tag}
                  disabled={disabled}
                  style={{ "--i": index } as CSSProperties}
                  aria-label={`${formatGems(pack.gems)} gems for ${formatCents(price)}${pack.discountPct > 0 ? `, ${pack.discountPct}% off` : ""}`}
                  onClick={() => void buy(pack)}
                >
                  {tag ? <span className="pack-tag">{tag}</span> : null}
                  <GemBag tier={bagTierFor(index, packs.length)} />
                  <span className="pack-copy">
                    <span className="pack-gems">
                      <GemGlyph /> {formatGems(pack.gems)}
                    </span>
                    {/* In rows the Buy button carries the price; the copy keeps the list price it was cut from. */}
                    {layout === "rows" ? (
                      price < list ? (
                        <span className="pack-price">
                          <s>{formatCents(list)}</s>
                        </span>
                      ) : null
                    ) : (
                      <span className="pack-price">
                        {price < list ? <s>{formatCents(list)}</s> : null}
                        {formatCents(price)}
                      </span>
                    )}
                    <span className="pack-save">{save}</span>
                  </span>
                  <span className="btn-play pack-cta">{busy === pack.gems ? "Opening…" : layout === "rows" ? formatCents(price) : "Buy"}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-xs leading-5 text-ink-muted">
            Gems are a game currency with no cash value and cannot be refunded once spent. Winnings are paid in ETH to
            your balance and can be withdrawn from your wallet once they reach {formatEth(economy.withdrawMinEth)}.
          </p>
        </>
      )}

      {landed ? (
        <PackLanded
          gems={landed.gems}
          from={landed.from}
          to={landed.balances.gems}
          tier={bagTierFor(Math.max(0, packs.findIndex((pack) => pack.gems === landed.gems)), packs.length)}
          viaStripe={landed.viaStripe}
          onCount={onCount}
          onClose={() => {
            playSheetBack();
            publish?.(landed.balances);
            setLanded(null);
            onLandedClose?.();
          }}
          onMore={() => {
            playSheetBuy();
            publish?.(landed.balances);
            setLanded(null);
          }}
        />
      ) : null}
    </>
  );
}

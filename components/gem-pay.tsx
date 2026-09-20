"use client";

import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type {
  Appearance,
  Stripe,
  StripeElementsOptions,
  StripeExpressCheckoutElementOptions,
  StripePaymentElementOptions,
} from "@stripe/stripe-js";
// The `pure` entry: the default one injects Stripe.js on import, i.e. on every game page.
import { loadStripe } from "@stripe/stripe-js/pure";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { GemPayment } from "@/app/actions/earn";
import { GemGlyph } from "@/components/currency-glyphs";
import { GemBag, type BagTier } from "@/components/gem-bag";
import { formatCents, formatGems, type GemPack } from "@/lib/economy";

/* --- Stripe.js, loaded once, the first time a pack is picked --------------- */

let loader: { key: string; promise: Promise<Stripe | null> } | null = null;

function stripeFor(publishableKey: string) {
  if (!loader || loader.key !== publishableKey) loader = { key: publishableKey, promise: loadStripe(publishableKey) };
  return loader.promise;
}

/**
 * Stripe's iframes cannot read our stylesheet: the tokens are handed over
 * through the Appearance API so the card form sits on the sheet like one of
 * our own fields — surface fill, hairline, the accent on focus, ink type.
 */
function readAppearance(forceNight: boolean): Appearance {
  const night = forceNight || (typeof document !== "undefined" && document.documentElement.dataset.theme === "dark");
  // A surface that is always night glass (the recharge sheet) does not follow the page's tokens.
  const style = typeof document !== "undefined" && !forceNight ? getComputedStyle(document.documentElement) : null;
  const token = (name: string, fallback: string) => style?.getPropertyValue(name).trim() || fallback;
  const accent = token("--accent", "#5b5bff");
  const hairline = token("--hairline", night ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 17, 23, 0.07)");
  const field = token("--field", night ? "rgba(255, 255, 255, 0.07)" : "rgba(255, 255, 255, 0.75)");
  return {
    theme: night ? "night" : "stripe",
    labels: "above",
    variables: {
      colorPrimary: accent,
      colorBackground: token("--surface", night ? (forceNight ? "#151829" : "#1c1f2b") : "#ffffff"),
      colorText: token("--ink", night ? "#f2f3f7" : "#0f1117"),
      colorTextSecondary: token("--ink-muted", night ? "#9aa1b5" : "#5c6274"),
      colorTextPlaceholder: token("--ink-muted", night ? "#9aa1b5" : "#5c6274"),
      colorDanger: token("--danger", "#ff5a5f"),
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSizeBase: "15px",
      fontWeightNormal: "500",
      borderRadius: "12px",
      spacingUnit: "4px",
      focusBoxShadow: "0 0 0 3px rgba(91, 91, 255, 0.25)",
    },
    rules: {
      ".Input": { border: `1px solid ${hairline}`, boxShadow: "none", backgroundColor: field, padding: "12px 14px" },
      ".Input:focus": { border: `1px solid ${accent}` },
      ".Input--invalid": { boxShadow: "none" },
      ".Label": { fontSize: "12px", fontWeight: "500", letterSpacing: "0.02em", marginBottom: "6px" },
      ".Tab": { border: `1px solid ${hairline}`, boxShadow: "none" },
      ".Tab--selected": { border: `1px solid ${accent}` },
      ".Block": { border: `1px solid ${hairline}`, boxShadow: "none" },
      ".PickerItem": { border: `1px solid ${hairline}`, boxShadow: "none" },
    },
  };
}

/**
 * The payment step of the shop sheet: the pack on one line, Apple Pay or
 * Google Pay in one tap when the device has them (the Express Checkout
 * Element decides — Apple Pay on Apple devices with a card in Wallet, Google
 * Pay where Google Pay is set up), the card form under a hairline for
 * everyone else. The PaymentIntent is confirmed right here; 3-D Secure opens
 * in a modal over the sheet, and only a bank that insists on its own page
 * takes the player away — Stripe brings them back to this page with
 * `?payment_intent=`.
 */
export function GemPay({
  publishableKey,
  payment,
  pack,
  tier,
  listCents,
  night = false,
  summary,
  onPaid,
  onBack,
}: {
  publishableKey: string;
  payment: GemPayment;
  pack: GemPack;
  tier: BagTier;
  /** The list price, struck through when the pack is discounted. */
  listCents: number;
  /** The form sits on night glass whatever the page's theme (the recharge sheet). */
  night?: boolean;
  /** Replaces the pack line at the top — a surface that has its own receipt. */
  summary?: ReactNode;
  /** Stripe confirmed the intent: credit and celebrate. Resolves to an error line, or null. */
  onPaid: (paymentIntentId: string) => Promise<string | null>;
  /** A "Back to the packs" button under Pay; omitted, the surface has its own way back. */
  onBack?: () => void;
}) {
  const stripePromise = useMemo(() => stripeFor(publishableKey), [publishableKey]);
  const options = useMemo<StripeElementsOptions>(
    () => ({ clientSecret: payment.clientSecret, appearance: readAppearance(night), loader: "always" }),
    [night, payment.clientSecret],
  );
  return (
    <Elements stripe={stripePromise} options={options}>
      <PayForm payment={payment} pack={pack} tier={tier} listCents={listCents} night={night} summary={summary} onPaid={onPaid} onBack={onBack} />
    </Elements>
  );
}

const CARD_OPTIONS: StripePaymentElementOptions = {
  layout: "tabs",
  // The wallets have their own buttons above the form.
  wallets: { applePay: "never", googlePay: "never" },
  terms: { card: "never" },
};

function PayForm({
  payment,
  pack,
  tier,
  listCents,
  night: forceNight,
  summary,
  onPaid,
  onBack,
}: {
  payment: GemPayment;
  pack: GemPack;
  tier: BagTier;
  listCents: number;
  night: boolean;
  summary?: ReactNode;
  onPaid: (paymentIntentId: string) => Promise<string | null>;
  onBack?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardReady, setCardReady] = useState(false);
  /** `null` until the Express Checkout Element has looked at the device. */
  const [express, setExpress] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const night = forceNight || (typeof document !== "undefined" && document.documentElement.dataset.theme === "dark");
  const expressOptions = useMemo<StripeExpressCheckoutElementOptions>(
    () => ({
      buttonHeight: 48,
      buttonType: { applePay: "buy", googlePay: "buy" },
      buttonTheme: { applePay: night ? "white" : "black", googlePay: night ? "white" : "black" },
      // Wallets only: Link, PayPal and the rest would take the player elsewhere.
      paymentMethods: { applePay: "auto", googlePay: "auto", link: "never", paypal: "never", amazonPay: "never", klarna: "never" },
      layout: { maxColumns: 1, maxRows: 2, overflow: "never" },
    }),
    [night],
  );

  async function confirm() {
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}${window.location.pathname}` },
        redirect: "if_required",
      });
      if (result.error) {
        setError(result.error.message ?? "The payment did not go through. Nothing was charged.");
        return;
      }
      const intent = result.paymentIntent;
      if (intent.status === "succeeded") {
        setSettling(true);
        const problem = await onPaid(intent.id);
        if (problem) {
          setError(problem);
          setSettling(false);
        }
        return;
      }
      if (intent.status === "processing") {
        setError("Your bank is still processing the payment. Your gems land as soon as it clears.");
        return;
      }
      setError("The payment was not completed. Try another card.");
    } catch {
      setError("Could not reach Stripe. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void confirm();
  }

  const discounted = listCents > payment.cents;

  return (
    <form className="pay-step" onSubmit={submit} aria-busy={busy || settling}>
      {summary ?? (
        <div className="pay-summary glass">
          <span className="pay-summary-art" aria-hidden="true">
            <GemBag tier={tier} />
          </span>
          <span className="pay-summary-copy">
            <span className="pay-summary-gems">
              <GemGlyph /> {formatGems(pack.gems)}
            </span>
            <span className="pay-summary-sub">
              {discounted ? `Gem pack · ${pack.discountPct}% off the list price` : "Gem pack"}
            </span>
          </span>
          <span className="pay-summary-price">
            {discounted ? <s>{formatCents(listCents)}</s> : null}
            {formatCents(payment.cents)}
          </span>
        </div>
      )}

      <div className="pay-express" data-available={express === true ? "true" : undefined} hidden={express === false}>
        <ExpressCheckoutElement
          options={expressOptions}
          onReady={(event) => setExpress(Boolean(event.availablePaymentMethods))}
          onLoadError={() => setExpress(false)}
          onConfirm={() => void confirm()}
        />
      </div>
      {express ? (
        <p className="pay-divider" aria-hidden="true">
          or pay with a card
        </p>
      ) : null}

      <div className="pay-card">
        <PaymentElement options={CARD_OPTIONS} onReady={() => setCardReady(true)} />
      </div>

      {error ? (
        <p className="text-sm leading-6 text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-play pay-cta" disabled={!stripe || !cardReady || busy || settling}>
        {settling ? "Confirming…" : busy ? "Paying…" : `Pay ${formatCents(payment.cents)}`}
      </button>
      {onBack ? (
        <button type="button" className="btn-glass pay-back" onClick={onBack} disabled={busy || settling}>
          Back to the packs
        </button>
      ) : null}
      <p className="pay-secure">Secured by Stripe. Your card details never reach Breeq.</p>
    </form>
  );
}

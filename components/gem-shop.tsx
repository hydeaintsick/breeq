"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { abandonGemPayment, claimCheckout, claimPayment, createGemPayment, sandboxTopUp, type GemPayment } from "@/app/actions/earn";
import { useBalances } from "@/components/balances-provider";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { GemBag, bagTierFor } from "@/components/gem-bag";
import { GemPay } from "@/components/gem-pay";
import { CloseIcon } from "@/components/nav-icons";
import { PackLanded } from "@/components/pack-landed";
import { playSheetAppear, playSheetBack, playSheetBuy } from "@/game/breakout/audio";
import type { Balances } from "@/lib/earn";
import { formatCents, formatEth, formatGems, packListCents, packPriceCents, packUnitUsd, type Economy, type GemPack } from "@/lib/economy";

/* --- The door -------------------------------------------------------------- */

interface ShopContext {
  /** Slide the shop up over the current page. */
  open: () => void;
  close: () => void;
  isOpen: boolean;
  /** The packs and prices, for a surface that sells gems inside its own sheet (the recharge checkout). */
  economy: Economy | null;
  /** Stripe's publishable key, or `null` when payments are not set up. */
  publishableKey: string | null;
  /** Dev only: packs are free while Stripe is off. */
  sandbox: boolean;
}

const Ctx = createContext<ShopContext | null>(null);

/** Open the gem shop from anywhere in the game (no-op outside the game layout). */
export function useGemShop(): ShopContext {
  return (
    useContext(Ctx) ?? { open: () => {}, close: () => {}, isOpen: false, economy: null, publishableKey: null, sandbox: false }
  );
}

/** A button that opens the shop; styled by the caller. */
export function TopUpButton({ className, children = "Top up gems" }: { className: string; children?: ReactNode }) {
  const { open } = useGemShop();
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        open();
      }}
    >
      {children}
    </button>
  );
}

/** What Stripe left in the URL when a payment had to leave the page. */
type Return = {
  /** A Checkout Session opened before payments moved into the sheet. */
  sessionId: string | null;
  /** A PaymentIntent confirmed on a bank's page. */
  paymentIntentId: string | null;
  /** Stripe's verdict on that redirect: `succeeded`, `failed`… */
  redirectStatus: string | null;
  canceled: boolean;
};

/**
 * The gem shop is not a page: it is a sheet over two thirds of the screen that
 * any surface can call up (the bag pill's "+", every "Top up gems" button) and
 * that closes back onto the page the player was on. Picking a pack turns the
 * sheet into the payment step — Apple Pay, Google Pay or a card, confirmed
 * right there — and the pack lands without the page ever changing. The rare
 * bank that insists on its own page sends the player back here with
 * `?payment_intent=`: the sheet opens by itself, credits and shows the landing.
 */
export function GemShopProvider({
  economy,
  publishableKey,
  sandbox,
  children,
}: {
  economy: Economy;
  /** Stripe's publishable key, or `null` when payments are not set up. */
  publishableKey: string | null;
  sandbox: boolean;
  children: ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);
  const [ret, setRet] = useState<Return | null>(null);

  const open = useCallback(() => {
    playSheetAppear();
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    setRet(null);
  }, []);
  const onReturn = useCallback((value: Return) => {
    setRet(value);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ open, close, isOpen, economy, publishableKey, sandbox }),
    [open, close, isOpen, economy, publishableKey, sandbox],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <CheckoutReturn onReturn={onReturn} />
      </Suspense>
      {isOpen ? (
        <GemShopSheet economy={economy} publishableKey={publishableKey} sandbox={sandbox} ret={ret} onClose={close} />
      ) : null}
    </Ctx.Provider>
  );
}

/** Watches the URL for Stripe's return and strips the query once it is handed over. */
function CheckoutReturn({ onReturn }: { onReturn: (value: Return) => void }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const sessionId = params.get("session_id");
  const paymentIntentId = params.get("payment_intent");
  const redirectStatus = params.get("redirect_status");
  const canceled = params.get("checkout") === "canceled";
  const seen = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId && !paymentIntentId && !canceled) return;
    const key = `${pathname}|${sessionId ?? ""}|${paymentIntentId ?? ""}|${canceled}`;
    if (seen.current === key) return;
    seen.current = key;
    onReturn({ sessionId, paymentIntentId, redirectStatus, canceled });
    router.replace(pathname, { scroll: false });
  }, [sessionId, paymentIntentId, redirectStatus, canceled, pathname, router, onReturn]);

  return null;
}

/* --- The sheet ------------------------------------------------------------- */

type Step = { kind: "packs" } | { kind: "pay"; pack: GemPack; payment: GemPayment };

function GemShopSheet({
  economy,
  publishableKey,
  sandbox,
  ret,
  onClose,
}: {
  economy: Economy;
  publishableKey: string | null;
  sandbox: boolean;
  ret: Return | null;
  onClose: () => void;
}) {
  const shared = useBalances();
  const balances = shared?.balances ?? { gems: 0, ethGwei: "0", eth: 0 };
  const publish = shared?.setBalances;
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stripeReady = publishableKey !== null;

  const [step, setStep] = useState<Step>({ kind: "packs" });
  // Each step starts at the top of the sheet.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step.kind]);
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

  /** Leave the payment step: the intent is canceled so it can never charge later. */
  const leavePayment = useCallback(() => {
    if (step.kind !== "pay") return;
    void abandonGemPayment(step.payment.paymentIntentId).catch(() => {});
    setStep({ kind: "packs" });
  }, [step]);

  function dismiss() {
    playSheetBack();
    leavePayment();
    onClose();
  }

  function back() {
    playSheetBack();
    setError(null);
    leavePayment();
  }

  // The page behind holds still; Escape closes; focus starts on the sheet.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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

  /** Stripe confirmed the intent in the sheet: credit it and celebrate. */
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
  const paying = step.kind === "pay";

  return (
    <>
      <div className="gem-shop" onClick={dismiss}>
        <div
          ref={sheetRef}
          className="gem-shop-sheet glass-sheet"
          data-step={step.kind}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="gem-shop-handle" aria-hidden="true" />
          <div className="gem-shop-head">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{paying ? "Checkout" : "Gems"}</p>
              <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {paying ? (
                  <>
                    Pay for the <span className="text-neon">bag</span>
                  </>
                ) : (
                  <>
                    Fill the <span className="text-neon">bag</span>
                  </>
                )}
              </h2>
            </div>
            <div className="gem-shop-balances">
              <span className="earn-balance">
                <GemGlyph /> {formatGems(balances.gems)}
              </span>
              <span className="earn-balance">
                <EthGlyph /> {formatEth(balances.eth, { unit: false })}
              </span>
            </div>
            <button type="button" className="header-chip" aria-label="Close the shop" onClick={dismiss}>
              <span className="sr-only">Close the shop</span>
              <CloseIcon />
            </button>
          </div>

          <div ref={scrollRef} className="gem-shop-scroll">
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
                <p className="text-sm leading-6 text-ink-muted">Gems buy tickets and publish maps. Bigger bags cost less per gem.</p>

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

                <div className="pack-grid mt-6">
                  {packs.map((pack, index) => {
                    const price = packPriceCents(pack, economy);
                    const list = packListCents(pack.gems, economy);
                    const tag = pack.tag;
                    const disabled = (!stripeReady && !sandbox) || busy !== null;
                    return (
                      <button
                        key={pack.gems}
                        type="button"
                        className="pack glass"
                        data-tag={tag}
                        disabled={disabled}
                        aria-label={`${formatGems(pack.gems)} gems for ${formatCents(price)}${pack.discountPct > 0 ? `, ${pack.discountPct}% off` : ""}`}
                        onClick={() => void buy(pack)}
                      >
                        {tag ? <span className="pack-tag">{tag}</span> : null}
                        <GemBag tier={bagTierFor(index, packs.length)} />
                        <span className="pack-gems">
                          <GemGlyph /> {formatGems(pack.gems)}
                        </span>
                        <span className="pack-price">
                          {price < list ? <s>{formatCents(list)}</s> : null}
                          {formatCents(price)}
                        </span>
                        <span className="pack-save">
                          {pack.discountPct > 0 ? `Save ${pack.discountPct}%` : `${(packUnitUsd(pack, economy) * 100).toFixed(1)}¢ a gem`}
                        </span>
                        <span className="btn-play pack-cta">{busy === pack.gems ? "Opening…" : "Buy"}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-6 text-xs leading-5 text-ink-muted">
                  Gems are a game currency with no cash value and cannot be refunded once spent. Winnings are paid in ETH
                  to your balance and can be withdrawn from your wallet once they reach {formatEth(economy.withdrawMinEth)}.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {landed ? (
        <PackLanded
          gems={landed.gems}
          from={landed.from}
          to={landed.balances.gems}
          tier={bagTierFor(Math.max(0, packs.findIndex((pack) => pack.gems === landed.gems)), packs.length)}
          viaStripe={landed.viaStripe}
          onCount={onCount}
          onClose={dismiss}
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

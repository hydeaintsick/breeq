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
import { claimCheckout, createGemCheckout, sandboxTopUp } from "@/app/actions/earn";
import { useBalances } from "@/components/balances-provider";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { GemBag, bagTierFor } from "@/components/gem-bag";
import { CloseIcon } from "@/components/nav-icons";
import { PackLanded } from "@/components/pack-landed";
import type { Balances } from "@/lib/earn";
import { formatCents, formatEth, formatGems, packListCents, packPriceCents, packUnitUsd, type Economy } from "@/lib/economy";

/* --- The door -------------------------------------------------------------- */

interface ShopContext {
  /** Slide the shop up over the current page. */
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const Ctx = createContext<ShopContext | null>(null);

/** Open the gem shop from anywhere in the game (no-op outside the game layout). */
export function useGemShop(): ShopContext {
  return useContext(Ctx) ?? { open: () => {}, close: () => {}, isOpen: false };
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

/**
 * The gem shop is not a page: it is a sheet over two thirds of the screen that
 * any surface can call up (the bag pill's "+", every "Top up gems" button) and
 * that closes back onto the page the player was on. Coming back from Stripe
 * Checkout lands on that same page with `?session_id=`: the sheet opens by
 * itself, claims the session and shows the pack landing.
 */
export function GemShopProvider({
  economy,
  stripeReady,
  sandbox,
  children,
}: {
  economy: Economy;
  stripeReady: boolean;
  sandbox: boolean;
  children: ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);
  const [ret, setRet] = useState<{ sessionId: string | null; canceled: boolean } | null>(null);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => {
    setOpen(false);
    setRet(null);
  }, []);
  const onReturn = useCallback((sessionId: string | null, canceled: boolean) => {
    setRet({ sessionId, canceled });
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <CheckoutReturn onReturn={onReturn} />
      </Suspense>
      {isOpen ? (
        <GemShopSheet
          economy={economy}
          stripeReady={stripeReady}
          sandbox={sandbox}
          sessionId={ret?.sessionId ?? null}
          canceled={ret?.canceled ?? false}
          onClose={close}
        />
      ) : null}
    </Ctx.Provider>
  );
}

/** Watches the URL for Stripe's return and strips the query once it is handed over. */
function CheckoutReturn({ onReturn }: { onReturn: (sessionId: string | null, canceled: boolean) => void }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const sessionId = params.get("session_id");
  const canceled = params.get("checkout") === "canceled";
  const seen = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId && !canceled) return;
    const key = `${pathname}|${sessionId ?? ""}|${canceled}`;
    if (seen.current === key) return;
    seen.current = key;
    onReturn(sessionId, canceled);
    router.replace(pathname, { scroll: false });
  }, [sessionId, canceled, pathname, router, onReturn]);

  return null;
}

/* --- The sheet ------------------------------------------------------------- */

function GemShopSheet({
  economy,
  stripeReady,
  sandbox,
  sessionId,
  canceled,
  onClose,
}: {
  economy: Economy;
  stripeReady: boolean;
  sandbox: boolean;
  sessionId: string | null;
  canceled: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const shared = useBalances();
  const balances = shared?.balances ?? { gems: 0, ethGwei: "0", eth: 0 };
  const publish = shared?.setBalances;
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);

  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(Boolean(sessionId));
  const claimed = useRef(false);
  /** A pack has landed: the celebration owns the screen until the player leaves it. */
  const [landed, setLanded] = useState<{ gems: number; from: number; balances: Balances; viaStripe: boolean } | null>(null);

  const land = useCallback((gems: number, next: Balances, viaStripe: boolean) => {
    setLanded({ gems, from: Math.max(0, next.gems - gems), balances: next, viaStripe });
  }, []);
  // The counter on the celebration has started: now the header pill rolls too.
  const onCount = useCallback(() => {
    if (landed) publish?.(landed.balances);
  }, [landed, publish]);

  // Back from Checkout: ask the server to credit the session (the webhook may
  // already have — either way the pack is shown landing once).
  useEffect(() => {
    if (!sessionId || claimed.current) return;
    claimed.current = true;
    void claimCheckout(sessionId)
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
  }, [land, publish, sessionId]);

  // The page behind holds still; Escape closes; focus starts on the sheet.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function buy(gems: number) {
    setBusy(gems);
    setError(null);
    try {
      if (!stripeReady && sandbox) {
        const result = await sandboxTopUp(gems);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        land(result.gems, result.balances, false);
        return;
      }
      const result = await createGemCheckout(gems, pathname);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.location.assign(result.url);
    } catch {
      setError("Could not open the checkout. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const packs = economy.packs;

  return (
    <>
      <div className="gem-shop" onClick={onClose}>
        <div
          ref={sheetRef}
          className="gem-shop-sheet glass-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="gem-shop-handle" aria-hidden="true" />
          <div className="gem-shop-head">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Gems</p>
              <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Fill the <span className="text-neon">bag</span>
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
            <button type="button" className="header-chip" aria-label="Close the shop" onClick={onClose}>
              <span className="sr-only">Close the shop</span>
              <CloseIcon />
            </button>
          </div>

          <div className="gem-shop-scroll">
            <p className="text-sm leading-6 text-ink-muted">Gems buy tickets and publish maps. Bigger bags cost less per gem.</p>

            {claiming ? (
              <p className="mt-4 text-sm text-ink-muted" aria-live="polite">
                Confirming your purchase with Stripe…
              </p>
            ) : null}
            {canceled && !landed ? <p className="mt-4 text-sm text-ink-muted">Checkout canceled. Nothing was charged.</p> : null}
            {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
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
                    onClick={() => void buy(pack.gems)}
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
          onClose={onClose}
          onMore={() => {
            publish?.(landed.balances);
            setLanded(null);
          }}
        />
      ) : null}
    </>
  );
}

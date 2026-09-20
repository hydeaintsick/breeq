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
import { useBalances } from "@/components/balances-provider";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { GemStorefront, type GemStep, type StripeReturn } from "@/components/gem-storefront";
import { CloseIcon } from "@/components/nav-icons";
import { playSheetAppear, playSheetBack } from "@/game/breakout/audio";
import { formatEth, formatGems, type Economy } from "@/lib/economy";

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

/**
 * The gem shop is not a page: it is a sheet over two thirds of the screen that
 * any surface can call up (the bag pill's "+", every "Top up gems" button) and
 * that closes back onto the page the player was on. The storefront inside it
 * (`GemStorefront`) is the same one the shop page lays out flat: packs, the
 * payment step, the landing. The rare bank that insists on its own page sends
 * the player back here with `?payment_intent=`: the sheet opens by itself,
 * credits and shows the landing.
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
  const [ret, setRet] = useState<StripeReturn | null>(null);

  const open = useCallback(() => {
    playSheetAppear();
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    setRet(null);
  }, []);
  const onReturn = useCallback((value: StripeReturn) => {
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
function CheckoutReturn({ onReturn }: { onReturn: (value: StripeReturn) => void }) {
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
  ret: StripeReturn | null;
  onClose: () => void;
}) {
  const shared = useBalances();
  const balances = shared?.balances ?? { gems: 0, ethGwei: "0", eth: 0 };
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<GemStep>("packs");
  // Each step starts at the top of the sheet.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  function dismiss() {
    playSheetBack();
    onClose();
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

  const paying = step === "pay";

  return (
    <div className="gem-shop" onClick={dismiss}>
      <div
        ref={sheetRef}
        className="gem-shop-sheet glass-sheet"
        data-step={step}
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
          <GemStorefront
            economy={economy}
            publishableKey={publishableKey}
            sandbox={sandbox}
            ret={ret}
            intro="Gems buy tickets and publish maps. Bigger bags cost less per gem."
            onStep={setStep}
            onLandedClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}

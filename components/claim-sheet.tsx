"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { beginGoogleClaim, cancelGoogleClaim, claimWithPassword } from "@/app/actions/claim";
import { CONTINUE_PATH } from "@/lib/auth/paths";
import {
  clearClaimView,
  rememberClaimLater,
  writeClaimView,
  type ClaimView,
} from "@/lib/claim-view";
import { playSheetAppear, playSheetBack, playSheetBuy } from "@/game/breakout/audio";
import { pulseUi } from "@/game/breakout/haptics";
import { CloseIcon, ChevronLeftIcon } from "@/components/nav-icons";
import { useSheetSwipe } from "@/components/use-sheet-swipe";

type Mode = "save" | "signin" | "taken" | "linked";

/**
 * Night glass over the victory. Google leaves and comes back; email stays
 * on the page and attaches to this same account. An account that already
 * has a road does not replace this one.
 */
export function ClaimSheet({
  reason,
  google,
  notice,
  view,
  onClose,
  onSaved,
}: {
  reason: "clear" | "pay";
  google: boolean;
  notice: "taken" | "linked" | null;
  view: ClaimView | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const { update } = useSession();
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>(notice === "linked" ? "linked" : notice === "taken" ? "taken" : "save");
  const [takenFrom, setTakenFrom] = useState<"google" | "email" | "signin">(notice === "taken" ? "google" : "email");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const appeared = useRef(false);

  useEffect(() => {
    if (appeared.current) return;
    appeared.current = true;
    playSheetAppear();
    pulseUi(6);
    sheetRef.current?.focus();
  }, []);

  const savedNote = useRef(false);
  useEffect(() => {
    if (notice !== "linked" || savedNote.current) return;
    savedNote.current = true;
    void update();
    router.refresh();
  }, [notice, router, update]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (mode === "signin") {
        setMode("save");
        setError(null);
        return;
      }
      if (mode !== "linked") rememberClaimLater();
      playSheetBack();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, onClose]);

  function dismiss() {
    if (mode !== "linked") rememberClaimLater();
    playSheetBack();
    onClose();
  }

  const swipe = useSheetSwipe(sheetRef, dismiss);

  async function onGoogle() {
    setError(null);
    setPending(true);
    playSheetBuy();
    try {
      if (view) writeClaimView({ ...view, savedAt: Date.now() });
      const back = `${window.location.pathname}${window.location.search}`;
      const started = await beginGoogleClaim(back);
      if ("error" in started) {
        setError(started.error);
        setPending(false);
        return;
      }
      await signIn("google", { redirectTo: window.location.pathname });
    } catch {
      setError("Google could not start. Try again.");
      setPending(false);
    }
  }

  async function onEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    playSheetBuy();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      const result = await claimWithPassword({ email, password });
      if ("taken" in result) {
        setTakenFrom("email");
        setMode("taken");
        setPending(false);
        return;
      }
      if ("error" in result) {
        setError(result.error);
        setPending(false);
        return;
      }
      onSaved();
      await update();
      router.refresh();
      setMode("linked");
    } catch {
      setError("Could not save this road. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function onSwitch() {
    setError(null);
    setPending(true);
    playSheetBuy();
    const form = document.getElementById("claim-signin") as HTMLFormElement | null;
    const data = form ? new FormData(form) : null;
    const identifier = String(data?.get("identifier") ?? "").trim();
    const password = String(data?.get("password") ?? "");
    try {
      if (takenFrom === "google") {
        clearClaimView();
        await cancelGoogleClaim();
        await signIn("google", { redirectTo: CONTINUE_PATH });
        return;
      }
      const result = await signIn("credentials", {
        email: identifier,
        username: identifier,
        password,
        redirect: false,
        redirectTo: CONTINUE_PATH,
      });
      if (!result?.ok) {
        setError("Email, username, or password is not right.");
        setPending(false);
        return;
      }
      clearClaimView();
      window.location.assign(CONTINUE_PATH);
    } catch {
      setError("Could not open that account. Try again.");
      setPending(false);
    }
  }

  const title =
    mode === "linked"
      ? "Saved."
      : mode === "taken"
        ? "That account already has a road."
        : mode === "signin"
          ? "Sign in"
          : reason === "pay"
            ? "Save your progress."
            : "Don't lose your progress.";

  const line =
    mode === "linked"
      ? "This road is on your account now. A new phone can open it."
      : mode === "taken"
        ? "You're still on this one. The wall you just cleared stays here."
        : mode === "signin"
          ? "This opens your other road. Sign out later to come back to the progress on this phone."
          : reason === "pay"
            ? "A payment has to sit on an account you can open again. This phone keeps the road until then."
            : "This phone keeps your road. Add Google or an email so a new phone can too.";

  return (
    <div className="energy-sheet claim-sheet" onClick={dismiss}>
      <div
        ref={sheetRef}
        className="energy-sheet-body"
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
        <div className="energy-sheet-head">
          {mode === "signin" ? (
            <button
              type="button"
              className="header-chip energy-sheet-close energy-sheet-back"
              aria-label="Back"
              onClick={() => {
                playSheetBack();
                setMode("save");
                setError(null);
              }}
            >
              <ChevronLeftIcon />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Your road</p>
            <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
          </div>
          <button type="button" className="header-chip energy-sheet-close" aria-label="Not now" onClick={dismiss}>
            <CloseIcon />
          </button>
        </div>

        <p className="energy-sheet-copy">{line}</p>

        {mode === "linked" ? (
          <button type="button" className="btn-play mt-6 min-h-11 w-full" onClick={dismiss}>
            Keep playing
          </button>
        ) : null}

        {mode === "taken" ? (
          <div className="mt-6 grid gap-3">
            <button type="button" className="btn-play min-h-11 w-full" onClick={dismiss}>
              Stay on this road
            </button>
            <p className="text-sm leading-6 text-ink-muted">
              Switching opens the other road. This phone&apos;s progress stays here until you sign out.
            </p>
            {takenFrom === "email" ? (
              <button
                type="button"
                className="btn-glass min-h-11 w-full"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
              >
                Sign in to that account
              </button>
            ) : (
              <button type="button" className="btn-glass min-h-11 w-full" disabled={pending} onClick={() => void onSwitch()}>
                {pending ? "Please wait…" : "Switch to that Google account"}
              </button>
            )}
          </div>
        ) : null}

        {mode === "signin" ? (
          <form id="claim-signin" className="mt-6 grid gap-4" onSubmit={(event) => event.preventDefault()}>
            <label className="grid gap-2 text-sm text-ink-muted">
              Email or username
              <input
                name="identifier"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                className="field"
                disabled={pending}
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-muted">
              Password
              <input name="password" type="password" autoComplete="current-password" required className="field" disabled={pending} />
            </label>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <button type="button" className="btn-play min-h-11 w-full" disabled={pending} onClick={() => void onSwitch()}>
              {pending ? "Please wait…" : "Open that account"}
            </button>
          </form>
        ) : null}

        {mode === "save" ? (
          <div className="mt-6 grid gap-4">
            {google ? (
              <button type="button" className="btn-play min-h-11 w-full gap-2" disabled={pending} onClick={() => void onGoogle()}>
                <GoogleMark />
                {pending ? "Please wait…" : "Continue with Google"}
              </button>
            ) : null}
            <form className="grid gap-4" onSubmit={(event) => void onEmail(event)}>
              <label className="grid gap-2 text-sm text-ink-muted">
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="field"
                  disabled={pending}
                />
              </label>
              <label className="grid gap-2 text-sm text-ink-muted">
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="field"
                  disabled={pending}
                />
              </label>
              {error ? (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" className="btn-glass min-h-11 w-full" disabled={pending}>
                {pending ? "Please wait…" : "Save with email"}
              </button>
            </form>
            <button
              type="button"
              className="min-h-11 text-sm font-medium text-ink-muted"
              onClick={() => {
                setMode("signin");
                setTakenFrom("signin");
                setError(null);
              }}
            >
              Sign in
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.12 8.18c0-.55-.05-1.08-.14-1.59H8.16v3.01h3.89a3.32 3.32 0 0 1-1.44 2.18v1.81h2.33c1.36-1.25 2.18-3.1 2.18-5.41Z"
      />
      <path
        fill="currentColor"
        opacity="0.72"
        d="M8.16 15.2c1.95 0 3.58-.65 4.78-1.76l-2.33-1.81c-.65.43-1.47.69-2.45.69-1.88 0-3.47-1.27-4.04-2.97H1.7v1.87A7.04 7.04 0 0 0 8.16 15.2Z"
      />
      <path
        fill="currentColor"
        opacity="0.55"
        d="M4.12 9.35A4.22 4.22 0 0 1 3.9 8c0-.47.08-.92.22-1.35V4.78H1.7A7.04 7.04 0 0 0 .96 8c0 1.14.27 2.21.74 3.22l2.42-1.87Z"
      />
      <path
        fill="currentColor"
        opacity="0.4"
        d="M8.16 3.68c1.06 0 2.01.36 2.76 1.08l2.07-2.07A7.02 7.02 0 0 0 1.7 4.78l2.42 1.87c.57-1.7 2.16-2.97 4.04-2.97Z"
      />
    </svg>
  );
}

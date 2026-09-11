"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { registerAccount } from "@/app/actions/register";
import { AFTER_AUTH_PATH } from "@/lib/auth/paths";
import { siweMessage } from "@/lib/auth/siwe";

type Mode = "signin" | "signup";

export function AuthForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const identifier = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const username = String(form.get("username") ?? "").trim();
    const loginId = mode === "signup" ? email : identifier;

    try {
      if (mode === "signup") {
        const result = await registerAccount({ username, email, password });
        if ("error" in result) {
          setError(result.error);
          return;
        }
      }

      const result = await signIn("credentials", {
        email: loginId,
        username: loginId,
        password,
        redirect: false,
        redirectTo: AFTER_AUTH_PATH,
      });

      if (!result?.ok) {
        setError(
          mode === "signup"
            ? "Account created, but sign-in failed. Try signing in."
            : "Username, email, or password is not right.",
        );
        return;
      }

      window.location.assign(AFTER_AUTH_PATH);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setPending(true);
    try {
      await signIn("google", { redirectTo: AFTER_AUTH_PATH });
    } catch {
      setError("Google sign-in could not start.");
      setPending(false);
    }
  }

  async function onMetaMask() {
    setError(null);
    setPending(true);

    try {
      if (!window.ethereum) {
        setError("MetaMask is not installed in this browser.");
        return;
      }

      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts[0];
      if (!address) {
        setError("No wallet account was returned.");
        return;
      }

      const nonceResponse = await fetch("/api/auth/siwe/nonce");
      if (!nonceResponse.ok) {
        setError("Could not start a wallet sign-in.");
        return;
      }

      const { nonce } = (await nonceResponse.json()) as { nonce: string };
      const message = siweMessage(address, nonce);
      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;

      const result = await signIn("credentials", {
        address,
        signature,
        redirect: false,
        redirectTo: AFTER_AUTH_PATH,
      });

      if (!result?.ok) {
        setError("Wallet signature could not be verified.");
        return;
      }

      window.location.assign(AFTER_AUTH_PATH);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      if (message.toLowerCase().includes("reject") || message.toLowerCase().includes("denied")) {
        setError("Wallet sign-in was cancelled.");
      } else {
        setError("MetaMask sign-in failed. Try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-card glass w-full max-w-md px-5 py-7 sm:px-8 sm:py-8">
      <div className="mode-switch" data-mode={mode}>
        <span className="mode-switch-pill" aria-hidden="true" />
        <button
          type="button"
          data-active={mode === "signin"}
          aria-pressed={mode === "signin"}
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          data-active={mode === "signup"}
          aria-pressed={mode === "signup"}
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
        >
          Sign up
        </button>
      </div>

      <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
        {mode === "signup" ? (
          <label className="grid gap-2 text-sm text-ink-muted">
            Username
            <input
              name="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_]{3,20}"
              className="field"
              disabled={pending}
            />
          </label>
        ) : null}

        {mode === "signin" ? (
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
        ) : (
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
        )}

        <label className="grid gap-2 text-sm text-ink-muted">
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={mode === "signup" ? 8 : undefined}
            className="field"
            disabled={pending}
          />
        </label>

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn-play play-shimmer mt-1 w-full"
          disabled={pending}
        >
          {pending ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      {mode === "signin" ? (
        <>
          <div className="mt-6 flex items-center gap-3 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-muted">
            <span className="h-px flex-1 bg-hairline" />
            or
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <div className="mt-5 grid gap-3">
            {googleEnabled ? (
              <button
                type="button"
                className="btn-glass w-full"
                onClick={() => {
                  void onGoogle();
                }}
                disabled={pending}
              >
                <GoogleMark />
                Continue with Google
              </button>
            ) : null}
            <button
              type="button"
              className="btn-glass w-full"
              onClick={() => {
                void onMetaMask();
              }}
              disabled={pending}
            >
              <WalletMark />
              Continue with MetaMask
            </button>
          </div>
        </>
      ) : (
        <p className="mt-5 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <button
            type="button"
            className="font-medium text-ink underline-offset-4 hover:underline"
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
          >
            Sign in
          </button>
        </p>
      )}
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
        d="M4.12 9.35a4.23 4.23 0 0 1 0-2.7V4.78H1.7a7.04 7.04 0 0 0 0 6.44l2.42-1.87Z"
      />
      <path
        fill="currentColor"
        opacity="0.85"
        d="M8.16 3.68c1.06 0 2.01.36 2.76 1.08l2.07-2.07A7.02 7.02 0 0 0 8.16.8 7.04 7.04 0 0 0 1.7 4.78l2.42 1.87c.57-1.7 2.16-2.97 4.04-2.97Z"
      />
    </svg>
  );
}

function WalletMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="1.5"
        y="4"
        width="13"
        height="9"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M10.5 8.5h4v2.2c0 .7-.56 1.3-1.25 1.3H10.5V8.5Z"
        fill="currentColor"
        opacity="0.85"
      />
      <circle cx="12.35" cy="10.15" r="0.7" fill="var(--bg)" />
      <path
        d="M4 4.2 8 1.8 12 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

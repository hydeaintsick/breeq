"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { setAlternativeLogin, revokeAlternativeLogin, updateAccount } from "@/app/actions/account";

export function AccountForm({
  username,
  email,
  wallet,
  methods,
  hasPassword,
  passwordSetAt,
  hasOtherMethods,
}: {
  username: string;
  email: string;
  wallet: string | null;
  methods: string[];
  hasPassword: boolean;
  passwordSetAt: string | null;
  hasOtherMethods: boolean;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const nextUsername = String(form.get("username") ?? "");
    const nextEmail = String(form.get("email") ?? "");

    try {
      const result = await updateAccount({
        username: nextUsername,
        email: nextEmail,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setSaved(true);
      router.refresh();
      void update();
    } catch {
      setError("Could not update your account. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-10 grid gap-4">
      <form className="glass grid gap-5 p-6 sm:p-8" onSubmit={onSubmit}>
        <label className="grid gap-2 text-sm text-ink-muted">
          Username
          <input
            key={username}
            name="username"
            defaultValue={username}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9_]+"
            className="field"
          />
        </label>
        <label className="grid gap-2 text-sm text-ink-muted">
          Email
          <input
            name="email"
            type="email"
            defaultValue={email}
            autoComplete="email"
            className="field"
          />
        </label>
        <div className="grid gap-2">
          <p className="text-sm text-ink-muted">Wallet</p>
          <p className="field flex items-center font-mono text-sm">
            {wallet ? truncateWallet(wallet) : "Not linked"}
          </p>
        </div>
        <div className="grid gap-2">
          <p className="text-sm text-ink-muted">Sign-in methods</p>
          <p className="field flex items-center">
            {methods.length > 0 ? methods.join(" · ") : "—"}
          </p>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {saved ? <p className="text-sm text-ink">Saved.</p> : null}
        <button type="submit" className="btn-play w-fit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>

      <AlternativeLoginForm
        username={username}
        hasPassword={hasPassword}
        passwordSetAt={passwordSetAt}
        hasOtherMethods={hasOtherMethods}
      />
    </div>
  );
}

function AlternativeLoginForm({
  username,
  hasPassword,
  passwordSetAt,
  hasOtherMethods,
}: {
  username: string;
  hasPassword: boolean;
  passwordSetAt: string | null;
  hasOtherMethods: boolean;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const result = await setAlternativeLogin({
        alias: String(data.get("alias") ?? ""),
        password: String(data.get("password") ?? ""),
        confirmPassword: String(data.get("confirmPassword") ?? ""),
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      form.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((input) => {
        input.value = "";
      });
      router.refresh();
      void update();
    } catch {
      setError("Could not save your password login. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function onRevoke() {
    if (!confirmRevoke) {
      setConfirmRevoke(true);
      return;
    }

    setError(null);
    setPending(true);

    try {
      const result = await revokeAlternativeLogin();
      if ("error" in result) {
        setError(result.error);
        return;
      }

      setConfirmRevoke(false);
      router.refresh();
      void update();
    } catch {
      setError("Could not revoke your password login. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="account-fold glass p-6 sm:p-8" data-open={open}>
      <button
        type="button"
        className="account-fold-trigger"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          setConfirmRevoke(false);
          setError(null);
        }}
      >
        <span className="account-fold-copy">
          Alternative login
          <span className="account-fold-hint">
            {hasPassword
              ? "On · sign in with your alias and password"
              : "Add an alias and a password"}
          </span>
        </span>
        <span className="account-fold-chevron" aria-hidden="true">
          <FoldChevron />
        </span>
      </button>

      {open ? (
        hasPassword ? (
          <div className="account-fold-body">
            {passwordSetAt ? (
              <p className="text-sm leading-6 text-ink-muted">
                Created{" "}
                <time dateTime={passwordSetAt} suppressHydrationWarning>
                  {formatLoginCreatedAt(passwordSetAt)}
                </time>
              </p>
            ) : (
              <p className="text-sm leading-6 text-ink-muted">
                Use this alias on the sign-in page.
              </p>
            )}
            <div className="grid gap-2">
              <p className="text-sm text-ink-muted">Alias</p>
              <p className="field flex items-center">{username}</p>
            </div>
            <div className="grid gap-2">
              <p className="text-sm text-ink-muted">Password</p>
              <p className="field flex items-center" aria-label="Hidden password">
                ••••••••
              </p>
            </div>
            <p className="text-sm leading-6 text-ink-muted">
              {hasOtherMethods
                ? "You can still sign in with MetaMask or Google."
                : "This is your password sign-in. Revoking it means you’ll need another way in next time."}
            </p>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              className="btn-glass w-fit text-danger"
              disabled={pending}
              onClick={() => {
                void onRevoke();
              }}
            >
              {pending ? "Revoking…" : confirmRevoke ? "Revoke this login?" : "Revoke"}
            </button>
          </div>
        ) : (
          <form className="account-fold-body" onSubmit={onSubmit}>
            <p className="text-sm leading-6 text-ink-muted">
              Works for every account. Fill this in and you can sign in without your wallet or Google.
            </p>
            <label className="grid gap-2 text-sm text-ink-muted">
              Alias
              <input
                name="alias"
                defaultValue={username}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z0-9_]+"
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
            <label className="grid gap-2 text-sm text-ink-muted">
              Confirm password
              <input
                name="confirmPassword"
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
            <button type="submit" className="btn-play w-fit" disabled={pending}>
              {pending ? "Saving…" : "Enable password login"}
            </button>
          </form>
        )
      ) : null}
    </div>
  );
}

function formatLoginCreatedAt(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

function FoldChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 6.25 8 10.75l4.5-4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function truncateWallet(address: string) {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

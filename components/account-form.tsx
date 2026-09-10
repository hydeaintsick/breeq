"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateAccount } from "@/app/actions/account";

export function AccountForm({
  username,
  email,
  wallet,
  methods,
}: {
  username: string;
  email: string;
  wallet: string | null;
  methods: string[];
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

      await update();
      router.refresh();
      setSaved(true);
    } catch {
      setError("Could not update your account. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="glass mt-10 grid gap-5 p-6 sm:p-8" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm text-ink-muted">
        Username
        <input
          name="username"
          defaultValue={username}
          autoComplete="username"
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
  );
}

function truncateWallet(address: string) {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

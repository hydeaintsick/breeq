"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestWithdrawal } from "@/app/actions/earn";
import { usePublishBalances } from "@/components/balances-provider";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { TopUpButton } from "@/components/gem-shop";
import { EARN_PATH } from "@/lib/auth/paths";
import type { Balances, LedgerLine, WithdrawalLine } from "@/lib/earn";
import { formatEth, formatGems, formatUsd, type Economy } from "@/lib/economy";

const KIND_LABEL: Record<string, string> = {
  TOPUP: "Gems bought",
  PUBLISH: "Map published",
  TICKET: "Ticket",
  PAYOUT: "Win paid out",
  WITHDRAW: "Withdrawal",
  WITHDRAW_REFUND: "Withdrawal returned",
  GRANT: "Gems from Breeq",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "On its way",
  PAID: "Sent",
  REJECTED: "Returned",
};

export function EarnWallet({
  balances: initial,
  economy,
  ledger,
  withdrawals,
  record,
  walletAddress,
}: {
  balances: Balances;
  economy: Economy;
  ledger: LedgerLine[];
  withdrawals: WithdrawalLine[];
  record: { runs: number; wins: number; maps: number };
  walletAddress: string | null;
}) {
  const router = useRouter();
  const [balances, setBalances] = useState(initial);
  usePublishBalances(balances);
  const [address, setAddress] = useState(walletAddress ?? "");
  const [amount, setAmount] = useState(balances.eth >= economy.withdrawMinEth ? formatEth(balances.eth, { unit: false }) : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const canWithdraw = balances.eth >= economy.withdrawMinEth && economy.withdrawMinEth >= 0;
  const hasPending = withdrawals.some((row) => row.status === "PENDING");
  const ethUsd = balances.eth * economy.ethPriceUsd;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await requestWithdrawal({ eth: Number(amount.replace(/,/g, "")), toAddress: address });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setBalances(result.balances);
      setSent(true);
      router.refresh();
    } catch {
      setError("Could not send the request. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="page-gutter pb-24 pt-28">
      <div className="mx-auto w-full max-w-4xl">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Wallet</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Your <span className="text-neon">balances</span>
      </h1>

      <div className="wallet-tiles mt-8">
        <div className="wallet-tile glass">
          <p className="text-xs text-ink-muted">Gems</p>
          <p className="wallet-tile-n text-ink">
            <GemGlyph /> {formatGems(balances.gems)}
          </p>
          <TopUpButton className="mt-3 inline-flex min-h-11 items-center text-sm text-ink underline decoration-hairline underline-offset-4">
            Top up
          </TopUpButton>
        </div>
        <div className="wallet-tile glass">
          <p className="text-xs text-ink-muted">ETH won</p>
          <p className="wallet-tile-n text-ink">
            <EthGlyph /> {formatEth(balances.eth, { unit: false })}
          </p>
          <p className="mt-3 text-sm text-ink-muted">≈ {formatUsd(ethUsd)}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        {record.runs.toLocaleString("en-US")} tickets played · {record.wins.toLocaleString("en-US")} walls cleared ·{" "}
        {record.maps.toLocaleString("en-US")} maps published
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="glass p-5 sm:p-6">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Withdraw</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            From {formatEth(economy.withdrawMinEth)}. The amount leaves your balance now and is sent to your address
            by hand, usually within a day. One request at a time.
          </p>
          {sent ? (
            <p className="mt-5 text-sm text-ink">Request received. You will see it below as “On its way”.</p>
          ) : (
            <form className="mt-5 grid gap-4" onSubmit={submit}>
              <label className="grid gap-2 text-sm text-ink-muted">
                Ethereum address
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="field font-mono text-sm"
                  placeholder="0x…"
                  spellCheck={false}
                  autoComplete="off"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm text-ink-muted">
                <span className="flex items-baseline justify-between">
                  Amount (ETH)
                  <button
                    type="button"
                    className="text-xs text-ink underline decoration-hairline underline-offset-4"
                    onClick={() => setAmount(formatEth(balances.eth, { unit: false }))}
                  >
                    Max
                  </button>
                </span>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="field tabular-nums"
                  inputMode="decimal"
                  placeholder={formatEth(economy.withdrawMinEth, { unit: false })}
                  required
                />
              </label>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <button type="submit" className="btn-play min-h-11 w-full" disabled={pending || !canWithdraw || hasPending}>
                {pending ? "Sending…" : hasPending ? "A withdrawal is on its way" : canWithdraw ? "Request withdrawal" : `Reach ${formatEth(economy.withdrawMinEth)} to withdraw`}
              </button>
            </form>
          )}
        </div>

        <div className="glass p-5 sm:p-6">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Withdrawals</h2>
          {withdrawals.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-ink-muted">None yet. Clear a few walls first.</p>
          ) : (
            <div className="ledger mt-3">
              {withdrawals.map((row) => (
                <div key={row.id} className="ledger-row">
                  <span className="text-ink">{STATUS_LABEL[row.status] ?? row.status}</span>
                  <span className="ledger-n text-ink">{formatEth(row.eth)}</span>
                  <span className="ledger-meta font-mono">
                    {row.toAddress.slice(0, 6)}…{row.toAddress.slice(-4)} · {new Date(row.createdAt).toLocaleDateString("en-US")}
                    {row.txHash ? ` · tx ${row.txHash.slice(0, 10)}…` : ""}
                    {row.note ? ` · ${row.note}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass mt-8 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Activity</h2>
          <Link href={EARN_PATH} className="text-sm text-ink underline decoration-hairline underline-offset-4">
            Store
          </Link>
        </div>
        {ledger.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-ink-muted">Nothing yet. Your first ticket shows up here.</p>
        ) : (
          <div className="ledger mt-3">
            {ledger.map((line) => {
              const gemLine = line.gems !== 0;
              const value = gemLine ? line.gems : line.eth;
              const sign = value > 0 ? "pos" : "neg";
              return (
                <div key={line.id} className="ledger-row">
                  <span className="text-ink">{line.note ?? KIND_LABEL[line.kind] ?? line.kind}</span>
                  <span className="ledger-n inline-flex items-center gap-1.5 text-ink" data-sign={sign}>
                    {gemLine ? <GemGlyph /> : <EthGlyph />}
                    {value > 0 ? "+" : ""}
                    {gemLine ? formatGems(line.gems) : formatEth(line.eth, { unit: false })}
                  </span>
                  <span className="ledger-meta">
                    {KIND_LABEL[line.kind] ?? line.kind} · {new Date(line.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </section>
  );
}

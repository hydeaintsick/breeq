"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { publishEarnMap, type PublishResult } from "@/app/actions/earn";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { TopUpButton } from "@/components/gem-shop";
import { useDifficulty } from "@/components/difficulty-meter";
import { WallEditor } from "@/components/wall-editor";
import {
  applyBackgroundPhoto,
  createDraftLevel,
  serializeLevel,
  validateLevel,
  type Level,
} from "@/game/breakout/engine";
import { EARN_PATH } from "@/lib/auth/paths";
import { compressImageFile } from "@/lib/compress-image";
import { formatEth, formatGems, formatUsd, payoutFor, ticketUsd, type Economy } from "@/lib/economy";
import { DEFAULT_GRADIENT_ID, GRADIENTS, findGradient, gradientCss, gradientSrc } from "@/lib/gradients";

/**
 * The map wizard: name it and pick a sky, build the wall, then let the robot
 * prove it and price the ticket. Publishing costs gems and puts the map on
 * sale at once; the server runs the same proof again before it charges.
 */

type Sky = { kind: "gradient"; id: string } | { kind: "photo"; file: File; url: string };

const STEPS = ["Name & sky", "Build the wall", "Prove & price"] as const;

export function EarnWizard({
  author,
  economy,
  gems,
}: {
  author: string;
  economy: Economy;
  gems: number;
}) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [sky, setSky] = useState<Sky>({ kind: "gradient", id: DEFAULT_GRADIENT_ID });
  const [skyError, setSkyError] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>(() =>
    applyBackgroundPhoto(createDraftLevel({ id: "draft", name: "New map", author }), gradientSrc(findGradient(DEFAULT_GRADIENT_ID)!)),
  );
  const [ticket, setTicket] = useState(economy.ticketDefaultGems);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; need?: number } | null>(null);
  const [done, setDone] = useState<PublishResult | null>(null);

  const skySrc = sky.kind === "photo" ? sky.url : gradientSrc(findGradient(sky.id) ?? GRADIENTS[0]);

  /** The board's sky follows the pick. */
  function pickSky(next: Sky) {
    const src = next.kind === "photo" ? next.url : gradientSrc(findGradient(next.id) ?? GRADIENTS[0]);
    setSky(next);
    setLevel((current) => applyBackgroundPhoto(current, src));
  }

  useEffect(() => {
    return () => {
      if (sky.kind === "photo") URL.revokeObjectURL(sky.url);
    };
  }, [sky]);

  const errors = useMemo(() => validateLevel(level).filter((issue) => issue.level === "error"), [level]);
  const cleanTitle = title.trim();
  const titleOk = cleanTitle.length >= 2 && cleanTitle.length <= 40;

  async function onPhoto(file: File | null) {
    setSkyError(null);
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      const url = URL.createObjectURL(compressed);
      pickSky({ kind: "photo", file: compressed, url });
    } catch (issue) {
      setSkyError(issue instanceof Error ? issue.message : "Could not read that photo.");
    }
  }

  async function publish() {
    setPending(true);
    setError(null);
    try {
      const data = new FormData();
      data.set("title", cleanTitle);
      data.set("ticketGems", String(ticket));
      if (sky.kind === "gradient") data.set("gradientId", sky.id);
      else data.set("image", sky.file);
      data.set("level", JSON.stringify(serializeLevel({ ...level, name: cleanTitle, author })));
      const result = await publishEarnMap(data);
      if ("error" in result) {
        setError({ message: result.error, need: result.need });
        return;
      }
      setDone(result);
    } catch {
      setError({ message: "Could not publish. Try again." });
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <section className="mx-auto flex min-h-[100svh] w-full max-w-2xl flex-col justify-center px-4 pb-20 pt-28 sm:px-6">
        <div className="glass p-6 text-center sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">On sale</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{cleanTitle}</h1>
          <p className="mt-3 text-base leading-7 text-ink-muted">
            Rated {done.difficulty}/100 · {done.label}. Every ticket bought on your wall counts toward its rank; the
            most played walls sit at the top of the store.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-muted">
            <GemGlyph /> {formatGems(done.balances.gems)} gems left
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href={EARN_PATH} className="btn-play min-h-11">
              Open the store
            </Link>
            <button
              type="button"
              className="btn-glass min-h-11"
              onClick={() => {
                setDone(null);
                setStep(0);
                setTitle("");
                setLevel(applyBackgroundPhoto(createDraftLevel({ id: "draft", name: "New map", author }), skySrc));
              }}
            >
              Build another
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-4 pb-20 pt-28 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Create a map</p>
        <p className="text-xs text-ink-muted">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{STEPS[step]}</h1>
      <div className="wizard-steps mt-5" aria-hidden="true">
        {STEPS.map((name, index) => (
          <span key={name} className="wizard-step" data-done={index <= step} />
        ))}
      </div>

      {step === 0 ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="min-w-0">
            <label className="grid gap-2 text-sm text-ink-muted">
              Map name
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="field"
                maxLength={40}
                placeholder="Give your wall a name"
                autoComplete="off"
              />
            </label>

            <p className="mt-8 text-sm font-medium text-ink">Sky</p>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              Your own photo, dimmed behind the bricks, or one of twenty gradients.
            </p>

            <label className="sky-photo mt-4">
              {sky.kind === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sky.url} alt="" />
              ) : null}
              <span className={sky.kind === "photo" ? "relative z-10 rounded-full bg-black/55 px-3 py-1 text-white" : ""}>
                {sky.kind === "photo" ? "Replace photo" : "Upload a photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => void onPhoto(event.target.files?.[0] ?? null)}
                aria-label="Upload a photo for the sky"
              />
            </label>
            {skyError ? <p className="mt-2 text-sm text-danger">{skyError}</p> : null}

            <div className="sky-grid mt-5" role="radiogroup" aria-label="Gradient sky">
              {GRADIENTS.map((gradient) => {
                const active = sky.kind === "gradient" && sky.id === gradient.id;
                return (
                  <button
                    key={gradient.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className="sky-swatch"
                    data-active={active}
                    style={{ background: gradientCss(gradient) }}
                    onClick={() => pickSky({ kind: "gradient", id: gradient.id })}
                  >
                    <span>{gradient.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full max-w-[22rem] lg:justify-self-end">
            <p className="mb-3 text-sm font-medium text-ink">Preview</p>
            <div
              className="board-stage relative z-10 overflow-hidden"
              style={{ aspectRatio: `${level.width} / ${level.height}`, backgroundImage: `url("${skySrc}")`, backgroundSize: "cover", backgroundPosition: "center" }}
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-black/45" />
              <div className="absolute inset-x-[7%] top-[9%] grid grid-cols-6 gap-[3%]">
                {Array.from({ length: 18 }, (_, i) => (
                  <span
                    key={i}
                    className="block h-3 rounded-[3px]"
                    style={{
                      background: `var(--neon-${["pink", "cyan", "lime", "amber", "blue", "violet"][i % 6]})`,
                      boxShadow: `0 0 10px var(--neon-${["pink", "cyan", "lime", "amber", "blue", "violet"][i % 6]})`,
                      opacity: 0.9,
                    }}
                  />
                ))}
              </div>
              <span className="absolute bottom-[10%] left-1/2 h-1.5 w-[22%] -translate-x-1/2 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.6)]" />
            </div>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-8">
          <p className="mb-6 max-w-xl text-sm leading-6 text-ink-muted">
            Tap the board to place a piece, tap a piece to lift it off. Flip “Simulate gameplay” to watch the robot
            try it. The wall must be clearable to go on sale.
          </p>
          <WallEditor
            level={level}
            onChange={setLevel}
            readyLabel="Passes the structural check."
            actions={({ undo, canUndo, errorCount }) => (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button type="button" className="btn-play" disabled={errorCount > 0} onClick={() => setStep(2)}>
                  Next: prove &amp; price
                </button>
                <button type="button" className="btn-glass" disabled={!canUndo} onClick={undo}>
                  Undo
                </button>
                <button type="button" className="btn-glass" onClick={() => setStep(0)}>
                  Back
                </button>
              </div>
            )}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <ProveAndPrice
          level={level}
          blocked={errors.length > 0}
          economy={economy}
          ticket={ticket}
          gems={gems}
          pending={pending}
          error={error}
          onTicket={setTicket}
          onBack={() => setStep(1)}
          onPublish={publish}
        />
      ) : null}

      {step === 0 ? (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-play" disabled={!titleOk} onClick={() => setStep(1)}>
            Next: build the wall
          </button>
          <Link href={EARN_PATH} className="btn-glass">
            Cancel
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function ProveAndPrice({
  level,
  blocked,
  economy,
  ticket,
  gems,
  pending,
  error,
  onTicket,
  onBack,
  onPublish,
}: {
  level: Level;
  blocked: boolean;
  economy: Economy;
  ticket: number;
  gems: number;
  pending: boolean;
  error: { message: string; need?: number } | null;
  onTicket: (ticket: number) => void;
  onBack: () => void;
  onPublish: () => void;
}) {
  const state = useDifficulty(level, blocked);
  const result = state.status === "ready" ? state.result : null;
  const shown = result ?? (state.status === "rating" ? state.last : null);
  const payout = payoutFor(ticket, economy);
  const cost = economy.publishCostGems;
  const short = Math.max(0, cost - gems);
  const canPublish = result !== null && result.clearable && short === 0 && !pending;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div className="glass p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Robot proof</p>
        <div className="difficulty mt-4" data-tier={shown?.tier ?? 0} aria-live="polite">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-ink">
              Difficulty{shown ? <span className="difficulty-label"> · {shown.label}</span> : null}
            </p>
            <p className="text-sm tabular-nums text-ink-muted">{shown ? `${shown.score}/100` : "…"}</p>
          </div>
          <div className="rank-bar difficulty-bar mt-2" data-rating={state.status === "rating" ? "true" : undefined}>
            <span className="rank-bar-fill difficulty-fill" style={{ width: `${shown?.score ?? 0}%` }} />
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          {state.status === "blocked"
            ? "Fix the wall's errors first."
            : !result
              ? "A flawless autopilot is proving the wall, then fallible players are trying it…"
              : !result.clearable
                ? "The robot could not bring this wall down. Open a path to every brick, add a life, or ease the timer — then come back."
                : `Cleared. Good players clear it ${Math.round((result.samples[0]?.winRate ?? 0) * 100)}% of the time${
                    result.meanSeconds != null ? `, in about ${Math.round(result.meanSeconds)} seconds` : ""
                  }. This score goes on the card.`}
        </p>
      </div>

      <div className="glass p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Ticket</p>
        <label className="mt-4 grid gap-2 text-sm text-ink-muted">
          <span className="flex items-baseline justify-between">
            Price per attempt
            <strong className="inline-flex items-center gap-1.5 text-base text-ink">
              <GemGlyph /> {formatGems(ticket)}
            </strong>
          </span>
          <input
            type="range"
            min={economy.ticketMinGems}
            max={economy.ticketMaxGems}
            step={Math.max(1, Math.round((economy.ticketMaxGems - economy.ticketMinGems) / 48))}
            value={ticket}
            onChange={(event) => onTicket(Number(event.target.value))}
            className="h-11 w-full accent-[var(--accent)]"
          />
          <span className="flex justify-between text-xs">
            <span>{formatGems(economy.ticketMinGems)}</span>
            <span>{formatGems(economy.ticketMaxGems)}</span>
          </span>
        </label>
        <div className="mt-4">
          <div className="earn-sheet-row">
            <span>A ticket is worth</span>
            <strong>{formatUsd(ticketUsd(ticket, economy))}</strong>
          </div>
          <div className="earn-sheet-row" data-big="true">
            <span>A clear pays</span>
            <strong className="inline-flex items-center gap-1.5">
              <EthGlyph /> {formatEth(payout.eth)}
              <small className="text-xs font-normal text-ink-muted">≈ {formatUsd(payout.usd)}</small>
            </strong>
          </div>
          <div className="earn-sheet-row">
            <span>Publishing costs</span>
            <strong className="inline-flex items-center gap-1.5">
              <GemGlyph /> {formatGems(cost)}
            </strong>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-ink-muted">
          Harder walls can carry a higher ticket. A wall pays each player once; your own map pays you nothing.
        </p>

        {error ? <p className="mt-4 text-sm text-danger">{error.message}</p> : null}

        <div className="mt-6 grid gap-3">
          {short > 0 || error?.need ? (
            <>
              <p className="text-sm text-ink-muted">You are {formatGems(error?.need ?? short)} gems short to publish.</p>
              <TopUpButton className="btn-play min-h-11 w-full" />
            </>
          ) : (
            <button type="button" className="btn-play play-shimmer min-h-11 w-full" disabled={!canPublish} onClick={onPublish}>
              {pending ? "Publishing…" : (
                <span className="inline-flex items-center gap-2">
                  Publish for <GemGlyph /> {formatGems(cost)}
                </span>
              )}
            </button>
          )}
          <button type="button" className="btn-glass min-h-11 w-full" onClick={onBack} disabled={pending}>
            Back to the wall
          </button>
        </div>
      </div>
    </div>
  );
}

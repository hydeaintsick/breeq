"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { finishEarnRun, forfeitEarnRun, startEarnRun, type RunEnd, type RunStart } from "@/app/actions/earn";
import { BreakoutPreview } from "@/components/breakout-preview";
import { EthGlyph, GemGlyph } from "@/components/currency-glyphs";
import { TopUpButton } from "@/components/gem-shop";
import { HapticsToggle } from "@/components/haptics-toggle";
import { SoundToggle } from "@/components/sound-toggle";
import { SwipeToggle } from "@/components/swipe-toggle";
import { useImmersive } from "@/components/use-immersive";
import { useTheme } from "@/components/use-story-theme";
import { applyBackgroundPhoto, parseStoredLevel, RULES, type GameEvent, type GameState } from "@/game/breakout/engine";
import { createPayoutSfx, levelKey, pursuit, type PayoutSfx } from "@/game/breakout/audio";
import { isHapticsEnabled, isHapticsSupported } from "@/game/breakout/haptics";
import { enterImmersive, wantsImmersive } from "@/game/breakout/preview";
import type { Balances, EarnMapCard } from "@/lib/earn";
import { formatEth, formatGems, formatUsd } from "@/lib/economy";
import { screenPhoto } from "@/lib/photo";

/**
 * One paid attempt at a map, from the ticket to the payout: the sheet that
 * names the price, the full-screen board, then the clear screen with its ETH
 * stamp or the lose screen with a re-buy. The ticket is paid on "Play", the
 * payout is credited by the server when the wall comes down.
 */
export function EarnRun({
  card,
  balances,
  onBalances,
  onWon,
  onClose,
}: {
  card: EarnMapCard;
  balances: Balances;
  onBalances: (balances: Balances) => void;
  onWon: (mapId: string) => void;
  onClose: () => void;
}) {
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const [run, setRun] = useState<RunStart | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<{ message: string; need?: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [end, setEnd] = useState<{ kind: "won" | "lost"; score: number; reason?: "lives" | "timeout" | "crushed"; result: RunEnd | null } | null>(null);
  const [runIndex, setRunIndex] = useState(0);
  const runRef = useRef<RunStart | null>(null);

  useEffect(() => {
    // Portals need the body, which only exists on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortal(document.body);
  }, []);

  useImmersive(run !== null);

  const level = useMemo(() => {
    const photo = card.backgroundSrc.startsWith("data:") ? card.backgroundSrc : screenPhoto(card.backgroundSrc);
    const parsed = parseStoredLevel(card.level, { id: card.id, name: card.title, author: card.author });
    parsed.name = card.title;
    parsed.author = card.author;
    return [applyBackgroundPhoto(parsed, photo)];
  }, [card]);

  // The run's music, in the level's key, on top of the store's theme while the
  // board is live; it steps aside in the pause menu and leaves on the end
  // screens so the store's anthem comes back under the payout.
  const live = run !== null && end === null;
  const score = useMemo(() => pursuit(levelKey(level[0])), [level]);
  const setIntensity = useTheme(live ? score : null, paused);
  const tension = useRef({ lostLives: 0, heat: 0 });
  const handleEvent = useCallback(
    (event: GameEvent, state: Readonly<GameState>) => {
      const t = tension.current;
      if (event.type === "life") t.lostLives = Math.max(0, level[0].lives - event.lives);
      else if (event.type === "heat") t.heat = Math.min(1, event.heat / RULES.heatMax);
      else if (event.type === "launch") t.heat = 0;
      else return;
      // Every life lost is a big step; heat fills the rest. State is the source
      // of truth for lives in case an event was missed.
      const lost = Math.max(t.lostLives, level[0].lives - state.lives);
      const lives = level[0].lives > 1 ? lost / (level[0].lives - 1) : lost;
      setIntensity(Math.min(1, 0.6 * lives + 0.4 * t.heat));
    },
    [level, setIntensity],
  );

  const buy = useCallback(async () => {
    if (wantsImmersive()) void enterImmersive();
    setStarting(true);
    setError(null);
    try {
      const result = await startEarnRun(card.id);
      if ("error" in result) {
        setError({ message: result.error, need: result.need });
        return;
      }
      runRef.current = result;
      onBalances(result.balances);
      tension.current = { lostLives: 0, heat: 0 };
      setIntensity(0);
      setEnd(null);
      setPaused(false);
      setRunIndex((n) => n + 1);
      setRun(result);
    } catch {
      setError({ message: "Could not start the run. Try again." });
    } finally {
      setStarting(false);
    }
  }, [card.id, onBalances, setIntensity]);

  const settle = useCallback(
    async (won: boolean, score: number) => {
      const current = runRef.current;
      if (!current) return;
      try {
        const result = await finishEarnRun(current.runId, { won, score });
        if ("error" in result) return;
        onBalances(result.balances);
        if (result.outcome === "WON") onWon(card.id);
        setEnd((state) => (state ? { ...state, result } : state));
      } catch {
        // The clear screen falls back to the locked-in payout figures.
      }
    },
    [card.id, onBalances, onWon],
  );

  const handleCleared = useCallback(
    ({ human, score }: { human: boolean; score: number }) => {
      if (!human) return;
      setPaused(false);
      setEnd({ kind: "won", score, result: null });
      void settle(true, score);
    },
    [settle],
  );

  const handleOver = useCallback(
    ({ human, score, reason }: { human: boolean; score: number; reason: "lives" | "timeout" | "crushed" }) => {
      if (!human) return;
      setPaused(false);
      setEnd({ kind: "lost", score, reason, result: null });
      void settle(false, score);
    },
    [settle],
  );

  const quit = useCallback(() => {
    const current = runRef.current;
    if (current && !end) {
      void forfeitEarnRun(current.runId).catch(() => null);
    }
    runRef.current = null;
    onClose();
  }, [end, onClose]);

  // Escape closes the sheet, pauses a live run.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!run) onClose();
      else if (!end) setPaused(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [end, onClose, run]);

  if (!portal) return null;

  if (!run) {
    const canPlay = !card.won && !card.mine;
    const short = Math.max(0, card.ticketGems - balances.gems);
    return createPortal(
      <div className="earn-sheet" role="dialog" aria-modal="true" aria-label={`Play ${card.title}`} onClick={onClose}>
        <div className="earn-sheet-body glass-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Ticket</p>
              <h2 className="mt-2 truncate text-2xl font-semibold tracking-tight text-ink">{card.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">
                by {card.author} · {card.difficulty}/100 {card.difficultyLabel}
              </p>
            </div>
            <button type="button" className="header-chip" aria-label="Close" onClick={onClose}>
              <CloseGlyph />
            </button>
          </div>

          <div className="mt-5">
            <div className="earn-sheet-row">
              <span>Ticket</span>
              <strong className="inline-flex items-center gap-1.5">
                <GemGlyph />
                {formatGems(card.ticketGems)}
              </strong>
            </div>
            <div className="earn-sheet-row" data-big="true">
              <span>Clear the wall, win</span>
              <strong className="inline-flex items-center gap-1.5">
                <EthGlyph />
                {formatEth(card.payoutEth)}
                <small className="text-xs font-normal text-ink-muted">≈ {formatUsd(card.payoutUsd)}</small>
              </strong>
            </div>
            <div className="earn-sheet-row">
              <span>Your gems</span>
              <strong className="inline-flex items-center gap-1.5">
                <GemGlyph />
                {formatGems(balances.gems)}
              </strong>
            </div>
          </div>

          {error ? <p className="mt-3 text-sm text-danger">{error.message}</p> : null}

          <div className="mt-5 grid gap-3">
            {!canPlay ? (
              <p className="text-sm leading-6 text-ink-muted">
                {card.won
                  ? "You already cleared this map and were paid. One win per map keeps the pot fair."
                  : "This is your map. Your own wall pays you nothing — but every player who tries it counts toward its rank."}
              </p>
            ) : short > 0 || (error && error.need) ? (
              <>
                <p className="text-sm leading-6 text-ink-muted">
                  You are {formatGems(error?.need ?? short)} gems short for this ticket.
                </p>
                <TopUpButton className="btn-play min-h-11 w-full" />
              </>
            ) : (
              <button type="button" className="btn-play play-shimmer min-h-11 w-full" disabled={starting} onClick={buy}>
                {starting ? "Opening…" : (
                  <span className="inline-flex items-center gap-2">
                    Play for <GemGlyph /> {formatGems(card.ticketGems)}
                  </span>
                )}
              </button>
            )}
            <button type="button" className="btn-glass min-h-11 w-full" onClick={onClose}>
              {canPlay ? "Not now" : "Close"}
            </button>
          </div>
        </div>
      </div>,
      portal,
    );
  }

  return createPortal(
    <div className="story-play" role="dialog" aria-modal="true" aria-label={card.title}>
      <div className="absolute inset-0">
        <BreakoutPreview
          key={runIndex}
          levels={level}
          seed={run.seed}
          followQuery={false}
          controls="pointer"
          loop={false}
          contain
          thumbRail
          sound
          haptics
          showCaption={false}
          paused={paused || end !== null}
          chrome={
            end ? null : (
              <button type="button" className="story-pause" aria-label="Pause" onClick={() => setPaused(true)}>
                <CloseGlyph />
              </button>
            )
          }
          onCleared={handleCleared}
          onOver={handleOver}
          onEvent={handleEvent}
        />
      </div>

      {end?.kind === "won" ? (
        <EarnClear
          key={`clear-${runIndex}`}
          title={card.title}
          score={end.score}
          payoutEth={end.result?.payoutEth ?? run.payoutEth}
          payoutUsd={end.result?.payoutUsd ?? run.payoutUsd}
          before={end.result?.before.eth ?? null}
          after={end.result?.balances.eth ?? null}
          onClose={quit}
        />
      ) : null}

      {end?.kind === "lost" ? (
        <EarnLose
          key={`lose-${runIndex}`}
          title={card.title}
          score={end.score}
          reason={end.reason ?? "lives"}
          ticketGems={card.ticketGems}
          gems={balances.gems}
          retrying={starting}
          error={error?.message ?? null}
          onRetry={buy}
          onClose={quit}
        />
      ) : null}

      {paused && !end ? (
        <div className="story-pause-menu">
          <div className="glass w-full max-w-sm p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Paused</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{card.title}</h3>
            <p className="mt-2 text-sm text-ink-muted">Quitting forfeits the ticket.</p>
            <div className="mt-8 grid gap-3">
              <button type="button" className="btn-play min-h-11 w-full" onClick={() => setPaused(false)}>
                Resume
              </button>
              <SoundToggle variant="row" />
              <HapticsToggle variant="row" />
              <SwipeToggle variant="row" />
              <button type="button" className="btn-glass min-h-11 w-full" onClick={quit}>
                Quit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    portal,
  );
}

// --- Clear: the ETH stamp ----------------------------------------------------

const T = {
  stampStart: 520,
  countStart: 900,
  countDur: 1100,
  buttonsAfter: 320,
} as const;

const TICKS = 20;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function pulse() {
  if (!isHapticsEnabled() || !isHapticsSupported()) return;
  navigator.vibrate([18, 50, 26]);
}

function EarnClear({
  title,
  score,
  payoutEth,
  payoutUsd,
  before,
  after,
  onClose,
}: {
  title: string;
  score: number;
  payoutEth: number;
  payoutUsd: number;
  before: number | null;
  after: number | null;
  onClose: () => void;
}) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const mountedAt = useRef(0);
  const [skipped, setSkipped] = useState(false);
  const [stage, setStage] = useState<"hidden" | "stamp" | "done">("hidden");
  const [buttonsTimed, setButtons] = useState(false);
  const stampRef = useRef<HTMLSpanElement>(null);
  const balanceRef = useRef<HTMLSpanElement>(null);
  const sfxRef = useRef<PayoutSfx | null>(null);

  const skip = reduced || skipped;
  const shownStage = skip ? "done" : stage;
  const buttons = skip || buttonsTimed;

  useEffect(() => {
    mountedAt.current = performance.now();
    const sfx = createPayoutSfx();
    sfxRef.current = sfx;
    return () => {
      sfxRef.current = null;
      sfx.destroy();
    };
  }, []);

  useEffect(() => {
    const paint = (eth: number) => {
      if (stampRef.current) stampRef.current.textContent = `+${formatEth(eth)}`;
    };
    if (skip) {
      paint(payoutEth);
      return;
    }
    paint(0);
    const stampAt = mountedAt.current + T.stampStart;
    const countAt = mountedAt.current + T.countStart;
    let raf = 0;
    let lastStep = 0;
    const stampTimer = window.setTimeout(() => {
      setStage("stamp");
      sfxRef.current?.stamp();
      pulse();
    }, Math.max(0, stampAt - performance.now()));
    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - countAt) / T.countDur));
      const eased = easeOutCubic(t);
      paint(payoutEth * eased);
      const step = Math.floor(eased * TICKS);
      if (step !== lastStep) {
        lastStep = step;
        sfxRef.current?.tick(eased);
      }
      if (t < 1) raf = requestAnimationFrame(frame);
      else {
        sfxRef.current?.settle();
        setStage("done");
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(stampTimer);
    };
  }, [payoutEth, skip]);

  useEffect(() => {
    if (buttons || shownStage !== "done") return;
    const id = window.setTimeout(() => setButtons(true), T.buttonsAfter);
    return () => window.clearTimeout(id);
  }, [buttons, shownStage]);

  useEffect(() => {
    if (balanceRef.current && after !== null) balanceRef.current.textContent = formatEth(after);
  }, [after]);

  return (
    <div
      className="story-clear"
      data-kind="earn"
      role="dialog"
      aria-modal="true"
      aria-label={`Victory: ${title}. You won ${formatEth(payoutEth)}.`}
      data-skip={skip}
      onClick={() => setSkipped(true)}
    >
      <div className="story-clear-body">
        <p className="story-clear-kicker">Paid out</p>
        <h2 className="story-clear-title">{title}</h2>

        <p className="story-clear-scoreline">
          <span className="story-clear-label">Score</span>
          <span className="story-clear-scoreline-n">{Math.round(score).toLocaleString("en-US")}</span>
        </p>

        <div className="story-clear-xp" data-stage={shownStage}>
          <span ref={stampRef} className="story-clear-stamp">
            +{formatEth(0)}
          </span>
          <span className="earn-clear-usd">≈ {formatUsd(payoutUsd)} · sent to your wallet</span>
        </div>

        <p className="earn-clear-balance" data-show={shownStage === "done"}>
          <EthGlyph />
          <span>
            Balance{" "}
            <span ref={balanceRef}>{after !== null ? formatEth(after) : before !== null ? formatEth(before + payoutEth) : "…"}</span>
          </span>
        </p>

        <div className="story-clear-actions" data-show={buttons}>
          <button
            type="button"
            className="btn-play min-h-11 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            Back to the store
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Lose: the ticket is spent, a re-buy is one tap ----------------------------

const NOTE: Record<"lives" | "timeout" | "crushed", string> = {
  lives: "The last ball got past you.",
  timeout: "The clock ran out.",
  crushed: "The wall reached the paddle.",
};

function EarnLose({
  title,
  score,
  reason,
  ticketGems,
  gems,
  retrying,
  error,
  onRetry,
  onClose,
}: {
  title: string;
  score: number;
  reason: "lives" | "timeout" | "crushed";
  ticketGems: number;
  gems: number;
  retrying: boolean;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const [skipped, setSkipped] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [buttonsTimed, setButtons] = useState(false);
  const skip = reduced || skipped;
  const stage = skip ? "done" : stamped ? "stamp" : "hidden";
  const buttons = skip || buttonsTimed;
  const canRebuy = gems >= ticketGems;

  useEffect(() => {
    if (skip) return;
    const a = window.setTimeout(() => setStamped(true), 900);
    const b = window.setTimeout(() => setButtons(true), 1500);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [skip]);

  return (
    <div
      className="story-clear"
      data-kind="lose"
      role="dialog"
      aria-modal="true"
      aria-label={`Game over: ${title}`}
      data-skip={skip}
      onClick={() => setSkipped(true)}
    >
      <div className="story-clear-body">
        <p className="story-clear-kicker">Game over</p>
        <h2 className="story-clear-title">{title}</h2>

        <p className="story-clear-scoreline">
          <span className="story-clear-label">Score</span>
          <span className="story-clear-scoreline-n">{Math.round(score).toLocaleString("en-US")}</span>
        </p>

        <div className="story-clear-xp" data-stage={stage} data-replay="true">
          <span className="story-clear-stamp">Ticket spent</span>
          <span className="story-clear-note">{NOTE[reason]} The wall is still standing — and still paying.</span>
        </div>

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        <div className="story-clear-actions" data-show={buttons}>
          {canRebuy ? (
            <button
              type="button"
              className="btn-play min-h-11 w-full"
              disabled={retrying}
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
            >
              {retrying ? "Opening…" : (
                <span className="inline-flex items-center gap-2">
                  Try again · <GemGlyph /> {formatGems(ticketGems)}
                </span>
              )}
            </button>
          ) : (
            <TopUpButton className="btn-play min-h-11 w-full" />
          )}
          <button
            type="button"
            className="btn-glass story-clear-glass min-h-11 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            Back to the store
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

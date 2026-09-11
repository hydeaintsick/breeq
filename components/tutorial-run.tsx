"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ChapterClearResult } from "@/app/actions/progress";
import { completeTutorial } from "@/app/actions/tutorial";
import { BreakoutPreview } from "@/components/breakout-preview";
import { HapticsToggle } from "@/components/haptics-toggle";
import { SoundToggle } from "@/components/sound-toggle";
import { StoryClear } from "@/components/story-clear";
import { StoryLose } from "@/components/story-lose";
import type { GameEvent } from "@/game/breakout/engine/types";
import { TUTORIAL } from "@/game/breakout/levels";
import type { BreakoutHandle, CssRect } from "@/game/breakout/preview";
import { STORY_AFTER_TUTORIAL_PATH, STORY_PATH } from "@/lib/auth/paths";

const DONE_NOTE =
  "Glass and hard bricks are just the start. Explosive, ghost, magnet, keys and locks, plus rings that speed the ball up, flip it, or split it in two, are all waiting in the story.";

/**
 * The guided first run. A real game on the real board; the tutorial only
 * watches events, freezes the world on the moments worth a word, and lights
 * one thing at a time: the rail, a glass brick, a crack, a zone, the lives.
 */

type Target =
  /** A world rectangle on the board. */
  | { kind: "world"; x: number; y: number; w: number; h: number }
  /** The paddle, wherever it is right now. */
  | { kind: "paddle" }
  /** A piece of chrome around the board (the rail, the lives). */
  | { kind: "dom"; selector: string };

type StepId = "welcome" | "controls" | "glass" | "hard" | "zone" | "life";

type Step = {
  id: StepId;
  kicker: string;
  title: string;
  body: string;
  action: string;
  /** What stays lit: the union of these. Empty = the whole board is dimmed. */
  targets: Target[];
};

const LEVELS = [TUTORIAL];
const HOLE_PAD = 10;

/** Bounding box of every brick of one kind, in world units. */
function rowBox(kind: "glass" | "hard") {
  const bricks = TUTORIAL.bricks.filter((brick) => brick.kind === kind);
  const x0 = Math.min(...bricks.map((b) => b.x));
  const y0 = Math.min(...bricks.map((b) => b.y));
  const x1 = Math.max(...bricks.map((b) => b.x + b.w));
  const y1 = Math.max(...bricks.map((b) => b.y + b.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

const WELCOME: Step = {
  id: "welcome",
  kicker: "Tutorial",
  title: "Welcome to Breeq.",
  body: "This is a wall: neon bricks over a photo. Break every brick to clear it. First, the paddle.",
  action: "Next",
  targets: [],
};

const CONTROLS: Step = {
  id: "controls",
  kicker: "Controls",
  title: "Move and launch.",
  body: "Slide along the rail to move the paddle. Tap anywhere on the board to launch the ball, then keep it in play.",
  action: "Got it",
  targets: [{ kind: "paddle" }, { kind: "dom", selector: ".thumb-rail" }],
};

function glassStep(): Step {
  return {
    id: "glass",
    kicker: "Brick 1 of 2",
    title: "Glass brick.",
    body: "One hit and it shatters. Every brick you break adds to your score.",
    action: "Continue",
    targets: [{ kind: "world", ...rowBox("glass") }],
  };
}

function hardStep(brick: { x: number; y: number; w: number; h: number }): Step {
  return {
    id: "hard",
    kicker: "Brick 2 of 2",
    title: "Hard brick.",
    body: "It cracks on the first hit and breaks on the second. Look for the crack.",
    action: "Continue",
    targets: [{ kind: "world", x: brick.x, y: brick.y, w: brick.w, h: brick.h }],
  };
}

function zoneStep(zone: { x: number; y: number; r: number }): Step {
  const r = zone.r * 1.5;
  return {
    id: "zone",
    kicker: "Zone",
    title: "Slow zone.",
    body: "The ring cut the ball's speed in half for a few seconds. Fast rings do the opposite: ×2 and ×3.",
    action: "Continue",
    targets: [{ kind: "world", x: zone.x - r, y: zone.y - r, w: r * 2, h: r * 2 }],
  };
}

function lifeStep(lives: number): Step {
  const left = lives === 1 ? "1 life left" : `${lives} lives left`;
  return {
    id: "life",
    kicker: "Lives",
    title: "Ball lost.",
    body: `The dots up top are your lives. When the last one goes, the run is over. ${left}.`,
    action: "Continue",
    targets: [{ kind: "dom", selector: ".board-hud-lives" }],
  };
}

function pad(rect: CssRect, by: number): CssRect {
  return { x: rect.x - by, y: rect.y - by, width: rect.width + by * 2, height: rect.height + by * 2 };
}

function union(a: CssRect, b: CssRect): CssRect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

export function TutorialRun({ done: alreadyDone }: { done: boolean }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<BreakoutHandle | null>(null);
  const seen = useRef<Set<StepId>>(new Set());
  const actionRef = useRef<HTMLButtonElement>(null);
  // Finishing refreshes the page with `done` flipped; the labels keep the
  // state the player arrived with, so the button does not change under them.
  const [firstVisit] = useState(() => !alreadyDone);

  const [step, setStep] = useState<Step | null>(WELCOME);
  const [menu, setMenu] = useState(false);
  /** The wall came down: score is known at once, the payout arrives a beat later. */
  const [cleared, setCleared] = useState<{ score: number; result: ChapterClearResult | null } | null>(null);
  const [lost, setLost] = useState<{ score: number; reason: "lives" | "timeout" | "crushed" } | null>(null);
  const [runId, setRunId] = useState(0);
  const [hole, setHole] = useState<CssRect | null>(null);
  const [place, setPlace] = useState<"top" | "bottom" | "center">("center");
  const [ready, setReady] = useState(false);
  const [opening, startOpening] = useTransition();

  const paused = step !== null || menu || cleared !== null || lost !== null;
  const stepRef = useRef(step);
  const endedRef = useRef(false);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Freeze the world on the spot and show one card.
  const show = useCallback((next: Step) => {
    if (stepRef.current || endedRef.current || seen.current.has(next.id)) return;
    seen.current.add(next.id);
    handleRef.current?.pause();
    stepRef.current = next;
    setStep(next);
  }, []);

  const onEvent = useCallback(
    (event: GameEvent) => {
      switch (event.type) {
        case "brick":
          if (event.brick.kind === "glass") show(glassStep());
          else if (event.brick.kind === "hard" && !event.broken) show(hardStep(event.brick));
          break;
        case "zone":
          if (event.zone.kind === "slow") show(zoneStep(event.zone));
          break;
        case "life":
          if (event.lives > 0) show(lifeStep(event.lives));
          break;
        default:
          break;
      }
    },
    [show],
  );

  const onHandle = useCallback((handle: BreakoutHandle | null) => {
    handleRef.current = handle;
    setReady(handle !== null);
  }, []);

  const onCleared = useCallback(({ score }: { human: boolean; score: number }) => {
    endedRef.current = true;
    setStep(null);
    setMenu(false);
    setCleared({ score, result: null });
    completeTutorial()
      .then((result) => setCleared((current) => (current ? { ...current, result } : current)))
      .catch(() => null);
  }, []);

  const onOver = useCallback(({ score, reason }: { human: boolean; score: number; reason: "lives" | "timeout" | "crushed" }) => {
    endedRef.current = true;
    setStep(null);
    setMenu(false);
    setLost({ score, reason });
  }, []);

  const restart = useCallback((fromTop: boolean) => {
    endedRef.current = false;
    if (fromTop) seen.current.clear();
    setCleared(null);
    setLost(null);
    setMenu(false);
    setStep(fromTop ? WELCOME : null);
    setRunId((n) => n + 1);
  }, []);

  const advance = useCallback(() => {
    const current = stepRef.current;
    if (!current) return;
    if (current.id === "welcome") {
      seen.current.add("welcome");
      seen.current.add("controls");
      stepRef.current = CONTROLS;
      setStep(CONTROLS);
      return;
    }
    stepRef.current = null;
    setStep(null);
  }, []);

  // Where the light goes, in CSS pixels relative to the run's box.
  const measure = useCallback(() => {
    const root = rootRef.current;
    const current = stepRef.current;
    if (!root || !current || current.targets.length === 0) {
      setHole(null);
      setPlace("center");
      return;
    }
    const base = root.getBoundingClientRect();
    const handle = handleRef.current;
    const canvas = root.querySelector("canvas");
    const onBoard = (x: number, y: number, w: number, h: number): CssRect | null => {
      if (!handle || !canvas) return null;
      const r = handle.project(x, y, w, h);
      const c = canvas.getBoundingClientRect();
      return { x: r.x + c.left - base.left, y: r.y + c.top - base.top, width: r.width, height: r.height };
    };
    let rect: CssRect | null = null;
    for (const target of current.targets) {
      let part: CssRect | null = null;
      if (target.kind === "world") {
        part = onBoard(target.x, target.y, target.w, target.h);
      } else if (target.kind === "paddle") {
        const s = handle?.state();
        if (s) {
          const p = TUTORIAL.paddle;
          part = onBoard(s.paddleX - s.paddleWidth / 2, p.y, s.paddleWidth, p.height);
        }
      } else {
        const el = root.querySelector<HTMLElement>(target.selector);
        if (el) {
          const r = el.getBoundingClientRect();
          part = { x: r.left - base.left, y: r.top - base.top, width: r.width, height: r.height };
        }
      }
      if (part) rect = rect ? union(rect, part) : part;
    }
    if (!rect) {
      setHole(null);
      setPlace("center");
      return;
    }
    const padded = pad(rect, HOLE_PAD);
    setHole(padded);
    setPlace(padded.y + padded.height / 2 < base.height / 2 ? "bottom" : "top");
  }, []);

  useLayoutEffect(() => {
    measure();
    if (!step) return;
    // The board settles its size a frame later; measure again once it has.
    const raf = window.requestAnimationFrame(measure);
    // The mount re-lays the world out ~90ms after a resize settles.
    let timer = 0;
    const onResize = () => {
      measure();
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 160);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [measure, step, ready]);

  useEffect(() => {
    if (!step) return;
    actionRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    const html = document.documentElement;
    const previousHtml = html.style.overflow;
    const previousBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = previousHtml;
      document.body.style.overflow = previousBody;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || cleared || lost) return;
      setMenu((open) => !open);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cleared, lost]);

  const openStory = () => {
    startOpening(() => {
      router.push(firstVisit ? STORY_AFTER_TUTORIAL_PATH : STORY_PATH);
    });
  };

  const veilStyle = useMemo(
    () =>
      hole
        ? { left: hole.x, top: hole.y, width: hole.width, height: hole.height }
        : { left: "50%", top: "50%", width: 2, height: 2 },
    [hole],
  );

  return (
    <div ref={rootRef} className="story-play tutorial-run" role="dialog" aria-modal="true" aria-label="Tutorial">
      <BreakoutPreview
        levels={LEVELS}
        seed={31 + runId}
        followQuery={false}
        controls="pointer"
        loop={false}
        contain
        thumbRail
        sound
        haptics
        showCaption={false}
        paused={paused}
        onCleared={onCleared}
        onOver={onOver}
        onEvent={onEvent}
        onHandle={onHandle}
      />

      <div
        className="tutorial-veil"
        data-show={step ? "true" : "false"}
        data-hole={hole ? "true" : "false"}
        style={veilStyle}
        aria-hidden="true"
      />

      {step ? (
        <div key={step.id} className="tutorial-card glass" data-place={place} role="group" aria-live="polite">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{step.kicker}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{step.title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{step.body}</p>
          <button ref={actionRef} type="button" className="btn-play mt-5 min-h-11 w-full" onClick={advance}>
            {step.action}
          </button>
        </div>
      ) : null}

      {cleared || lost ? null : (
        <button type="button" className="story-pause" aria-label="Pause" onClick={() => setMenu(true)}>
          <CloseGlyph />
        </button>
      )}

      {cleared ? (
        <StoryClear
          key={`cleared-${runId}`}
          kicker="Tutorial complete"
          title="Nice work."
          score={cleared.score}
          result={cleared.result}
          hasNext
          episodeDone={false}
          note={DONE_NOTE}
          nextLabel={opening ? "Opening the story…" : firstVisit ? "Start the story" : "Back to the story"}
          closeLabel="Replay tutorial"
          onNext={openStory}
          onClose={() => restart(true)}
        />
      ) : null}

      {lost ? (
        <StoryLose
          key={`lost-${runId}`}
          title={TUTORIAL.name}
          score={lost.score}
          reason={lost.reason}
          onRetry={() => restart(false)}
          onClose={() => router.push(STORY_PATH)}
        />
      ) : null}

      {menu && !cleared && !lost ? (
        <div className="story-pause-menu">
          <div className="glass w-full max-w-sm p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Paused</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{TUTORIAL.name}</h3>
            <div className="mt-8 grid gap-3">
              <button type="button" className="btn-play min-h-11 w-full" onClick={() => setMenu(false)}>
                Resume
              </button>
              <SoundToggle variant="row" />
              <HapticsToggle variant="row" />
              <button type="button" className="btn-glass min-h-11 w-full" onClick={() => router.push(STORY_PATH)}>
                Quit
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

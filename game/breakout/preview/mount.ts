/**
 * Mount one or more breakout levels on a canvas.
 *
 * Runs the deterministic game at a fixed step, the autopilot plays, and the
 * visitor can take the paddle at any time by moving a pointer or a finger
 * over the board (the autopilot resumes after a few idle seconds). When a
 * game ends the next level in the rotation loads. Owns the browser side:
 * DPR, resize, off-screen / hidden-tab pause, reduced motion.
 */
import { BreakoutSfx } from "../audio";
import { Autopilot } from "../engine/autopilot";
import { Game, RULES } from "../engine/game";
import { BreakoutHaptics } from "../haptics";
import type { GameEvent, GameInput, GamePhase, GameState, Level, PaddleModKind, SpeedZoneKind } from "../engine/types";
import { readNeonPalette } from "../render/palette";
import { BreakoutRenderer, type CssRect } from "../render/renderer";
import { SceneFx, createScene } from "../render/scene";

export interface HudState {
  levelName: string;
  author: string;
  lives: number;
  maxLives: number;
  score: number;
  /** Effective speed multiplier. */
  speed: number;
  bonus: SpeedZoneKind | null;
  mod: PaddleModKind | null;
  heat: number;
  balls: number;
  /** Seconds left on the timer rule, or null. */
  timeLeft: number | null;
  phase: GamePhase;
  /** Who holds the paddle. */
  pilot: "auto" | "you";
  caption: string;
}

export interface MountOptions {
  onHud?: (hud: HudState) => void;
  /** Fired once when a wall is cleared. `human` is true if the visitor held the paddle this run. */
  onCleared?: (info: {
    human: boolean;
    score: number;
    paddleHits: number;
    livesLeft: number;
    time: number;
  }) => void;
  /** Fired once when the run ends in a loss. `human` is true if the visitor held the paddle this run. */
  onOver?: (info: { human: boolean; score: number; reason: "lives" | "timeout" | "crushed" }) => void;
  /**
   * Every game event as it happens, with the state right after it. Read-only
   * observation for guided runs (the tutorial pauses on the first glass brick,
   * the first crack, the first zone). Calling `pause()` from inside freezes the
   * game on this exact step.
   */
  onEvent?: (event: GameEvent, state: Readonly<GameState>) => void;
  seed?: number;
  /** "auto": demo only. "pointer": human only. "hybrid": demo until the visitor moves. */
  controls?: "auto" | "pointer" | "hybrid";
  /** Seconds of pointer inactivity before the autopilot takes back the paddle. */
  handoverDelay?: number;
  maxDpr?: number;
  /** Index of the level to start with (wraps). */
  start?: number;
  /**
   * "edit": paint the serve frame only. No paddle input. Call
   * `setSimulating(true)` to run the autopilot on the current draft.
   */
  mode?: "play" | "edit";
  /**
   * Paint the authored serve frame and never run. Locked chapter cards use
   * this so the wall is visible but still. Distinct from reduced-motion
   * freeze(), which advances a few seconds for a showcase pose.
   */
  frozen?: boolean;
  /** When false, a finished wall stays on the end frame instead of rotating. */
  loop?: boolean;
  /**
   * Play the sound design for this mount. Off by default: showcase and menu
   * previews stay silent. Audio starts on the first pointer gesture and follows
   * the page-wide preference (`setSoundEnabled`); it ducks while paused,
   * off-screen, or in a hidden tab.
   */
  sound?: boolean;
  /**
   * Vibrate on contact and on the big moments (`navigator.vibrate`, where
   * available). Off by default; follows the page-wide preference
   * (`setHapticsEnabled`) and stops while paused, off-screen, or hidden.
   */
  haptics?: boolean;
  /**
   * Optional thumb rail: a touch strip outside the board that steers the paddle,
   * so a finger never covers the play field. Pointer input on it maps its
   * width onto the field (see `railGain`); a quick tap launches. The mount
   * writes `--rail-paddle`, `--rail-paddle-w`, `--rail-ball` (0..1 of the rail
   * width) and `data-ball` on the element every frame so CSS can mirror the
   * paddle and the ball without touching React.
   */
  rail?: HTMLElement | null;
  /**
   * Full-screen boards: the canvas fills its parent and the world is fitted
   * (contain, centered) inside this element's box instead, so the photo runs
   * edge to edge while the field keeps its aspect and clears the chrome.
   */
  fit?: HTMLElement | null;
  /**
   * How much of the field the rail's full width covers. 1.25 means the whole
   * field fits in the central 80% of the rail: less thumb travel, and the
   * outer 10% on each side is slack so the paddle can be pinned to a wall
   * without aiming for a pixel.
   */
  railGain?: number;
}

export interface BreakoutHandle {
  destroy(): void;
  /** Swap the background photo of the current level (editor use). */
  setBackground(src: string): void;
  /** Replace the current level and redraw (editor use). */
  setLevel(next: Level): void;
  /** Restart the current level. */
  restart(): void;
  /** Jump to the next level in the rotation. */
  next(): void;
  pause(): void;
  resume(): void;
  /** Editor: run the autopilot, or freeze back to the authored serve frame. */
  setSimulating(on: boolean): void;
  /**
   * A world rectangle in CSS pixels relative to the canvas's top-left, so a DOM
   * overlay can sit on a brick, a zone, or the paddle.
   */
  project(x: number, y: number, w: number, h: number): CssRect;
  /** The live game state, read-only. */
  state(): Readonly<GameState>;
}

const CAPTIONS = {
  serveAuto: "Autoplay. Move over the board to take the paddle.",
  serveYou: "Tap or click to launch.",
  /** Pointer-only games before the first touch. */
  serveTouch: "Slide to move. Tap anywhere to launch.",
  playAuto: "Autoplay. Move over the board to take the paddle.",
  playYou: "You have the paddle.",
  /** Pointer-only games stay quiet during play. */
  playTouch: "",
  lost: "Ball lost.",
  cleared: "Level cleared.",
  overLives: "Game over. Next level…",
  overTimeout: "Out of time. Next level…",
  overCrushed: "The wall came down. Next level…",
  frozen: "A player-built wall. Bricks, zones, obstacles, your photo behind.",
} as const;

export function mountBreakout(
  canvas: HTMLCanvasElement,
  levels: Level | Level[],
  options: MountOptions = {},
): BreakoutHandle {
  const rotation = Array.isArray(levels) ? levels : [levels];
  if (rotation.length === 0) throw new Error("mountBreakout needs at least one level");
  const maxDpr = options.maxDpr ?? 2;
  const controls = options.mode === "edit" ? "auto" : (options.controls ?? "hybrid");
  const editMode = options.mode === "edit";
  const handoverDelay = options.handoverDelay ?? 3.5;
  const loop = options.loop ?? true;
  const rail = editMode ? null : (options.rail ?? null);
  const fit = options.fit ?? null;
  const railGain = Math.max(1, options.railGain ?? 1.25);
  const forceFrozen = Boolean(options.frozen);
  let seed = options.seed ?? 1;
  let levelIndex = (((options.start ?? 0) % rotation.length) + rotation.length) % rotation.length;
  let paused = false;
  let simulating = false;
  const wantsAutoLaunch = () => (editMode ? simulating : controls !== "pointer");

  const palette = readNeonPalette();
  const scene = createScene();
  const fx = new SceneFx(scene);
  const sfx = options.sound && !editMode ? new BreakoutSfx(rotation[levelIndex]) : null;
  const haptics = options.haptics && !editMode ? new BreakoutHaptics() : null;

  let destroyed = false;
  let raf = 0;
  let last = 0;
  let accumulator = 0;
  let endHold = 0;
  let cssWidth = 0;
  let cssHeight = 0;
  let dpr = 1;

  // Human input.
  let pointerX: number | null = null;
  let pointerLaunch = false;
  let lastPointerT = -Infinity;
  let humanTouched = false;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frozen = forceFrozen || (!editMode && reducedMotion.matches);
  let visible = true;
  let hidden = document.visibilityState === "hidden";

  // Current level.
  let level = rotation[levelIndex];
  let game = new Game(level, { seed, autoLaunch: wantsAutoLaunch() });
  let pilot = new Autopilot(level, { seed: seed * 7 });
  let renderer = new BreakoutRenderer(canvas, level, palette, () => draw(), editMode);

  let hud: HudState = {
    levelName: level.name,
    author: level.author,
    lives: level.lives,
    maxLives: level.lives,
    score: 0,
    speed: 1,
    bonus: null,
    mod: null,
    heat: 0,
    balls: 1,
    timeLeft: level.rules.timer > 0 ? level.rules.timer : null,
    phase: "serve",
    pilot: "auto",
    caption: frozen ? CAPTIONS.frozen : controls === "pointer" ? CAPTIONS.serveTouch : CAPTIONS.serveAuto,
  };
  const emitHud = () => options.onHud?.(hud);
  emitHud();

  const humanActive = () => controls === "pointer" || (controls === "hybrid" && scene.time - lastPointerT < handoverDelay);

  const input = (): GameInput => {
    // Pointer-only games always accept a launch, even before the rail has a
    // target (tap-anywhere to serve). Hybrid still needs a pointer on the board.
    if (controls === "pointer") {
      const launch = pointerLaunch;
      pointerLaunch = false;
      return { targetX: pointerX ?? game.state.paddleX, launch };
    }
    if (humanActive() && pointerX !== null) {
      const launch = pointerLaunch;
      pointerLaunch = false;
      return { targetX: pointerX, launch };
    }
    return pilot.input(game.state, game.bricks);
  };

  const applyEvents = (events: GameEvent[]) => {
    for (const e of events) {
      fx.apply(e);
      sfx?.apply(e, game.state);
      haptics?.apply(e);
      options.onEvent?.(e, game.state);
      if (e.type === "cleared") {
        options.onCleared?.({
          human: humanTouched,
          score: e.score,
          paddleHits: game.state.totalPaddleHits,
          livesLeft: game.state.lives,
          time: game.state.time,
        });
      }
      if (e.type === "over") {
        options.onOver?.({ human: humanTouched, score: e.score, reason: e.reason });
      }
    }
  };

  const syncHud = () => {
    const s = game.state;
    const who: HudState["pilot"] = humanActive() && pointerX !== null ? "you" : "auto";
    let caption: string;
    switch (s.phase) {
      case "serve":
        caption = who === "you" ? CAPTIONS.serveYou : controls === "pointer" ? CAPTIONS.serveTouch : CAPTIONS.serveAuto;
        break;
      case "play":
        caption = controls === "pointer" ? CAPTIONS.playTouch : who === "you" ? CAPTIONS.playYou : CAPTIONS.playAuto;
        break;
      case "lost":
        caption = CAPTIONS.lost;
        break;
      case "cleared":
        caption = CAPTIONS.cleared;
        break;
      case "over":
        caption = s.ending === "timeout" ? CAPTIONS.overTimeout : s.ending === "crushed" ? CAPTIONS.overCrushed : CAPTIONS.overLives;
        break;
    }
    const next: HudState = {
      levelName: level.name,
      author: level.author,
      lives: s.lives,
      maxLives: level.lives,
      score: s.score,
      speed: Math.round(s.speed.total * 10) / 10,
      bonus: s.speed.bonusKind,
      mod: s.paddleMod?.kind ?? null,
      heat: Math.round(s.speed.heat),
      balls: s.balls.length,
      timeLeft: s.timeLeft === null ? null : Math.ceil(s.timeLeft),
      phase: s.phase,
      pilot: who,
      caption,
    };
    for (const key of Object.keys(next) as (keyof HudState)[]) {
      if (next[key] !== hud[key]) {
        hud = next;
        emitHud();
        return;
      }
    }
  };

  const applyLevel = (next: Level, { bumpSeed = true } = {}) => {
    level = next;
    if (bumpSeed) seed += 1;
    game = new Game(level, { seed, autoLaunch: wantsAutoLaunch() });
    pilot = new Autopilot(level, { seed: seed * 7 });
    renderer = new BreakoutRenderer(canvas, level, palette, () => draw(), editMode);
    if (cssWidth > 0) renderer.view(viewport());
    scene.trail.length = 0;
    scene.particles.length = 0;
    scene.rings.length = 0;
    endHold = 0;
    accumulator = 0;
    humanTouched = false;
    sfx?.setLevel(level);
    syncHud();
    if (!destroyed) draw();
  };

  const loadLevel = (index: number) => {
    levelIndex = ((index % rotation.length) + rotation.length) % rotation.length;
    applyLevel(rotation[levelIndex]);
  };

  const restart = () => {
    seed += 1;
    game.reset(seed);
    pilot = new Autopilot(level, { seed: seed * 7 });
    scene.trail.length = 0;
    endHold = 0;
    humanTouched = false;
  };

  const tick = (dt: number) => {
    accumulator += dt;
    const maxSteps = RULES.stepsPerSecond * 0.1;
    let steps = 0;
    // `paused` is checked per step: an event callback may pause mid-tick and
    // expects the world frozen right there, not a few steps later.
    while (!paused && accumulator >= game.dt && steps < maxSteps) {
      applyEvents(game.step(input()));
      accumulator -= game.dt;
      steps += 1;
    }
    if (steps === maxSteps) accumulator = 0;

    fx.update(dt, game.state.phase === "play" ? game.state.balls.filter((b) => b.stuck === null) : []);
    sfx?.update(game.state);

    if (game.finished) {
      endHold += dt;
      if (loop && endHold > 0.6) loadLevel(levelIndex + 1);
    }
    syncHud();
  };

  // --- thumb rail mirror ------------------------------------------------------
  // Field x → 0..1 across the rail (the field sits in the central 1/railGain).
  const toRailU = (x: number) => {
    const { left, right } = level.field;
    const u = (x - left) / (right - left);
    return (u - 0.5) / railGain + 0.5;
  };
  const railVars = { paddle: "", paddleW: "", ball: "", hasBall: "" };
  const setRailVar = (key: keyof typeof railVars, prop: string, value: string) => {
    if (railVars[key] === value) return;
    railVars[key] = value;
    rail!.style.setProperty(prop, value);
  };
  const syncRail = () => {
    if (!rail) return;
    const s = game.state;
    const fieldW = level.field.right - level.field.left;
    setRailVar("paddle", "--rail-paddle", toRailU(s.paddleX).toFixed(4));
    setRailVar("paddleW", "--rail-paddle-w", (s.paddleWidth / fieldW / railGain).toFixed(4));
    // The ball shadow tracks the ball closest to the paddle.
    let shadow: { x: number; y: number } | null = null;
    if (s.phase === "play") {
      for (const b of s.balls) {
        if (b.stuck === null && (shadow === null || b.y > shadow.y)) shadow = b;
      }
    }
    const hasBall = shadow ? "true" : "false";
    if (railVars.hasBall !== hasBall) {
      railVars.hasBall = hasBall;
      rail.dataset.ball = hasBall;
    }
    if (shadow) setRailVar("ball", "--rail-ball", Math.max(0, Math.min(1, toRailU(shadow.x))).toFixed(4));
  };

  const draw = () => {
    renderer.render(game, scene);
    syncRail();
  };

  const live = () => {
    if (destroyed || !visible || hidden || paused) return false;
    if (editMode) return simulating;
    return !frozen;
  };

  const frame = (now: number) => {
    raf = 0;
    if (!live()) return;
    const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(dt);
    draw();
    raf = requestAnimationFrame(frame);
  };

  const schedule = () => {
    sfx?.setActive(live());
    haptics?.setActive(live());
    if (!raf && live()) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  const freeze = () => {
    // Static showcase frame: a few bricks gone, ball mid-flight.
    frozen = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    sfx?.setActive(false);
    haptics?.setActive(false);
    const demo = new Autopilot(level, { seed: 99, skill: 1 });
    game.reset(seed);
    for (let i = 0; i < RULES.stepsPerSecond * 9; i++) {
      game.step(demo.input(game.state, game.bricks));
    }
    scene.trail.length = 0;
    hud = { ...hud, caption: CAPTIONS.frozen, lives: game.state.lives, score: game.state.score };
    emitHud();
    draw();
  };

  const onReducedMotion = () => {
    if (editMode || forceFrozen) return;
    if (reducedMotion.matches) freeze();
    else {
      frozen = false;
      restart();
      schedule();
    }
  };

  // --- pointer controls -----------------------------------------------------
  const toWorldX = (clientX: number) => {
    const rect = canvas.getBoundingClientRect();
    return renderer.worldX(clientX - rect.left);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (controls === "auto" || paused || rail) return;
    humanTouched = true;
    pointerX = toWorldX(e.clientX);
    lastPointerT = scene.time;
  };
  const onPointerDown = (e: PointerEvent) => {
    if (controls === "auto" || paused || !e.isPrimary) return;
    sfx?.unlock();
    humanTouched = true;
    lastPointerT = scene.time;
    pointerLaunch = true;
    // With a thumb rail, the board is a launch surface only — steering stays
    // on the rail so a finger never covers the field.
    if (rail) {
      if (pointerX === null) pointerX = game.state.paddleX;
      return;
    }
    pointerX = toWorldX(e.clientX);
  };
  const onPointerLeave = () => {
    if (controls === "hybrid") lastPointerT = -Infinity;
  };
  const stage = canvas.parentElement;
  const onStageDown = (e: PointerEvent) => {
    if (controls === "auto" || paused || !e.isPrimary) return;
    if (rail && (e.target === rail || rail.contains(e.target as Node))) return;
    sfx?.unlock();
    humanTouched = true;
    lastPointerT = scene.time;
    pointerLaunch = true;
    if (pointerX === null) pointerX = game.state.paddleX;
  };
  if (!editMode) {
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);
    // Capture on the stage so overlays (the fit slot, HUD, caption) cannot
    // swallow a serve tap. The rail still owns its own tap-vs-drag.
    if (rail && stage) stage.addEventListener("pointerdown", onStageDown, true);
  }
  canvas.style.touchAction = editMode || controls === "pointer" ? "none" : "pan-y";

  // --- thumb rail controls ----------------------------------------------------
  // Absolute mapping: the thumb's place on the rail is where the paddle goes
  // (the engine glides it there at paddle speed, so a far touch never snaps).
  // A quick tap without travel launches; a drag never does.
  const railToWorldX = (clientX: number) => {
    const rect = rail!.getBoundingClientRect();
    const railU = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
    const fieldU = Math.max(0, Math.min(1, (railU - 0.5) * railGain + 0.5));
    return level.field.left + fieldU * (level.field.right - level.field.left);
  };
  let railTap: { id: number; x: number; t: number } | null = null;
  const RAIL_TAP_SLOP = 10;
  const RAIL_TAP_MS = 350;
  const onRailDown = (e: PointerEvent) => {
    if (controls === "auto" || paused || !e.isPrimary) return;
    e.preventDefault();
    sfx?.unlock();
    humanTouched = true;
    pointerX = railToWorldX(e.clientX);
    lastPointerT = scene.time;
    railTap = { id: e.pointerId, x: e.clientX, t: e.timeStamp };
    try {
      rail!.setPointerCapture(e.pointerId);
    } catch {
      // Capture is best-effort (e.g. synthetic events).
    }
    rail!.dataset.touched = "true";
    rail!.dataset.active = "true";
  };
  const onRailMove = (e: PointerEvent) => {
    if (controls === "auto" || paused || !e.isPrimary) return;
    // Only steer while a finger is down or a mouse hovers the rail; a finger
    // resting on the rail while paused must not move the paddle on resume.
    if (railTap === null && e.pointerType !== "mouse") return;
    pointerX = railToWorldX(e.clientX);
    lastPointerT = scene.time;
    if (railTap && Math.abs(e.clientX - railTap.x) > RAIL_TAP_SLOP) railTap = { ...railTap, x: Number.NaN };
  };
  const onRailUp = (e: PointerEvent) => {
    if (railTap === null || railTap.id !== e.pointerId) return;
    const isTap = !Number.isNaN(railTap.x) && e.timeStamp - railTap.t < RAIL_TAP_MS;
    railTap = null;
    rail!.dataset.active = "false";
    if (controls === "auto" || paused) return;
    if (isTap) {
      pointerLaunch = true;
      lastPointerT = scene.time;
    }
  };
  const onRailCancel = (e: PointerEvent) => {
    if (railTap?.id === e.pointerId) railTap = null;
    rail!.dataset.active = "false";
  };
  if (rail) {
    rail.style.touchAction = "none";
    rail.dataset.touched = "false";
    rail.dataset.active = "false";
    rail.dataset.ball = "false";
    rail.addEventListener("pointerdown", onRailDown);
    rail.addEventListener("pointermove", onRailMove);
    rail.addEventListener("pointerup", onRailUp);
    rail.addEventListener("pointercancel", onRailCancel);
    rail.addEventListener("lostpointercapture", onRailCancel);
  }

  // --- browser plumbing -------------------------------------------------------
  const viewport = () => {
    if (!fit) return { width: cssWidth, height: cssHeight, dpr };
    const c = canvas.getBoundingClientRect();
    const f = fit.getBoundingClientRect();
    return {
      width: cssWidth,
      height: cssHeight,
      dpr,
      fit: { x: f.left - c.left, y: f.top - c.top, width: f.width, height: f.height },
    };
  };
  const applySize = () => {
    cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || level.width;
    cssHeight = fit
      ? canvas.clientHeight || canvas.parentElement?.clientHeight || level.height
      : (cssWidth * level.height) / level.width;
    dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    try {
      renderer.view(viewport());
      if (!destroyed) draw();
    } catch (error) {
      console.error("[breeq] breakout preview failed to size.", error);
    }
  };
  // Re-rasterizing the photo is the most expensive thing this mount does, so a
  // box that is still animating (a sheet growing, a rotating phone) is left
  // stretched by CSS until it settles; only the first size is applied at once.
  let resizeTimer = 0;
  let sized = false;
  const RESIZE_SETTLE = 90;
  const resize = () => {
    if (!sized) {
      applySize();
      sized = canvas.clientWidth > 0;
      return;
    }
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!destroyed) applySize();
    }, RESIZE_SETTLE);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas.parentElement ?? canvas);
  if (fit) resizeObserver.observe(fit);
  resize();

  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      schedule();
    },
    { rootMargin: "80px" },
  );
  intersection.observe(canvas);

  const onVisibility = () => {
    hidden = document.visibilityState === "hidden";
    schedule();
  };
  document.addEventListener("visibilitychange", onVisibility);
  reducedMotion.addEventListener("change", onReducedMotion);

  if (editMode || forceFrozen) {
    draw();
  } else if (frozen) {
    freeze();
  } else {
    schedule();
  }

  return {
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      sfx?.destroy();
      haptics?.destroy();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onReducedMotion);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (rail && stage) stage.removeEventListener("pointerdown", onStageDown, true);
      if (rail) {
        rail.removeEventListener("pointerdown", onRailDown);
        rail.removeEventListener("pointermove", onRailMove);
        rail.removeEventListener("pointerup", onRailUp);
        rail.removeEventListener("pointercancel", onRailCancel);
        rail.removeEventListener("lostpointercapture", onRailCancel);
      }
    },
    setBackground(src) {
      renderer.setBackground(src);
    },
    setLevel(next) {
      rotation[levelIndex] = next;
      applyLevel(next, { bumpSeed: false });
    },
    restart,
    next() {
      loadLevel(levelIndex + 1);
    },
    pause() {
      paused = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      sfx?.setActive(false);
      haptics?.setActive(false);
    },
    resume() {
      if (!paused) return;
      paused = false;
      schedule();
    },
    setSimulating(on) {
      if (!editMode || simulating === on) return;
      simulating = on;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      if (on) frozen = false;
      applyLevel(level, { bumpSeed: false });
      if (on) {
        schedule();
        return;
      }
      sfx?.setActive(false);
      haptics?.setActive(false);
    },
    project(x, y, w, h) {
      return renderer.cssRect(x, y, w, h);
    },
    state() {
      return game.state;
    },
  };
}

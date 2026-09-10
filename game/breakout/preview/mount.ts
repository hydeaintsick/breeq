/**
 * Mount one or more breakout levels on a canvas.
 *
 * Runs the deterministic game at a fixed step, the autopilot plays, and the
 * visitor can take the paddle at any time by moving a pointer or a finger
 * over the board (the autopilot resumes after a few idle seconds). When a
 * game ends the next level in the rotation loads. Owns the browser side:
 * DPR, resize, off-screen / hidden-tab pause, reduced motion.
 */
import { Autopilot } from "../engine/autopilot";
import { Game, RULES } from "../engine/game";
import type { GameEvent, GameInput, GamePhase, Level, PaddleModKind, SpeedZoneKind } from "../engine/types";
import { readNeonPalette } from "../render/palette";
import { BreakoutRenderer } from "../render/renderer";
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
  onCleared?: (info: { human: boolean; score: number }) => void;
  seed?: number;
  /** "auto": demo only. "pointer": human only. "hybrid": demo until the visitor moves. */
  controls?: "auto" | "pointer" | "hybrid";
  /** Seconds of pointer inactivity before the autopilot takes back the paddle. */
  handoverDelay?: number;
  maxDpr?: number;
  /** Index of the level to start with (wraps). */
  start?: number;
  /** "edit": paint the serve frame only. No simulation, no paddle input. */
  mode?: "play" | "edit";
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
}

const CAPTIONS = {
  serveAuto: "Autoplay. Move over the board to take the paddle.",
  serveYou: "Tap or click to launch.",
  playAuto: "Autoplay. Move over the board to take the paddle.",
  playYou: "You have the paddle.",
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
  let seed = options.seed ?? 1;
  let levelIndex = (((options.start ?? 0) % rotation.length) + rotation.length) % rotation.length;

  const palette = readNeonPalette();
  const scene = createScene();
  const fx = new SceneFx(scene);

  let destroyed = false;
  let raf = 0;
  let last = 0;
  let accumulator = 0;
  let endHold = 0;
  let cssWidth = 0;
  let dpr = 1;

  // Human input.
  let pointerX: number | null = null;
  let pointerLaunch = false;
  let lastPointerT = -Infinity;
  let humanTouched = false;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frozen = reducedMotion.matches;
  let visible = true;
  let hidden = document.visibilityState === "hidden";

  // Current level.
  let level = rotation[levelIndex];
  let game = new Game(level, { seed, autoLaunch: controls !== "pointer" });
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
    caption: frozen ? CAPTIONS.frozen : CAPTIONS.serveAuto,
  };
  const emitHud = () => options.onHud?.(hud);
  emitHud();

  const humanActive = () => controls === "pointer" || (controls === "hybrid" && scene.time - lastPointerT < handoverDelay);

  const input = (): GameInput => {
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
      if (e.type === "cleared") {
        options.onCleared?.({ human: humanTouched, score: e.score });
      }
    }
  };

  const syncHud = () => {
    const s = game.state;
    const who: HudState["pilot"] = humanActive() && pointerX !== null ? "you" : "auto";
    let caption: string;
    switch (s.phase) {
      case "serve":
        caption = who === "you" ? CAPTIONS.serveYou : CAPTIONS.serveAuto;
        break;
      case "play":
        caption = who === "you" ? CAPTIONS.playYou : CAPTIONS.playAuto;
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
    game = new Game(level, { seed, autoLaunch: !editMode && controls !== "pointer" });
    pilot = new Autopilot(level, { seed: seed * 7 });
    renderer = new BreakoutRenderer(canvas, level, palette, () => draw(), editMode);
    if (cssWidth > 0) renderer.resize(cssWidth, dpr);
    scene.trail.length = 0;
    scene.particles.length = 0;
    scene.rings.length = 0;
    endHold = 0;
    accumulator = 0;
    humanTouched = false;
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
    while (accumulator >= game.dt && steps < maxSteps) {
      applyEvents(game.step(input()));
      accumulator -= game.dt;
      steps += 1;
    }
    if (steps === maxSteps) accumulator = 0;

    fx.update(dt, game.state.phase === "play" ? game.state.balls.filter((b) => b.stuck === null) : []);

    if (game.finished) {
      endHold += dt;
      if (endHold > 0.6) loadLevel(levelIndex + 1);
    }
    syncHud();
  };

  const draw = () => renderer.render(game, scene);

  const frame = (now: number) => {
    raf = 0;
    if (destroyed || frozen || !visible || hidden) return;
    const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(dt);
    draw();
    raf = requestAnimationFrame(frame);
  };

  const schedule = () => {
    if (!raf && !destroyed && !frozen && visible && !hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  const freeze = () => {
    // Static showcase frame: a few bricks gone, ball mid-flight.
    frozen = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
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
    return ((clientX - rect.left) / rect.width) * level.width;
  };
  const onPointerMove = (e: PointerEvent) => {
    if (controls === "auto") return;
    humanTouched = true;
    pointerX = toWorldX(e.clientX);
    lastPointerT = scene.time;
  };
  const onPointerDown = (e: PointerEvent) => {
    if (controls === "auto") return;
    humanTouched = true;
    pointerX = toWorldX(e.clientX);
    lastPointerT = scene.time;
    pointerLaunch = true;
  };
  const onPointerLeave = () => {
    if (controls === "hybrid") lastPointerT = -Infinity;
  };
  if (!editMode) {
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);
  }
  canvas.style.touchAction = editMode ? "none" : "pan-y";

  // --- browser plumbing -------------------------------------------------------
  const resize = () => {
    cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || level.width;
    dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    try {
      renderer.resize(cssWidth, dpr);
      if (!destroyed) draw();
    } catch (error) {
      console.error("[breeq] breakout preview failed to size.", error);
    }
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas.parentElement ?? canvas);
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

  if (editMode) {
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
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onReducedMotion);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
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
  };
}

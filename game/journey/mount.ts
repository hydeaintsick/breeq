/**
 * Mount the Story Journey on a canvas.
 *
 * Owns the browser side: DPR cap, resize, off-screen / hidden-tab pause,
 * reduced motion, and the camera. The camera is a fractional node index moved
 * by a drag (the map follows the finger), a flick (it glides on and settles on
 * a zone), a wheel or trackpad, or `goTo`. Taps on a zone are reported, not
 * acted on: the surface decides whether to open it or to travel there first.
 * DOM labels ride along via `onFrame`, which gives every node's screen place
 * once per frame without a React render.
 */
import { JourneySfx } from "./audio";
import { frontierIndex, layoutJourney, type JourneyNodeInput } from "./model";
import { JourneyRenderer, REVEAL_SECONDS, type CssRect } from "./render";

export interface JourneyPlacement {
  index: number;
  /** Node centre in CSS px relative to the stage. */
  x: number;
  y: number;
  /** Signed distance from the camera, in nodes. 0 is centred. */
  d: number;
  /** Whether the node is anywhere near the screen. */
  visible: boolean;
}

export interface JourneyMountOptions {
  /** Node to open on; defaults to the frontier. */
  start?: number;
  maxDpr?: number;
  /** Play the Journey's sound layer (needs a gesture to start; follows the sound preference). */
  sound?: boolean;
  /** Every drawn frame: the camera and where each node sits. */
  onFrame?: (cam: number, placements: readonly JourneyPlacement[]) => void;
  /** The camera came to rest on a node. */
  onSettle?: (index: number) => void;
  /** A tap on a node's medallion or on an element carrying `data-journey-node="<index>"`. */
  onTap?: (index: number) => void;
  /** A zone's shroud started lifting (its state left `locked` between two `setNodes`). */
  onReveal?: (index: number) => void;
}

export interface JourneyHandle {
  destroy(): void;
  /** New states after a clear: shrouds lift, arcs fill, Kal moves on. */
  setNodes(nodes: readonly JourneyNodeInput[]): void;
  /** Travel to a node; `instant` skips the glide. */
  goTo(index: number, options?: { instant?: boolean }): void;
  /** The node the camera rests on or is heading to. */
  current(): number;
  /** Where the camera is right now, fractional. */
  camera(): number;
  pause(): void;
  resume(): void;
  /** A node's box in CSS px relative to the stage. */
  nodeRect(index: number): CssRect;
  /** Start audio from a gesture the mount did not see (a toggle, a key). */
  unlockSound(): void;
  /** Cue the open chime (the surface opens the sheet). */
  playOpen(): void;
  /** Cue the locked knock. */
  playLocked(): void;
}

/** Past this travel a press is a drag, not a tap. */
const DRAG_START = 6;
/** Spring toward the target: stiffness and critical damping. */
const STIFFNESS = 120;
const DAMPING = 2 * Math.sqrt(STIFFNESS);
/** How far a flick carries, nodes per (node/s) of release speed. */
const FLING = 0.22;
const MAX_FLING = 3;
/** Wheel idle before the map settles, ms. */
const WHEEL_SETTLE = 140;

export function mountJourney(
  canvas: HTMLCanvasElement,
  inputs: readonly JourneyNodeInput[],
  options: JourneyMountOptions = {},
): JourneyHandle {
  const stage = canvas.parentElement ?? canvas;
  const maxDpr = options.maxDpr ?? 2;
  let nodes = [...inputs];
  let destroyed = false;
  let raf = 0;
  let last = 0;
  let time = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let paused = false;
  let visible = true;
  let hidden = document.visibilityState === "hidden";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Camera.
  let target = clampIndex(options.start ?? frontierIndex(nodes));
  let cam = target;
  let vel = 0;
  let settled = -1;

  // Shrouds: 0 = fully shrouded, 1 = open.
  const reveal: number[] = nodes.map((n) => (n.state === "locked" ? 0 : 1));
  const revealing = new Set<number>();

  let layout = layoutJourney(nodes, { width: 1, height: 1 });
  const renderer = new JourneyRenderer(canvas, layout, () => schedule());
  const sfx = options.sound ? new JourneySfx() : null;

  function clampIndex(i: number) {
    return Math.max(0, Math.min(nodes.length - 1, Math.round(i)));
  }

  const live = () => !destroyed && visible && !hidden && !paused;

  const placements: JourneyPlacement[] = [];
  const emitFrame = () => {
    if (!options.onFrame) return;
    placements.length = 0;
    const reach = width / 2 + layout.spacing * 1.2;
    for (let i = 0; i < nodes.length; i++) {
      const c = renderer.nodeCenter(i, cam);
      placements.push({ index: i, x: c.x, y: c.y, d: i - cam, visible: Math.abs(c.x - width / 2) < reach });
    }
    options.onFrame(cam, placements);
  };

  const draw = () => {
    renderer.render(cam, time, reveal);
    emitFrame();
  };

  // ---------------------------------------------------------------------------
  // Loop
  // ---------------------------------------------------------------------------

  let drag: {
    id: number;
    startX: number;
    startY: number;
    startCam: number;
    lastX: number;
    lastT: number;
    speed: number;
    moved: boolean;
    target: EventTarget | null;
  } | null = null;

  const step = (dt: number) => {
    let moving = false;
    if (!drag) {
      if (reducedMotion.matches) {
        if (cam !== target) {
          cam = target;
          vel = 0;
        }
      } else {
        const dx = target - cam;
        if (Math.abs(dx) > 0.0005 || Math.abs(vel) > 0.005) {
          const a = STIFFNESS * dx - DAMPING * vel;
          vel += a * dt;
          cam += vel * dt;
          moving = true;
        } else if (cam !== target) {
          cam = target;
          vel = 0;
        }
      }
      if (!moving && settled !== target) {
        settled = target;
        options.onSettle?.(target);
        sfx?.settle(target, nodes[target]?.state === "locked");
      }
    }
    sfx?.setSpeed(drag ? drag.speed : vel);

    for (const i of revealing) {
      reveal[i] = Math.min(1, reveal[i] + dt / REVEAL_SECONDS);
      if (reveal[i] >= 1) revealing.delete(i);
      moving = true;
    }
    if (!reducedMotion.matches) time += dt;
    return moving || Boolean(drag);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!live()) return;
    const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    const moving = step(dt);
    sfx?.update();
    draw();
    // Under reduced motion the map is still: the loop stops once nothing moves.
    if (!reducedMotion.matches || moving) raf = requestAnimationFrame(frame);
  };

  const schedule = () => {
    sfx?.setActive(live());
    if (!raf && live()) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  // ---------------------------------------------------------------------------
  // Pointer: drag the map, flick it, tap a node
  // ---------------------------------------------------------------------------

  const nodeFromTarget = (t: EventTarget | null): number => {
    if (!(t instanceof Element)) return -1;
    const el = t.closest<HTMLElement>("[data-journey-node]");
    if (!el) return -1;
    const i = Number(el.dataset.journeyNode);
    return Number.isInteger(i) ? i : -1;
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary || e.button !== 0 || drag) return;
    sfx?.unlock();
    drag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startCam: cam,
      lastX: e.clientX,
      lastT: e.timeStamp,
      speed: 0,
      moved: false,
      target: e.target,
    };
    vel = 0;
    schedule();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved) {
      // Any direction of travel commits the drag: a thumb rarely moves level.
      if (Math.hypot(dx, e.clientY - drag.startY) < DRAG_START) return;
      drag.moved = true;
      // A touch already holds the pointer (implicitly, on the element under the
      // finger) and its events bubble here; only a mouse leaving the stage
      // needs capturing.
      if (e.pointerType !== "touch") {
        try {
          stage.setPointerCapture(e.pointerId);
        } catch {
          // Best effort.
        }
      }
    }
    const dt = Math.max(1, e.timeStamp - drag.lastT);
    const instant = -((e.clientX - drag.lastX) / layout.spacing) / (dt / 1000);
    drag.speed = drag.speed * 0.6 + instant * 0.4;
    drag.lastX = e.clientX;
    drag.lastT = e.timeStamp;
    cam = rubber(drag.startCam - dx / layout.spacing, nodes.length - 1);
    schedule();
  };

  const endDrag = (e: PointerEvent) => {
    if (!drag || drag.id !== e.pointerId) return;
    const d = drag;
    drag = null;
    if (stage.hasPointerCapture?.(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    if (!d.moved) {
      // A tap: on a medallion, or on a label that names its node.
      let hit = nodeFromTarget(d.target);
      if (hit < 0) {
        const rect = canvas.getBoundingClientRect();
        hit = renderer.hitNode(e.clientX - rect.left, e.clientY - rect.top, cam);
      }
      if (hit >= 0) options.onTap?.(hit);
      return;
    }
    // Flick: carry on in the direction of travel, then settle on a node.
    const carry = Math.max(-MAX_FLING, Math.min(MAX_FLING, d.speed * FLING));
    target = clampIndex(cam + carry);
    vel = d.speed;
    settled = -1;
    sfx?.fling();
    schedule();
  };

  const onPointerCancel = (e: PointerEvent) => {
    if (!drag || drag.id !== e.pointerId) return;
    drag = null;
    target = clampIndex(cam);
    settled = -1;
    schedule();
  };

  // A touch gives the element under the finger (the canvas, a label) implicit
  // capture; moving it to the stage makes that child fire `lostpointercapture`,
  // which bubbles here. Only the stage itself losing the pointer is a cancel.
  const onLostCapture = (e: PointerEvent) => {
    if (e.target !== stage) return;
    onPointerCancel(e);
  };

  // Pointer taps are handled above; only keyboard "clicks" (detail 0) reach the labels.
  const onClickCapture = (e: MouseEvent) => {
    if (e.detail !== 0) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  let wheelTimer = 0;
  const onWheel = (e: WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta === 0) return;
    e.preventDefault();
    sfx?.unlock();
    cam = rubber(cam + delta / layout.spacing, nodes.length - 1);
    vel = 0;
    target = clampIndex(cam);
    settled = -1;
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => {
      target = clampIndex(cam);
      schedule();
    }, WHEEL_SETTLE);
    schedule();
  };

  // The page under the map never scrolls: every touch is the map's, so a thumb
  // can pull the route without the browser claiming a near-vertical swipe.
  stage.style.touchAction = "none";
  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", onPointerCancel);
  stage.addEventListener("lostpointercapture", onLostCapture);
  stage.addEventListener("click", onClickCapture, true);
  stage.addEventListener("wheel", onWheel, { passive: false });

  // ---------------------------------------------------------------------------
  // Browser plumbing
  // ---------------------------------------------------------------------------

  const applySize = () => {
    width = stage.clientWidth || canvas.clientWidth;
    height = stage.clientHeight || canvas.clientHeight;
    if (width === 0 || height === 0) return;
    dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    layout = layoutJourney(nodes, { width, height });
    renderer.setLayout(layout);
    renderer.view({ width, height, dpr });
    if (!destroyed) draw();
  };
  let resizeTimer = 0;
  let sized = false;
  const resize = () => {
    if (!sized) {
      applySize();
      sized = width > 0;
      return;
    }
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!destroyed) applySize();
    }, 80);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();

  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      schedule();
    },
    { rootMargin: "40px" },
  );
  intersection.observe(canvas);

  const onVisibility = () => {
    hidden = document.visibilityState === "hidden";
    schedule();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const onMotion = () => schedule();
  reducedMotion.addEventListener("change", onMotion);

  schedule();

  return {
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(wheelTimer);
      sfx?.destroy();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onMotion);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", endDrag);
      stage.removeEventListener("pointercancel", onPointerCancel);
      stage.removeEventListener("lostpointercapture", onLostCapture);
      stage.removeEventListener("click", onClickCapture, true);
      stage.removeEventListener("wheel", onWheel);
    },
    setNodes(next) {
      const before = nodes;
      nodes = [...next];
      for (let i = 0; i < nodes.length; i++) {
        const was = before[i]?.state ?? "locked";
        const now = nodes[i].state;
        if (reveal[i] === undefined) reveal[i] = now === "locked" ? 0 : 1;
        if (was === "locked" && now !== "locked" && reveal[i] < 1) {
          revealing.add(i);
          options.onReveal?.(i);
          sfx?.reveal();
        } else if (now === "locked") {
          reveal[i] = 0;
          revealing.delete(i);
        }
      }
      reveal.length = nodes.length;
      target = clampIndex(target);
      if (width > 0) {
        layout = layoutJourney(nodes, { width, height });
        renderer.setLayout(layout);
      }
      if (width > 0 && !destroyed) draw();
      schedule();
    },
    goTo(index, opts) {
      target = clampIndex(index);
      settled = -1;
      if (opts?.instant || reducedMotion.matches) {
        cam = target;
        vel = 0;
      }
      schedule();
    },
    current: () => target,
    camera: () => cam,
    pause() {
      paused = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      sfx?.setActive(false);
    },
    resume() {
      if (!paused) return;
      paused = false;
      schedule();
    },
    nodeRect: (index) => renderer.nodeRect(clampIndex(index), cam),
    unlockSound() {
      sfx?.unlock();
      sfx?.setActive(live());
    },
    playOpen: () => sfx?.open(),
    playLocked: () => sfx?.locked(),
  };
}

/** The map has a little give past both ends, then holds. */
function rubber(pos: number, last: number): number {
  if (pos < 0) return pos * 0.3;
  if (pos > last) return last + (pos - last) * 0.3;
  return pos;
}

/**
 * Deterministic drop simulation.
 *
 * Fixed time step, seeded randomness, plain arithmetic only. Given the same
 * board and seed, every device produces the same `Replay`, which is what lets
 * a defender's proof-of-completion and an attacker's run be compared.
 */
import { DIVIDER_CAP_RADIUS, indexPieces } from "./board";
import { circleIntersectsRect, fanStream, nailHitbox, pointInRect, trampolineSpan } from "./geometry";
import { createRng } from "./random";
import type { Board, Outcome, Replay, SimEvent } from "./types";

export interface PhysicsConfig {
  stepsPerSecond: number;
  sampleFps: number;
  gravity: number;
  pegRestitution: number;
  wallRestitution: number;
  dividerRestitution: number;
  /** Fraction of velocity lost per second to air. */
  drag: number;
  /** Tangential speed randomly added on a peg hit, to break symmetry. */
  pegJitter: number;
  spawnJitterX: number;
  spawnJitterVx: number;
  /** Upward speed a trampoline adds on top of the kept fall speed. */
  trampolineBase: number;
  /** Fraction of the incoming speed the trampoline gives back. */
  trampolineKeep: number;
  trampolineMaxUp: number;
  /** Seconds without downward progress before the ball is nudged. */
  stuckWindow: number;
  maxNudges: number;
  maxTime: number;
  /** Minimum impact speed that emits a hit event. */
  minEventSpeed: number;
}

export const PHYSICS: PhysicsConfig = {
  stepsPerSecond: 240,
  sampleFps: 120,
  gravity: 1500,
  pegRestitution: 0.5,
  wallRestitution: 0.42,
  dividerRestitution: 0.4,
  drag: 0.12,
  pegJitter: 26,
  spawnJitterX: 10,
  spawnJitterVx: 24,
  trampolineBase: 380,
  trampolineKeep: 0.85,
  trampolineMaxUp: 720,
  stuckWindow: 1,
  maxNudges: 3,
  maxTime: 9,
  minEventSpeed: 20,
};

export function simulateDrop(board: Board, seed: number, overrides: Partial<PhysicsConfig> = {}): Replay {
  const cfg: PhysicsConfig = { ...PHYSICS, ...overrides };
  const rng = createRng(seed);
  const index = indexPieces(board);
  const dt = 1 / cfg.stepsPerSecond;
  const sampleEvery = Math.max(1, Math.round(cfg.stepsPerSecond / cfg.sampleFps));
  const r = board.ballRadius;
  const { left, right, top } = board.rails;
  const centerX = (left + right) / 2;

  const nailBoxes = index.nails.map(nailHitbox);
  const fanStreams = index.fans.map(fanStream);
  const fanInside = index.fans.map(() => false);
  const portalInside = index.portals.map(() => false);
  const dividerCapY = index.dividers.map((d) => board.floorY - d.height);

  let x = board.spawn.x + rng.range(-cfg.spawnJitterX, cfg.spawnJitterX);
  let y = board.spawn.y;
  let vx = rng.range(-cfg.spawnJitterVx, cfg.spawnJitterVx);
  let vy = 0;
  let t = 0;
  let step = 0;

  const xs: number[] = [x];
  const ys: number[] = [y];
  const events: SimEvent[] = [];
  let outcome: Outcome | null = null;

  let deepestY = y;
  let deepestT = 0;
  let nudges = 0;

  const emit = (event: SimEvent) => {
    events.push(event);
  };

  while (outcome === null) {
    // --- forces -----------------------------------------------------------
    let ax = 0;
    for (let i = 0; i < index.fans.length; i++) {
      const inside = pointInRect(x, y, fanStreams[i]);
      if (inside) {
        ax += index.fans[i].dir === "left" ? -index.fans[i].force : index.fans[i].force;
      }
      if (inside !== fanInside[i]) {
        fanInside[i] = inside;
        emit({ t, type: "fan", index: i, phase: inside ? "enter" : "exit" });
      }
    }

    vx += ax * dt;
    vy += cfg.gravity * dt;
    const damping = 1 - cfg.drag * dt;
    vx *= damping;
    vy *= damping;

    const prevY = y;
    x += vx * dt;
    y += vy * dt;

    // --- rails and ceiling ------------------------------------------------
    if (x - r < left) {
      x = left + r;
      if (vx < 0) {
        const speed = -vx;
        vx = -vx * cfg.wallRestitution;
        if (speed > cfg.minEventSpeed) emit({ t, type: "wall", side: "left", speed });
      }
    } else if (x + r > right) {
      x = right - r;
      if (vx > 0) {
        const speed = vx;
        vx = -vx * cfg.wallRestitution;
        if (speed > cfg.minEventSpeed) emit({ t, type: "wall", side: "right", speed });
      }
    }
    if (y - r < top) {
      y = top + r;
      if (vy < 0) {
        const speed = -vy;
        vy = -vy * cfg.wallRestitution;
        if (speed > cfg.minEventSpeed) emit({ t, type: "wall", side: "top", speed });
      }
    }

    // --- pegs -------------------------------------------------------------
    for (let i = 0; i < index.pegs.length; i++) {
      const peg = index.pegs[i];
      const dx = x - peg.x;
      const dy = y - peg.y;
      const rr = r + peg.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) continue;

      const d = Math.sqrt(d2) || 1e-6;
      const nx = dx / d;
      const ny = dy / d;
      x = peg.x + nx * rr;
      y = peg.y + ny * rr;

      const vn = vx * nx + vy * ny;
      if (vn < 0) {
        const speed = -vn;
        vx -= (1 + cfg.pegRestitution) * vn * nx;
        vy -= (1 + cfg.pegRestitution) * vn * ny;
        const jitter = rng.range(-cfg.pegJitter, cfg.pegJitter);
        vx += -ny * jitter;
        vy += nx * jitter;
        if (speed > cfg.minEventSpeed) emit({ t, type: "peg", index: i, speed });
      }
    }

    // --- dividers (cap + shaft) ------------------------------------------
    for (let i = 0; i < index.dividers.length; i++) {
      const divider = index.dividers[i];
      const capY = dividerCapY[i];
      const rr = r + DIVIDER_CAP_RADIUS;

      if (y < capY) {
        const dx = x - divider.x;
        const dy = y - capY;
        const d2 = dx * dx + dy * dy;
        if (d2 < rr * rr) {
          const d = Math.sqrt(d2) || 1e-6;
          const nx = dx / d;
          const ny = dy / d;
          x = divider.x + nx * rr;
          y = capY + ny * rr;
          const vn = vx * nx + vy * ny;
          if (vn < 0) {
            const speed = -vn;
            vx -= (1 + cfg.dividerRestitution) * vn * nx;
            vy -= (1 + cfg.dividerRestitution) * vn * ny;
            if (speed > cfg.minEventSpeed) emit({ t, type: "divider", index: i, speed });
          }
        }
      } else if (Math.abs(x - divider.x) < rr) {
        const side = x < divider.x ? -1 : 1;
        x = divider.x + side * rr;
        if (vx * side < 0) {
          const speed = Math.abs(vx);
          vx = -vx * cfg.dividerRestitution;
          if (speed > cfg.minEventSpeed) emit({ t, type: "divider", index: i, speed });
        }
      }
    }

    // --- trampolines ------------------------------------------------------
    for (let i = 0; i < index.trampolines.length; i++) {
      const tramp = index.trampolines[i];
      const span = trampolineSpan(tramp);
      if (vy > 0 && prevY + r <= tramp.y && y + r >= tramp.y && x >= span.x0 && x <= span.x1) {
        const speed = vy;
        y = tramp.y - r;
        const up = Math.min(speed * cfg.trampolineKeep + cfg.trampolineBase * tramp.power, cfg.trampolineMaxUp);
        vy = -up;
        vx = vx * 0.9 + rng.range(-24, 24);
        emit({ t, type: "trampoline", index: i, speed });
      }
    }

    // --- nails ------------------------------------------------------------
    for (let i = 0; i < nailBoxes.length; i++) {
      if (circleIntersectsRect(x, y, r * 0.8, nailBoxes[i])) {
        emit({ t, type: "nail", index: i });
        outcome = "nail";
        break;
      }
    }
    if (outcome) break;

    // --- portals ----------------------------------------------------------
    for (let i = 0; i < index.portals.length; i++) {
      const portal = index.portals[i];
      const dx = x - portal.x;
      const dy = y - portal.y;
      const d2 = dx * dx + dy * dy;
      const inner = portal.r - 2;
      if (!portalInside[i] && d2 < inner * inner) {
        portalInside[i] = true;
        const teleported = portal.exit !== undefined;
        emit({ t, type: "portal", index: i, teleported });
        if (portal.exit) {
          x = portal.exit.x;
          y = portal.exit.y;
        }
      } else if (portalInside[i] && d2 > (portal.r + r) * (portal.r + r)) {
        portalInside[i] = false;
      }
    }

    // --- floor and bins ---------------------------------------------------
    for (let i = 0; i < index.chests.length; i++) {
      const chest = index.chests[i];
      const lidY = board.floorY - chest.height;
      if (Math.abs(x - chest.x) <= chest.width / 2 && y + r >= lidY) {
        y = lidY - r;
        emit({ t, type: "chest", index: i });
        outcome = "chest";
        break;
      }
    }
    if (outcome) break;

    for (let i = 0; i < index.voids.length; i++) {
      const pit = index.voids[i];
      if (Math.abs(x - pit.x) <= pit.width / 2 && y + r >= board.floorY - 2) {
        emit({ t, type: "void", index: i });
        outcome = "void";
        break;
      }
    }
    if (outcome) break;

    if (y + r > board.floorY) {
      y = board.floorY - r;
      vy = -vy * 0.3;
    }

    // --- stuck detection --------------------------------------------------
    if (y > deepestY + 1) {
      deepestY = y;
      deepestT = t;
    } else if (t - deepestT > cfg.stuckWindow) {
      deepestT = t;
      nudges += 1;
      if (nudges > cfg.maxNudges) {
        emit({ t, type: "stuck" });
        outcome = "stuck";
        break;
      }
      vx += (x < centerX ? 1 : -1) * rng.range(40, 90);
      vy = Math.min(vy, -140);
    }

    // --- advance ----------------------------------------------------------
    t += dt;
    step += 1;
    if (step % sampleEvery === 0) {
      xs.push(x);
      ys.push(y);
    }
    if (t > cfg.maxTime) {
      emit({ t, type: "stuck" });
      outcome = "stuck";
    }
  }

  if (step % sampleEvery !== 0) {
    xs.push(x);
    ys.push(y);
  }

  return {
    boardId: board.id,
    seed,
    outcome,
    duration: t,
    fps: cfg.sampleFps,
    xs: Float32Array.from(xs),
    ys: Float32Array.from(ys),
    events,
    end: { x, y },
  };
}

/** Interpolated ball position at `time` seconds into a replay. */
export function sampleReplay(replay: Replay, time: number, out: { x: number; y: number }): void {
  const last = replay.xs.length - 1;
  const f = Math.max(0, Math.min(last, time * replay.fps));
  const i = Math.floor(f);
  const j = Math.min(last, i + 1);
  const k = f - i;
  out.x = replay.xs[i] + (replay.xs[j] - replay.xs[i]) * k;
  out.y = replay.ys[i] + (replay.ys[j] - replay.ys[i]) * k;
}

export interface SeedSearchOptions {
  from?: number;
  maxTries?: number;
}

/** First seed (from `from`) whose drop ends with `outcome`, or `null`. */
export function findReplayWithOutcome(
  board: Board,
  outcome: Outcome,
  { from = 1, maxTries = 600 }: SeedSearchOptions = {},
): Replay | null {
  for (let seed = from; seed < from + maxTries; seed++) {
    const replay = simulateDrop(board, seed);
    if (replay.outcome === outcome) {
      return replay;
    }
  }
  return null;
}

/**
 * The golden rule, mechanically: a board is publishable only if at least one
 * drop reaches the chest. Returns that winning replay as the proof.
 */
export function proveBeatable(board: Board, options: SeedSearchOptions = {}): Replay | null {
  return findReplayWithOutcome(board, "chest", { maxTries: 2000, ...options });
}

/** Outcome distribution over `n` seeds — useful to tune a board's cruelty. */
export function outcomeStats(board: Board, n = 200, from = 1): Record<Outcome, number> {
  const stats: Record<Outcome, number> = { chest: 0, void: 0, nail: 0, stuck: 0 };
  for (let seed = from; seed < from + n; seed++) {
    stats[simulateDrop(board, seed).outcome] += 1;
  }
  return stats;
}

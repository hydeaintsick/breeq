/**
 * Draft helpers for the level editor. Placement and persistence only —
 * the game loop never lives here.
 */
import { BRICKS, OBSTACLES, ZONES } from "./catalog";
import {
  BRICK_COLORS,
  BRICK_HP,
  LEVEL_DEFAULTS,
  createLevel,
  obstacleBox,
  paddleZoneTop,
  type LevelOptions,
} from "./level";

const HIT_SLOP = 14;
import type {
  Brick,
  BrickColor,
  BrickKind,
  Level,
  Obstacle,
  ObstacleKind,
  Zone,
  ZoneKind,
} from "./types";

const DEFAULT_BACKGROUND = "/backgrounds/bokeh-rain.jpg";
const SNAP = 4;
const RAIL_WIDTH = LEVEL_DEFAULTS.brick.w * 3 + LEVEL_DEFAULTS.brick.gap * 2;

export type EditorTool =
  | { family: "brick"; kind: BrickKind }
  | { family: "zone"; kind: ZoneKind }
  | { family: "obstacle"; kind: ObstacleKind }
  | { family: "erase" };

export type Hit =
  | { type: "brick"; id: number }
  | { type: "zone"; id: number }
  | { type: "obstacle"; id: number };

export function createDraftLevel(options: LevelOptions): Level {
  return createLevel(options).background(DEFAULT_BACKGROUND, { dim: 0.5 }).draft();
}

export function cloneLevel(level: Level): Level {
  return {
    ...level,
    field: { ...level.field },
    paddle: { ...level.paddle },
    ball: { ...level.ball },
    background: { ...level.background },
    rules: { ...level.rules },
    bricks: level.bricks.map((brick) => ({ ...brick })),
    zones: level.zones.map((zone) => ({ ...zone })),
    obstacles: level.obstacles.map((obstacle) => ({ ...obstacle })),
  };
}

export function nextPieceId(level: Level): number {
  let max = 0;
  for (const brick of level.bricks) max = Math.max(max, brick.id);
  for (const zone of level.zones) max = Math.max(max, zone.id);
  for (const obstacle of level.obstacles) max = Math.max(max, obstacle.id);
  return max + 1;
}

export function brickColorFromTint(tint: string, fallback: BrickColor): BrickColor {
  return (BRICK_COLORS as readonly string[]).includes(tint) ? (tint as BrickColor) : fallback;
}

export function snapPoint(x: number, y: number) {
  return {
    x: Math.round(x / SNAP) * SNAP,
    y: Math.round(y / SNAP) * SNAP,
  };
}

export function snapBrickOrigin(x: number, y: number, level: Level) {
  const { w, h, gap } = LEVEL_DEFAULTS.brick;
  const col = Math.round((x - w / 2 - level.field.left) / (w + gap));
  const row = Math.round((y - h / 2 - level.field.top) / (h + gap));
  const maxCol = Math.floor((level.field.right - level.field.left - w) / (w + gap));
  const maxRow = Math.floor((paddleZoneTop(level) - level.field.top - h) / (h + gap));
  const c = clamp(col, 0, Math.max(0, maxCol));
  const r = clamp(row, 0, Math.max(0, maxRow));
  return {
    x: level.field.left + c * (w + gap),
    y: level.field.top + r * (h + gap),
    w,
    h,
  };
}

export function hitTest(level: Level, x: number, y: number): Hit | null {
  for (let i = level.obstacles.length - 1; i >= 0; i -= 1) {
    const box = obstacleBox(level.obstacles[i]);
    if (inBox(x, y, box, HIT_SLOP)) {
      return { type: "obstacle", id: level.obstacles[i].id };
    }
  }
  for (let i = level.zones.length - 1; i >= 0; i -= 1) {
    const zone = level.zones[i];
    if ((x - zone.x) ** 2 + (y - zone.y) ** 2 <= (zone.r + HIT_SLOP) ** 2) {
      return { type: "zone", id: zone.id };
    }
  }
  for (let i = level.bricks.length - 1; i >= 0; i -= 1) {
    const brick = level.bricks[i];
    if (inBox(x, y, brick, 2)) {
      return { type: "brick", id: brick.id };
    }
  }
  return null;
}

function inBox(
  x: number,
  y: number,
  box: { x: number; y: number; w: number; h: number },
  pad: number,
) {
  return x >= box.x - pad && x <= box.x + box.w + pad && y >= box.y - pad && y <= box.y + box.h + pad;
}

export function removePiece(level: Level, hit: Hit): Level {
  const next = cloneLevel(level);
  if (hit.type === "brick") {
    next.bricks = next.bricks.filter((brick) => brick.id !== hit.id);
    return next;
  }
  if (hit.type === "zone") {
    const zone = next.zones.find((item) => item.id === hit.id);
    const drop = new Set<number>([hit.id]);
    if (zone?.link != null) drop.add(zone.link);
    next.zones = next.zones.filter((item) => !drop.has(item.id));
    return next;
  }
  next.obstacles = next.obstacles.filter((obstacle) => obstacle.id !== hit.id);
  return next;
}

export function applyStroke(
  level: Level,
  world: { x: number; y: number },
  tool: EditorTool,
  options: { color: BrickColor; pendingPortalId: number | null },
): { level: Level; pendingPortalId: number | null; changed: boolean } {
  const hit = hitTest(level, world.x, world.y);
  if (tool.family === "erase" || hit) {
    if (!hit) {
      return { level, pendingPortalId: options.pendingPortalId, changed: false };
    }
    return { level: removePiece(level, hit), pendingPortalId: null, changed: true };
  }

  if (tool.family === "brick") {
    return { level: placeBrick(level, world.x, world.y, tool.kind, options.color), pendingPortalId: null, changed: true };
  }
  if (tool.family === "zone") {
    return placeZone(level, world.x, world.y, tool.kind, options.pendingPortalId);
  }
  return { level: placeObstacle(level, world.x, world.y, tool.kind), pendingPortalId: null, changed: true };
}

export function placeBrick(level: Level, x: number, y: number, kind: BrickKind, color: BrickColor): Level {
  const origin = snapBrickOrigin(x, y, level);
  const next = cloneLevel(level);
  next.bricks = next.bricks.filter((brick) => brick.x !== origin.x || brick.y !== origin.y);
  next.bricks.push({
    id: nextPieceId(next),
    x: origin.x,
    y: origin.y,
    w: origin.w,
    h: origin.h,
    kind,
    color,
    hp: BRICK_HP[kind],
  });
  return next;
}

function placeZone(
  level: Level,
  x: number,
  y: number,
  kind: ZoneKind,
  pendingPortalId: number | null,
): { level: Level; pendingPortalId: number | null; changed: boolean } {
  const point = snapPoint(x, y);
  const next = cloneLevel(level);
  const id = nextPieceId(next);
  const zone: Zone = { id, kind, x: point.x, y: point.y, r: LEVEL_DEFAULTS.zoneRadius };

  if (kind === "portal") {
    if (pendingPortalId != null) {
      const twin = next.zones.find((item) => item.id === pendingPortalId && item.kind === "portal");
      if (twin) {
        twin.link = id;
        zone.link = twin.id;
        next.zones.push(zone);
        return { level: next, pendingPortalId: null, changed: true };
      }
    }
    next.zones.push(zone);
    return { level: next, pendingPortalId: id, changed: true };
  }

  next.zones.push(zone);
  return { level: next, pendingPortalId: null, changed: true };
}

function placeObstacle(level: Level, x: number, y: number, kind: ObstacleKind): Level {
  const point = snapPoint(x, y);
  const next = cloneLevel(level);
  const id = nextPieceId(next);
  const obstacle = makeObstacle(id, kind, point.x, point.y);
  next.obstacles.push(obstacle);
  return next;
}

function makeObstacle(id: number, kind: ObstacleKind, x: number, y: number): Obstacle {
  switch (kind) {
    case "bumper":
      return { id, kind, x, y, r: LEVEL_DEFAULTS.bumperRadius };
    case "rail":
      return { id, kind, x: x - RAIL_WIDTH / 2, y, w: RAIL_WIDTH };
    case "fan":
      return { id, kind, x, y, dir: 1, reach: 110, spread: 36, force: 2.2 };
    case "guard":
      return { id, kind, x, y, w: 48, h: 8, range: 60, speed: 1.4 };
    case "trampoline":
      return { id, kind, x: x - RAIL_WIDTH / 2, y, w: RAIL_WIDTH };
    case "blackhole":
      return { id, kind, x, y, r: LEVEL_DEFAULTS.blackholeRadius };
  }
}

export function serializeLevel(level: Level) {
  return JSON.parse(
    JSON.stringify({
      ...level,
      bricks: level.bricks.map((brick) => ({
        ...brick,
        hp: Number.isFinite(brick.hp) ? brick.hp : null,
      })),
    }),
  ) as Record<string, unknown>;
}

export function parseStoredLevel(raw: unknown, fallback: LevelOptions): Level {
  if (!isStoredLevel(raw)) {
    return createDraftLevel(fallback);
  }

  const draft = createDraftLevel(fallback);
  return {
    ...draft,
    id: typeof raw.id === "string" ? raw.id : fallback.id,
    name: typeof raw.name === "string" ? raw.name : fallback.name,
    author: typeof raw.author === "string" ? raw.author : fallback.author,
    lives: clamp(Number(raw.lives) || draft.lives, 1, 5),
    background: {
      ...draft.background,
      ...(isRecord(raw.background) ? raw.background : {}),
      type: "photo",
      src: isRecord(raw.background) && typeof raw.background.src === "string" ? raw.background.src : draft.background.src,
    },
    rules: {
      timer: Math.max(0, Number(isRecord(raw.rules) ? raw.rules.timer : 0) || 0),
      descend: Math.max(0, Number(isRecord(raw.rules) ? raw.rules.descend : 0) || 0),
      order: isRecord(raw.rules) && isBrickColor(raw.rules.order) ? raw.rules.order : null,
    },
    bricks: raw.bricks.map(hydrateBrick).filter((brick): brick is Brick => brick !== null),
    zones: raw.zones.map(hydrateZone).filter((zone): zone is Zone => zone !== null),
    obstacles: raw.obstacles.map(hydrateObstacle).filter((obstacle): obstacle is Obstacle => obstacle !== null),
  };
}

function hydrateBrick(raw: unknown): Brick | null {
  if (!isRecord(raw) || !isBrickKind(raw.kind) || !isBrickColor(raw.color)) {
    return null;
  }
  return {
    id: Number(raw.id) || 0,
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    w: Number(raw.w) || LEVEL_DEFAULTS.brick.w,
    h: Number(raw.h) || LEVEL_DEFAULTS.brick.h,
    kind: raw.kind,
    color: raw.color,
    hp: BRICK_HP[raw.kind],
  };
}

function hydrateZone(raw: unknown): Zone | null {
  if (!isRecord(raw) || !isZoneKind(raw.kind)) {
    return null;
  }
  return {
    id: Number(raw.id) || 0,
    kind: raw.kind,
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    r: Number(raw.r) || LEVEL_DEFAULTS.zoneRadius,
    link: typeof raw.link === "number" ? raw.link : undefined,
  };
}

function hydrateObstacle(raw: unknown): Obstacle | null {
  if (!isRecord(raw) || !isObstacleKind(raw.kind)) {
    return null;
  }
  const id = Number(raw.id) || 0;
  const x = Number(raw.x) || 0;
  const y = Number(raw.y) || 0;
  switch (raw.kind) {
    case "bumper":
      return { id, kind: "bumper", x, y, r: Number(raw.r) || LEVEL_DEFAULTS.bumperRadius };
    case "rail":
      return { id, kind: "rail", x, y, w: Number(raw.w) || RAIL_WIDTH };
    case "fan":
      return {
        id,
        kind: "fan",
        x,
        y,
        dir: raw.dir === -1 ? -1 : 1,
        reach: Number(raw.reach) || 110,
        spread: Number(raw.spread) || 36,
        force: Number(raw.force) || 2.2,
      };
    case "guard":
      return {
        id,
        kind: "guard",
        x,
        y,
        w: Number(raw.w) || 48,
        h: Number(raw.h) || 8,
        range: Number(raw.range) || 60,
        speed: Number(raw.speed) || 1.4,
      };
    case "trampoline":
      return { id, kind: "trampoline", x, y, w: Number(raw.w) || RAIL_WIDTH };
    case "blackhole":
      return { id, kind: "blackhole", x, y, r: Number(raw.r) || LEVEL_DEFAULTS.blackholeRadius };
  }
}

function isStoredLevel(value: unknown): value is {
  id?: unknown;
  name?: unknown;
  author?: unknown;
  lives?: unknown;
  background?: unknown;
  rules?: unknown;
  bricks: unknown[];
  zones: unknown[];
  obstacles: unknown[];
} {
  return (
    isRecord(value) &&
    Array.isArray(value.bricks) &&
    Array.isArray(value.zones) &&
    Array.isArray(value.obstacles)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBrickKind(value: unknown): value is BrickKind {
  return typeof value === "string" && value in BRICKS;
}

function isZoneKind(value: unknown): value is ZoneKind {
  return typeof value === "string" && value in ZONES;
}

function isObstacleKind(value: unknown): value is ObstacleKind {
  return typeof value === "string" && value in OBSTACLES;
}

function isBrickColor(value: unknown): value is BrickColor {
  return typeof value === "string" && (BRICK_COLORS as readonly string[]).includes(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Discoveries — the one-time explainer a story run shows the first time the
 * ball meets a kind of piece the player has never seen: a brick, a zone, an
 * obstacle, or a level rule. Pure data and mapping; no DOM, no database.
 *
 * `discoveriesFromEvent` turns a `GameEvent` into the pieces it could teach,
 * most specific first. The run shows the first one the player does not know
 * yet, freezes the world on it, and never shows it again (`User.discoveries`).
 */
import { BRICKS, OBSTACLES, ZONES } from "@/game/breakout/engine/catalog";
import type {
  Brick,
  BrickColor,
  BrickKind,
  GameEvent,
  Level,
  Obstacle,
  ObstacleKind,
  Zone,
  ZoneKind,
} from "@/game/breakout/engine/types";

export type PieceFamily = "brick" | "zone" | "obstacle" | "rule";
export type RuleKind = "timer" | "descend" | "order";
export type PieceId = `${PieceFamily}:${string}`;

export function pieceId(family: "brick", kind: BrickKind): PieceId;
export function pieceId(family: "zone", kind: ZoneKind): PieceId;
export function pieceId(family: "obstacle", kind: ObstacleKind): PieceId;
export function pieceId(family: "rule", kind: RuleKind): PieceId;
export function pieceId(family: PieceFamily, kind: string): PieceId {
  return `${family}:${kind}`;
}

/** What the guided tutorial teaches by hand; finishing it counts as having seen these. */
export const TUTORIAL_PIECES: readonly PieceId[] = ["brick:glass", "brick:hard", "zone:slow"];

/** What stays lit on the board while the card is up. */
export type SpotTarget =
  /** A world rectangle on the board. */
  | { kind: "world"; x: number; y: number; w: number; h: number }
  /** A piece of chrome around the board (the clock, the lives). */
  | { kind: "dom"; selector: string };

export type Lesson = {
  id: PieceId;
  kicker: string;
  title: string;
  body: string;
};

export type Discovery = {
  lesson: Lesson;
  /** Empty: the whole board is dimmed evenly. */
  targets: SpotTarget[];
};

const BRICK_COPY: Record<BrickKind, string> = {
  glass: "One hit and it shatters. Every brick you break adds to your score.",
  hard: "It cracks on the first hit and breaks on the second. Look for the crack.",
  steel: "It never breaks. Steel shapes the path; you do not need to clear it.",
  explosive: "Break it and it takes its neighbors with it. Explosives chain into each other.",
  ghost: "It fades in and out. While it is faint the ball passes straight through, so hit it while it is solid.",
  regen: "It comes back a few seconds after you break it. It scores again, but it never blocks your clear.",
  magnet: "It bends the ball toward itself while it stands. Break it to straighten the path.",
  rotor: "A slow blade. It sends the ball off at odd angles and takes two hits.",
  key: "Break every key on the wall to open the locks.",
  lock: "Unbreakable while a key still stands. Clear the keys first, then it opens.",
};

const ZONE_COPY: Record<ZoneKind, string> = {
  slow: "The ring cut the ball's speed in half for a few seconds.",
  fast2: "Double speed for a few seconds. Watch the ball, not the paddle.",
  fast3: "Triple speed for a few seconds. Get under it early.",
  antigrav: "The ball curves upward while it is inside the ring.",
  gravity: "The ball curves downward while it is inside the ring.",
  portal: "The ball came out at the twin portal, heading kept. Watch both ends.",
  fakePortal: "It looks like a portal, but the ball passes straight through. Nothing happens.",
  mirror: "It flips the ball left to right on entry. Expect it on the other side.",
  fog: "The ball is hidden while it is inside. Follow the trail out.",
  split: "A second ball, for a few seconds. Either one counts; losing the clone costs nothing.",
  shrink: "Your paddle is at 60% for a few seconds. Center under the ball.",
  grow: "Your paddle is at 150% for a few seconds. Make the most of it.",
  invert: "Controls are reversed for a few seconds: slide left to go right.",
  ice: "The paddle slides for a few seconds. Start moving early and stop early.",
  sticky: "The paddle catches the ball. Aim, then tap to release.",
};

const OBSTACLE_COPY: Record<ObstacleKind, string> = {
  bumper: "A pinball post. Hard rebound and a speed kick every time.",
  rail: "The ball rolls along it and drops off the end. From below, it passes through.",
  fan: "Sideways wind in a corridor. The ball drifts while it is in the draft.",
  guard: "A steel bar sweeping back and forth. It blocks the ball; time your shots around it.",
  trampoline: "A band that fires the ball back up, faster.",
  blackhole: "It pulls nearby balls in and swallows what it catches. A swallowed ball is a lost ball.",
};

const RULE_COPY: Record<RuleKind, { title: string; body: string }> = {
  timer: {
    title: "This wall is on the clock.",
    body: "Clear it before the time up top runs out.",
  },
  descend: {
    title: "The wall drops.",
    body: "Every few paddle hits, the whole wall moves down a row. If it reaches the paddle, the run is over.",
  },
  order: {
    title: "One color first.",
    body: "The lit bricks must fall before the others will break. Everything else just bounces for now.",
  },
};

function brickLesson(kind: BrickKind): Lesson {
  return { id: pieceId("brick", kind), kicker: "New brick", title: `${BRICKS[kind].name} brick.`, body: BRICK_COPY[kind] };
}

function zoneLesson(kind: ZoneKind): Lesson {
  const name = ZONES[kind].name;
  const title = kind === "portal" || kind === "fakePortal" || kind === "fog" ? `${name}.` : `${name} zone.`;
  return { id: pieceId("zone", kind), kicker: "New zone", title, body: ZONE_COPY[kind] };
}

function obstacleLesson(kind: ObstacleKind): Lesson {
  return { id: pieceId("obstacle", kind), kicker: "New obstacle", title: `${OBSTACLES[kind].name}.`, body: OBSTACLE_COPY[kind] };
}

function ruleLesson(kind: RuleKind, order: BrickColor | null = null): Lesson {
  const copy = RULE_COPY[kind];
  const body = kind === "order" && order ? `The ${order} bricks must fall before the others will break. Everything else just bounces for now.` : copy.body;
  return { id: pieceId("rule", kind), kicker: "New rule", title: copy.title, body };
}

/** Every lesson the story can show, by id. Used to validate what gets saved. */
export const LESSON_IDS: ReadonlySet<string> = new Set<string>([
  ...(Object.keys(BRICKS) as BrickKind[]).map((kind) => pieceId("brick", kind)),
  ...(Object.keys(ZONES) as ZoneKind[]).map((kind) => pieceId("zone", kind)),
  ...(Object.keys(OBSTACLES) as ObstacleKind[]).map((kind) => pieceId("obstacle", kind)),
  pieceId("rule", "timer"),
  pieceId("rule", "descend"),
  pieceId("rule", "order"),
]);

// -----------------------------------------------------------------------------
// Targets
// -----------------------------------------------------------------------------

function brickBox(brick: Brick): SpotTarget {
  return { kind: "world", x: brick.x, y: brick.y, w: brick.w, h: brick.h };
}

function zoneBox(zone: Zone): SpotTarget {
  const r = zone.r * 1.5;
  return { kind: "world", x: zone.x - r, y: zone.y - r, w: r * 2, h: r * 2 };
}

function obstacleBox(o: Obstacle): SpotTarget {
  switch (o.kind) {
    case "bumper":
      return { kind: "world", x: o.x - o.r * 1.4, y: o.y - o.r * 1.4, w: o.r * 2.8, h: o.r * 2.8 };
    case "blackhole":
      return { kind: "world", x: o.x - o.r * 1.6, y: o.y - o.r * 1.6, w: o.r * 3.2, h: o.r * 3.2 };
    case "rail":
    case "trampoline":
      return { kind: "world", x: o.x, y: o.y - 8, w: o.w, h: 16 };
    case "fan": {
      const x0 = o.dir > 0 ? o.x : o.x - o.reach;
      return { kind: "world", x: x0, y: o.y - o.spread / 2, w: o.reach, h: o.spread };
    }
    case "guard":
      return { kind: "world", x: o.x - o.w / 2 - o.range, y: o.y - o.h / 2, w: o.w + o.range * 2, h: o.h };
  }
}

/** Bounding box of every brick of one color, for the order rule. */
function colorBox(level: Level, color: BrickColor): SpotTarget | null {
  const bricks = level.bricks.filter((brick) => brick.color === color && brick.kind !== "steel");
  if (bricks.length === 0) return null;
  const x0 = Math.min(...bricks.map((b) => b.x));
  const y0 = Math.min(...bricks.map((b) => b.y));
  const x1 = Math.max(...bricks.map((b) => b.x + b.w));
  const y1 = Math.max(...bricks.map((b) => b.y + b.h));
  return { kind: "world", x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// -----------------------------------------------------------------------------
// Event → discoveries
// -----------------------------------------------------------------------------

/**
 * The pieces one event could teach, most specific first. The caller shows the
 * first one the player has not seen. Events that merely echo another (`explode`
 * after an explosive `brick`, `split` and `mod` beside their `zone`) map to nothing.
 */
export function discoveriesFromEvent(event: GameEvent, level: Level): Discovery[] {
  switch (event.type) {
    case "launch":
      return level.rules.timer > 0
        ? [{ lesson: ruleLesson("timer"), targets: [{ kind: "dom", selector: ".board-hud-clock" }] }]
        : [];

    case "brick": {
      const { brick } = event;
      const out: Discovery[] = [{ lesson: brickLesson(brick.kind), targets: [brickBox(brick)] }];
      const order = level.rules.order;
      // The ball bounced off a breakable brick of the wrong color: that is the order rule at work.
      if (order && !event.broken && brick.color !== order && brick.kind !== "steel" && brick.kind !== "lock") {
        const box = colorBox(level, order);
        out.push({ lesson: ruleLesson("order", order), targets: box ? [box] : [] });
      }
      return out;
    }

    case "zone":
      return [{ lesson: zoneLesson(event.zone.kind), targets: [zoneBox(event.zone)] }];

    case "teleport":
      return [{ lesson: zoneLesson("portal"), targets: [zoneBox(event.from), zoneBox(event.to)] }];

    case "obstacle":
      return [{ lesson: obstacleLesson(event.obstacle.kind), targets: [obstacleBox(event.obstacle)] }];

    case "swallow": {
      const hole = level.obstacles.find((o) => o.kind === "blackhole" && o.x === event.x && o.y === event.y);
      return [{ lesson: obstacleLesson("blackhole"), targets: hole ? [obstacleBox(hole)] : [] }];
    }

    case "field": {
      const { source } = event;
      if (source.family === "zone") return [{ lesson: zoneLesson(source.zone.kind), targets: [zoneBox(source.zone)] }];
      if (source.family === "obstacle") {
        return [{ lesson: obstacleLesson(source.obstacle.kind), targets: [obstacleBox(source.obstacle)] }];
      }
      return [{ lesson: brickLesson(source.brick.kind), targets: [brickBox(source.brick)] }];
    }

    case "descend":
      return [{ lesson: ruleLesson("descend"), targets: [] }];

    default:
      return [];
  }
}

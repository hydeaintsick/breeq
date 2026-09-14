/**
 * The chapter trail — one episode's walls as a road winding up the screen.
 *
 * Pure data, in CSS pixels for a given stage width: chapter one sits at the
 * bottom, the last wall at the top, and the road swings left and right of the
 * centre on a seeded smooth wave so it reads as a way through, not a list.
 * Also hands back the road as an SVG path and how far along it every node
 * sits, so the lit part (the walls already down) can be measured in pixels.
 */
import { createRng } from "../shared/random";

export interface TrailNode {
  index: number;
  /** Node centre, CSS px from the trail's top-left. */
  x: number;
  y: number;
  /** Which side of the disc is clear of the road (its neighbours lean the other way): -1 left, 1 right. */
  side: -1 | 1;
}

export interface TrailLayout {
  nodes: TrailNode[];
  width: number;
  height: number;
  /** The road through every node, bottom to top, as an SVG path `d`. */
  path: string;
  /** Road length from the first node to each node, px. */
  reach: number[];
  /** Full road length, px. */
  length: number;
}

/** Vertical distance between two walls, and the room kept above and below the road. */
export const TRAIL_STEP = 118;
const PAD_TOP = 96;
const PAD_BOTTOM = 104;

export function layoutTrail(count: number, stage: { width: number }): TrailLayout {
  const n = Math.max(0, Math.floor(count));
  const width = Math.max(1, stage.width);
  const height = n === 0 ? PAD_TOP + PAD_BOTTOM : PAD_TOP + PAD_BOTTOM + (n - 1) * TRAIL_STEP;
  // Leaves room beside the outermost discs for their stars (disc half + gap + three stars).
  const amplitude = Math.min(width * 0.27, width / 2 - 104, 124);
  const rng = createRng(0x7a11);
  const p0 = rng.range(0, Math.PI * 2);
  const p1 = rng.range(0, Math.PI * 2);
  const wave = (i: number) => 0.72 * Math.sin(i * 2.05 + p0) + 0.28 * Math.sin(i * 0.85 + p1);

  const xs = Array.from({ length: n }, (_, index) => Math.round(width / 2 + wave(index) * amplitude));
  const nodes: TrailNode[] = xs.map((x, index) => {
    // The road leaves the disc straight up and down, then bends toward the
    // neighbours: whatever hangs off the disc goes to the other side.
    const prev = xs[index - 1] ?? x;
    const next = xs[index + 1] ?? x;
    const lean = (prev - x) + (next - x);
    return {
      index,
      x,
      y: height - PAD_BOTTOM - index * TRAIL_STEP,
      side: lean > 0 ? -1 : 1,
    };
  });

  const reach: number[] = [0];
  let path = "";
  let length = 0;
  if (n > 0) {
    path = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < n; i++) {
      const a = nodes[i - 1];
      const b = nodes[i];
      const h = (a.y - b.y) * 0.5;
      const c1 = { x: a.x, y: a.y - h };
      const c2 = { x: b.x, y: b.y + h };
      path += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
      length += bezierLength(a, c1, c2, b);
      reach.push(length);
    }
  }

  return { nodes, width, height, path, reach, length };
}

function bezierLength(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
): number {
  const steps = 16;
  let len = 0;
  let px = p0.x;
  let py = p0.y;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const u = 1 - t;
    const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
    const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return len;
}

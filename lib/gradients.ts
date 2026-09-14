/**
 * The gradient bank: twenty skies an author can put behind a wall instead of
 * a photo. Each is rendered to a small SVG and handed to the engine as the
 * level's background `src`, so the renderer treats it exactly like a photo —
 * no engine change, nothing to upload, one kilobyte per level.
 *
 * Named after the worlds on Kal's route. Dark enough that neon bricks read.
 */

export type Gradient = {
  id: string;
  name: string;
  /** Degrees, CSS convention (0 = up, 90 = right). */
  angle: number;
  /** Two to four stops, top to bottom. */
  stops: string[];
  /** One soft bloom: color and its center as fractions of the frame. */
  bloom: { color: string; x: number; y: number };
};

export const GRADIENTS: readonly Gradient[] = [
  { id: "grey-moon", name: "Grey Moon", angle: 170, stops: ["#2a2f3d", "#0f1220", "#05060c"], bloom: { color: "#8b93a7", x: 0.7, y: 0.2 } },
  { id: "vitra-dawn", name: "Vitra Dawn", angle: 160, stops: ["#3b1d5e", "#1a1233", "#0a0714"], bloom: { color: "#ffb020", x: 0.5, y: 0.08 } },
  { id: "cold-orbit", name: "Cold Orbit", angle: 180, stops: ["#0b1a3a", "#0a1226", "#05060c"], bloom: { color: "#4f7cff", x: 0.25, y: 0.3 } },
  { id: "twin-suns", name: "Twin Suns", angle: 155, stops: ["#5a2a12", "#2a1220", "#0a0714"], bloom: { color: "#ffb020", x: 0.3, y: 0.15 } },
  { id: "glass-sky", name: "Glass Sky", angle: 175, stops: ["#0e3a4a", "#0b1d33", "#05060c"], bloom: { color: "#22d3ee", x: 0.6, y: 0.2 } },
  { id: "empty-nest", name: "Empty Nest", angle: 165, stops: ["#1a1a2e", "#101021", "#05060c"], bloom: { color: "#8b5cf6", x: 0.8, y: 0.35 } },
  { id: "lumen-reef", name: "Lumen Reef", angle: 180, stops: ["#063d4a", "#0a2a3d", "#041018"], bloom: { color: "#22d3ee", x: 0.5, y: 0.75 } },
  { id: "pearl", name: "Pearl", angle: 150, stops: ["#3d3a5a", "#1c1a33", "#0a0914"], bloom: { color: "#ff4fa3", x: 0.35, y: 0.25 } },
  { id: "ashen-court", name: "Ashen Court", angle: 180, stops: ["#2b1a14", "#150d0c", "#05060c"], bloom: { color: "#ff5a5f", x: 0.5, y: 0.85 } },
  { id: "the-candle", name: "The Candle", angle: 170, stops: ["#3a2a0a", "#1c140a", "#0a0704"], bloom: { color: "#ffb020", x: 0.5, y: 0.3 } },
  { id: "ember-fleet", name: "Ember Fleet", angle: 160, stops: ["#3a1a14", "#1e0f1a", "#0a0714"], bloom: { color: "#ffb020", x: 0.2, y: 0.6 } },
  { id: "the-hush", name: "The Hush", angle: 180, stops: ["#0a0a12", "#06060d", "#020207"], bloom: { color: "#8b5cf6", x: 0.5, y: 0.45 } },
  { id: "aurel", name: "Aurel", angle: 165, stops: ["#0d3a2a", "#0b2433", "#05060c"], bloom: { color: "#a3e635", x: 0.7, y: 0.15 } },
  { id: "second-sun", name: "Second Sun", angle: 150, stops: ["#5a3a0a", "#2a1a2a", "#0a0714"], bloom: { color: "#ff4fa3", x: 0.75, y: 0.3 } },
  { id: "green-static", name: "Green Static", angle: 175, stops: ["#0a2a14", "#0a1a14", "#05060c"], bloom: { color: "#a3e635", x: 0.3, y: 0.5 } },
  { id: "vireo", name: "Vireo", angle: 180, stops: ["#0f3a1a", "#0a2a2a", "#04100a"], bloom: { color: "#22d3ee", x: 0.8, y: 0.7 } },
  { id: "glasshouse", name: "Glasshouse", angle: 160, stops: ["#3a2a0a", "#1a1a1a", "#05060c"], bloom: { color: "#ffb020", x: 0.5, y: 0.2 } },
  { id: "rootway", name: "Rootway", angle: 180, stops: ["#1a1206", "#0f0f1a", "#05060c"], bloom: { color: "#a3e635", x: 0.5, y: 0.5 } },
  { id: "wall-walker", name: "Wall-walker", angle: 180, stops: ["#0a0f2a", "#05081a", "#02030a"], bloom: { color: "#4f7cff", x: 0.6, y: 0.4 } },
  { id: "meridian", name: "Meridian", angle: 165, stops: ["#0a3a2a", "#1a2a3a", "#0a0714"], bloom: { color: "#ff4fa3", x: 0.4, y: 0.3 } },
];

export const DEFAULT_GRADIENT_ID = "cold-orbit";

export function findGradient(id: string | null | undefined): Gradient | null {
  if (!id) return null;
  return GRADIENTS.find((g) => g.id === id) ?? null;
}

/** CSS for a picker swatch or a card fallback. */
export function gradientCss(g: Gradient) {
  const linear = `linear-gradient(${g.angle}deg, ${g.stops.join(", ")})`;
  const bx = Math.round(g.bloom.x * 100);
  const by = Math.round(g.bloom.y * 100);
  const bloom = `radial-gradient(60% 45% at ${bx}% ${by}%, ${g.bloom.color}66, transparent 70%)`;
  return `${bloom}, ${linear}`;
}

/**
 * The gradient as an image the engine can paint. 360×640 like the field; the
 * renderer covers whatever box it gets, so the aspect only sets the bloom's
 * shape.
 */
export function gradientSrc(g: Gradient): string {
  const rad = ((g.angle - 90) * Math.PI) / 180;
  const x1 = 50 - Math.cos(rad) * 50;
  const y1 = 50 - Math.sin(rad) * 50;
  const x2 = 50 + Math.cos(rad) * 50;
  const y2 = 50 + Math.sin(rad) * 50;
  const stops = g.stops
    .map((color, index) => `<stop offset="${Math.round((index / Math.max(1, g.stops.length - 1)) * 100)}%" stop-color="${color}"/>`)
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640" viewBox="0 0 360 640">` +
    `<defs>` +
    `<linearGradient id="l" x1="${x1.toFixed(1)}%" y1="${y1.toFixed(1)}%" x2="${x2.toFixed(1)}%" y2="${y2.toFixed(1)}%">${stops}</linearGradient>` +
    `<radialGradient id="b" cx="${(g.bloom.x * 100).toFixed(0)}%" cy="${(g.bloom.y * 100).toFixed(0)}%" r="55%">` +
    `<stop offset="0%" stop-color="${g.bloom.color}" stop-opacity="0.55"/>` +
    `<stop offset="100%" stop-color="${g.bloom.color}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `</defs>` +
    `<rect width="360" height="640" fill="url(#l)"/>` +
    `<rect width="360" height="640" fill="url(#b)"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** What goes behind a map: its photo, else its gradient, else the default sky. */
export function resolveBackgroundSrc(
  backgroundUrl: string | null | undefined,
  gradientId: string | null | undefined,
  photo: (url: string) => string = (url) => url,
): string {
  if (backgroundUrl) return photo(backgroundUrl);
  const gradient = findGradient(gradientId) ?? findGradient(DEFAULT_GRADIENT_ID)!;
  return gradientSrc(gradient);
}

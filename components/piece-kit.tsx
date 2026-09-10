import { BRICKS, OBSTACLES, RULES_CATALOG, ZONES, type CatalogEntry, type PieceTint } from "@/game/breakout/engine/catalog";

/**
 * The piece catalog, laid out for the showcase. Reads the same data the
 * engine validates against, so the site never drifts from the game.
 */

const FAMILIES: { title: string; lede: string; items: CatalogEntry[] }[] = [
  {
    title: "Bricks",
    lede: "What you break. Ten kinds, one grid.",
    items: Object.values(BRICKS),
  },
  {
    title: "Zones",
    lede: "What the ball passes through. Speed, forces, portals, paddle tricks.",
    items: Object.values(ZONES),
  },
  {
    title: "Obstacles",
    lede: "What sits on the field and is not part of the wall.",
    items: Object.values(OBSTACLES),
  },
  {
    title: "Rules",
    lede: "Set once per level.",
    items: RULES_CATALOG,
  },
];

const TINT_VAR: Record<PieceTint, string> = {
  blue: "var(--neon-blue)",
  violet: "var(--neon-violet)",
  pink: "var(--neon-pink)",
  cyan: "var(--neon-cyan)",
  lime: "var(--neon-lime)",
  amber: "var(--neon-amber)",
  steel: "var(--steel)",
  white: "var(--ink-muted)",
  danger: "var(--danger)",
};

function Glyph({ entry }: { entry: CatalogEntry }) {
  const color = TINT_VAR[entry.tint];
  if (entry.family === "brick" && !entry.glyph) {
    // Plain bricks: a small tile in their color.
    return (
      <span className="kit-glyph" style={{ ["--kit-color" as string]: color }} aria-hidden="true">
        <span className="kit-tile" />
      </span>
    );
  }
  return (
    <span className="kit-glyph" style={{ ["--kit-color" as string]: color }} aria-hidden="true">
      {entry.glyph || <span className="kit-dot" />}
    </span>
  );
}

export function PieceKit() {
  return (
    <div className="mt-14 space-y-14">
      {FAMILIES.map((family) => (
        <div key={family.title}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 className="text-2xl font-semibold tracking-tight text-ink">{family.title}</h3>
            <p className="text-sm text-ink-muted">{family.lede}</p>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {family.items.map((entry) => (
              <li key={entry.id} className="glass flex items-start gap-4 p-4">
                <Glyph entry={entry} />
                <div className="min-w-0">
                  <p className="text-base font-semibold tracking-tight text-ink">{entry.name}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">{entry.blurb}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

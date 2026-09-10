"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BRICKS,
  BRICK_COLORS,
  LEVEL_BUDGET,
  OBSTACLES,
  RULES_CATALOG,
  ZONES,
  applyStroke,
  brickColorFromTint,
  cloneLevel,
  levelCost,
  serializeLevel,
  validateLevel,
  type BrickColor,
  type CatalogEntry,
  type EditorTool,
  type Level,
  type PieceTint,
} from "@/game/breakout/engine";
import { mountBreakout, type BreakoutHandle } from "@/game/breakout/preview";
import { saveChapter } from "@/app/actions/editor";
import { ADMIN_EDITOR_PATH } from "@/lib/auth/paths";

type FamilyTab = "brick" | "zone" | "obstacle" | "rule" | "erase";

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

const COLOR_VAR: Record<BrickColor, string> = {
  blue: "var(--neon-blue)",
  violet: "var(--neon-violet)",
  pink: "var(--neon-pink)",
  cyan: "var(--neon-cyan)",
  lime: "var(--neon-lime)",
  amber: "var(--neon-amber)",
};

const TABS: { id: FamilyTab; label: string }[] = [
  { id: "brick", label: "Bricks" },
  { id: "zone", label: "Zones" },
  { id: "obstacle", label: "Obstacles" },
  { id: "rule", label: "Rules" },
  { id: "erase", label: "Erase" },
];

export function LevelEditor({
  episodeId,
  chapterId,
  episodeTitle,
  initialTitle,
  initialLevel,
}: {
  episodeId: string;
  chapterId: string;
  episodeTitle: string;
  initialTitle: string;
  initialLevel: Level;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<BreakoutHandle | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [level, setLevel] = useState(initialLevel);
  const [history, setHistory] = useState<Level[]>([]);
  const [tab, setTab] = useState<FamilyTab>("brick");
  const [tool, setTool] = useState<EditorTool>({ family: "brick", kind: "glass" });
  const [color, setColor] = useState<BrickColor>("pink");
  const [pendingPortalId, setPendingPortalId] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const issues = useMemo(() => validateLevel(level), [level]);
  const cost = useMemo(() => levelCost(level), [level]);
  const errors = issues.filter((issue) => issue.level === "error");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const handle = mountBreakout(canvas, level, { mode: "edit", controls: "auto" });
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
    // Mount once; later drafts go through setLevel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleRef.current?.setLevel(level);
  }, [level]);

  function commit(next: Level) {
    setHistory((stack) => [...stack.slice(-29), cloneLevel(level)]);
    setLevel(next);
    setDirty(true);
    setSaved(false);
    setError(null);
  }

  function onBoardPointer(event: React.PointerEvent<HTMLButtonElement>) {
    if (tab === "rule") {
      return;
    }
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const rect = stage.getBoundingClientRect();
    const world = {
      x: ((event.clientX - rect.left) / rect.width) * level.width,
      y: ((event.clientY - rect.top) / rect.height) * level.height,
    };
    const active: EditorTool = tab === "erase" ? { family: "erase" } : tool;
    const result = applyStroke(level, world, active, { color, pendingPortalId });
    if (!result.changed) {
      return;
    }
    setPendingPortalId(result.pendingPortalId);
    commit(result.level);
  }

  function selectEntry(entry: CatalogEntry) {
    if (entry.family === "rule") {
      setTab("rule");
      return;
    }
    if (entry.family === "brick") {
      setTool({ family: "brick", kind: entry.id as Extract<EditorTool, { family: "brick" }>["kind"] });
      setColor(brickColorFromTint(entry.tint, color));
      setTab("brick");
      return;
    }
    if (entry.family === "zone") {
      setTool({ family: "zone", kind: entry.id as Extract<EditorTool, { family: "zone" }>["kind"] });
      setTab("zone");
      return;
    }
    setTool({ family: "obstacle", kind: entry.id as Extract<EditorTool, { family: "obstacle" }>["kind"] });
    setTab("obstacle");
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) {
      return;
    }
    setHistory((stack) => stack.slice(0, -1));
    setLevel(previous);
    setPendingPortalId(null);
    setDirty(true);
    setSaved(false);
  }

  async function onSave() {
    setPending(true);
    setError(null);
    try {
      const result = await saveChapter({
        episodeId,
        chapterId,
        title,
        level: serializeLevel({ ...level, name: title }),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDirty(false);
      setSaved(true);
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setPending(false);
    }
  }

  const catalog =
    tab === "brick"
      ? Object.values(BRICKS)
      : tab === "zone"
        ? Object.values(ZONES)
        : tab === "obstacle"
          ? Object.values(OBSTACLES)
          : tab === "rule"
            ? RULES_CATALOG
            : [];

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-4 pb-16 pt-28 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Editor
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">
        {episodeTitle}
      </h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-ink-muted">
        <Link href={`${ADMIN_EDITOR_PATH}/${episodeId}`} className="underline decoration-hairline underline-offset-4">
          {episodeTitle}
        </Link>
        {" · "}
        Tap the board to place. Tap a piece to lift it off.
      </p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="w-full max-w-[22rem]">
          <div className="relative">
            <div className="board-aura" aria-hidden="true" />
            <div
              ref={stageRef}
              className="board-stage relative z-10 mx-auto"
              style={{ aspectRatio: `${level.width} / ${level.height}` }}
            >
              <canvas
                ref={canvasRef}
                className="block h-full w-full"
                style={{ aspectRatio: `${level.width} / ${level.height}` }}
              />
              <button
                type="button"
                className="absolute inset-0 z-20 cursor-crosshair touch-none rounded-[inherit] bg-transparent"
                aria-label="Place or remove a piece"
                onPointerDown={onBoardPointer}
              />
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            Budget {cost}/{LEVEL_BUDGET}
            {pendingPortalId != null ? " · Tap the twin portal." : null}
          </p>
          {errors.length > 0 ? (
            <ul className="mt-3 grid gap-1 text-sm text-danger">
              {errors.slice(0, 4).map((issue) => (
                <li key={issue.message}>{issue.message}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">Ready to save as a draft.</p>
          )}
        </div>

        <div className="min-w-0">
          <label className="grid gap-2 text-sm text-ink-muted">
            Chapter name
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setDirty(true);
                setSaved(false);
              }}
              className="field"
              maxLength={60}
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Piece family">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className="editor-chip"
                data-active={tab === item.id}
                onClick={() => {
                  setTab(item.id);
                  if (item.id === "erase") {
                    setTool({ family: "erase" });
                  }
                  if (item.id === "brick" && tool.family !== "brick") {
                    setTool({ family: "brick", kind: "glass" });
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "brick" ? (
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Brick color">
              {BRICK_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className="editor-swatch"
                  data-active={color === swatch}
                  style={{ ["--kit-color" as string]: COLOR_VAR[swatch] }}
                  aria-label={swatch}
                  onClick={() => setColor(swatch)}
                />
              ))}
            </div>
          ) : null}

          {tab === "rule" ? (
            <RulesPanel
              level={level}
              onChange={(next) => {
                commit(next);
              }}
            />
          ) : tab === "erase" ? (
            <p className="mt-5 text-sm leading-6 text-ink-muted">
              Tap any piece on the board to remove it. Portals come off as a pair.
            </p>
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {catalog.map((entry) => {
                const active = tool.family !== "erase" && tool.family === entry.family && tool.kind === entry.id;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className="editor-piece"
                      data-active={active}
                      onClick={() => selectEntry(entry)}
                    >
                      <Glyph entry={entry} />
                      <span className="min-w-0 text-left">
                        <span className="block truncate text-sm font-semibold text-ink">{entry.name}</span>
                        <span className="mt-0.5 block text-xs text-ink-muted">{entry.cost} pts</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-play" disabled={pending || !dirty} onClick={onSave}>
              {pending ? "Saving…" : "Save chapter"}
            </button>
            <button type="button" className="btn-glass" disabled={history.length === 0} onClick={undo}>
              Undo
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          {saved ? <p className="mt-3 text-sm text-ink">Saved.</p> : null}
        </div>
      </div>
    </section>
  );
}

function RulesPanel({
  level,
  onChange,
}: {
  level: Level;
  onChange: (level: Level) => void;
}) {
  function patch(rules: Partial<Level["rules"]>, lives?: number) {
    const next = cloneLevel(level);
    if (lives != null) {
      next.lives = lives;
    }
    next.rules = {
      ...next.rules,
      ...rules,
    };
    onChange(next);
  }

  return (
    <div className="mt-5 grid gap-4">
      <label className="grid gap-2 text-sm text-ink-muted">
        Lives
        <select
          className="field"
          value={level.lives}
          onChange={(event) => patch({}, Number(event.target.value))}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm text-ink-muted">
        Timer (seconds, 0 = off)
        <input
          type="number"
          min={0}
          max={600}
          className="field"
          value={level.rules.timer}
          onChange={(event) => patch({ timer: Math.max(0, Number(event.target.value) || 0) })}
        />
      </label>
      <label className="grid gap-2 text-sm text-ink-muted">
        Descend every N paddle hits (0 = off)
        <input
          type="number"
          min={0}
          max={40}
          className="field"
          value={level.rules.descend}
          onChange={(event) => patch({ descend: Math.max(0, Number(event.target.value) || 0) })}
        />
      </label>
      <label className="grid gap-2 text-sm text-ink-muted">
        Order color
        <select
          className="field"
          value={level.rules.order ?? ""}
          onChange={(event) =>
            patch({ order: event.target.value ? (event.target.value as BrickColor) : null })
          }
        >
          <option value="">None</option>
          {BRICK_COLORS.map((swatch) => (
            <option key={swatch} value={swatch}>
              {swatch}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function Glyph({ entry }: { entry: CatalogEntry }) {
  const color = TINT_VAR[entry.tint];
  if (entry.family === "brick" && !entry.glyph) {
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

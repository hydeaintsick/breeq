"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPlayReplay } from "@/app/actions/replay";
import { BreakoutPreview } from "@/components/breakout-preview";
import { parseStoredLevel } from "@/game/breakout/engine";
import type { PlayTape } from "@/game/breakout/engine/tape";
import type { Level } from "@/game/breakout/engine/types";
import type { BreakoutHandle } from "@/game/breakout/preview";

export type AdminReplayRow = {
  id: string;
  title: string;
  kind: string;
  outcome: string | null;
  score: number;
  steps: number;
  when: string;
};

const KINDS: Record<string, string> = {
  story: "Story",
  tutorial: "Tutorial",
  earn: "Earn",
};

const OUTCOMES: Record<string, string> = {
  cleared: "Cleared",
  lives: "Lives",
  timeout: "Time",
  crushed: "Crushed",
  quit: "Left",
};

function duration(steps: number) {
  const seconds = Math.max(0, Math.round(steps / 240));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function AdminReplays({ rows }: { rows: AdminReplayRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [run, setRun] = useState<{ title: string; level: Level; tape: PlayTape } | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<1 | 2 | 4>(1);
  const handleRef = useRef<BreakoutHandle | null>(null);
  const rateRef = useRef(rate);
  rateRef.current = rate;
  const levels = useMemo(() => (run ? [run.level] : []), [run]);
  const takeHandle = useCallback((handle: BreakoutHandle | null) => {
    handleRef.current = handle;
    handle?.setReplayRate(rateRef.current);
  }, []);
  const seeking = useRef(false);
  const queued = useRef<number | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    handleRef.current?.setReplayRate(rate);
  }, [rate, run]);

  const open = (id: string) => {
    setOpenId(id);
    setLoading(true);
    setFailed(false);
    setRun(null);
    setStep(0);
    setRate(1);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPlaying(!reduced);
    void getPlayReplay(id)
      .then((row) => {
        setLoading(false);
        if (!row) {
          setFailed(true);
          return;
        }
        const level = parseStoredLevel(row.level, { id: "replay", name: row.title, author: "Breeq" });
        setRun({ title: row.title, level, tape: row.tape as PlayTape });
      })
      .catch(() => {
        setLoading(false);
        setFailed(true);
      });
  };

  const scrub = (value: number) => {
    setPlaying(false);
    setStep(value);
    queued.current = value;
    if (frame.current) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0;
      const target = queued.current;
      if (target !== null) handleRef.current?.seek(target);
    });
  };

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Replays</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
        The board is the real game, replayed from the paddle inputs. Story, tutorial, and Earn runs from the last
        sessions.
      </p>

      {openId ? (
        <div className="admin-replay glass mt-4 p-4">
          {loading ? <p className="text-sm text-ink-muted">Loading the run…</p> : null}
          {failed ? <p className="text-sm text-ink-muted">This run can&apos;t be replayed.</p> : null}
          {run ? (
            <>
              <BreakoutPreview
                key={openId}
                levels={levels}
                replay={run.tape}
                seed={run.tape.seed}
                followQuery={false}
                loop={false}
                showCaption={false}
                sound={false}
                haptics={false}
                paused={!playing}
                onReplay={(next) => {
                  if (!seeking.current) setStep(next);
                }}
                onHandle={takeHandle}
              />
              <div className="admin-replay-controls">
                <button type="button" className="btn-play min-h-11" onClick={() => setPlaying((value) => !value)}>
                  {playing ? "Pause" : "Play"}
                </button>
                {([1, 2, 4] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="btn-glass min-h-11"
                    data-on={rate === value ? "true" : "false"}
                    aria-pressed={rate === value}
                    onClick={() => setRate(value)}
                  >
                    {value}×
                  </button>
                ))}
                <button
                  type="button"
                  className="btn-glass min-h-11"
                  onClick={() => {
                    setOpenId(null);
                    setRun(null);
                    setPlaying(false);
                  }}
                >
                  Close
                </button>
              </div>
              <label className="admin-replay-scrub">
                <input
                  type="range"
                  min={0}
                  max={run.tape.steps}
                  step={1}
                  value={Math.min(step, run.tape.steps)}
                  aria-label="Replay position"
                  aria-valuetext={duration(step)}
                  onPointerDown={() => {
                    seeking.current = true;
                  }}
                  onPointerUp={() => {
                    seeking.current = false;
                  }}
                  onPointerCancel={() => {
                    seeking.current = false;
                  }}
                  onChange={(event) => scrub(Number(event.target.value))}
                />
                <span className="tabular-nums text-xs text-ink-muted">
                  {duration(step)} / {duration(run.tape.steps)}
                </span>
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No recorded runs yet.</p>
      ) : (
        <ul className="admin-replay-list">
          {rows.map((row) => (
            <li key={row.id} className="admin-replay-row">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{row.title}</p>
                <p className="text-xs leading-5 text-ink-muted">
                  {KINDS[row.kind] ?? row.kind}
                  {" · "}
                  {row.outcome ? (OUTCOMES[row.outcome] ?? row.outcome) : "In progress"}
                  {" · "}
                  {duration(row.steps)}
                  {" · "}
                  {row.score.toLocaleString("en-US")}
                </p>
                <p className="text-xs text-ink-muted">{row.when}</p>
              </div>
              <button type="button" className="btn-glass min-h-11 shrink-0" onClick={() => open(row.id)}>
                Replay
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

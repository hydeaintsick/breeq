"use client";

import { useState } from "react";
import Link from "next/link";
import { serializeLevel, type Level } from "@/game/breakout/engine";
import { WallEditor } from "@/components/wall-editor";
import { saveChapter } from "@/app/actions/editor";
import { ADMIN_EDITOR_PATH } from "@/lib/auth/paths";
import { CHAPTER_INTRO_MAX } from "@/lib/chapter-intro";

/** The story chapter editor: the wall editor plus the chapter's own fields. */
export function LevelEditor({
  episodeId,
  chapterId,
  episodeTitle,
  initialTitle,
  initialIntro = "",
  initialXpReward,
  initialLevel,
}: {
  episodeId: string;
  chapterId: string;
  episodeTitle: string;
  initialTitle: string;
  initialIntro?: string;
  initialXpReward: number;
  initialLevel: Level;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [intro, setIntro] = useState(initialIntro);
  const [xpReward, setXpReward] = useState(initialXpReward);
  const [level, setLevel] = useState(initialLevel);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function touch() {
    setDirty(true);
    setSaved(false);
    setError(null);
  }

  async function onSave() {
    setPending(true);
    setError(null);
    try {
      const result = await saveChapter({
        episodeId,
        chapterId,
        title,
        intro,
        xpReward,
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

      <div className="mt-8">
        <WallEditor
          level={level}
          onChange={(next) => {
            setLevel(next);
            touch();
          }}
          readyLabel="Ready to save as a draft."
          fields={
            <>
              <label className="grid gap-2 text-sm text-ink-muted">
                Chapter name
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    touch();
                  }}
                  className="field"
                  maxLength={60}
                />
              </label>
              <label className="mt-4 grid gap-2 text-sm text-ink-muted">
                <span className="flex items-baseline justify-between gap-3">
                  Story text
                  <span className="tabular-nums text-xs">
                    {intro.length}/{CHAPTER_INTRO_MAX}
                  </span>
                </span>
                <textarea
                  value={intro}
                  onChange={(event) => {
                    setIntro(event.target.value);
                    touch();
                  }}
                  className="field min-h-[5.5rem] resize-y leading-6"
                  maxLength={CHAPTER_INTRO_MAX}
                  rows={3}
                  placeholder="One or two sentences of Kal's story. Shown on the chapter card and before the run."
                />
              </label>
              <label className="mt-4 grid gap-2 text-sm text-ink-muted">
                XP for a clear
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step={10}
                  value={xpReward}
                  onChange={(event) => {
                    setXpReward(Number(event.target.value));
                    touch();
                  }}
                  className="field"
                />
              </label>
            </>
          }
          actions={({ undo, canUndo }) => (
            <>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button type="button" className="btn-play" disabled={pending || !dirty} onClick={onSave}>
                  {pending ? "Saving…" : "Save chapter"}
                </button>
                <button type="button" className="btn-glass" disabled={!canUndo} onClick={undo}>
                  Undo
                </button>
              </div>
              {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
              {saved ? <p className="mt-3 text-sm text-ink">Saved.</p> : null}
            </>
          )}
        />
      </div>
    </section>
  );
}

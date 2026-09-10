"use client";

import { useActionState } from "react";
import { createChapter } from "@/app/actions/editor";

export function CreateChapterForm({ episodeId }: { episodeId: string }) {
  const action = createChapter.bind(null, episodeId);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="glass mt-8 grid gap-4 p-5 sm:p-6">
      <label className="grid gap-2 text-sm text-ink-muted">
        Chapter name
        <input
          name="title"
          required
          minLength={2}
          maxLength={60}
          placeholder="Chapter 1"
          className="field"
        />
      </label>
      <label className="grid gap-2 text-sm text-ink-muted">
        XP for a clear
        <input
          name="xpReward"
          type="number"
          min={0}
          max={10000}
          step={10}
          defaultValue={100}
          className="field"
        />
      </label>
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button type="submit" className="btn-play w-fit" disabled={pending}>
        {pending ? "Creating…" : "Create chapter"}
      </button>
    </form>
  );
}

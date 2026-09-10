"use client";

import { useActionState } from "react";
import { createEpisode } from "@/app/actions/editor";

export function CreateEpisodeForm() {
  const [state, action, pending] = useActionState(createEpisode, null);

  return (
    <form action={action} className="glass mt-8 grid gap-4 p-5 sm:p-6">
      <label className="grid gap-2 text-sm text-ink-muted">
        Episode name
        <input
          name="title"
          required
          minLength={2}
          maxLength={60}
          placeholder="Episode 1"
          className="field"
        />
      </label>
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button type="submit" className="btn-play w-fit" disabled={pending}>
        {pending ? "Creating…" : "Create episode"}
      </button>
    </form>
  );
}

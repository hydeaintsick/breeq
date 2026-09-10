"use client";

import { useActionState, useState } from "react";
import { createEpisode } from "@/app/actions/editor";
import { compressImageFile } from "@/lib/compress-image";

export function CreateEpisodeForm() {
  const [state, action, pending] = useActionState(createEpisode, null);
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <form
      className="glass mt-8 grid gap-4 p-5 sm:p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setLocalError(null);
        const data = new FormData(event.currentTarget);
        const file = data.get("image");
        if (file instanceof File && file.size > 0) {
          try {
            data.set("image", await compressImageFile(file));
          } catch (error) {
            setLocalError(error instanceof Error ? error.message : "Could not compress the image.");
            return;
          }
        }
        action(data);
      }}
    >
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
      <label className="grid gap-2 text-sm text-ink-muted">
        Story background
        <input name="image" type="file" accept="image/*" className="field min-h-11 py-2" />
      </label>
      <p className="text-sm leading-6 text-ink-muted">
        Optional. Compressed to stay under 10 MB, then stored in Cloudinary.
      </p>
      {localError || state?.error ? (
        <p className="text-sm text-danger">{localError ?? state?.error}</p>
      ) : null}
      <button type="submit" className="btn-play w-fit" disabled={pending}>
        {pending ? "Creating…" : "Create episode"}
      </button>
    </form>
  );
}

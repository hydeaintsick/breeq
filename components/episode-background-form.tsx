"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { updateEpisodeBackground } from "@/app/actions/editor";
import { compressImageFile } from "@/lib/compress-image";

export function EpisodeBackgroundForm({
  episodeId,
  backgroundUrl,
}: {
  episodeId: string;
  backgroundUrl: string | null;
}) {
  const bound = updateEpisodeBackground.bind(null, episodeId);
  const [state, action, pending] = useActionState(bound, null);
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <form
      className="glass mt-8 grid gap-4 p-5 sm:p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setLocalError(null);
        const data = new FormData(event.currentTarget);
        const file = data.get("image");
        if (!(file instanceof File) || file.size === 0) {
          setLocalError("Choose an image.");
          return;
        }
        try {
          data.set("image", await compressImageFile(file));
        } catch (error) {
          setLocalError(error instanceof Error ? error.message : "Could not compress the image.");
          return;
        }
        action(data);
      }}
    >
      <p className="text-sm font-medium text-ink">Story background</p>
      {backgroundUrl ? (
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink">
          <Image
            src={backgroundUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40rem"
          />
        </div>
      ) : (
        <p className="text-sm leading-6 text-ink-muted">No photo yet. Upload one for this episode.</p>
      )}
      <label className="grid gap-2 text-sm text-ink-muted">
        Image
        <input name="image" type="file" accept="image/*" required className="field min-h-11 py-2" />
      </label>
      <p className="text-sm leading-6 text-ink-muted">
        Compressed to stay under 10 MB. Stored in the Cloudinary story-backgrounds folder.
      </p>
      {localError || state?.error ? (
        <p className="text-sm text-danger">{localError ?? state?.error}</p>
      ) : null}
      <button type="submit" className="btn-play w-fit" disabled={pending}>
        {pending ? "Uploading…" : backgroundUrl ? "Replace photo" : "Upload photo"}
      </button>
    </form>
  );
}

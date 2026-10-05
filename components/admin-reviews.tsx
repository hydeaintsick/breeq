"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { setReviewOffer } from "@/app/actions/review";
import { ReviewPromptSheet, type ReviewPhase } from "@/components/review-sheet";
import { REVIEW_EVERY_MAX, REVIEW_GEMS_MAX } from "@/lib/review";

/** The cadence and the reward, plus a preview of the sheet players see. */
export function AdminReviews({ every, gems }: { every: number; gems: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [everyField, setEveryField] = useState(String(every));
  const [gemsField, setGemsField] = useState(String(gems));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [phase, setPhase] = useState<ReviewPhase>("ask");
  const [note, setNote] = useState<string | null>(null);

  function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const nextEvery = Number(everyField);
    const nextGems = Number(gemsField);
    start(async () => {
      const result = await setReviewOffer(nextEvery, nextGems);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEveryField(String(result.every));
      setGemsField(String(result.gems));
      setSaved(true);
      router.refresh();
    });
  }

  function openPreview() {
    setPhase("ask");
    setNote(null);
    setPreview(true);
  }

  function closePreview(label: string) {
    setPreview(false);
    setNote(label);
  }

  return (
    <div className="glass mt-8 p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-ink">The ask</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
        {every === 0
          ? "The ask is off. Players are not shown the sheet."
          : `The Android app asks after every ${every} new story chapters, and pays ${gems} gems.`}
      </p>
      <form className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,10rem)_auto] sm:items-end" onSubmit={save}>
        <label className="grid gap-2 text-sm text-ink-muted">
          Every N chapters
          <input
            className="field tabular-nums"
            type="number"
            inputMode="numeric"
            min={0}
            max={REVIEW_EVERY_MAX}
            step={1}
            value={everyField}
            onChange={(event) => setEveryField(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm text-ink-muted">
          Gems
          <input
            className="field tabular-nums"
            type="number"
            inputMode="numeric"
            min={1}
            max={REVIEW_GEMS_MAX}
            step={1}
            value={gemsField}
            onChange={(event) => setGemsField(event.target.value)}
          />
        </label>
        <button type="submit" className="btn-play min-h-11" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      <p className="mt-3 text-xs leading-5 text-ink-muted">
        0 turns the ask off. Not now waits another N chapters. Don&apos;t ask again, and giving the 5 stars, close it for
        good.
      </p>
      {error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-3 text-sm text-ink" role="status">
          Saved.
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-glass min-h-11" onClick={openPreview}>
          Preview the sheet
        </button>
        {note ? <p className="text-sm text-ink-muted">{note}</p> : null}
      </div>
      {preview ? (
        <ReviewPromptSheet
          phase={phase}
          gems={Number(gemsField) > 0 ? Number(gemsField) : gems}
          pending={false}
          error={null}
          storeOpen={false}
          preview
          onRate={() => setPhase("thanks")}
          onLater={() => closePreview("Preview closed with Not now.")}
          onNever={() => closePreview("Preview closed with Don't ask me again.")}
          onClose={() => closePreview(phase === "thanks" ? "Preview closed after 5 stars." : "Preview closed.")}
        />
      ) : null}
    </div>
  );
}

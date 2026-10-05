"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { sendPushNotification } from "@/app/actions/push";
import { PushPromptSheet } from "@/components/push-prompt";
import { PUSH_BODY_MAX, PUSH_TITLE_MAX } from "@/lib/push";

export type PushHistoryRow = {
  id: string;
  title: string;
  body: string;
  url: string;
  author: string;
  recipients: number | null;
  error: string | null;
  createdAt: string;
};

/** Compose a push for everyone who turned notifications on, and see what they were sent. */
export function AdminNotifications({
  ready,
  missing,
  history,
}: {
  ready: boolean;
  missing: string[];
  history: PushHistoryRow[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/game/story");
  const [step, setStep] = useState<"write" | "confirm">("write");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [preview, setPreview] = useState(false);

  function review() {
    setMessage(null);
    if (!title.trim() || !body.trim()) {
      setMessage({ text: "Add a title and a message first.", error: true });
      return;
    }
    setStep("confirm");
  }

  async function send() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await sendPushNotification({ title, body, url });
      if ("error" in result) {
        setMessage({ text: result.error, error: true });
        setStep("write");
      } else {
        const count =
          result.recipients === null
            ? "Sent."
            : `Sent to ${result.recipients.toLocaleString("en-US")} ${result.recipients === 1 ? "subscriber" : "subscribers"}.`;
        setMessage({ text: count });
        setTitle("");
        setBody("");
        setStep("write");
        router.refresh();
      }
    } catch {
      setMessage({ text: "Could not send. Try again.", error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 grid gap-4">
      {!ready ? (
        <div className="glass p-6">
          <h2 className="text-lg font-semibold tracking-tight text-ink">OneSignal is not connected</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Add {missing.join(" and ")} on the server, then redeploy. The player prompt stays hidden until the App ID is
            set. The REST key is the app key from Keys &amp; IDs — it starts with os_v2_app_.
          </p>
        </div>
      ) : null}

      <form
        className="glass grid gap-4 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (step === "write") review();
          else void send();
        }}
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Send a notification</h2>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            Everyone who turned notifications on, on the site and in the Android app. A tap opens the page below.
          </p>
        </div>

        {step === "write" ? (
          <>
            <label className="grid gap-2 text-sm text-ink-muted">
              Title
              <input
                className="field"
                value={title}
                maxLength={PUSH_TITLE_MAX}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="A new chapter is open"
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-muted">
              Message
              <textarea
                className="field min-h-24 resize-y"
                value={body}
                maxLength={PUSH_BODY_MAX}
                onChange={(event) => setBody(event.target.value)}
                placeholder="The next wall is on the shelf."
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-muted">
              Opens
              <input
                className="field"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="/game/story"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
            <p className="text-sm text-ink-muted">Leave it empty to open Play. Only pages on breeq.space.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="btn-play min-h-11" disabled={!ready || busy}>
                Review
              </button>
              <button type="button" className="btn-glass min-h-11" onClick={() => setPreview(true)}>
                Preview the ask
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-hairline bg-white/50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Players will see</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-ink">{title.trim()}</p>
              <p className="mt-1 text-sm leading-6 text-ink-muted">{body.trim()}</p>
              <p className="mt-3 text-sm text-ink-muted">{url.trim() || "/game/menu"}</p>
            </div>
            <p className="text-sm leading-6 text-ink-muted">
              This goes out now to everyone subscribed. It cannot be unsent.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="btn-play min-h-11" disabled={busy}>
                {busy ? "Sending…" : "Send"}
              </button>
              <button
                type="button"
                className="btn-glass min-h-11"
                disabled={busy}
                onClick={() => {
                  setStep("write");
                  setMessage(null);
                }}
              >
                Back
              </button>
            </div>
          </>
        )}

        {message ? (
          <p className={`text-sm ${message.error ? "text-danger" : "text-ink-muted"}`} role={message.error ? "alert" : "status"}>
            {message.text}
          </p>
        ) : null}
      </form>

      <section className="glass p-6">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Sent</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Nothing sent yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {history.map((row) => (
              <li key={row.id} className="border-t border-hairline pt-3 first:border-t-0 first:pt-0">
                <p className="font-medium text-ink">{row.title}</p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">{row.body}</p>
                <p className="mt-2 text-xs text-ink-muted">
                  {row.createdAt}
                  {" · "}
                  {row.author}
                  {" · "}
                  {row.error
                    ? row.error
                    : row.recipients === null
                      ? "Sent"
                      : `${row.recipients.toLocaleString("en-US")} ${row.recipients === 1 ? "subscriber" : "subscribers"}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {preview
        ? createPortal(
            <PushPromptSheet
              phase="ask"
              pending={false}
              error={null}
              preview
              onAccept={() => setPreview(false)}
              onLater={() => setPreview(false)}
              onClose={() => setPreview(false)}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

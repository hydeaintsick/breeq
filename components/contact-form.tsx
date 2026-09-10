"use client";

import { type FormEvent, useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-ink">
        Message received. We will get back to you when the first levels go live.
      </p>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm text-ink-muted">
        Name
        <input
          name="name"
          required
          className="field"
        />
      </label>
      <label className="grid gap-2 text-sm text-ink-muted">
        Email
        <input
          name="email"
          type="email"
          required
          className="field"
        />
      </label>
      <label className="grid gap-2 text-sm text-ink-muted">
        Message
        <textarea
          name="message"
          required
          rows={5}
          className="field h-auto py-3"
        />
      </label>
      <button type="submit" className="btn-play play-shimmer w-fit">
        Send
      </button>
    </form>
  );
}

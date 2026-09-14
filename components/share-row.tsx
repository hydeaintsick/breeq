"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  referralPath,
  referralUrl,
  SHARE_CHANNEL_LABEL,
  SHARE_CHANNELS,
  shareHref,
  type ShareChannel,
} from "@/lib/share";

/**
 * Four networks and a copy button, each carrying the player's referral link
 * tagged with the button it left from. Plain anchors: a tap is a top-level
 * navigation, which is what lets iOS and Android hand the universal link to the
 * installed app instead of the browser.
 */
export function ShareRow({ code, text }: { code: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  /** The href is resolved on the tap: the origin is only known in the browser. */
  function open(e: MouseEvent<HTMLAnchorElement>, channel: ShareChannel) {
    e.stopPropagation();
    e.currentTarget.href = shareHref(channel, referralUrl(window.location.origin, code, channel), text);
  }

  async function copy(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    const url = referralUrl(window.location.origin, code, "copy");
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the link is still in the buttons above.
    }
  }

  return (
    <ul className="share-row" aria-label="Share">
      {SHARE_CHANNELS.map((channel) => (
        <li key={channel}>
          <a
            className="share-btn"
            href={shareHref(channel, referralPath(code, channel), text)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${SHARE_CHANNEL_LABEL[channel]}`}
            title={SHARE_CHANNEL_LABEL[channel]}
            onClick={(e) => open(e, channel)}
          >
            <ShareGlyph channel={channel} />
          </a>
        </li>
      ))}
      <li>
        <button
          type="button"
          className="share-btn"
          data-copied={copied}
          aria-label={copied ? "Link copied" : "Copy link"}
          title="Copy link"
          onClick={(e) => void copy(e)}
        >
          {copied ? <CheckGlyph /> : <LinkGlyph />}
        </button>
      </li>
    </ul>
  );
}

function ShareGlyph({ channel }: { channel: ShareChannel }) {
  switch (channel) {
    case "x":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z"
          />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M13.6 21.5v-8.2h2.75l.42-3.2H13.6V8.05c0-.93.26-1.56 1.59-1.56h1.7V3.63c-.3-.04-1.3-.13-2.48-.13-2.45 0-4.13 1.5-4.13 4.24v2.36H7.5v3.2h2.78v8.2h3.32Z"
          />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2.2a9.8 9.8 0 0 0-8.4 14.85L2.2 21.8l4.9-1.28A9.8 9.8 0 1 0 12 2.2Zm0 1.75a8.05 8.05 0 1 1-4.1 14.98l-.3-.18-2.9.76.77-2.8-.19-.3A8.05 8.05 0 0 1 12 3.95ZM8.8 7.4c-.2 0-.5.07-.77.36-.27.29-1.02 1-1.02 2.42 0 1.43 1.04 2.8 1.19 3 .14.19 2.02 3.08 4.9 4.32 2.42.95 2.92.76 3.44.71.53-.05 1.7-.7 1.94-1.37.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.56-.34-.29-.14-1.7-.84-1.97-.94-.26-.1-.46-.14-.65.15-.19.29-.75.94-.92 1.13-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.6-2-.17-.3-.02-.45.12-.6l.44-.51c.14-.17.19-.3.29-.5.1-.19.05-.36-.02-.5l-.89-2.16c-.23-.56-.47-.48-.65-.49L8.8 7.4Z"
          />
        </svg>
      );
    case "telegram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21.94 4.55 18.9 19.05c-.23 1.02-.83 1.27-1.68.79l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73 8.6-7.77c.38-.33-.08-.52-.58-.19L7.13 13.04 2.55 11.6c-1-.31-1.02-1 .2-1.48L20.66 3.2c.83-.31 1.55.2 1.28 1.35Z"
          />
        </svg>
      );
  }
}

function LinkGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 13.5a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 0 0-5.66-5.66l-1.41 1.41M13.5 10.5a4 4 0 0 0-5.66 0l-2.83 2.83a4 4 0 0 0 5.66 5.66l1.41-1.41"
      />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 12.5 4.5 4.5L19 7.5"
      />
    </svg>
  );
}

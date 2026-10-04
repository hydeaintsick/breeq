import type { Metadata } from "next";
import { BreakoutPreview } from "@/components/breakout-preview";
import { LogoMark } from "@/components/logo-mark";
import { partnerEmail, partnerPath } from "@/lib/partner";

/**
 * Partner card for Plypto. Framed by their app, kept out of search.
 * The whole card is the tap: a new tab on `/p/plypto`, which sets the
 * partner cookie. Pass `origin_user_email` on this page and Play carries it.
 */

export const metadata: Metadata = {
  title: "Play",
  description: "Break the wall. A brick breaker built by players.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PlyptoEmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ origin_user_email?: string | string[]; email?: string | string[] }>;
}) {
  const params = await searchParams;
  const href = partnerPath(
    "plypto",
    partnerEmail(first(params.origin_user_email) ?? first(params.email)),
  );

  return (
    <div className="plypto-embed">
      <a
        className="plypto-card"
        href={href}
        target="_blank"
        rel="noopener"
        aria-label="Play Breeq. Break the wall. Players build it. You clear it."
      >
        <div className="plypto-stage" aria-hidden="true">
          <BreakoutPreview controls="auto" followQuery={false} showCaption={false} showHud loop />
        </div>
        <div className="plypto-bar">
          <p className="plypto-kicker">
            <LogoMark size={16} />
            Breeq
            <span className="plypto-dot" aria-hidden="true" />
            Free to play
          </p>
          <h1 className="plypto-title">
            <span className="text-neon">Break</span> the wall.
          </h1>
          <p className="plypto-lede">Players build it. You clear it.</p>
          <span className="btn-play play-shimmer plypto-play">
            Play
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
              <path
                d="M4.5 11.5 11.5 4.5M7 4.5h4.5V9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </a>
    </div>
  );
}

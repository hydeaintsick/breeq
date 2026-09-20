import type { CSSProperties } from "react";

/**
 * The gem: a shard of light-glass, cut like a brick's corner. Cyan-to-violet
 * body, a white facet line, a soft glow. Sized by `font-size` like an icon.
 */
export function GemGlyph({ className = "gem-glyph", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="gem-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--neon-cyan)" />
          <stop offset="55%" stopColor="var(--neon-blue)" />
          <stop offset="100%" stopColor="var(--neon-violet)" />
        </linearGradient>
        <linearGradient id="gem-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <path d="M6.2 3.5h11.6L22 9.3 12 21.5 2 9.3z" fill="url(#gem-body)" />
      <path d="M6.2 3.5h11.6L22 9.3H2z" fill="url(#gem-top)" />
      <path d="M2 9.3h20L12 21.5z" fill="#05060c" opacity="0.18" />
      <path d="M8.6 9.3 12 21.5 15.4 9.3 12 3.5z" fill="#ffffff" opacity="0.22" />
      <path d="M6.2 3.5h11.6L22 9.3 12 21.5 2 9.3z" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
    </svg>
  );
}

/**
 * The energy bolt: a shard of plasma, amber at the tip cooling to pink, a
 * white facet down its edge. Sized by `font-size` like an icon.
 */
export function BoltGlyph({ className = "bolt-glyph", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="bolt-body" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="28%" stopColor="var(--neon-amber)" />
          <stop offset="100%" stopColor="var(--neon-pink)" />
        </linearGradient>
      </defs>
      <path d="M13.6 1.8 4.6 13.4h6.2L9.4 22.2l10-12.4h-6.3z" fill="url(#bolt-body)" />
      <path d="M13.6 1.8 4.6 13.4h6.2l-.7 3.2 3.1-6.8h-3.6z" fill="#ffffff" opacity="0.28" />
      <path
        d="M13.6 1.8 4.6 13.4h6.2L9.4 22.2l10-12.4h-6.3z"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.65"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The heart's outline, shared by the HUD lives and the revive mark. */
export const HEART_PATH =
  "M12 20.6c-.3 0-.6-.1-.8-.3C7.2 17 2.5 13.2 2.5 8.6 2.5 5.8 4.7 3.6 7.4 3.6c1.8 0 3.5 1 4.6 2.5 1.1-1.5 2.8-2.5 4.6-2.5 2.7 0 4.9 2.2 4.9 5 0 4.6-4.7 8.4-8.7 11.7-.2.2-.5.3-.8.3z";

/**
 * The heart: a life. Plasma glass like the bolt — white at the highlight,
 * pink through the body, the danger red at the tip — with a white hairline.
 * `hollow` draws the outline only (a life lost). Sized by `font-size`.
 */
export function HeartGlyph({ className = "heart-glyph", style, hollow = false }: { className?: string; style?: CSSProperties; hollow?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} data-hollow={hollow ? "true" : undefined} aria-hidden="true">
      <defs>
        <linearGradient id="heart-body" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="var(--neon-pink)" />
          <stop offset="100%" stopColor="var(--danger)" />
        </linearGradient>
      </defs>
      <path d={HEART_PATH} fill={hollow ? "none" : "url(#heart-body)"} />
      {hollow ? null : <path d="M7.4 5.6c-1.4 0-2.6.9-3 2.2 1.1-.6 2.4-.7 3.6-.1.8-1 1.8-1.7 2.9-1.9-1-.2-2.2-.2-3.5-.2z" fill="#ffffff" opacity="0.35" />}
      <path d={HEART_PATH} fill="none" stroke="#ffffff" strokeOpacity={hollow ? 0.55 : 0.7} strokeWidth={hollow ? 1.2 : 0.8} strokeLinejoin="round" />
    </svg>
  );
}

/** The Ethereum diamond, in ink, for balances and payouts. */
export function EthGlyph({ className = "eth-glyph", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <path d="M12 2.5 5.4 12.6 12 16.4l6.6-3.8z" fill="currentColor" opacity="0.55" />
      <path d="M12 2.5v13.9l6.6-3.8z" fill="currentColor" opacity="0.9" />
      <path d="M12 17.9 5.4 14l6.6 7.5 6.6-7.5z" fill="currentColor" opacity="0.55" />
      <path d="M12 17.9v3.6L18.6 14z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

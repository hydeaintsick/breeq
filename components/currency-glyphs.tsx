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

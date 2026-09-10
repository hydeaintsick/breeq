/** Three neon bricks and a ball — the game in 22px. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <rect x="2" y="3" width="5.4" height="3.2" rx="1" fill="var(--neon-pink)" />
      <rect x="8.3" y="3" width="5.4" height="3.2" rx="1" fill="var(--neon-violet)" />
      <rect x="14.6" y="3" width="5.4" height="3.2" rx="1" fill="var(--neon-blue)" />
      <rect x="5.15" y="7.4" width="5.4" height="3.2" rx="1" fill="var(--neon-cyan)" />
      <rect x="11.45" y="7.4" width="5.4" height="3.2" rx="1" fill="var(--neon-lime)" />
      <circle cx="11" cy="14.6" r="1.7" fill="var(--ink)" />
      <rect x="7" y="18" width="8" height="2" rx="1" fill="var(--ink)" />
    </svg>
  );
}

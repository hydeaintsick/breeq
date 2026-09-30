import type { Leaderboard, LeaderboardEntry } from "@/lib/leaderboard";

function entryLabel(entry: LeaderboardEntry) {
  const who = entry.you ? `${entry.name} (you)` : entry.name;
  return `${who}, rank ${entry.rank}, level ${entry.level}`;
}

function PodiumIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <rect x="6.15" y="2.4" width="3.7" height="11.2" rx="0.7" fill="currentColor" />
      <rect x="1.4" y="6.3" width="3.7" height="7.3" rx="0.7" fill="currentColor" opacity="0.55" />
      <rect x="10.9" y="8.2" width="3.7" height="5.4" rx="0.7" fill="currentColor" opacity="0.38" />
    </svg>
  );
}

function Place({ entry }: { entry: LeaderboardEntry }) {
  return (
    <li
      className="leaderboard-place"
      data-place={entry.rank}
      data-you={entry.you ? "true" : undefined}
      aria-label={entryLabel(entry)}
    >
      <span className="leaderboard-place-rank" aria-hidden="true">
        {entry.rank}
      </span>
      <span className="leaderboard-place-name" title={entry.name} aria-hidden="true">
        {entry.name}
      </span>
      {entry.you ? (
        <span className="leaderboard-you" aria-hidden="true">
          You
        </span>
      ) : null}
      <div className="leaderboard-brick" aria-hidden="true">
        <span className="leaderboard-brick-level">{entry.level}</span>
        <span className="leaderboard-brick-caption">Level</span>
      </div>
    </li>
  );
}

function Row({ entry }: { entry: LeaderboardEntry }) {
  return (
    <li className="leaderboard-row" data-you={entry.you ? "true" : undefined} aria-label={entryLabel(entry)}>
      <span className="leaderboard-rank" aria-hidden="true">
        {entry.rank}
      </span>
      <span className="leaderboard-name" aria-hidden="true">
        <span className="leaderboard-name-text" title={entry.name}>
          {entry.name}
        </span>
        {entry.you ? <span className="leaderboard-you">You</span> : null}
      </span>
      <span className="leaderboard-level" aria-hidden="true">
        <span className="leaderboard-level-word">Level</span>
        <span className="leaderboard-level-n">{entry.level}</span>
      </span>
    </li>
  );
}

/** The header disclosure: a neon podium, then the rest of the board. */
export function LeaderboardPanel({ id, board }: { id: string; board: Leaderboard }) {
  const podium = board.entries.filter((entry) => entry.rank <= 3);
  const rest = board.entries.filter((entry) => entry.rank > 3);

  return (
    <div className="pointer-events-none relative z-10 mx-auto mt-2 flex w-full max-w-6xl justify-end">
      <section id={id} className="leaderboard glass-sheet pointer-events-auto" aria-label="Leaderboard" data-header-menu="">
        <p className="leaderboard-kicker text-xs font-medium uppercase tracking-[0.2em] text-accent">Leaderboard</p>
        {podium.length > 0 ? (
          <ol className="leaderboard-podium" data-count={podium.length}>
            {podium.map((entry) => (
              <Place key={entry.rank} entry={entry} />
            ))}
          </ol>
        ) : null}
        {rest.length > 0 ? (
          <ol className="leaderboard-list" start={rest[0].rank}>
            {rest.map((entry) => (
              <Row key={entry.rank} entry={entry} />
            ))}
          </ol>
        ) : null}
        {board.you ? (
          <ol className="leaderboard-list leaderboard-pinned" start={board.you.rank}>
            <Row entry={board.you} />
          </ol>
        ) : null}
        {board.entries.length === 0 && !board.you ? <p className="leaderboard-empty">No players yet.</p> : null}
      </section>
    </div>
  );
}

export function LeaderboardIcon() {
  return <PodiumIcon />;
}

import Link from "next/link";

export type AdminPlayerRow = {
  id: string;
  username: string;
  email: string | null;
  role: string;
  joined: string;
  playTime: string;
  country: string;
  channel: string;
  device: string | null;
};

export function AdminPlayers({ rows }: { rows: AdminPlayerRow[] }) {
  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-ink-muted">No players match.</p>;
  }

  return (
    <div className="admin-table-wrap mt-6">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Joined</th>
            <th>Play time</th>
            <th>Country</th>
            <th>Support</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <Link href={`/admin/players/${row.id}`} className="inline-flex min-h-11 flex-col justify-center underline decoration-hairline underline-offset-4">
                  <span className="font-medium text-ink">
                    {row.username}
                    {row.role === "ADMIN" ? <span className="ml-2 font-mono text-[0.62rem] tracking-[0.1em] text-accent no-underline">ADMIN</span> : null}
                  </span>
                  <span className="text-xs text-ink-muted">{row.email ?? "—"}</span>
                </Link>
              </td>
              <td className="whitespace-nowrap text-ink-muted">{row.joined}</td>
              <td className="whitespace-nowrap">{row.playTime}</td>
              <td className="whitespace-nowrap">{row.country}</td>
              <td>
                <span className="block whitespace-nowrap">{row.channel}</span>
                {row.device ? <span className="block text-xs text-ink-muted">{row.device}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

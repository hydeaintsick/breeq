import Link from "next/link";
import { ADMIN_PLAYERS_PATH } from "@/lib/auth/paths";
import type { AdminActivity } from "@/lib/admin-activity";

/** A short feed of admin activity. Each row is one thing that just happened. */
export function AdminActivityList({
  items,
  linked = true,
}: {
  items: AdminActivity[];
  /** The whole row opens the player. Off on that player's own page. */
  linked?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-3 grid gap-2">
      {items.map((item) => {
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              {linked ? (
                <p className="min-w-0 flex-1 break-words font-medium text-ink">{item.username}</p>
              ) : (
                <p className="min-w-0 flex-1 break-words text-sm text-ink">{item.what}</p>
              )}
              <time className="shrink-0 text-xs tabular-nums text-ink-muted" dateTime={item.iso}>
                {item.at}
              </time>
            </div>
            {linked ? <p className="mt-1 break-words text-sm text-ink">{item.what}</p> : null}
            {item.detail ? <p className="text-xs text-ink-muted">{item.detail}</p> : null}
          </>
        );
        return (
          <li key={item.id}>
            {linked ? (
              <Link href={`${ADMIN_PLAYERS_PATH}/${item.userId}`} className="glass block min-h-11 px-4 py-3">
                {body}
              </Link>
            ) : (
              <div className="glass px-4 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

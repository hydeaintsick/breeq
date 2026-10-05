import type { Metadata } from "next";
import { AdminNotifications } from "@/components/admin-notifications";
import { requireAdmin } from "@/lib/auth/session";
import { formatAdminWhen } from "@/lib/admin-time";
import { pushCredentials } from "@/lib/onesignal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Notifications — Admin",
  description: "Send a push notification to players who opted in.",
};

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const credentials = pushCredentials();
  const rows = await prisma.pushMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const history = rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    url: row.url,
    author: row.author,
    recipients: row.recipients,
    error: row.error,
    createdAt: formatAdminWhen(row.createdAt),
  }));

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Notifications</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
        One message to every player who turned push on. Web and Android go out together. Players are asked once, after
        their first story chapter — not after the tutorial.
      </p>
      <AdminNotifications ready={credentials.ready} missing={credentials.missing} history={history} />
    </section>
  );
}

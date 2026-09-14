import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/** The admin space: the side menu plus the page. The story editor keeps its own full-width layout. */
export default async function AdminSpaceLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const pending = await prisma.withdrawal.count({ where: { status: "PENDING" } });

  return (
    <div className="admin-shell">
      <AdminNav pending={pending} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

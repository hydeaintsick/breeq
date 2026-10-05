import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
import { recentAdminActivity } from "@/lib/admin-activity";
import { getAdminBrief } from "@/lib/admin-brief";
import { requireAdmin } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/tutorial";

export const metadata: Metadata = {
  title: "Admin — Breeq",
  description: "Breeq admin dashboard.",
};

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const [brief, settings, activity] = await Promise.all([getAdminBrief(), getSiteSettings(), recentAdminActivity()]);

  return (
    <AdminDashboard
      label={user.username ?? user.name ?? "Admin"}
      earnEnabled={settings.earnEnabled}
      energyEnabled={settings.energyEnabled}
      tutorialEnabled={settings.tutorialEnabled}
      brief={brief}
      activity={activity}
    />
  );
}

import { AdminHeader } from "@/components/admin-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-clip">
        {children}
      </div>
    </>
  );
}

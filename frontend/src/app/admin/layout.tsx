import AdminSidebar from '@/components/features/dashboards/AdminSidebar';
import { RoleDashboardShell } from '@/components/layout/RoleDashboardShell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleDashboardShell requiredRole="admin" sidebar={<AdminSidebar />}>
      {children}
    </RoleDashboardShell>
  );
}

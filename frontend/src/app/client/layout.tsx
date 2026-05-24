import ClientSidebar from '@/components/features/dashboards/ClientSidebar';
import { RoleDashboardShell } from '@/components/layout/RoleDashboardShell';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleDashboardShell requiredRole="client" sidebar={<ClientSidebar />}>
      {children}
    </RoleDashboardShell>
  );
}

import TrainerSidebar from '@/components/features/dashboards/TrainerSidebar';
import { RoleDashboardShell } from '@/components/layout/RoleDashboardShell';

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleDashboardShell requiredRole="trainer" sidebar={<TrainerSidebar />}>
      {children}
    </RoleDashboardShell>
  );
}

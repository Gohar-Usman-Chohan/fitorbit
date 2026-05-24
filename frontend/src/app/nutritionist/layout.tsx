import NutritionistSidebar from '@/components/features/dashboards/NutritionistSidebar';
import { RoleDashboardShell } from '@/components/layout/RoleDashboardShell';

export default function NutritionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleDashboardShell requiredRole="nutritionist" sidebar={<NutritionistSidebar />}>
      {children}
    </RoleDashboardShell>
  );
}

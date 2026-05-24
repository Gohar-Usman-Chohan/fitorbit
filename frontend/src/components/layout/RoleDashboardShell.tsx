import ProtectedRoute from '@/components/ProtectedRoute';

type Role = 'client' | 'trainer' | 'nutritionist' | 'admin';

interface RoleDashboardShellProps {
  requiredRole: Role;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function RoleDashboardShell({
  requiredRole,
  sidebar,
  children,
}: RoleDashboardShellProps) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-1 bg-surface sm:min-h-[calc(100vh-72px)]">
        {sidebar}
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-20 md:pb-8">
          <div className="dashboard-shell">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/features/client_side/header/ClientHeader';
import Footer from '@/components/features/client_side/footer/ClientFooter';
import { isDashboardRoute } from '@/config/dashboardNav';

const AUTH_NO_CHROME_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideAllChrome = AUTH_NO_CHROME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const dashboardRoute = isDashboardRoute(pathname);

  if (hideAllChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="min-w-0 overflow-x-hidden">{children}</div>
      {!dashboardRoute && <Footer />}
    </>
  );
}

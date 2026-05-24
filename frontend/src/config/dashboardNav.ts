/** Routes that use sidebar layout (header shown, footer hidden). */
export const DASHBOARD_ROUTE_PREFIXES = [
  '/client',
  '/trainer',
  '/nutritionist',
  '/admin',
] as const;

export function isDashboardRoute(pathname: string) {
  return DASHBOARD_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Quick links shown in the navbar only — not duplicated in the sidebar. */
export const NAVBAR_ONLY_LINKS: Record<string, { href: string; label: string }[]> = {
  client: [{ href: '/client/browse-experts', label: 'Browse Experts' }],
  trainer: [],
  nutritionist: [],
  admin: [],
};

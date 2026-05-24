import { NextRequest, NextResponse } from 'next/server';

function getRoleDashboard(role?: string) {
  switch (role) {
    case 'trainer':
      return '/trainer/dashboard';
    case 'nutritionist':
      return '/nutritionist/dashboard';
    case 'admin':
      return '/admin/approvals';
    default:
      return '/client/dashboard';
  }
}

function getRoleFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/',
    '/about',
    '/faq',
    '/privacy',
    '/terms',
    '/contact',
    '/trainers',
    '/nutritionists',
    '/search',
    '/unauthorized',
  ];

  const isExpertPublicProfile = /^\/(trainer|nutritionist)\/[^/]+$/.test(pathname);

  const isPublicRoute =
    isExpertPublicProfile ||
    publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  const authPages = ['/login', '/register', '/forgot-password'];

  if (isPublicRoute) {
    if ((token || refreshToken) && authPages.some((route) => pathname.startsWith(route))) {
      const role = token ? getRoleFromToken(token) : 'client';
      return NextResponse.redirect(new URL(getRoleDashboard(role || undefined), request.url));
    }
    return NextResponse.next();
  }

  if (!token && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};

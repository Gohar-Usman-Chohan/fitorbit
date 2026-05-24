'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Menu, X, LayoutDashboard, LogOut, Dumbbell } from 'lucide-react';
import Cookies from 'js-cookie';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logout } from '@/redux/slices/authSlice';
import { clearNotificationState } from '@/redux/slices/notificationSlice';
import type { RootState } from '@/redux/store';
import { isDashboardRoute, NAVBAR_ONLY_LINKS } from '@/config/dashboardNav';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const { isAuthenticated, user } = auth;
  const onDashboard = isDashboardRoute(pathname);
  const navbarOnlyLinks =
    user?.role && onDashboard ? NAVBAR_ONLY_LINKS[user.role] || [] : [];

  const getDashboardLink = () => {
    const roleRoutes: Record<string, string> = {
      client: '/client/dashboard',
      trainer: '/trainer/dashboard',
      nutritionist: '/nutritionist/dashboard',
      admin: '/admin/approvals',
    };
    return roleRoutes[user?.role || 'client'];
  };

  const logoHref = isAuthenticated && onDashboard ? getDashboardLink() : '/';

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    dispatch(logout());
    dispatch(clearNotificationState());
    setIsOpen(false);
    router.push('/login');
  };

  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/search', label: 'Find Experts' },
    { href: '/trainers', label: 'Trainers' },
    { href: '/nutritionists', label: 'Nutritionists' },
    { href: '/faq', label: 'FAQ' },
    { href: '/about', label: 'About' },
  ];

  const renderNavLinks = (mobile = false) => {
    if (!isAuthenticated) {
      return publicLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            mobile
              ? 'block rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600'
              : 'text-sm font-medium text-slate-600 transition hover:text-blue-600'
          }
          onClick={() => setIsOpen(false)}
        >
          {link.label}
        </Link>
      ));
    }

    if (onDashboard) {
      return navbarOnlyLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            mobile
              ? 'block rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600'
              : 'text-sm font-medium text-slate-600 transition hover:text-blue-600'
          }
          onClick={() => setIsOpen(false)}
        >
          {link.label}
        </Link>
      ));
    }

    return (
      <>
        <Link
          href={user?.role === 'client' ? '/client/browse-experts' : '/search'}
          className={
            mobile
              ? 'block rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600'
              : 'text-sm font-medium text-slate-600 transition hover:text-blue-600'
          }
          onClick={() => setIsOpen(false)}
        >
          Find Experts
        </Link>
        <Link
          href="/faq"
          className={
            mobile
              ? 'block rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600'
              : 'text-sm font-medium text-slate-600 transition hover:text-blue-600'
          }
          onClick={() => setIsOpen(false)}
        >
          FAQ
        </Link>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <Link href={logoHref} className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25 sm:h-9 sm:w-9">
            <Dumbbell size={18} />
          </span>
          <span className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Fit<span className="text-blue-600">Orbit</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex xl:gap-6">{renderNavLinks()}</nav>

        <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
          {isAuthenticated && user ? (
            <>
              <div className="mr-1 hidden text-right sm:block">
                <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900 xl:max-w-none">
                  {user.name || 'User'}
                </p>
                <p className="text-xs capitalize text-slate-500">{user.role}</p>
              </div>
              <Link href={getDashboardLink()} className="btn-primary !py-2 !text-xs sm:!text-sm">
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:px-3"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600">
                Login
              </Link>
              <Link href="/register" className="btn-primary !py-2">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen && (
        <nav className="border-t border-slate-100 px-4 py-4 sm:px-6 lg:hidden">
          <div className="space-y-1">{renderNavLinks(true)}</div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <p className="px-3 text-sm font-semibold text-slate-900">{user.name}</p>
                <Link href={getDashboardLink()} className="btn-primary w-full" onClick={() => setIsOpen(false)}>
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn-secondary w-full text-red-600">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/login" className="btn-secondary flex-1" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="btn-primary flex-1" onClick={() => setIsOpen(false)}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

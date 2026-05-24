import Cookies from 'js-cookie';
import { disconnectSocket } from '@/lib/socket';
import { store } from '@/redux/store';
import { logout } from '@/redux/slices/authSlice';

export function isAccountInactiveError(
  status?: number,
  message?: string,
  code?: string
) {
  if (status !== 403) return false;
  if (code === 'account_inactive' || code === 'email_not_verified') return true;

  const normalized = (message || '').toLowerCase();
  return (
    normalized.includes('not active') ||
    normalized.includes('suspended') ||
    normalized.includes('verify your email')
  );
}

export function forceLogout(reason?: string) {
  Cookies.remove('token', { path: '/' });
  Cookies.remove('refreshToken', { path: '/' });

  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    const onPublicPage = publicPaths.some((path) => window.location.pathname.startsWith(path));

    disconnectSocket();
    store.dispatch(logout());

    if (!onPublicPage) {
      const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      window.location.href = `/login${query}`;
    }
  }
}

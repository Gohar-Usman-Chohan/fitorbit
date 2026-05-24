'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { RootState } from '@/redux/store';

export function useAuth() {
  const auth = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.loading,
    error: auth.error,
    logout: () => {
      Cookies.remove('token');
      Cookies.remove('refreshToken');
    },
  };
}

export function useProtectedRoute(allowedRoles?: string[]) {
  const auth = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    // Check if token exists in cookies or Redux
    const token = Cookies.get('token');

    if (!token && !auth.isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check role if allowedRoles is specified
    if (allowedRoles && auth.user && !allowedRoles.includes(auth.user.role)) {
      router.push('/unauthorized');
      return;
    }
  }, [auth.isAuthenticated, auth.user, router, allowedRoles]);

  return auth;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'trainer' | 'nutritionist' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const auth = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');

    if (!token && !auth.isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole && auth.user && auth.user.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }
  }, [auth.isAuthenticated, auth.user, requiredRole, router]);

  if (!auth.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requiredRole && auth.user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

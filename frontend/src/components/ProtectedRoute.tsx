'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { RootState } from '@/redux/store';
import { persistor } from '@/redux/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'trainer' | 'nutritionist' | 'admin';
}

function usePersistReady() {
  const [ready, setReady] = useState(() => persistor.getState().bootstrapped);

  useEffect(() => {
    if (ready) return;

    const unsubscribe = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        setReady(true);
        unsubscribe();
      }
    });

    return unsubscribe;
  }, [ready]);

  return ready;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);
  const persistReady = usePersistReady();
  const hasToken = !!Cookies.get('token');
  const isAuthed = auth.isAuthenticated || hasToken;

  useEffect(() => {
    if (!persistReady) return;

    if (!isAuthed) {
      router.replace('/login');
      return;
    }

    if (requiredRole && auth.user?.role && auth.user.role !== requiredRole) {
      router.replace('/unauthorized');
    }
  }, [persistReady, isAuthed, auth.user, requiredRole, router]);

  if (!persistReady) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthed) {
    return null;
  }

  if (requiredRole && auth.user?.role && auth.user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

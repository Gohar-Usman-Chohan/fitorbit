'use client';

import React, { ReactNode, useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Cookies from 'js-cookie';
import { store, persistor } from '@/redux/store';
import { SocketProvider } from '@/hooks/useSocket';
import { UnreadCountsProvider } from '@/hooks/useUnreadCounts';
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog';
import { Toaster } from 'sonner';
import { loginSuccess } from '@/redux/slices/authSlice';
import type { RootState } from '@/redux/store';

function LoadingScreen() {
  return null;
}

// Component to restore auth from cookies if needed
function AuthRestorer({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const token = Cookies.get('token');
    const refreshToken = Cookies.get('refreshToken');

    if (!token || !refreshToken || auth.isAuthenticated) {
      return;
    }
      // Tokens exist but Redux state is empty - restore from cookies
      // This handles the case where page was refreshed or cookies persisted but Redux didn't
      try {
        const decoded: any = JSON.parse(atob(token.split('.')[1]));
        const fullName = decoded.name || `${decoded.firstName} ${decoded.lastName}`.trim() || 'User';
        dispatch(
          loginSuccess({
            user: {
              id: decoded.id,
              email: decoded.email,
              role: decoded.role,
              name: fullName,
            },
            token,
            refreshToken,
          })
        );
      } catch (error) {
        console.error('Failed to restore auth from cookies:', error);
        Cookies.remove('token');
        Cookies.remove('refreshToken');
      }
  }, [dispatch, auth.isAuthenticated]);

  return <>{children}</>;
}

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <AuthRestorer>
          <SocketProvider>
            <UnreadCountsProvider>
              <ConfirmDialogProvider>
                {children}
                <Toaster position="top-right" />
              </ConfirmDialogProvider>
            </UnreadCountsProvider>
          </SocketProvider>
        </AuthRestorer>
      </PersistGate>
    </Provider>
  );
}

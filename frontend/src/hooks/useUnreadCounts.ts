'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { chatAPI, notificationAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { setUnreadCounts } from '@/redux/slices/notificationSlice';
import { persistor, type RootState } from '@/redux/store';

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

function parseUnreadCounts(chatRes: { data?: { data?: Record<string, number> } }, notifRes: { data?: { data?: Record<string, number> } }) {
  const chatData = chatRes.data?.data;
  const notifData = notifRes.data?.data;

  return {
    chatUnread: chatData?.chatUnread ?? chatData?.count ?? 0,
    notificationUnread: notifData?.count ?? notifData?.notificationUnread ?? 0,
  };
}

export function useUnreadCounts() {
  const dispatch = useDispatch();
  const persistReady = usePersistReady();
  const auth = useSelector((state: RootState) => state.auth);
  const { chatUnread, notificationUnread } = useSelector(
    (state: RootState) => state.notifications
  );

  const hasToken = !!(auth.token || Cookies.get('token'));

  const refreshUnreadCounts = useCallback(async () => {
    if (!persistReady || !hasToken) return;

    try {
      const [chatRes, notifRes] = await Promise.all([
        chatAPI.getUnreadCount(),
        notificationAPI.getUnreadCount(),
      ]);

      dispatch(setUnreadCounts(parseUnreadCounts(chatRes, notifRes)));
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [persistReady, hasToken, dispatch]);

  useEffect(() => {
    refreshUnreadCounts();
  }, [refreshUnreadCounts]);

  useEffect(() => {
    if (!hasToken) return;

    const handleFocus = () => {
      refreshUnreadCounts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [hasToken, refreshUnreadCounts]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !hasToken) return;

    const handleCountsUpdate = (data: { chatUnread?: number; notificationUnread?: number }) => {
      dispatch(
        setUnreadCounts({
          chatUnread: data.chatUnread ?? 0,
          notificationUnread: data.notificationUnread ?? 0,
        })
      );
    };

    socket.on('unread_counts_updated', handleCountsUpdate);
    return () => {
      socket.off('unread_counts_updated', handleCountsUpdate);
    };
  }, [hasToken, dispatch]);

  return { chatUnread, notificationUnread, refreshUnreadCounts };
}

/** Keeps sidebar badges in sync app-wide (not only when a sidebar mounts). */
export function UnreadCountsProvider({ children }: { children: ReactNode }) {
  useUnreadCounts();
  return children;
}

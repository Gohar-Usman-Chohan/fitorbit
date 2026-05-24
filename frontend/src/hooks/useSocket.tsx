'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  initializeSocket,
  getSocket,
  disconnectSocket,
  onReceiveMessage,
  offReceiveMessage,
  onMessageRead,
  offMessageRead,
  onUserTyping,
  offUserTyping,
  onReceiveNotification,
  offReceiveNotification,
  onOnlineUsersUpdate,
  offOnlineUsersUpdate,
  onAppointmentUpdated,
  offAppointmentUpdated,
  onAccountSuspended,
  offAccountSuspended,
} from '@/lib/socket';
import { forceLogout } from '@/lib/forceLogout';
import {
  receiveMessage,
  markMessageAsRead,
  userTyping,
  userStopTyping,
  socketConnected,
  socketDisconnected,
  updateOnlineUsers,
} from '@/redux/slices/chatSlice';
import { setLastNotification } from '@/redux/slices/notificationSlice';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';

export function useSocket() {
  const dispatch = useDispatch();
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = auth.token || Cookies.get('token');
    if (!token) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    try {
      const socket = initializeSocket(auth.user?.id);

      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        dispatch(socketConnected());
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        dispatch(socketDisconnected());
      });

      // Message listeners
      const handleReceiveMessage = (data: any) => {
        dispatch(receiveMessage(data));
      };

      const handleMessageRead = (data: any) => {
        dispatch(markMessageAsRead(data.messageId));
      };

      const handleUserTyping = (data: any) => {
        dispatch(userTyping(data.userId));
        // Auto-clear typing after 3 seconds
        setTimeout(() => {
          dispatch(userStopTyping(data.userId));
        }, 3000);
      };

      const handleReceiveNotification = (data: any) => {
        dispatch(
          setLastNotification({
            id: data.id,
            title: data.title,
            message: data.message,
            type: data.type,
            actionUrl: data.actionUrl,
          })
        );
        toast.info(data.title || 'New notification', {
          description: data.message,
          action: data.actionUrl
            ? {
                label: 'Open',
                onClick: () => router.push(data.actionUrl),
              }
            : undefined,
        });
      };

      const handleOnlineUsersUpdate = (data: any) => {
        dispatch(updateOnlineUsers(data.onlineUsers));
      };

      const handleAppointmentUpdated = (data: any) => {
        toast.info('Appointment updated');
      };

      const handleAccountSuspended = (data: { message?: string }) => {
        toast.error(data.message || 'Your account has been suspended.');
        forceLogout(data.message || 'account_suspended');
      };

      onReceiveMessage(handleReceiveMessage);
      onMessageRead(handleMessageRead);
      onUserTyping(handleUserTyping);
      onReceiveNotification(handleReceiveNotification);
      onOnlineUsersUpdate(handleOnlineUsersUpdate);
      onAppointmentUpdated(handleAppointmentUpdated);
      onAccountSuspended(handleAccountSuspended);

      return () => {
        offReceiveMessage(handleReceiveMessage);
        offMessageRead(handleMessageRead);
        offUserTyping(handleUserTyping);
        offReceiveNotification(handleReceiveNotification);
        offOnlineUsersUpdate(handleOnlineUsersUpdate);
        offAppointmentUpdated(handleAppointmentUpdated);
        offAccountSuspended(handleAccountSuspended);
      };
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  }, [auth.isAuthenticated, auth.token, auth.user?.id, dispatch, router]);

  useEffect(() => {
    const userId = auth.user?.id;
    if (!userId) return;

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('user_connect', userId);
    }
  }, [auth.user?.id]);

  return {
    socket: getSocket(),
    isConnected,
  };
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket();
  return <>{children}</>;
}

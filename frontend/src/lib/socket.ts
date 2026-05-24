import io, { Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initializeSocket = (userId?: string): Socket => {
  if (socket && socket.connected) {
    if (userId) {
      socket.emit('user_connect', userId);
    }
    return socket;
  }

  const token = Cookies.get('token');

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    if (userId) {
      socket?.emit('user_connect', userId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('notification', (data) => {
    console.log('Notification received:', data);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinConversation = (conversationId: string) => {
  if (!socket) return;
  socket.emit('join_conversation', conversationId);
};

export const leaveConversation = (conversationId: string) => {
  if (!socket) return;
  socket.emit('leave_conversation', conversationId);
};

export const sendMessage = (
  conversationId: string,
  messageContent: string,
  receiverId: string
) => {
  if (!socket) return;
  socket.emit('send_message', { conversationId, receiverId, messageContent });
};

export const onReceiveMessage = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.on('receive_message', callback);
};

export const offReceiveMessage = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.off('receive_message', callback);
};

export const markMessageAsRead = (conversationId: string, messageIds: string[]) => {
  if (!socket) return;
  socket.emit('mark_as_read', { conversationId, messageIds });
};

export const onMessageRead = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.on('messages_read', callback);
};

export const offMessageRead = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.off('messages_read', callback);
};

export const sendTypingIndicator = (conversationId: string, isTyping: boolean) => {
  if (!socket) return;
  socket.emit(isTyping ? 'typing' : 'stop_typing', { conversationId });
};

export const onUserTyping = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.on('user_typing', callback);
};

export const offUserTyping = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.off('user_typing', callback);
};

export const onReceiveNotification = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.on('notification', callback);
};

export const offReceiveNotification = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.off('notification', callback);
};

export const onOnlineUsersUpdate = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.on('user_online', callback);
};

export const offOnlineUsersUpdate = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.off('user_online', callback);
};

export const onAppointmentUpdated = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.on('appointment_updated', callback);
};

export const offAppointmentUpdated = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.off('appointment_updated', callback);
};

export const onAccountSuspended = (callback: (data: { message?: string; code?: string }) => void) => {
  if (!socket) return;
  socket.on('account_suspended', callback);
};

export const offAccountSuspended = (callback: (data: { message?: string; code?: string }) => void) => {
  if (!socket) return;
  socket.off('account_suspended', callback);
};

export const onProgressUpdated = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.on('progress_updated', callback);
};

export const offProgressUpdated = (callback: (data: any) => void) => {
  if (!socket) return;
  socket.off('progress_updated', callback);
};

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UnreadCounts {
  chatUnread: number;
  notificationUnread: number;
}

interface NotificationState extends UnreadCounts {
  lastNotification: {
    id?: string;
    title?: string;
    message?: string;
    type?: string;
    actionUrl?: string;
  } | null;
}

const initialState: NotificationState = {
  chatUnread: 0,
  notificationUnread: 0,
  lastNotification: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadCounts: (state, action: PayloadAction<UnreadCounts>) => {
      state.chatUnread = action.payload.chatUnread;
      state.notificationUnread = action.payload.notificationUnread;
    },
    setLastNotification: (state, action: PayloadAction<NotificationState['lastNotification']>) => {
      state.lastNotification = action.payload;
    },
    clearNotificationState: (state) => {
      state.chatUnread = 0;
      state.notificationUnread = 0;
      state.lastNotification = null;
    },
  },
});

export const { setUnreadCounts, setLastNotification, clearNotificationState } =
  notificationSlice.actions;

export default notificationSlice.reducer;

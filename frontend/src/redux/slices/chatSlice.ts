import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt?: string;
  attachments?: {
    fileName: string;
    fileUrl: string;
  }[];
  reactions?: {
    emoji: string;
    userId: string;
  }[];
  replyTo?: string;
  mentions?: string[];
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatState {
  conversations: ChatConversation[];
  selectedConversationId: string | null;
  messages: ChatMessage[];
  onlineUsers: string[];
  typingUsers: string[];
  loading: boolean;
  error: string | null;
  socketConnected: boolean;
}

const initialState: ChatState = {
  conversations: [],
  selectedConversationId: null,
  messages: [],
  onlineUsers: [],
  typingUsers: [],
  loading: false,
  error: null,
  socketConnected: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Fetch conversations
    fetchConversationsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchConversationsSuccess: (
      state,
      action: PayloadAction<ChatConversation[]>
    ) => {
      state.conversations = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchConversationsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Fetch messages for a conversation
    fetchMessagesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchMessagesSuccess: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchMessagesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Select conversation
    selectConversation: (state, action: PayloadAction<string | null>) => {
      state.selectedConversationId = action.payload;
    },

    // Receive new message
    receiveMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      
      // Update conversation's last message
      const convIndex = state.conversations.findIndex(
        (c) => c.id === action.payload.conversationId
      );
      if (convIndex !== -1) {
        state.conversations[convIndex].lastMessage = action.payload;
      }
    },

    // Mark message as read
    markMessageAsRead: (state, action: PayloadAction<string>) => {
      const message = state.messages.find((m) => m.id === action.payload);
      if (message) {
        message.status = 'read';
      }
    },

    // Mark all messages as read in conversation
    markConversationAsRead: (state, action: PayloadAction<string>) => {
      const convIndex = state.conversations.findIndex(
        (c) => c.id === action.payload
      );
      if (convIndex !== -1) {
        state.conversations[convIndex].unreadCount = 0;
      }
    },

    // User typing
    userTyping: (state, action: PayloadAction<string>) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },

    // User stop typing
    userStopTyping: (state, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(
        (id) => id !== action.payload
      );
    },

    // Online users update
    updateOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },

    // Socket connected
    socketConnected: (state) => {
      state.socketConnected = true;
    },

    // Socket disconnected
    socketDisconnected: (state) => {
      state.socketConnected = false;
    },

    // Clear chat on logout
    clearChat: (state) => {
      state.conversations = [];
      state.selectedConversationId = null;
      state.messages = [];
      state.onlineUsers = [];
      state.typingUsers = [];
      state.loading = false;
      state.error = null;
      state.socketConnected = false;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchConversationsRequest,
  fetchConversationsSuccess,
  fetchConversationsFailure,
  fetchMessagesRequest,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  selectConversation,
  receiveMessage,
  markMessageAsRead,
  markConversationAsRead,
  userTyping,
  userStopTyping,
  updateOnlineUsers,
  socketConnected,
  socketDisconnected,
  clearChat,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;

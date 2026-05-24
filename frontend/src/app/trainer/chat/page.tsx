'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { chatAPI, userAPI } from '@/lib/api';
import { getSocket, joinConversation } from '@/lib/socket';
import { appendMessageDeduped, isOwnMessage, mapApiMessage, normalizeId } from '@/lib/chatHelpers';
import { buildClientConversationStub, findConversationByDeepLink } from '@/lib/chatDeepLink';
import { ConversationUnreadBadge } from '@/components/ui/NavBadge';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import {
  ChatConversation,
  ChatEmptyState,
  ChatLayout,
  ChatSidebar,
} from '@/components/features/chat/ChatLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import { formatTime } from '@/lib/dateFormat';

function getConversationName(conversation: any) {
  if (conversation.expertName) return conversation.expertName;
  if (conversation.clientName) return conversation.clientName;
  const user = conversation.otherUser;
  if (user) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return 'Client';
}

export default function TrainerChat() {
  const auth = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  useSocket();
  const { refreshUnreadCounts } = useUnreadCounts();

  const targetConversationId = searchParams.get('conversationId');
  const targetClientId = searchParams.get('clientId');
  const sessionReminder = searchParams.get('sessionReminder') === '1';

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedConversation) return;

    const conversationId = selectedConversation.conversationId || selectedConversation.id;
    if (conversationId) {
      fetchMessages(conversationId);
      joinConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReceive = (data: any) => {
      const activeConversationId =
        selectedConversation?.conversationId || selectedConversation?.id;

      if (
        activeConversationId &&
        data.conversationId &&
        normalizeId(data.conversationId) !== normalizeId(activeConversationId)
      ) {
        setConversations((prev) =>
          prev.map((c) =>
            normalizeId(c.conversationId || c.id) === normalizeId(data.conversationId)
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: data.messageContent }
              : c
          )
        );
        refreshUnreadCounts();
        return;
      }

      if (
        activeConversationId &&
        data.conversationId &&
        normalizeId(data.conversationId) === normalizeId(activeConversationId) &&
        normalizeId(data.receiverId) === normalizeId(auth.user?.id)
      ) {
        chatAPI.markAllAsRead(data.conversationId);
        refreshUnreadCounts();
      }

      setMessages((prev) => appendMessageDeduped(prev, data));
    };

    socket.on('receive_message', handleReceive);
    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [selectedConversation, auth.user?.id, refreshUnreadCounts]);

  const selectConversationFromDeepLink = async (list: any[]) => {
    const matched = findConversationByDeepLink(list, targetConversationId, targetClientId);
    if (matched) {
      setSelectedConversation(matched);
      setMobileView('chat');
      return;
    }

    if (targetClientId) {
      try {
        const response = await userAPI.getUserById(targetClientId);
        const client = response.data.data?.user || response.data.data;
        if (client) {
          setSelectedConversation(buildClientConversationStub(client));
          setMobileView('chat');
        }
      } catch {
        toast.error('Could not load client for this session');
      }
      return;
    }

    if (list.length > 0) {
      setSelectedConversation(list[0]);
    }
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await chatAPI.getConversations();
      const list = response.data.data?.conversations || [];
      setConversations(list);

      if (targetConversationId || targetClientId) {
        await selectConversationFromDeepLink(list);
      } else if (!selectedConversation && list.length > 0) {
        setSelectedConversation(list[0]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await chatAPI.getMessages(conversationId);
      const list = response.data.data?.messages || [];
      setMessages(list.map(mapApiMessage));
      setConversations((prev) =>
        prev.map((c) =>
          (c.conversationId || c.id) === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
      await refreshUnreadCounts();
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const conversationId = selectedConversation.conversationId || selectedConversation.id;
    const receiverId =
      selectedConversation.otherUserId ||
      selectedConversation.otherUser?._id ||
      selectedConversation.otherUser?.id;

    if (!receiverId) {
      toast.error('Cannot send message: receiver not found');
      return;
    }

    try {
      setIsSending(true);
      const response = await chatAPI.sendMessage(
        conversationId && conversationId !== 'new' ? conversationId : undefined,
        {
          content: messageText,
          receiverId: String(receiverId),
          conversationId,
        }
      );

      const newMessage = response.data.data?.message;
      if (newMessage) {
        setMessages((prev) => appendMessageDeduped(prev, newMessage));

        if (!conversationId && newMessage.conversationId) {
          const newConversationId = String(newMessage.conversationId);
          setSelectedConversation((prev: any) =>
            prev
              ? {
                  ...prev,
                  conversationId: newConversationId,
                  id: newConversationId,
                }
              : prev
          );
          joinConversation(newConversationId);
        }
      }

      setMessageText('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ChatLayout
      title="Chat with Clients"
      mobileView={mobileView}
      onMobileBack={() => setMobileView('list')}
      infoBanner={
        sessionReminder ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            Your online session is starting soon. Send the meeting link to your client in this chat.
          </div>
        ) : undefined
      }
      sidebar={
        <ChatSidebar
          searchPlaceholder="Search clients..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        >
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id || conversation.conversationId}
                onClick={() => {
                  setSelectedConversation(conversation);
                  setMobileView('chat');
                }}
                className={`cursor-pointer border-l-4 p-4 transition hover:bg-gray-50 ${
                  (selectedConversation?.id || selectedConversation?.conversationId) ===
                  (conversation.id || conversation.conversationId)
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{getConversationName(conversation)}</p>
                  <ConversationUnreadBadge count={conversation.unreadCount || 0} />
                </div>
                <p className="truncate text-sm text-gray-600">
                  {conversation.lastMessage || 'No messages yet'}
                </p>
                {conversation.lastMessageTime && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formatTime(conversation.lastMessageTime)}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No chats found' : 'No chats yet. Assigned clients can message you here.'}
            </div>
          )}
        </ChatSidebar>
      }
      conversation={
        selectedConversation ? (
          <ChatConversation
            messagesEndRef={messagesEndRef}
            header={
              <h2 className="font-bold text-gray-900">{getConversationName(selectedConversation)}</h2>
            }
            messages={
              messages.length > 0 ? (
                messages.map((message) => {
                  const isOwn = isOwnMessage(message, auth.user?.id);
                  return (
                    <div
                      key={message._id || message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 sm:max-w-xs ${
                          isOwn ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p>{message.content || message.messageContent}</p>
                        <p className={`mt-1 text-xs ${isOwn ? 'text-green-100' : 'text-gray-600'}`}>
                          {message.createdAt
                            ? formatTime(message.createdAt)
                            : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )
            }
            composer={
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !messageText.trim()}
                  className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:bg-green-400 sm:shrink-0"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            }
          />
        ) : (
          <ChatEmptyState>
            <div>
              <p className="text-lg text-gray-500">No conversation selected</p>
              <p className="mt-2 text-gray-400">Select a client chat to start messaging</p>
            </div>
          </ChatEmptyState>
        )
      }
    />
  );
}

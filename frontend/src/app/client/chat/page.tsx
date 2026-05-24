'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useSocket } from '@/hooks/useSocket';
import { chatAPI, clientAPI } from '@/lib/api';
import { getSocket, joinConversation } from '@/lib/socket';
import { appendMessageDeduped, isOwnMessage, mapApiMessage, normalizeId } from '@/lib/chatHelpers';
import {
  ChatConversation,
  ChatEmptyState,
  ChatLayout,
  ChatSidebar,
} from '@/components/features/chat/ChatLayout';
import { ConversationUnreadBadge } from '@/components/ui/NavBadge';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import { formatTime } from '@/lib/dateFormat';

type ChatContact = {
  id: string;
  conversationId?: string;
  otherUserId: string;
  expertName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  roleLabel?: string;
  isNew?: boolean;
  unreadCount?: number;
};

function mapExpertToContact(
  expert: any,
  roleLabel: string,
  existing?: ChatContact
): ChatContact {
  const id = expert._id || expert.id;
  const name = `${expert.firstName || ''} ${expert.lastName || ''}`.trim() || 'Expert';

  if (existing) {
    return { ...existing, expertName: existing.expertName || name, roleLabel };
  }

  return {
    id: `new-${id}`,
    otherUserId: String(id),
    expertName: name,
    roleLabel,
    isNew: true,
  };
}

function ClientChatContent() {
  const auth = useSelector((state: RootState) => state.auth);
  useSocket();
  const { refreshUnreadCounts } = useUnreadCounts();

  const [conversations, setConversations] = useState<ChatContact[]>([]);
  const [assignedContacts, setAssignedContacts] = useState<ChatContact[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatContact | null>(null);
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
    fetchChatData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation?.conversationId) {
      fetchMessages(selectedConversation.conversationId);
      joinConversation(selectedConversation.conversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReceive = (data: any) => {
      const activeConversationId = selectedConversation?.conversationId;
      if (
        activeConversationId &&
        data.conversationId &&
        normalizeId(data.conversationId) !== normalizeId(activeConversationId)
      ) {
        setConversations((prev) =>
          prev.map((c) =>
            normalizeId(c.conversationId) === normalizeId(data.conversationId)
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
  }, [selectedConversation]);

  const fetchAssignedExperts = async (existingConversations: ChatContact[]) => {
    try {
      const response = await clientAPI.getAssignedExperts();
      const trainer = response.data.data?.trainer;
      const nutritionist = response.data.data?.nutritionist;
      const contacts: ChatContact[] = [];

      const findExisting = (userId: string) =>
        existingConversations.find((c) => String(c.otherUserId) === String(userId));

      if (trainer) {
        const existing = findExisting(trainer._id || trainer.id);
        if (!existing) {
          contacts.push(mapExpertToContact(trainer, 'Trainer'));
        }
      }

      if (nutritionist) {
        const existing = findExisting(nutritionist._id || nutritionist.id);
        if (!existing) {
          contacts.push(mapExpertToContact(nutritionist, 'Nutritionist'));
        }
      }

      setAssignedContacts(contacts);
    } catch (error) {
      console.error('Failed to load assigned experts:', error);
      setAssignedContacts([]);
    }
  };

  const fetchChatData = async () => {
    try {
      setIsLoading(true);
      const response = await chatAPI.getConversations();
      const list: ChatContact[] = (response.data.data?.conversations || []).map(
        (conv: any) => ({
          id: conv.id || conv.conversationId,
          conversationId: conv.conversationId || conv.id,
          otherUserId: String(conv.otherUserId || conv.otherUser?._id || conv.otherUser?.id),
          expertName: conv.expertName || 'Expert',
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount || 0,
        })
      );
      setConversations(list);
      await fetchAssignedExperts(list);
      if (!selectedConversation && list.length > 0) {
        setSelectedConversation(list[0]);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load conversations';
      toast.error(message);
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
          c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
      await refreshUnreadCounts();
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const conversationId = selectedConversation.conversationId;
    const receiverId = selectedConversation.otherUserId;

    if (!receiverId) {
      toast.error('Cannot send message: receiver not found');
      return;
    }

    try {
      setIsSending(true);
      const payload: { content: string; receiverId: string; conversationId?: string } = {
        content: messageText,
        receiverId: String(receiverId),
      };
      if (conversationId) {
        payload.conversationId = conversationId;
      }

      const response = await chatAPI.sendMessage(
        conversationId || 'new',
        payload
      );

      const newMessage = response.data.data?.message;
      const newConversationId =
        newMessage?.conversationId || conversationId;

      if (newMessage) {
        setMessages((prev) => appendMessageDeduped(prev, newMessage));
      }

      if (newConversationId) {
        joinConversation(newConversationId);

        if (selectedConversation.isNew || !conversationId) {
          const updatedContact: ChatContact = {
            ...selectedConversation,
            id: newConversationId,
            conversationId: newConversationId,
            isNew: false,
            lastMessage: messageText,
            lastMessageTime: new Date().toISOString(),
          };
          setSelectedConversation(updatedContact);
          setConversations((prev) => {
            const without = prev.filter(
              (c) => String(c.otherUserId) !== String(receiverId)
            );
            return [updatedContact, ...without];
          });
          setAssignedContacts((prev) =>
            prev.filter((c) => String(c.otherUserId) !== String(receiverId))
          );
        }
      }

      setMessageText('');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const allContacts = [...conversations, ...assignedContacts];
  const filteredContacts = allContacts.filter((conv) =>
    (conv.expertName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ChatLayout
      title="Chat with Experts"
      mobileView={mobileView}
      onMobileBack={() => setMobileView('list')}
      titleAction={
        <Link
          href="/client/browse-experts"
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto sm:px-5"
        >
          Browse &amp; Book Experts
        </Link>
      }
      infoBanner={
        allContacts.length === 0 ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="mb-1 font-semibold">How to start chatting</p>
            <ol className="list-inside list-decimal space-y-1 text-blue-800">
              <li>
                Go to{' '}
                <Link href="/client/browse-experts" className="font-medium underline">
                  Browse Experts
                </Link>{' '}
                (top navbar) and book a trainer or nutritionist.
              </li>
              <li>After booking, your expert appears here — send your first message.</li>
              <li>They can reply from their Chat page; you get a notification too.</li>
            </ol>
          </div>
        ) : undefined
      }
      sidebar={
        <ChatSidebar
          searchPlaceholder="Search chats..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        >
          {filteredContacts.length > 0 ? (
            filteredContacts.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  setMobileView('chat');
                }}
                className={`cursor-pointer border-l-4 p-4 transition hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{conversation.expertName}</p>
                      <div className="flex items-center gap-2">
                        {conversation.roleLabel && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {conversation.roleLabel}
                          </span>
                        )}
                        <ConversationUnreadBadge count={conversation.unreadCount || 0} />
                      </div>
                    </div>
                <p className="truncate text-sm text-gray-600">
                  {conversation.isNew
                    ? 'Tap to start chatting'
                    : conversation.lastMessage || 'No messages yet'}
                </p>
                {conversation.lastMessageTime && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formatTime(conversation.lastMessageTime)}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="space-y-3 p-4 text-center text-gray-500">
              <p>{searchQuery ? 'No chats found' : 'No experts to chat with yet.'}</p>
              {!searchQuery && (
                <Link
                  href="/client/browse-experts"
                  className="inline-block font-medium text-blue-600 underline hover:text-blue-700"
                >
                  Browse Experts to book
                </Link>
              )}
            </div>
          )}
        </ChatSidebar>
      }
      conversation={
        selectedConversation ? (
          <ChatConversation
            messagesEndRef={messagesEndRef}
            header={
              <>
                <h2 className="font-bold text-gray-900">{selectedConversation.expertName}</h2>
                {selectedConversation.roleLabel && (
                  <p className="text-sm text-gray-500">{selectedConversation.roleLabel}</p>
                )}
              </>
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
                          isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p>{message.content || message.messageContent}</p>
                        <p className={`mt-1 text-xs ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
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
                  <p>No messages yet. Say hello to your expert!</p>
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
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !messageText.trim()}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400 sm:shrink-0"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            }
          />
        ) : (
          <ChatEmptyState>
            <div className="space-y-4">
              <p className="text-lg text-gray-500">No conversation selected</p>
              <p className="text-gray-400">Select an expert from the list, or book one first.</p>
              <Link
                href="/client/browse-experts"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                Browse &amp; Book Experts
              </Link>
            </div>
          </ChatEmptyState>
        )
      }
    />
  );
}

export default ClientChatContent;

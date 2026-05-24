'use client';

import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface ChatLayoutProps {
  title: string;
  titleAction?: ReactNode;
  infoBanner?: ReactNode;
  sidebar: ReactNode;
  conversation: ReactNode;
  /** On mobile: show conversation panel instead of the contact list */
  mobileView?: 'list' | 'chat';
  onMobileBack?: () => void;
}

/** Full-height chat shell: title stays visible; messages scroll inside the panel. */
export function ChatLayout({
  title,
  titleAction,
  infoBanner,
  sidebar,
  conversation,
  mobileView = 'list',
  onMobileBack,
}: ChatLayoutProps) {
  const showListOnMobile = mobileView === 'list';
  const showChatOnMobile = mobileView === 'chat';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="relative z-10 mb-3 shrink-0 bg-gray-50 sm:mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            {showChatOnMobile && onMobileBack ? (
              <button
                type="button"
                onClick={onMobileBack}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft size={18} />
              </button>
            ) : null}
            <h1 className="min-w-0 truncate text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
              {title}
            </h1>
          </div>
          {titleAction ? <div className="shrink-0">{titleAction}</div> : null}
        </div>
        {infoBanner ? <div className="mt-3 sm:mt-4">{infoBanner}</div> : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden sm:gap-4 md:grid md:grid-cols-4 md:gap-6">
        <div
          className={`flex min-h-[180px] flex-col overflow-hidden rounded-lg bg-white shadow md:h-full md:max-h-none ${
            showListOnMobile ? 'max-h-none flex-1 md:max-h-none' : 'hidden md:flex'
          }`}
        >
          {sidebar}
        </div>
        <div
          className={`flex min-h-[240px] flex-col overflow-hidden rounded-lg bg-white shadow md:col-span-3 md:h-full md:min-h-0 ${
            showChatOnMobile ? 'flex-1 md:flex' : 'hidden md:flex'
          }`}
        >
          {conversation}
        </div>
      </div>
    </div>
  );
}

interface ChatSidebarProps {
  searchPlaceholder: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  children: ReactNode;
}

export function ChatSidebar({
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  children,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b p-3 sm:p-4">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="min-h-0 flex-1 divide-y overflow-y-auto">{children}</div>
    </div>
  );
}

interface ChatConversationProps {
  header: ReactNode;
  messages: ReactNode;
  composer: ReactNode;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChatConversation({
  header,
  messages,
  composer,
  messagesEndRef,
}: ChatConversationProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b p-3 sm:p-4">{header}</div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4 md:p-6">
        {messages}
        {messagesEndRef ? <div ref={messagesEndRef} /> : null}
      </div>
      <div className="shrink-0 border-t p-3 sm:p-4">{composer}</div>
    </div>
  );
}

export function ChatEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6 text-center sm:p-8">
      {children}
    </div>
  );
}

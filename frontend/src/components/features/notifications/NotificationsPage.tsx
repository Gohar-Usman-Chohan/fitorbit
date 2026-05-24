'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notificationAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/dateFormat';

type RoleAccent = 'client' | 'trainer' | 'nutritionist';

const ACCENT: Record<
  RoleAccent,
  {
    primary: string;
    primaryHover: string;
    unreadBg: string;
    dot: string;
    readText: string;
  }
> = {
  client: {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    unreadBg: 'bg-blue-50',
    dot: 'bg-blue-600',
    readText: 'text-blue-600 hover:text-blue-700',
  },
  trainer: {
    primary: 'bg-green-600',
    primaryHover: 'hover:bg-green-700',
    unreadBg: 'bg-green-50',
    dot: 'bg-green-600',
    readText: 'text-green-600 hover:text-green-700',
  },
  nutritionist: {
    primary: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    unreadBg: 'bg-orange-50',
    dot: 'bg-orange-600',
    readText: 'text-orange-600 hover:text-orange-700',
  },
};

function getNotificationIcon(type: string) {
  switch (type) {
    case 'message':
      return '💬';
    case 'appointment':
      return '📅';
    case 'plan_assigned':
      return '📋';
    case 'progress_update':
      return '📈';
    case 'achievement':
      return '🏆';
    case 'system_alert':
      return '⚙️';
    default:
      return '🔔';
  }
}

function getNotificationColor(type: string) {
  const colors: Record<string, string> = {
    message: 'border-blue-500',
    appointment: 'border-orange-500',
    plan_assigned: 'border-purple-500',
    progress_update: 'border-green-500',
    achievement: 'border-yellow-500',
    system_alert: 'border-gray-500',
  };
  return colors[type] || 'border-gray-500';
}

function isUnread(n: any) {
  return !(n.isRead ?? n.read);
}

interface NotificationsPageProps {
  roleAccent: RoleAccent;
}

export default function NotificationsPage({ roleAccent }: NotificationsPageProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const { refreshUnreadCounts } = useUnreadCounts();
  const accent = ACCENT[roleAccent];

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data.data?.notifications || response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === notificationId ? { ...n, isRead: true, read: true } : n
        )
      );
      await refreshUnreadCounts();
      toast.success('Marked as read');
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const confirmed = await confirm({
      title: 'Delete notification?',
      message: 'This notification will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== notificationId));
      await refreshUnreadCounts();
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
      await refreshUnreadCounts();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = await confirm({
      title: 'Clear all notifications?',
      message: 'All notifications will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Clear all',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      setIsDeletingAll(true);
      await notificationAPI.deleteAllNotifications();
      setNotifications([]);
      await refreshUnreadCounts();
      toast.success('All notifications cleared');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete all notifications');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleOpenNotification = async (notification: any) => {
    const notificationId = notification._id || notification.id;
    if (isUnread(notification)) {
      await handleMarkAsRead(notificationId);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? isUnread(n) : true
  );
  const unreadCount = notifications.filter((n) => isUnread(n)).length;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="page-title">Notifications</h1>
            {unreadCount > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className={`rounded-lg px-4 py-2 font-medium text-white transition ${accent.primary} ${accent.primaryHover}`}
              >
                Mark All as Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:bg-red-400"
              >
                {isDeletingAll ? 'Clearing...' : 'Clear All'}
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 font-medium transition ${
              filter === 'all'
                ? `${accent.primary} text-white`
                : 'border border-gray-300 bg-white text-gray-700'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`rounded-lg px-4 py-2 font-medium transition ${
              filter === 'unread'
                ? `${accent.primary} text-white`
                : 'border border-gray-300 bg-white text-gray-700'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const notificationId = notification._id || notification.id;
              const unread = isUnread(notification);
              return (
                <div
                  key={notificationId}
                  className={`rounded-lg border-l-4 bg-white p-4 shadow transition hover:shadow-lg ${getNotificationColor(
                    notification.type
                  )} ${unread ? accent.unreadBg : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className="flex flex-1 gap-3 text-left"
                    >
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                          {unread && (
                            <span
                              className={`ml-2 inline-block h-2 w-2 rounded-full ${accent.dot}`}
                            />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          {notification.createdAt
                            ? formatDateTime(notification.createdAt)
                            : ''}
                        </p>
                        {notification.actionUrl && (
                          <p className={`mt-1 text-xs font-medium ${accent.readText}`}>
                            Tap to open →
                          </p>
                        )}
                      </div>
                    </button>
                    <div className="flex gap-2">
                      {unread && (
                        <button
                          onClick={() => handleMarkAsRead(notificationId)}
                          className={`text-sm font-medium ${accent.readText}`}
                        >
                          ✓ Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notificationId)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Delete notification"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-lg text-gray-500">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="mt-2 text-gray-400">You&apos;re all caught up!</p>
            {roleAccent === 'client' && (
              <Link
                href="/client/chat"
                className={`mt-4 inline-block text-sm font-medium ${accent.readText}`}
              >
                Go to Chat
              </Link>
            )}
            {roleAccent === 'trainer' && (
              <Link
                href="/trainer/chat"
                className={`mt-4 inline-block text-sm font-medium ${accent.readText}`}
              >
                Go to Chat
              </Link>
            )}
            {roleAccent === 'nutritionist' && (
              <Link
                href="/nutritionist/chat"
                className={`mt-4 inline-block text-sm font-medium ${accent.readText}`}
              >
                Go to Chat
              </Link>
            )}
          </div>
        )}
      </div>
  );
}

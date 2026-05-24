'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, Ban, RotateCcw, Search, Users } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { formatDate } from '@/lib/dateFormat';
import type { RootState } from '@/redux/store';

type AdminUser = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  accountStatus?: string;
  createdAt?: string;
};

function getUserId(user: AdminUser) {
  return String(user._id || user.id || '');
}

function formatRole(role?: string) {
  if (!role) return 'Unknown';
  return role.replace(/_/g, ' ');
}

function UserActions({
  user,
  currentUserId,
  actingOn,
  mode,
  onSuspend,
  onUnsuspend,
  compact = false,
}: {
  user: AdminUser;
  currentUserId?: string;
  actingOn: string | null;
  mode: 'active' | 'suspended';
  onSuspend: (user: AdminUser) => void;
  onUnsuspend: (user: AdminUser) => void;
  compact?: boolean;
}) {
  const userId = getUserId(user);
  const isSelf = currentUserId === userId;
  const isBusy = actingOn === userId;

  if (isSelf) {
    return <span className="text-xs text-slate-400">Cannot modify own account</span>;
  }

  if (mode === 'suspended') {
    return (
      <button
        type="button"
        onClick={() => onUnsuspend(user)}
        disabled={isBusy}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 ${
          compact ? 'w-full px-3 py-2 text-sm' : 'px-3 py-1.5 text-sm'
        }`}
      >
        <RotateCcw size={14} />
        Reopen account
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSuspend(user)}
      disabled={isBusy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 ${
        compact ? 'w-full px-3 py-2 text-sm' : 'px-3 py-1.5 text-sm'
      }`}
    >
      <Ban size={14} />
      Suspend
    </button>
  );
}

function UserTable({
  users,
  currentUserId,
  actingOn,
  mode,
  onSuspend,
  onUnsuspend,
}: {
  users: AdminUser[];
  currentUserId?: string;
  actingOn: string | null;
  mode: 'active' | 'suspended';
  onSuspend: (user: AdminUser) => void;
  onUnsuspend: (user: AdminUser) => void;
}) {
  if (users.length === 0) return null;

  return (
    <>
      <div className="mobile-card-list">
        {users.map((user) => {
          const userId = getUserId(user);
          const isSelf = currentUserId === userId;

          return (
            <article key={userId} className="card card-body space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {user.firstName} {user.lastName}
                    {isSelf ? (
                      <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        You
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-sm text-slate-500">{user.email}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                  {formatRole(user.role)}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                Joined {user.createdAt ? formatDate(user.createdAt) : '—'}
              </p>
              <UserActions
                user={user}
                currentUserId={currentUserId}
                actingOn={actingOn}
                mode={mode}
                onSuspend={onSuspend}
                onUnsuspend={onUnsuspend}
                compact
              />
            </article>
          );
        })}
      </div>

      <div className="desktop-table-only overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="table-scroll">
          <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const userId = getUserId(user);
              const isSelf = currentUserId === userId;

              return (
                <tr key={userId} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {user.firstName} {user.lastName}
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm capitalize text-slate-700">
                    {formatRole(user.role)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.createdAt ? formatDate(user.createdAt) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <UserActions
                      user={user}
                      currentUserId={currentUserId}
                      actingOn={actingOn}
                      mode={mode}
                      onSuspend={onSuspend}
                      onUnsuspend={onUnsuspend}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}

export default function AdminUsersPage() {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const confirm = useConfirm();

  const [activeUsers, setActiveUsers] = useState<AdminUser[]>([]);
  const [suspendedUsers, setSuspendedUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        role: roleFilter || undefined,
        search: search.trim() || undefined,
        limit: 100,
      };

      const [activeRes, suspendedRes] = await Promise.all([
        adminAPI.getUsers({ ...params, status: 'active' }),
        adminAPI.getUsers({ ...params, status: 'suspended' }),
      ]);

      setActiveUsers(activeRes.data.data?.users || []);
      setSuspendedUsers(suspendedRes.data.data?.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, search ? 300 : 0);

    return () => clearTimeout(timer);
  }, [fetchUsers, search]);

  const handleSuspend = async (user: AdminUser) => {
    const userId = getUserId(user);
    if (!userId) return;

    const confirmed = await confirm({
      title: 'Suspend user?',
      message: `${user.firstName} ${user.lastName} (${user.email}) will be signed out immediately and cannot log in until reopened.`,
      confirmLabel: 'Suspend',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      setActingOn(userId);
      await adminAPI.suspendUser(userId);
      toast.success('User suspended and signed out');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    } finally {
      setActingOn(null);
    }
  };

  const handleUnsuspend = async (user: AdminUser) => {
    const userId = getUserId(user);
    if (!userId) return;

    try {
      setActingOn(userId);
      await adminAPI.unsuspendUser(userId);
      toast.success('Account reopened — user can sign in again');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reopen account');
    } finally {
      setActingOn(null);
    }
  };

  if (isLoading && activeUsers.length === 0 && suspendedUsers.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Suspend active users or reopen suspended accounts."
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 sm:w-auto"
        >
          <option value="">All roles</option>
          <option value="client">Client</option>
          <option value="trainer">Trainer</option>
          <option value="nutritionist">Nutritionist</option>
        </select>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <AlertTriangle className="text-amber-600" size={20} />
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Suspended — awaiting reopen</h2>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            {suspendedUsers.length}
          </span>
        </div>

        {suspendedUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
            No suspended users right now.
          </div>
        ) : (
          <UserTable
            users={suspendedUsers}
            currentUserId={currentUserId}
            actingOn={actingOn}
            mode="suspended"
            onSuspend={handleSuspend}
            onUnsuspend={handleUnsuspend}
          />
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Users className="text-emerald-600" size={20} />
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Active users</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            {activeUsers.length}
          </span>
        </div>

        {activeUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
            No active users match your filters.
          </div>
        ) : (
          <UserTable
            users={activeUsers}
            currentUserId={currentUserId}
            actingOn={actingOn}
            mode="active"
            onSuspend={handleSuspend}
            onUnsuspend={handleUnsuspend}
          />
        )}
      </section>
    </div>
  );
}

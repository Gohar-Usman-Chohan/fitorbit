'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, UserCheck, XCircle } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { formatDate } from '@/lib/dateFormat';

export default function AdminApprovalsPage() {
  const [pendingExperts, setPendingExperts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getPendingExperts();
      setPendingExperts(response.data.data?.users || []);
    } catch {
      toast.error('Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      setActingOn(userId);
      await adminAPI.approveExpert(userId);
      toast.success('Expert approved — they can now sign in');
      fetchPending();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve expert');
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      setActingOn(userId);
      await adminAPI.rejectExpert(userId);
      toast.success('Expert registration rejected');
      fetchPending();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject expert');
    } finally {
      setActingOn(null);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Expert Approvals"
        description="Review trainer and nutritionist registrations before they can access the platform."
      />

      <div className="mb-6 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
        <Clock size={16} />
        {pendingExperts.length} pending {pendingExperts.length === 1 ? 'request' : 'requests'}
      </div>

      {pendingExperts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <UserCheck className="mx-auto mb-4 text-slate-300" size={48} />
          <h2 className="text-lg font-semibold text-slate-900">All caught up</h2>
          <p className="mt-2 text-slate-500">No trainer or nutritionist accounts waiting for approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingExperts.map((expert) => {
            const id = expert._id || expert.id;
            const isBusy = actingOn === id;

            return (
              <div key={id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
                      {expert.firstName} {expert.lastName}
                    </h3>
                    <p className="mt-1 text-sm capitalize text-slate-500">
                      Applying as {expert.role}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    Pending approval
                  </span>
                </div>

                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-slate-500">Email</dt>
                    <dd className="font-medium text-slate-900">{expert.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Registered</dt>
                    <dd className="font-medium text-slate-900">
                      {expert.createdAt ? formatDate(expert.createdAt) : 'N/A'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleApprove(id)}
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={16} />
                    {isBusy ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(id)}
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

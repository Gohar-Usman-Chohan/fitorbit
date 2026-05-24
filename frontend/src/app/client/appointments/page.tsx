'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Filter,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { appointmentAPI } from '@/lib/api';
import { mapAppointment } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { AppointmentRatingModal } from '@/components/features/appointments/AppointmentRatingModal';
import { AppointmentPaymentModal } from '@/components/features/appointments/AppointmentPaymentModal';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/dateFormat';

type TimeFilter = 'all' | 'upcoming' | 'past';
type StatusFilter =
  | 'all'
  | 'pending_approval'
  | 'awaiting_payment'
  | 'scheduled'
  | 'completed'
  | 'cancelled';
type ExpertTypeFilter = 'all' | 'trainer' | 'nutritionist';

const CANCELLED_STATUSES = ['cancelled', 'rejected', 'no_show'];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

function isUpcoming(appointment: { status?: string; appointmentDate?: string }) {
  if (CANCELLED_STATUSES.includes(appointment.status || '')) return false;
  if (appointment.status === 'completed') return false;
  if (['pending_approval', 'awaiting_payment'].includes(appointment.status || '')) return true;
  return new Date(appointment.appointmentDate || 0) > new Date();
}

function formatStatusLabel(status?: string) {
  return (status || 'unknown').replace(/_/g, ' ');
}

function getStatusColor(status: string) {
  switch (status) {
    case 'scheduled':
      return 'border-green-500 bg-green-50';
    case 'pending_approval':
      return 'border-amber-500 bg-amber-50';
    case 'awaiting_payment':
      return 'border-indigo-500 bg-indigo-50';
    case 'rejected':
      return 'border-red-500 bg-red-50';
    case 'completed':
      return 'border-blue-500 bg-blue-50';
    case 'cancelled':
    case 'no_show':
      return 'border-red-500 bg-red-50';
    default:
      return 'border-gray-300 bg-gray-50';
  }
}

function getSessionBadge(sessionType: string) {
  return sessionType === 'online' ? 'Video call' : 'In person';
}

function matchesStatusFilter(status: string | undefined, filter: StatusFilter) {
  if (filter === 'all') return true;
  if (filter === 'cancelled') return CANCELLED_STATUSES.includes(status || '');
  return status === filter;
}

function AppointmentCard({
  appointment,
  variant,
  isCancelling,
  onCancel,
  onPay,
  onRate,
}: {
  appointment: any;
  variant: 'upcoming' | 'past';
  isCancelling: string | null;
  onCancel: (id: string) => void;
  onPay: (appointment: any) => void;
  onRate: (appointment: any) => void;
}) {
  const isUpcomingCard = variant === 'upcoming';

  return (
    <article className={`card overflow-hidden border-l-4 ${getStatusColor(appointment.status)}`}>
      <div className="card-body space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{appointment.topic || 'Appointment'}</p>
            <p className="mt-1 text-sm text-gray-600">
              with {appointment.expertName}{' '}
              <span className="capitalize text-gray-500">({appointment.expertType})</span>
            </p>
          </div>
          <span
            className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              isUpcomingCard ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {formatStatusLabel(appointment.status)}
          </span>
        </div>

        {appointment.status === 'pending_approval' && (
          <p className="rounded-lg bg-amber-100/60 px-3 py-2 text-sm text-amber-800">
            Waiting for expert approval
          </p>
        )}
        {appointment.status === 'awaiting_payment' && (
          <p className="rounded-lg bg-indigo-100/60 px-3 py-2 text-sm text-indigo-800">
            Approved — pay $
            {appointment.paymentAmount?.toFixed?.(2) || appointment.paymentAmount || ''} to confirm
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-gray-500">Date & time</p>
            <p className="font-medium text-gray-900">{formatDateTime(appointment.appointmentDate)}</p>
          </div>
          <div>
            <p className="text-gray-500">Duration</p>
            <p className="font-medium text-gray-900">
              {appointment.duration} {appointment.durationUnit}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Session type</p>
            <p className="font-medium capitalize text-gray-900">
              {getSessionBadge(appointment.sessionType)}
            </p>
          </div>
          {appointment.sessionType === 'in_person' && appointment.location ? (
            <div>
              <p className="text-gray-500">Location</p>
              <p className="font-medium text-gray-900">{appointment.location}</p>
            </div>
          ) : null}
          {!isUpcomingCard && appointment.rating ? (
            <div>
              <p className="text-gray-500">Your rating</p>
              <p className="font-medium text-gray-900">{appointment.rating}/5</p>
            </div>
          ) : null}
        </div>

        {appointment.clientNotes ? (
          <div className="rounded-lg bg-white/70 p-3 text-sm">
            <p className="text-gray-500">Your notes</p>
            <p className="text-gray-900">{appointment.clientNotes}</p>
          </div>
        ) : null}

        {appointment.clientFeedback ? (
          <div className="rounded-lg bg-white/70 p-3 text-sm">
            <p className="text-gray-500">Your feedback</p>
            <p className="text-gray-900">{appointment.clientFeedback}</p>
          </div>
        ) : null}

        {appointment.expertNotes ? (
          <div className="rounded-lg bg-white/70 p-3 text-sm">
            <p className="text-gray-500">Expert notes</p>
            <p className="text-gray-900">{appointment.expertNotes}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {appointment.status === 'awaiting_payment' && (
            <button
              type="button"
              onClick={() => onPay(appointment)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Pay with Stripe
            </button>
          )}
          {isUpcomingCard &&
            ['pending_approval', 'awaiting_payment', 'scheduled'].includes(appointment.status) && (
              <button
                type="button"
                onClick={() => onCancel(appointment.id)}
                disabled={isCancelling === appointment.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-400"
              >
                {isCancelling === appointment.id ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
          {!isUpcomingCard && appointment.status === 'completed' && !appointment.rating && (
            <button
              type="button"
              onClick={() => onRate(appointment)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Rate this session
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function AppointmentsContent() {
  const confirm = useConfirm();
  const searchParams = useSearchParams();
  const rateAppointmentId = searchParams.get('rate');
  const payAppointmentId = searchParams.get('pay');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<any | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expertTypeFilter, setExpertTypeFilter] = useState<ExpertTypeFilter>('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!payAppointmentId || appointments.length === 0) return;
    const target = appointments.find((a) => a.id === payAppointmentId);
    if (target && target.status === 'awaiting_payment') {
      setPaymentTarget(target);
      setTimeFilter('upcoming');
      setStatusFilter('awaiting_payment');
    }
  }, [payAppointmentId, appointments]);

  useEffect(() => {
    if (!rateAppointmentId || appointments.length === 0) return;
    const target = appointments.find((a) => a.id === rateAppointmentId);
    if (target && target.status === 'completed' && !target.rating) {
      setRatingTarget(target);
      setTimeFilter('past');
      setStatusFilter('completed');
    }
  }, [rateAppointmentId, appointments]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await appointmentAPI.getAppointments();
      setAppointments((response.data.data?.appointments || []).map(mapAppointment));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const confirmed = await confirm({
      title: 'Cancel appointment?',
      message: 'This appointment will be cancelled. You may need to book a new slot.',
      confirmLabel: 'Yes, cancel',
      cancelLabel: 'No',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      setIsCancelling(appointmentId);
      await appointmentAPI.cancelAppointment(appointmentId, 'Cancelled by client');
      toast.success('Appointment cancelled successfully!');
      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setIsCancelling(null);
    }
  };

  const handleSubmitRating = async (rating: number, feedback: string) => {
    if (!ratingTarget) return;

    try {
      await appointmentAPI.rateAppointment(ratingTarget.id, { rating, feedback });
      toast.success('Thanks for your feedback!');
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === ratingTarget.id ? { ...a, rating, clientFeedback: feedback } : a
        )
      );
      setRatingTarget(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
      throw error;
    }
  };

  const counts = useMemo(() => {
    const upcoming = appointments.filter(isUpcoming);
    return {
      total: appointments.length,
      upcoming: upcoming.length,
      past: appointments.length - upcoming.length,
      pendingApproval: appointments.filter((a) => a.status === 'pending_approval').length,
      awaitingPayment: appointments.filter((a) => a.status === 'awaiting_payment').length,
      needsRating: appointments.filter((a) => a.status === 'completed' && !a.rating).length,
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return appointments.filter((appointment) => {
      if (timeFilter === 'upcoming' && !isUpcoming(appointment)) return false;
      if (timeFilter === 'past' && isUpcoming(appointment)) return false;
      if (!matchesStatusFilter(appointment.status, statusFilter)) return false;
      if (expertTypeFilter !== 'all' && appointment.expertType !== expertTypeFilter) return false;

      if (query) {
        const haystack = `${appointment.topic || ''} ${appointment.expertName || ''} ${appointment.expertType || ''} ${formatStatusLabel(appointment.status)}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [appointments, timeFilter, statusFilter, expertTypeFilter, searchQuery]);

  const { upcomingResults, pastResults } = useMemo(() => {
    const upcoming = filteredAppointments
      .filter(isUpcoming)
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
    const past = filteredAppointments
      .filter((a) => !isUpcoming(a))
      .sort(
        (a, b) =>
          new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      );

    return { upcomingResults: upcoming, pastResults: past };
  }, [filteredAppointments]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    timeFilter !== 'all' ||
    statusFilter !== 'all' ||
    expertTypeFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setTimeFilter('all');
    setStatusFilter('all');
    setExpertTypeFilter('all');
  };

  const applyQuickFilter = (type: 'payment' | 'approval' | 'rating') => {
    if (type === 'payment') {
      setTimeFilter('upcoming');
      setStatusFilter('awaiting_payment');
    } else if (type === 'approval') {
      setTimeFilter('upcoming');
      setStatusFilter('pending_approval');
    } else {
      setTimeFilter('past');
      setStatusFilter('completed');
    }
    setExpertTypeFilter('all');
    setSearchQuery('');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const showUpcomingSection = timeFilter !== 'past' && upcomingResults.length > 0;
  const showPastSection = timeFilter !== 'upcoming' && pastResults.length > 0;
  const noResults = filteredAppointments.length === 0;

  return (
    <div className="space-y-6">
      <AppointmentPaymentModal
        appointment={paymentTarget}
        isOpen={Boolean(paymentTarget)}
        onClose={() => setPaymentTarget(null)}
        onPaid={fetchAppointments}
      />
      <AppointmentRatingModal
        appointment={ratingTarget}
        isOpen={Boolean(ratingTarget)}
        onClose={() => setRatingTarget(null)}
        onSubmit={handleSubmitRating}
      />

      <PageHeader
        title="Appointments"
        description={`${counts.total} total · ${counts.upcoming} upcoming · ${counts.past} past`}
        action={
          <Link href="/client/browse-experts" className="btn-primary w-full sm:w-auto">
            Book new session
          </Link>
        }
      />

      {(counts.awaitingPayment > 0 || counts.pendingApproval > 0 || counts.needsRating > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {counts.awaitingPayment > 0 ? (
            <button
              type="button"
              onClick={() => applyQuickFilter('payment')}
              className="card card-body text-left transition hover:border-indigo-200 hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Awaiting payment
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{counts.awaitingPayment}</p>
              <p className="mt-1 text-sm text-slate-500">Tap to filter</p>
            </button>
          ) : null}
          {counts.pendingApproval > 0 ? (
            <button
              type="button"
              onClick={() => applyQuickFilter('approval')}
              className="card card-body text-left transition hover:border-amber-200 hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Pending approval
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{counts.pendingApproval}</p>
              <p className="mt-1 text-sm text-slate-500">Tap to filter</p>
            </button>
          ) : null}
          {counts.needsRating > 0 ? (
            <button
              type="button"
              onClick={() => applyQuickFilter('rating')}
              className="card card-body text-left transition hover:border-blue-200 hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Rate sessions
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{counts.needsRating}</p>
              <p className="mt-1 text-sm text-slate-500">Tap to filter</p>
            </button>
          ) : null}
        </div>
      )}

      <div className="card card-body space-y-5">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Filter size={18} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Filters</p>
            <p className="text-sm text-slate-500">
              {filteredAppointments.length} of {appointments.length} appointments shown
            </p>
          </div>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by expert, topic, or status..."
            className="input-field pl-10"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Time
          </p>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTimeFilter(option.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  timeFilter === option.value
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="appointment-status-filter"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Status
            </label>
            <select
              id="appointment-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="input-field"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="appointment-expert-filter"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Expert type
            </label>
            <select
              id="appointment-expert-filter"
              value={expertTypeFilter}
              onChange={(e) => setExpertTypeFilter(e.target.value as ExpertTypeFilter)}
              className="input-field"
            >
              <option value="all">All experts</option>
              <option value="trainer">Trainers</option>
              <option value="nutritionist">Nutritionists</option>
            </select>
          </div>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <X size={14} />
            Clear filters
          </button>
        ) : null}
      </div>

      {noResults ? (
        <div className="card card-body py-12 text-center">
          <Calendar className="mx-auto mb-4 text-slate-300" size={48} />
          <h2 className="text-lg font-semibold text-slate-900">
            {appointments.length === 0 ? 'No appointments yet' : 'No appointments match your filters'}
          </h2>
          <p className="mt-2 text-slate-500">
            {appointments.length === 0
              ? 'Browse experts and book your first session.'
              : 'Try adjusting your filters or search term.'}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {hasActiveFilters ? (
              <button type="button" onClick={clearFilters} className="btn-secondary">
                Clear filters
              </button>
            ) : null}
            <Link href="/client/browse-experts" className="btn-primary inline-flex">
              <Sparkles size={16} />
              Browse experts
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {showUpcomingSection ? (
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Upcoming
                  <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-semibold text-blue-700">
                    {upcomingResults.length}
                  </span>
                </h2>
              </div>
              <div className="space-y-4">
                {upcomingResults.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    variant="upcoming"
                    isCancelling={isCancelling}
                    onCancel={handleCancelAppointment}
                    onPay={setPaymentTarget}
                    onRate={setRatingTarget}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {showPastSection ? (
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Past
                  <span className="ml-2 rounded-full bg-slate-200 px-2.5 py-0.5 text-sm font-semibold text-slate-700">
                    {pastResults.length}
                  </span>
                </h2>
              </div>
              <div className="space-y-4">
                {pastResults.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    variant="past"
                    isCancelling={isCancelling}
                    onCancel={handleCancelAppointment}
                    onPay={setPaymentTarget}
                    onRate={setRatingTarget}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppointmentsContent />
    </Suspense>
  );
}

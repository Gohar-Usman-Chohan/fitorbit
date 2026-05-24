'use client';

import { useEffect, useState } from 'react';
import { trainerAPI } from '@/lib/api';
import { mapAppointment } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ExpertAppointmentActions } from '@/components/features/appointments/ExpertAppointmentActions';
import { BOOKING_WINDOW_LABEL } from '@/config/constants';
import { toast } from 'sonner';
import { formatDate, formatDateTime, formatTime, formatWeekdayShort } from '@/lib/dateFormat';

export default function TrainerSchedule() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const scheduleRes = await trainerAPI.getSchedule();
      setAppointments((scheduleRes.data.data?.appointments || []).map(mapAppointment));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const pending = appointments.filter((a) => a.status === 'pending_approval');
  const confirmed = appointments.filter((a) => a.status !== 'pending_approval');

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="page-title">Schedule</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {pending.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-amber-800">Pending approval ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-4 rounded-lg border border-amber-200 p-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {appt.clientName || 'Client'} — {appt.topic || 'Session request'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(appt.appointmentDate)} · {appt.duration} min · $
                        {appt.paymentAmount?.toFixed?.(2) || appt.paymentAmount || '—'}
                      </p>
                    </div>
                    <ExpertAppointmentActions appointment={appt} accent="green" onUpdated={fetchSchedule} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-gray-900">All sessions</h2>
            {confirmed.length > 0 ? (
              <div className="space-y-3">
                {confirmed.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="w-20 shrink-0 text-center">
                      <p className="font-bold text-blue-600">
                        {formatWeekdayShort(appt.appointmentDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(appt.appointmentDate)}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">
                        Session with {appt.clientName || 'Client'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTime(appt.appointmentDate)} · {appt.duration} min
                      </p>
                    </div>
                    <ExpertAppointmentActions appointment={appt} accent="green" onUpdated={fetchSchedule} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No other appointments yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Availability</h2>
          <p className="text-sm text-gray-700">{BOOKING_WINDOW_LABEL}</p>
          <p className="mt-3 text-sm text-gray-500">
            Clients can only book within these hours. Overlapping sessions are automatically blocked.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Dumbbell, MessageSquare, Users } from 'lucide-react';
import { trainerAPI } from '@/lib/api';
import { mapAppointment, formatExpertRating } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { QuickActionLink } from '@/components/ui/QuickActionLink';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/dateFormat';

export default function TrainerDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    trainerAPI
      .getDashboard()
      .then((res) => setDashboard(res.data.data))
      .catch((error: any) => {
        toast.error(error.response?.data?.message || 'Failed to load dashboard');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner />;

  const stats = dashboard?.stats || dashboard || {};
  const rating = formatExpertRating(stats.averageRating, stats.totalRatings);
  const upcoming = (dashboard?.upcomingAppointmentsList || []).map(mapAppointment);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trainer Dashboard"
        description="Manage your clients, sessions, and workout plans from one place."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Clients" value={stats.totalClients || 0} color="blue" />
        <StatCard title="Workout Plans" value={stats.totalWorkouts || dashboard?.activeWorkouts || 0} color="green" />
        <StatCard title="Upcoming Sessions" value={stats.upcomingAppointments || 0} color="orange" />
        <StatCard
          title="Average Rating"
          value={rating.display}
          subtitle={rating.subtitle}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding>
          <CardHeader title="Upcoming Sessions" />
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((appt: any) => (
                <div key={appt.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <p className="font-semibold text-slate-900">{appt.clientName || appt.topic || 'Session'}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDateTime(appt.appointmentDate)} · {appt.duration} min
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No upcoming sessions scheduled.</p>
          )}
        </Card>

        <Card padding>
          <CardHeader title="Quick Actions" />
          <div className="space-y-2">
            <QuickActionLink href="/trainer/clients" label="Manage Clients" icon={Users} />
            <QuickActionLink href="/trainer/workout-plans" label="Workout Plans" icon={Dumbbell} />
            <QuickActionLink href="/trainer/schedule" label="View Schedule" icon={Calendar} />
            <QuickActionLink href="/trainer/chat" label="Chat" icon={MessageSquare} />
          </div>
        </Card>
      </div>
    </div>
  );
}

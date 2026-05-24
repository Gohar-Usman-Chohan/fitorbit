'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MessageSquare, Search, Target } from 'lucide-react';
import { clientAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { QuickActionLink } from '@/components/ui/QuickActionLink';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/dateFormat';

export default function ClientDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientAPI
      .getDashboard()
      .then((response) => {
        setDashboardData(response.data.data);
        setError(null);
      })
      .catch((err: any) => {
        const message = err.response?.data?.message || 'Failed to load dashboard';
        setError(message);
        toast.error(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <Card className="text-center">
        <h2 className="text-lg font-semibold text-red-700">Error Loading Dashboard</h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome back!"
        description="Here's an overview of your fitness journey and upcoming activity."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Workout" value={dashboardData?.activeWorkout ? 1 : 0} color="blue" />
        <StatCard title="Active Diet Plan" value={dashboardData?.activeDiet ? 1 : 0} color="green" />
        <StatCard
          title="Upcoming Appointments"
          value={dashboardData?.upcomingAppointments?.length || 0}
          color="orange"
        />
        <StatCard
          title="Recent Progress Logs"
          value={dashboardData?.recentProgress?.length || 0}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding>
          <CardHeader title="Upcoming Appointments" />
          {dashboardData?.upcomingAppointments?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.upcomingAppointments.map((appt: any) => (
                <div
                  key={appt._id || appt.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{appt.topic || 'Session'}</p>
                    <p className="text-sm text-slate-500">
                      {formatDateTime(appt.appointmentDate)}
                    </p>
                  </div>
                  <Link href="/client/appointments" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No upcoming appointments</p>
          )}
        </Card>

        <Card padding>
          <CardHeader title="Quick Actions" />
          <div className="space-y-2">
            <QuickActionLink href="/client/browse-experts" label="Find Experts" icon={Search} description="Browse trainers & nutritionists" />
            <QuickActionLink href="/client/fitness-goals" label="Set Goals" icon={Target} description="Define your fitness targets" />
            <QuickActionLink href="/client/chat" label="Messages" icon={MessageSquare} description="Chat with your experts" />
            <QuickActionLink href="/client/appointments" label="Appointments" icon={Calendar} description="Manage your schedule" />
          </div>
        </Card>
      </div>
    </div>
  );
}

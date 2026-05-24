'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { nutritionistAPI, trainerAPI } from '@/lib/api';
import { formatExpertRating, mapDietPlan, mapWorkoutPlan } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { toast } from 'sonner';

type Variant = 'trainer' | 'nutritionist';

type ProgramRow = {
  title: string;
  clients: number;
  active: number;
};

type SessionStats = {
  completed: number;
  scheduled: number;
  cancelled: number;
};

const CONFIG = {
  trainer: {
    title: 'Analytics & Performance',
    description: 'Track sessions, client growth, ratings, and your most popular workout programs.',
    plansLabel: 'Workout Plans',
    plansKey: 'totalWorkouts' as const,
    topProgramsTitle: 'Top Workout Programs',
    sessionTitle: 'Session Breakdown',
    overviewTitle: 'Workout Plans Overview',
    emptyPrograms: 'No workout plans yet. Create plans to see analytics here.',
    accent: {
      primary: 'blue' as const,
      secondary: 'green' as const,
      rating: 'purple' as const,
      sessions: 'orange' as const,
    },
  },
  nutritionist: {
    title: 'Analytics & Performance',
    description: 'Monitor consultations, client engagement, ratings, and top diet programs.',
    plansLabel: 'Meal Plans',
    plansKey: 'totalMealPlans' as const,
    topProgramsTitle: 'Top Diet Programs',
    sessionTitle: 'Consultation Breakdown',
    overviewTitle: 'Diet Plans Overview',
    emptyPrograms: 'No diet plans yet. Create plans to see analytics here.',
    accent: {
      primary: 'green' as const,
      secondary: 'blue' as const,
      rating: 'purple' as const,
      sessions: 'orange' as const,
    },
  },
};

function ProgressRow({
  label,
  value,
  total,
  colorClass,
}: {
  label: string;
  value: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="tabular-nums font-semibold text-slate-900">
          {value}
          <span className="ml-1 text-xs font-normal text-slate-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OverviewRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const tones = {
    blue: 'bg-blue-50/80 text-blue-700 ring-blue-100',
    green: 'bg-emerald-50/80 text-emerald-700 ring-emerald-100',
    purple: 'bg-violet-50/80 text-violet-700 ring-violet-100',
    orange: 'bg-orange-50/80 text-orange-700 ring-orange-100',
  };

  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 ring-inset ${tones[tone]}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-lg font-bold tabular-nums">{value}</span>
    </div>
  );
}

interface ExpertAnalyticsContentProps {
  variant: Variant;
}

export function ExpertAnalyticsContent({ variant }: ExpertAnalyticsContentProps) {
  const config = CONFIG[variant];
  const [stats, setStats] = useState<any>(null);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    completed: 0,
    scheduled: 0,
    cancelled: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const api = variant === 'trainer' ? trainerAPI : nutritionistAPI;
    const plansCall = variant === 'trainer' ? trainerAPI.getWorkouts() : nutritionistAPI.getMealPlans();
    const mapPlan = variant === 'trainer' ? mapWorkoutPlan : mapDietPlan;
    const plansKey = variant === 'trainer' ? 'workouts' : 'plans';

    Promise.all([api.getDashboard(), plansCall, api.getSchedule()])
      .then(([dashboardRes, plansRes, scheduleRes]) => {
        const dashboard = dashboardRes.data.data;
        setStats(dashboard?.stats || dashboard || {});

        const rawPlans = plansRes.data.data?.[plansKey] || plansRes.data.data?.plans || [];
        const plans = rawPlans.map(mapPlan);
        const programMap = new Map<string, ProgramRow>();

        plans.forEach((plan: any) => {
          const key = plan.title || 'Untitled Plan';
          const existing = programMap.get(key) || { title: key, clients: 0, active: 0 };
          existing.clients += 1;
          if (plan.status === 'active') existing.active += 1;
          programMap.set(key, existing);
        });

        setPrograms(
          Array.from(programMap.values())
            .sort((a, b) => b.clients - a.clients)
            .slice(0, 5)
        );

        const appointments = scheduleRes.data.data?.appointments || [];
        setSessionStats({
          completed: appointments.filter((a: any) => a.status === 'completed').length,
          scheduled: appointments.filter((a: any) => a.status === 'scheduled').length,
          cancelled: appointments.filter((a: any) => a.status === 'cancelled').length,
        });
      })
      .catch((error: any) => {
        toast.error(error.response?.data?.message || 'Failed to load analytics');
      })
      .finally(() => setIsLoading(false));
  }, [variant]);

  const rating = useMemo(
    () => formatExpertRating(stats?.averageRating, stats?.totalRatings),
    [stats]
  );

  if (isLoading) return <LoadingSpinner />;

  const totalSessions =
    sessionStats.completed + sessionStats.scheduled + sessionStats.cancelled;
  const activeSessionTotal = sessionStats.completed + sessionStats.scheduled;
  const planTotal =
    stats?.[config.plansKey] ?? programs.reduce((sum, program) => sum + program.clients, 0);
  const activePlans = programs.reduce((sum, program) => sum + program.active, 0);

  return (
    <div className="space-y-8">
      <PageHeader title={config.title} description={config.description} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={variant === 'trainer' ? 'Total Sessions' : 'Total Consultations'}
          value={activeSessionTotal}
          subtitle={`${sessionStats.completed} completed · ${sessionStats.scheduled} upcoming`}
          color={config.accent.primary}
        />
        <StatCard
          title="Active Clients"
          value={stats?.totalClients || 0}
          subtitle={`${planTotal} active ${config.plansLabel.toLowerCase()}`}
          color={config.accent.secondary}
        />
        <StatCard
          title={config.plansLabel}
          value={planTotal}
          subtitle={`${activePlans} currently active`}
          color={config.accent.sessions}
        />
        <StatCard
          title="Avg Rating"
          value={
            <span className="inline-flex items-center gap-2">
              {rating.display}
              {rating.display !== '—' ? <Star size={22} className="fill-amber-400 text-amber-400" /> : null}
            </span>
          }
          subtitle={rating.subtitle}
          color={config.accent.rating}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding>
          <CardHeader
            title={config.sessionTitle}
            description="Distribution of your booked appointments"
          />
          <div className="space-y-5">
            <ProgressRow
              label="Completed"
              value={sessionStats.completed}
              total={totalSessions}
              colorClass="bg-emerald-500"
            />
            <ProgressRow
              label="Scheduled"
              value={sessionStats.scheduled}
              total={totalSessions}
              colorClass="bg-blue-500"
            />
            <ProgressRow
              label="Cancelled"
              value={sessionStats.cancelled}
              total={totalSessions}
              colorClass="bg-red-400"
            />
          </div>
        </Card>

        <Card padding>
          <CardHeader title={config.overviewTitle} description="Snapshot of your plan portfolio" />
          <div className="space-y-3">
            <OverviewRow label="Total Plans Created" value={planTotal} tone="blue" />
            <OverviewRow label="Active Plans" value={activePlans} tone="green" />
            <OverviewRow label="Unique Programs" value={programs.length} tone="purple" />
            <OverviewRow
              label="Upcoming Sessions"
              value={stats?.upcomingAppointments ?? sessionStats.scheduled}
              tone="orange"
            />
          </div>
        </Card>
      </div>

      <Card padding>
        <CardHeader
          title={config.topProgramsTitle}
          description="Most assigned programs across your client base"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <TrendingUp size={14} />
              Top {programs.length || 0}
            </span>
          }
        />

        {programs.length > 0 ? (
          <div className="table-scroll overflow-hidden rounded-xl border border-slate-200/90">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 font-semibold text-slate-600">Program</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Clients</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Active</th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 sm:table-cell">Share</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program, index) => {
                  const maxClients = programs[0]?.clients || 1;
                  const share = Math.round((program.clients / maxClients) * 100);

                  return (
                    <tr key={program.title} className="border-t border-slate-100 transition hover:bg-slate-50/60">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                            #{index + 1}
                          </span>
                          <span className="font-medium text-slate-900">{program.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-800">
                        {program.clients}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                          {program.active} active
                        </span>
                      </td>
                      <td className="hidden px-4 py-3.5 sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${variant === 'trainer' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-slate-500">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
              {variant === 'trainer' ? (
                <BarChart3 size={22} />
              ) : (
                <ClipboardList size={22} />
              )}
            </div>
            <p className="text-sm text-slate-500">{config.emptyPrograms}</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card card-body flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client reach</p>
            <p className="text-lg font-bold text-slate-900">{stats?.totalClients || 0} clients</p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CalendarCheck size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completion rate</p>
            <p className="text-lg font-bold text-slate-900">
              {totalSessions > 0
                ? `${Math.round((sessionStats.completed / totalSessions) * 100)}%`
                : '—'}
            </p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Star size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reputation</p>
            <p className="text-lg font-bold text-slate-900">{rating.display}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

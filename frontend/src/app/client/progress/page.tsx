'use client';

import { useState, useEffect } from 'react';
import { progressAPI } from '@/lib/api';
import { normalizeProgressStats } from '@/lib/apiHelpers';
import { WorkoutLogForm } from '@/components/forms/WorkoutLogForm';
import { DietLogForm } from '@/components/forms/DietLogForm';
import { MeasurementLogForm } from '@/components/forms/MeasurementLogForm';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import { formatDate, formatDateTime, formatChartDateTime } from '@/lib/dateFormat';

type Tab = 'charts' | 'workout' | 'nutrition' | 'measurement';

function formatLogSummary(log: any) {
  if (log.logType === 'workout') {
    const exercise = log.workoutLog?.exercisesCompleted?.[0]?.exerciseName || 'Workout';
    const duration = log.workoutLog?.durationMinutes;
    return duration ? `${exercise} · ${duration} min` : exercise;
  }
  if (log.logType === 'nutrition') {
    const calories = log.nutritionLog?.totalCalories;
    const meal = log.nutritionLog?.mealsConsumed?.[0] || log.nutritionLog?.mealType || 'Meal';
    return calories ? `${meal} · ${calories} kcal` : String(meal);
  }
  if (log.logType === 'measurement') {
    const weight = log.measurementLog?.weight;
    return weight ? `Weight: ${weight} kg` : 'Measurement';
  }
  return log.logType;
}

export default function ProgressContent() {
  const [logs, setLogs] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('charts');

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setIsLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        progressAPI.getProgressLogs({ limit: 100 }),
        progressAPI.getProgressStatistics(),
      ]);

      setLogs(logsRes.data.data?.progress || []);
      setStatistics(normalizeProgressStats(statsRes.data.data || {}));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  const weightData = logs
    .filter((log) => log.logType === 'measurement' && log.measurementLog?.weight != null)
    .map((log) => ({
      date: formatDate(log.logDate || log.createdAt),
      weight: log.measurementLog.weight,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const workoutData = logs
    .filter((log) => log.logType === 'workout')
    .reduce(
      (acc, log) => {
        const date = formatDate(log.logDate || log.createdAt);
        const existing = acc.find((d: { date: string; workouts: number }) => d.date === date);
        if (existing) existing.workouts += 1;
        else acc.push({ date, workouts: 1 });
        return acc;
      },
      [] as Array<{ date: string; workouts: number }>
    );

  const calorieData = logs
    .filter((log) => log.logType === 'nutrition' && log.nutritionLog?.totalCalories != null)
    .map((log) => {
      const when = new Date(log.logDate || log.createdAt);
      return {
        date: formatDate(when),
        label: formatChartDateTime(when),
        calories: Number(log.nutritionLog.totalCalories),
        sortTime: when.getTime(),
      };
    })
    .sort((a, b) => a.sortTime - b.sortTime)
    .map(({ sortTime: _sortTime, ...entry }) => entry);

  if (isLoading) return <LoadingSpinner />;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'charts', label: 'Charts & Analytics' },
    { id: 'workout', label: 'Log Workout' },
    { id: 'nutrition', label: 'Log Meal' },
    { id: 'measurement', label: 'Log Weight' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Progress Tracking"
        description="Log workouts, meals, and measurements to monitor your fitness journey."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          title="Current Weight"
          value={
            statistics?.currentWeight != null && statistics.currentWeight !== ''
              ? `${statistics.currentWeight} kg`
              : 'Not logged'
          }
          subtitle={
            statistics?.measurementCount
              ? `${statistics.measurementCount} measurement(s) logged`
              : 'From profile or latest measurement'
          }
          color="blue"
        />
        <StatCard
          title="Workouts Completed"
          value={statistics?.totalWorkouts || 0}
          subtitle={`This month: ${statistics?.monthlyWorkouts || 0}`}
          color="green"
        />
        <StatCard
          title="Average Calories"
          value={`${Math.round(statistics?.averageCalories || 0)} kcal`}
          subtitle={`${statistics?.nutritionCount || 0} meal log(s)`}
          color="orange"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {weightData.length > 0 ? (
              <ProgressChart
                data={weightData}
                title="Weight Progress"
                dataKey="weight"
                type="line"
                color="#2563eb"
              />
            ) : (
              <Card padding>
                <CardHeader
                  title="Weight Progress"
                  description="Log your weight under the “Log Weight” tab to see a chart here."
                />
              </Card>
            )}

            {workoutData.length > 0 ? (
              <ProgressChart
                data={workoutData}
                title="Workouts Per Day"
                dataKey="workouts"
                type="bar"
                color="#10b981"
              />
            ) : null}

            {calorieData.length > 0 ? (
              <ProgressChart
                data={calorieData}
                title="Calories Logged"
                dataKey="calories"
                categoryKey="label"
                type="bar"
                color="#f97316"
              />
            ) : null}
          </div>

          <Card padding>
            <CardHeader title="Recent Activity" />
            {logs.length > 0 ? (
              <ul className="space-y-3">
                {logs.slice(0, 10).map((log) => (
                  <li
                    key={log._id || log.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm"
                  >
                    <p className="font-medium capitalize text-slate-900">{log.logType}</p>
                    <p className="text-slate-600">{formatLogSummary(log)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(log.logDate || log.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No activity logged yet.</p>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'workout' && <WorkoutLogForm onSuccess={fetchProgressData} />}
      {activeTab === 'nutrition' && <DietLogForm onSuccess={fetchProgressData} />}
      {activeTab === 'measurement' && <MeasurementLogForm onSuccess={fetchProgressData} />}
    </div>
  );
}

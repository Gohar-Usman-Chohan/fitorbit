'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trainerAPI } from '@/lib/api';
import { mapTrainerClient } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { buildClientFilterOptions, ClientPlanFilter } from '@/components/ui/ClientPlanFilter';
import { toast } from 'sonner';
import { formatDate } from '@/lib/dateFormat';

interface ClientReport {
  id: string;
  name: string;
  planTitle: string;
  workoutLogsCount: number;
  progress: any[];
  workoutCount: number;
  measurementCount: number;
  latestNote?: string;
}

function getRating(workoutCount: number, planTitle: string) {
  if (!planTitle || planTitle === 'Not assigned') return 'No plan';
  if (workoutCount >= 8) return 'Excellent';
  if (workoutCount >= 4) return 'Good';
  if (workoutCount >= 1) return 'Fair';
  return 'Needs attention';
}

export default function ProgressReports() {
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get('clientId');

  const [reports, setReports] = useState<ClientReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('');

  const clientFilterOptions = useMemo(
    () => buildClientFilterOptions([], reports.map((report) => ({ clientId: report.id, clientName: report.name }))),
    [reports]
  );

  const filteredReports = useMemo(() => {
    if (!clientFilter) return reports;
    return reports.filter((report) => report.id === clientFilter);
  }, [reports, clientFilter]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        const clientsRes = await trainerAPI.getClients();
        const clients = (clientsRes.data.data?.clients || []).map(mapTrainerClient);

        const reportData = await Promise.all(
          clients.map(async (client: any) => {
            try {
              const progressRes = await trainerAPI.getClientProgress(client.id);
              const progress = progressRes.data.data?.progress || [];
              const workoutLogs = progress.filter((p: any) => p.logType === 'workout');
              const measurementLogs = progress.filter((p: any) => p.logType === 'measurement');
              const latestWorkout = workoutLogs[0];

              return {
                id: client.id,
                name: client.name,
                planTitle: client.planTitle,
                workoutLogsCount: client.workoutLogsCount || workoutLogs.length,
                progress,
                workoutCount: workoutLogs.length,
                measurementCount: measurementLogs.length,
                latestNote:
                  latestWorkout?.workoutLog?.notes ||
                  latestWorkout?.notes ||
                  (workoutLogs.length
                    ? `Last workout logged on ${formatDate(latestWorkout.logDate || latestWorkout.createdAt)}`
                    : 'No workout logs shared yet.'),
              };
            } catch {
              return {
                id: client.id,
                name: client.name,
                planTitle: client.planTitle,
                workoutLogsCount: client.workoutLogsCount || 0,
                progress: [],
                workoutCount: 0,
                measurementCount: 0,
                latestNote: 'Unable to load progress for this client.',
              };
            }
          })
        );

        setReports(reportData);
        setClientFilter(clientIdParam || '');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load progress reports');
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [clientIdParam]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Client Progress Reports"
        description={clientIdParam ? 'Showing report for selected client' : undefined}
      />

      {reports.length > 0 ? (
          <div className="space-y-6">
            <ClientPlanFilter
              options={clientFilterOptions}
              value={clientFilter}
              onChange={setClientFilter}
              filteredCount={filteredReports.length}
              totalCount={reports.length}
              planLabel="report"
              accent="blue"
            />

            {filteredReports.length > 0 ? (
              filteredReports.map((report) => {
              const progressPct = report.planTitle !== 'Not assigned'
                ? Math.min(100, Math.round((report.workoutCount / 8) * 100))
                : 0;

              return (
                <div key={report.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{report.name}</h3>
                      <p className="text-gray-600 text-sm">{report.planTitle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded">
                      <p className="text-gray-600 text-sm">Workout Logs</p>
                      <p className="text-2xl font-bold text-blue-600">{report.workoutCount}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <p className="text-gray-600 text-sm">Progress</p>
                      <p className="text-2xl font-bold text-green-600">{progressPct}%</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded">
                      <p className="text-gray-600 text-sm">Overall Rating</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {getRating(report.workoutCount, report.planTitle)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Latest Activity</h4>
                    <p className="text-gray-700 text-sm">{report.latestNote}</p>
                  </div>

                  {report.progress.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Recent Logs</h4>
                      <div className="space-y-2">
                        {report.progress.slice(0, 5).map((log: any) => (
                          <div key={log._id || log.id} className="flex justify-between text-sm p-2 border rounded">
                            <span className="capitalize text-gray-700">{log.logType}</span>
                            <span className="text-gray-500">
                              {formatDate(log.logDate || log.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg">No reports match this client filter.</p>
                <button
                  type="button"
                  onClick={() => setClientFilter('')}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Show all clients
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No client progress to show yet.</p>
            <p className="text-gray-400 mt-2">
              Assign clients and ask them to log workouts visible to you.
            </p>
          </div>
        )}
    </div>
  );
}

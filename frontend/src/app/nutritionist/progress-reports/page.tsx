'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { nutritionistAPI } from '@/lib/api';
import { mapNutritionistClient } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { buildClientFilterOptions, ClientPlanFilter } from '@/components/ui/ClientPlanFilter';
import { toast } from 'sonner';
import { formatDate } from '@/lib/dateFormat';

function getStatus(compliance: number, planTitle: string) {
  if (!planTitle || planTitle === 'Not assigned') return 'No plan';
  if (compliance >= 80) return 'Excellent';
  if (compliance >= 50) return 'Good';
  if (compliance >= 1) return 'Fair';
  return 'Needs attention';
}

export default function NutritionistProgressReports() {
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  const [reports, setReports] = useState<any[]>([]);
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
        const clientsRes = await nutritionistAPI.getClients();
        const clients = (clientsRes.data.data?.clients || []).map(mapNutritionistClient);

        const reportData = await Promise.all(
          clients.map(async (client: any) => {
            try {
              const progressRes = await nutritionistAPI.getClientProgress(client.id);
              const progress = progressRes.data.data?.progress || [];
              const nutritionLogs = progress.filter((p: any) => p.logType === 'nutrition');
              const latest = nutritionLogs[0];

              return {
                id: client.id,
                name: client.name,
                planTitle: client.planTitle,
                compliance: client.compliance || 0,
                nutritionCount: nutritionLogs.length,
                latestNote:
                  latest?.nutritionistFeedback ||
                  latest?.nutritionLog?.notes ||
                  (nutritionLogs.length
                    ? `Last nutrition log on ${formatDate(latest.logDate || latest.createdAt)}`
                    : 'No nutrition logs shared yet.'),
                progress: nutritionLogs.slice(0, 5),
              };
            } catch {
              return {
                id: client.id,
                name: client.name,
                planTitle: client.planTitle,
                compliance: client.compliance || 0,
                nutritionCount: 0,
                latestNote: 'Unable to load progress for this client.',
                progress: [],
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
      <PageHeader title="Client Progress Reports" />

      {reports.length > 0 ? (
        <div className="space-y-6">
          <ClientPlanFilter
            options={clientFilterOptions}
            value={clientFilter}
            onChange={setClientFilter}
            filteredCount={filteredReports.length}
            totalCount={reports.length}
            planLabel="report"
            accent="green"
          />

          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{report.name}</h3>
                <p className="text-gray-600 text-sm">{report.planTitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Adherence Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{report.compliance}%</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Nutrition Logs</p>
                  <p className="text-2xl font-bold text-green-600">{report.nutritionCount}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Overall Status</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {getStatus(report.compliance, report.planTitle)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Nutritionist Notes</h4>
                <p className="text-gray-700 text-sm">{report.latestNote}</p>
              </div>

              {report.progress.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recent Logs</h4>
                  <div className="space-y-2">
                    {report.progress.map((log: any) => (
                      <div key={log._id || log.id} className="flex justify-between text-sm p-2 border rounded">
                        <span>Nutrition log</span>
                        <span className="text-gray-500">
                          {formatDate(log.logDate || log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No reports match this client filter.</p>
              <button
                type="button"
                onClick={() => setClientFilter('')}
                className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Show all clients
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No client progress to show yet.</p>
          <p className="text-gray-400 mt-2">Assign clients and ask them to log nutrition visible to you.</p>
        </div>
      )}
    </div>
  );
}

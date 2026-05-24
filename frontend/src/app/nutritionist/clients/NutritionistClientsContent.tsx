'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { nutritionistAPI } from '@/lib/api';
import { mapNutritionistClient } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { formatDate } from '@/lib/dateFormat';

function ClientStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${
        status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      {status === 'active' ? 'Active' : 'Pending'}
    </span>
  );
}

export default function NutritionistClientsContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      try {
        setIsLoading(true);
        const response = await nutritionistAPI.getClients();
        const payload = response.data?.data ?? response.data;
        const list = payload?.clients ?? [];

        if (!cancelled) {
          setClients(list.map(mapNutritionistClient));
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          const message = err.response?.data?.message || 'Failed to load clients';
          setError(message);
          setClients([]);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadClients();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="My Clients"
        description={`${clients.length} client${clients.length === 1 ? '' : 's'} loaded from database`}
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {clients.length > 0 ? (
        <>
          <div className="mobile-card-list">
            {clients.map((client) => (
              <article key={client.id} className="card card-body space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-600">
                      Joined {client.joinedAt ? formatDate(client.joinedAt) : '—'}
                    </p>
                    {client.isEmailVerified === false && (
                      <p className="mt-1 text-xs text-amber-600">Email not verified</p>
                    )}
                  </div>
                  <ClientStatusBadge status={client.status} />
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Plan:</span> {client.planTitle}
                </div>
                {client.planTitle !== 'Not assigned' ? (
                  <div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-green-600"
                        style={{ width: `${client.compliance}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{client.compliance}% compliance</p>
                  </div>
                ) : null}
                {client.planTitle !== 'Not assigned' ? (
                  <Link
                    href={`/nutritionist/progress-reports?clientId=${client.id}`}
                    className="inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    View progress
                  </Link>
                ) : (
                  <Link
                    href="/nutritionist/diet-plans"
                    className="inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Assign plan
                  </Link>
                )}
              </article>
            ))}
          </div>

          <div className="desktop-table-only overflow-hidden rounded-lg bg-white shadow">
            <div className="table-scroll">
              <table>
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sm:px-6">
                      Client Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sm:px-6">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sm:px-6">
                      Diet Plan
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sm:px-6">
                      Compliance
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-4 sm:px-6">
                        <div>
                          <p className="font-semibold text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-600">
                            joined {client.joinedAt ? formatDate(client.joinedAt) : '—'}
                          </p>
                          {client.isEmailVerified === false && (
                            <p className="mt-1 text-xs text-amber-600">Email not verified</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <ClientStatusBadge status={client.status} />
                      </td>
                      <td className="px-4 py-4 sm:px-6">{client.planTitle}</td>
                      <td className="px-4 py-4 sm:px-6">
                        {client.planTitle !== 'Not assigned' ? (
                          <div>
                            <div className="h-2 w-full max-w-[140px] rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-green-600"
                                style={{ width: `${client.compliance}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-600">{client.compliance}%</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        {client.planTitle !== 'Not assigned' ? (
                          <Link
                            href={`/nutritionist/progress-reports?clientId=${client.id}`}
                            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            View
                          </Link>
                        ) : (
                          <Link
                            href="/nutritionist/diet-plans"
                            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            Assign
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-white p-8 text-center shadow sm:p-12">
          <p className="text-lg text-gray-500">No clients assigned yet</p>
          <p className="mt-2 text-gray-400">
            Clients appear here after they book you or you assign them a diet plan.
          </p>
        </div>
      )}
    </div>
  );
}

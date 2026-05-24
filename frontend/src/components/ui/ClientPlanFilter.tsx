'use client';

import { Filter, X } from 'lucide-react';

export type ClientFilterOption = {
  id: string;
  name: string;
};

export function buildClientFilterOptions(
  clients: any[],
  plans: { clientId?: string; clientName?: string }[]
): ClientFilterOption[] {
  const map = new Map<string, string>();

  for (const client of clients) {
    const id = String(client.id || client.userId?._id || client.userId || '');
    const name =
      client.name ||
      `${client.userId?.firstName || ''} ${client.userId?.lastName || ''}`.trim();
    if (id) map.set(id, name || 'Client');
  }

  for (const plan of plans) {
    if (plan.clientId && !map.has(plan.clientId)) {
      map.set(plan.clientId, plan.clientName || 'Client');
    }
  }

  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface ClientPlanFilterProps {
  options: ClientFilterOption[];
  value: string;
  onChange: (clientId: string) => void;
  filteredCount: number;
  totalCount: number;
  planLabel?: string;
  accent?: 'blue' | 'green';
}

const ACCENT = {
  blue: {
    ring: 'focus:ring-blue-500/20 focus:border-blue-400',
    icon: 'bg-blue-50 text-blue-600',
    badge: 'bg-blue-50 text-blue-700',
  },
  green: {
    ring: 'focus:ring-emerald-500/20 focus:border-emerald-400',
    icon: 'bg-emerald-50 text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700',
  },
};

export function ClientPlanFilter({
  options,
  value,
  onChange,
  filteredCount,
  totalCount,
  planLabel = 'plan',
  accent = 'blue',
}: ClientPlanFilterProps) {
  const plural = filteredCount === 1 ? planLabel : `${planLabel}s`;
  const isFiltered = Boolean(value);
  const theme = ACCENT[accent];

  return (
    <div className="card card-body flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.icon}`}>
          <Filter size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <label
            htmlFor="client-plan-filter"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Filter by client
          </label>
          <select
            id="client-plan-filter"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full max-w-md rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:bg-white focus:outline-none focus:ring-2 ${theme.ring}`}
          >
            <option value="">All clients</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:shrink-0">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.badge}`}>
          {filteredCount}
          {isFiltered ? ` / ${totalCount}` : ''} {plural}
        </span>
        {isFiltered ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <X size={14} />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

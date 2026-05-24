'use client';

type Accent = 'blue' | 'green';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  completed: 'bg-blue-50 text-blue-700 ring-blue-100',
  paused: 'bg-amber-50 text-amber-700 ring-amber-100',
  pending: 'bg-slate-100 text-slate-600 ring-slate-200',
  archived: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const FILTER_ACTIVE: Record<Accent, string> = {
  blue: 'bg-blue-600 text-white shadow-md shadow-blue-600/20',
  green: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
};

export function PlanStatusBadge({ status }: { status?: string }) {
  const normalized = (status || 'active').toLowerCase();
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[normalized] || STATUS_STYLES.pending
      }`}
    >
      {label}
    </span>
  );
}

export function PlanStatusFilter({
  value,
  onChange,
  accent,
  options = ['all', 'active', 'completed', 'paused'],
}: {
  value: string;
  onChange: (value: string) => void;
  accent: Accent;
  options?: string[];
}) {
  return (
    <div className="card card-body">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Filter by status
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              value === status
                ? FILTER_ACTIVE[accent]
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RecentLogCard({
  title,
  details,
  date,
  accent,
}: {
  title: string;
  details?: string;
  date: string;
  accent: Accent;
}) {
  const dot = accent === 'blue' ? 'bg-blue-500' : 'bg-emerald-500';

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            {details ? <p className="mt-1 text-sm text-slate-600">{details}</p> : null}
          </div>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-400">{date}</span>
      </div>
    </div>
  );
}

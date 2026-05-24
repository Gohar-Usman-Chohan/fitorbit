'use client';

import type { LucideIcon } from 'lucide-react';
import { Plus, Sparkles, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';

type Accent = 'blue' | 'green';

const ACCENT = {
  blue: {
    btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
    bar: 'bg-blue-600',
    iconBg: 'bg-blue-50 text-blue-600',
    badge: 'bg-blue-50 text-blue-700 ring-blue-100',
    pill: 'bg-blue-50/80 text-blue-700',
    action: 'text-blue-600 hover:bg-blue-50 border-blue-200/60',
    itemDot: 'bg-blue-400',
    emptyIcon: 'bg-blue-50 text-blue-600',
    statColor: 'blue' as const,
  },
  green: {
    btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
    bar: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    pill: 'bg-emerald-50/80 text-emerald-700',
    action: 'text-emerald-600 hover:bg-emerald-50 border-emerald-200/60',
    itemDot: 'bg-emerald-400',
    emptyIcon: 'bg-emerald-50 text-emerald-600',
    statColor: 'green' as const,
  },
};

interface PlansPageShellProps {
  title: string;
  description: string;
  accent: Accent;
  createLabel: string;
  onCreate: () => void;
  stats: { label: string; value: string | number; subtitle?: string }[];
  children: React.ReactNode;
}

export function PlansPageShell({
  title,
  description,
  accent,
  createLabel,
  onCreate,
  stats,
  children,
}: PlansPageShellProps) {
  const theme = ACCENT[accent];

  return (
    <div className="space-y-8">
      <PageHeader
        title={title}
        description={description}
        action={
          <button
            type="button"
            onClick={onCreate}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition ${theme.btn}`}
          >
            <Plus size={18} strokeWidth={2.5} />
            {createLabel}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            subtitle={stat.subtitle}
            color={theme.statColor}
          />
        ))}
      </div>

      {children}
    </div>
  );
}

interface PlanStatProps {
  label: string;
  value: string | number;
  accent: Accent;
}

export function PlanStat({ label, value, accent }: PlanStatProps) {
  const theme = ACCENT[accent];
  return (
    <div className={`rounded-xl px-3 py-2.5 ${theme.pill}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

interface PlanCardShellProps {
  accent: Accent;
  icon: LucideIcon;
  title: string;
  clientName: string;
  metaPrefix?: string;
  badges?: string[];
  description?: string;
  actions?: React.ReactNode;
  stats: React.ReactNode;
  footer: React.ReactNode;
}

export function PlanCardShell({
  accent,
  icon: Icon,
  title,
  clientName,
  metaPrefix,
  badges = [],
  description,
  actions,
  stats,
  footer,
}: PlanCardShellProps) {
  const theme = ACCENT[accent];
  const metaText = metaPrefix ? `${metaPrefix} ${clientName}` : clientName;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className={`absolute left-0 top-0 h-full w-1 ${theme.bar}`} />

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5 ${theme.iconBg}`}
            >
              <Icon size={20} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">{title}</h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  <UserRound size={14} className="shrink-0" />
                  {metaText}
                </span>
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${theme.badge}`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>

        {description ? (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{stats}</div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">{footer}</div>
      </div>
    </article>
  );
}

export function PlanActionButton({
  accent,
  onClick,
  children,
  variant = 'primary',
}: {
  accent: Accent;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'danger';
}) {
  const theme = ACCENT[accent];
  const className =
    variant === 'danger'
      ? 'border-red-200/70 text-red-600 hover:bg-red-50'
      : theme.action;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition ${className}`}
    >
      {children}
    </button>
  );
}

export function PlanItemList({
  accent,
  title,
  emptyMessage,
  items,
}: {
  accent: Accent;
  title: string;
  emptyMessage: string;
  items: React.ReactNode[];
}) {
  const theme = ACCENT[accent];

  if (items.length === 0) {
    return (
      <div className="flex items-start gap-3">
        <Sparkles size={16} className={`mt-0.5 shrink-0 ${theme.action.split(' ')[0]}`} />
        <p className="text-sm italic text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="space-y-2">{items}</ul>
    </div>
  );
}

export function PlanItemRow({
  accent,
  children,
}: {
  accent: Accent;
  children: React.ReactNode;
}) {
  const theme = ACCENT[accent];
  return (
    <li className="flex items-start gap-2.5 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-100">
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${theme.itemDot}`} />
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

interface PlansEmptyStateProps {
  accent: Accent;
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PlansEmptyState({
  accent,
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: PlansEmptyStateProps) {
  const theme = ACCENT[accent];

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${theme.emptyIcon}`}>
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={`mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition ${theme.btn}`}
        >
          <Plus size={16} />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function PlansFilterEmptyState({
  accent,
  onClear,
  message = 'No plans match this filter.',
  clearLabel = 'Show all plans',
}: {
  accent: Accent;
  onClear: () => void;
  message?: string;
  clearLabel?: string;
}) {
  const theme = ACCENT[accent];
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <p className="text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onClear}
        className={`mt-3 text-sm font-semibold ${theme.action.split(' ')[0]} hover:underline`}
      >
        {clearLabel}
      </button>
    </div>
  );
}

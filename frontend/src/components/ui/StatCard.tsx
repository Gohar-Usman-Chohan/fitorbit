import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type StatColor = 'blue' | 'green' | 'orange' | 'purple' | 'red';

const ACCENT: Record<StatColor, { value: string; bar: string }> = {
  blue: { value: 'text-blue-600', bar: 'bg-blue-600' },
  green: { value: 'text-emerald-600', bar: 'bg-emerald-500' },
  orange: { value: 'text-orange-600', bar: 'bg-orange-500' },
  purple: { value: 'text-violet-600', bar: 'bg-violet-500' },
  red: { value: 'text-red-600', bar: 'bg-red-500' },
};

interface StatCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  color?: StatColor;
}

export function StatCard({ title, value, subtitle, color = 'blue' }: StatCardProps) {
  const accent = ACCENT[color];

  return (
    <div className="card card-body relative overflow-hidden">
      <div className={cn('absolute left-0 top-0 h-full w-1 rounded-l-xl', accent.bar)} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={cn('mt-2 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl', accent.value)}>
        {value}
      </p>
      {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

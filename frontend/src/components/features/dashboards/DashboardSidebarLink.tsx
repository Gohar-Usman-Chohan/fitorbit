'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { NavBadge, NavBadgeGreen, NavBadgeOrange } from '@/components/ui/NavBadge';
import { cn } from '@/lib/utils';

type Accent = 'blue' | 'green' | 'orange' | 'purple';

interface DashboardSidebarLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  accent: Accent;
  badge?: number;
  onNavigate?: () => void;
}

const ACCENT_STYLES: Record<Accent, { active: string; icon: string }> = {
  blue: {
    active: 'border-blue-600 bg-blue-50 text-blue-700',
    icon: 'text-blue-600',
  },
  green: {
    active: 'border-emerald-500 bg-emerald-50 text-emerald-800',
    icon: 'text-emerald-600',
  },
  orange: {
    active: 'border-orange-500 bg-orange-50 text-orange-800',
    icon: 'text-orange-600',
  },
  purple: {
    active: 'border-violet-600 bg-violet-50 text-violet-800',
    icon: 'text-violet-600',
  },
};

function SidebarBadge({
  accent,
  count,
  active,
}: {
  accent: Accent;
  count: number;
  active: boolean;
}) {
  if (accent === 'green') return <NavBadgeGreen count={count} active={active} />;
  if (accent === 'orange') return <NavBadgeOrange count={count} active={active} />;
  return <NavBadge count={count} active={active} />;
}

export function DashboardSidebarLink({
  href,
  label,
  icon: Icon,
  active,
  accent,
  badge,
  onNavigate,
}: DashboardSidebarLinkProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <Link
      href={href}
      className={cn(
        'flex w-full min-w-0 items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-medium transition',
        active
          ? styles.active
          : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      )}
      onClick={onNavigate}
    >
      <Icon
        size={18}
        className={cn('shrink-0', active ? styles.icon : 'text-slate-400')}
      />
      <span className="min-w-0 flex-1">{label}</span>
      {badge !== undefined ? (
        <SidebarBadge accent={accent === 'purple' ? 'blue' : accent} count={badge} active={active} />
      ) : null}
    </Link>
  );
}

export function SidebarBrand({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 border-b border-slate-100 pb-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dashboard</p>
      <p className="mt-1 text-base font-bold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

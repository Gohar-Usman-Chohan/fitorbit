import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface QuickActionLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export function QuickActionLink({ href, label, icon: Icon, description }: QuickActionLinkProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80 transition group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        {description ? (
          <span className="block text-xs text-slate-500">{description}</span>
        ) : null}
      </span>
    </Link>
  );
}

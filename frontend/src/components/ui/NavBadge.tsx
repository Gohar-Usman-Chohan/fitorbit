interface NavBadgeProps {
  count: number;
  active?: boolean;
}

export function NavBadge({ count, active = false }: NavBadgeProps) {
  if (!count || count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);

  return (
    <span
      className={`shrink-0 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
        active ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
      }`}
    >
      {label}
    </span>
  );
}

interface NavBadgeGreenProps {
  count: number;
  active?: boolean;
}

export function NavBadgeGreen({ count, active = false }: NavBadgeGreenProps) {
  if (!count || count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);

  return (
    <span
      className={`shrink-0 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
        active ? 'bg-white text-green-600' : 'bg-red-500 text-white'
      }`}
    >
      {label}
    </span>
  );
}

interface NavBadgeOrangeProps {
  count: number;
  active?: boolean;
}

export function NavBadgeOrange({ count, active = false }: NavBadgeOrangeProps) {
  if (!count || count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);

  return (
    <span
      className={`shrink-0 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
        active ? 'bg-white text-orange-600' : 'bg-red-500 text-white'
      }`}
    >
      {label}
    </span>
  );
}

export function ConversationUnreadBadge({ count }: { count: number }) {
  if (!count || count <= 0) return null;

  return (
    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

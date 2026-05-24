'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Dumbbell,
  Calendar,
  MessageSquare,
  TrendingUp,
  Bell,
  User,
} from 'lucide-react';
import {
  SIDEBAR_DESKTOP_CLASSES,
  SIDEBAR_FAB_CLASSES,
  SIDEBAR_MOBILE_CLASSES,
} from './sidebarStyles';
import { DashboardSidebarLink, SidebarBrand } from './DashboardSidebarLink';
import type { RootState } from '@/redux/store';

export default function TrainerSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { chatUnread, notificationUnread } = useSelector(
    (state: RootState) => state.notifications
  );

  const menuItems = [
    { href: '/trainer/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/trainer/clients', label: 'Clients', icon: Users },
    { href: '/trainer/workout-plans', label: 'Workout Plans', icon: Dumbbell },
    { href: '/trainer/schedule', label: 'Schedule', icon: Calendar },
    { href: '/trainer/progress-reports', label: 'Progress Reports', icon: TrendingUp },
    { href: '/trainer/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/trainer/chat', label: 'Chat', icon: MessageSquare, badge: chatUnread },
    { href: '/trainer/notifications', label: 'Notifications', icon: Bell, badge: notificationUnread },
    { href: '/trainer/profile', label: 'Profile', icon: User },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <button className={SIDEBAR_FAB_CLASSES} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <aside
        className={`${SIDEBAR_MOBILE_CLASSES} ${SIDEBAR_DESKTOP_CLASSES} ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <nav className="p-5">
          <SidebarBrand title="Trainer Portal" subtitle="Manage clients & workout plans" />
          <div className="space-y-1">
            {menuItems.map((item) => (
              <DashboardSidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item.href)}
                accent="green"
                badge={'badge' in item ? item.badge : undefined}
                onNavigate={() => setIsOpen(false)}
              />
            ))}
          </div>
        </nav>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-x-0 top-16 bottom-0 z-20 bg-slate-900/40 backdrop-blur-[2px] sm:top-[72px] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

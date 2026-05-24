'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Utensils,
  TrendingUp,
  MessageSquare,
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

export default function ClientSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { chatUnread, notificationUnread } = useSelector(
    (state: RootState) => state.notifications
  );

  const menuItems = [
    { href: '/client/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/client/appointments', label: 'Appointments', icon: Calendar },
    { href: '/client/fitness-goals', label: 'Fitness Goals', icon: Dumbbell },
    { href: '/client/workouts', label: 'Workouts', icon: TrendingUp },
    { href: '/client/nutrition', label: 'Nutrition', icon: Utensils },
    { href: '/client/progress', label: 'Progress', icon: TrendingUp },
    { href: '/client/chat', label: 'Chat', icon: MessageSquare, badge: chatUnread },
    { href: '/client/notifications', label: 'Notifications', icon: Bell, badge: notificationUnread },
    { href: '/client/profile', label: 'Profile', icon: User },
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
          <SidebarBrand title="Client Portal" subtitle="Track goals & connect with experts" />
          <div className="space-y-1">
            {menuItems.map((item) => (
              <DashboardSidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item.href)}
                accent="blue"
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

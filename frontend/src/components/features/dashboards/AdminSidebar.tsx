'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { CheckSquare, Menu, Users, X } from 'lucide-react';
import {
  SIDEBAR_DESKTOP_CLASSES,
  SIDEBAR_FAB_CLASSES,
  SIDEBAR_MOBILE_CLASSES,
} from './sidebarStyles';
import { DashboardSidebarLink, SidebarBrand } from './DashboardSidebarLink';

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin/approvals', label: 'Expert Approvals', icon: CheckSquare },
    { href: '/admin/users', label: 'Users', icon: Users },
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
          <SidebarBrand title="Admin" subtitle="Manage users & approvals" />
          <div className="space-y-1">
            {menuItems.map((item) => (
              <DashboardSidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item.href)}
                accent="purple"
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

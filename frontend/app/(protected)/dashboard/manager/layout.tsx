'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const managerLinks = [
  { href: '/dashboard/manager', label: 'Overview' },
  { href: '/dashboard/manager/leaves', label: 'Leaves dashboard' },
  { href: '/dashboard/manager/requests', label: 'Requests' },
  { href: '/dashboard/manager/team', label: 'Team' },
];

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="p-4 text-lg font-semibold text-gray-900 dark:text-white">Manager</div>
        <nav className="space-y-1 px-2">
          {managerLinks.map(link => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-900 dark:bg-gray-700 text-white dark:text-white hover:bg-gray-900 dark:hover:bg-gray-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-6">{children}</main>
    </div>
  );
}
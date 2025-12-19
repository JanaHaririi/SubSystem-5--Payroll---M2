'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  FileText,
  Settings,
  PieChart,
  Users,
  LogOut,
  ClipboardList,
  FolderPlus,
  CheckSquare,
  Wallet, 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { name: 'Overview', href: '/dashboard/admin/leaves', icon: Calendar },
  { name: 'Leave Categories', href: '/dashboard/admin/leaves/categories', icon: FolderPlus },
  { name: 'Leave Types', href: '/dashboard/admin/leaves/types', icon: ClipboardList },
  { name: 'Leave Policies', href: '/dashboard/admin/leaves/policies', icon: Settings },
  { name: 'Leave Requests', href: '/dashboard/admin/leaves/requests', icon: FileText },
  { name: 'Leave Entitlements', href: '/dashboard/admin/leaves/entitlements', icon: CheckSquare },
  { name: 'Leave Calendar', href: '/dashboard/admin/leaves/calendar', icon: Calendar },
  { name: 'Reports', href: '/dashboard/admin/leaves/reports', icon: PieChart },
  {
    name: 'Paycode Mapping',
    href: '/dashboard/admin/leaves/paycode-mapping',
    icon: Wallet,
  },
];

const managerNavItems = [
  { name: 'Overview', href: '/dashboard/manager/leaves', icon: Calendar },
  { name: 'Team Requests', href: '/dashboard/manager/leaves/requests', icon: Users },
  { name: 'Approve Requests', href: '/dashboard/manager/leaves/approvals', icon: CheckSquare },
  { name: 'Reports', href: '/dashboard/manager/leaves/reports', icon: PieChart },
];

const employeeNavItems = [
  { name: 'Overview', href: '/dashboard/employee/leaves', icon: Calendar },
  { name: 'My Leave Balance', href: '/dashboard/employee/leaves/my-balance', icon: PieChart },
  { name: 'My Requests', href: '/dashboard/employee/leaves/my-requests', icon: FileText },
  { name: 'Request New Leave', href: '/dashboard/employee/leaves/new-request', icon: ClipboardList },
];

interface DashboardSidebarProps {
  currentRole: 'admin' | 'manager' | 'employee';
}

export default function DashboardSidebar({ currentRole }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navItems =
    currentRole === 'admin'
      ? adminNavItems
      : currentRole === 'manager'
      ? managerNavItems
      : employeeNavItems;

  const handleLogout = () => {
    localStorage.removeItem('hr_token');
    window.location.href = '/login';
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen p-4 flex flex-col">
      {/* Sidebar Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          Leave System
          <span className={cn(
            "ml-2 text-sm px-2 py-1 rounded",
            currentRole === 'admin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
            currentRole === 'manager' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          )}>
            {currentRole.toUpperCase()}
          </span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage leaves efficiently</p>
      </div>

      {/* Nav Links */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 p-3 rounded-lg transition-colors',
                isActive
                  ? currentRole === 'admin'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600 dark:border-blue-500'
                    : currentRole === 'manager'
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-l-4 border-purple-600 dark:border-purple-500'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-l-4 border-green-600 dark:border-green-500'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
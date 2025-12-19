// app/(protected)/dashboard/employee/leaves/layout.tsx
'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useAuth } from '@/app/(system)/context/authContext';

export default function EmployeeLeavesLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const roles = useMemo(
    () =>
      Array.isArray(user?.roles)
        ? user!.roles.map((r: string) => r.toLowerCase())
        : user?.role
        ? [String(user.role).toLowerCase()]
        : [],
    [user]
  );

  const isEmployee =
    roles.includes('department employee') ||
    roles.includes('department head') ||
    roles.includes('hr employee') ||
    roles.includes('hr admin') ||
    roles.includes('hr manager');
  

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isEmployee) {
      router.replace('/home');
    }
  }, [user, isEmployee, loading, router]);

  if (loading || !user || !isEmployee) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
        Checking permissions...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentRole="employee" />
      <main className="flex-1 p-6 overflow-y-auto dark:bg-gray-900">{children}</main>
    </div>
  );
}
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useAuth } from '@/app/(system)/context/authContext';

export default function LeavesLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 🔹 Who counts as "admin" for the ADMIN LEAVES area?
  const isAdmin =
    user?.roles?.includes('HR Admin') ||      // e.g. ["HR Admin"]
    user?.roles?.includes('SYSTEM_ADMIN') ||  // in case you use this later
    user?.role === 'HR Admin' ||              // fallback if backend sends `role`
    user?.role === 'SYSTEM_ADMIN';

  // 🔹 Protect the route on the client
  useEffect(() => {
    if (loading) return; // still checking /auth/me

    // Not logged in → send to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Logged in but NOT admin → send to employee dashboard (or whatever you want)
    if (!isAdmin) {
      router.replace('/dashboard/employee/leaves'); // or '/dashboard'
    }
  }, [user, isAdmin, loading, router]);

  // While we don't know yet / or we're redirecting, show a small placeholder
  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
        Checking permissions...
      </div>
    );
  }

  // ✅ Only real admins reach this point
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar – stays admin */}
      <DashboardSidebar currentRole="admin" />

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
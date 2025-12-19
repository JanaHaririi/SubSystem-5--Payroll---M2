'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/(system)/context/authContext';
import {
  isHRManager,
  isHREmployee,
  isLineManager,
  isEmployee,
} from '@/app/utils/roleCheck';

export default function PerformanceIndex() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (isHRManager(user) || isHREmployee(user)) {
        router.replace('/performance/adminDashboard');
      } else if (isLineManager(user)) {
        router.replace('/performance/managerDashboard');
      } else if (isEmployee(user)) {
        router.replace('/performance/employeeDashboard');
      }
    }
  }, [user, loading, router]);

  return null;
}

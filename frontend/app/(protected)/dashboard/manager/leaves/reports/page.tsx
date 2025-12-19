'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LeaveRequest {
  _id: string;
  employeeId: { fullName: string; workEmail?: string };
  leaveTypeId: { name: string };
  dates: { from: string; to: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

interface TypeSummary {
  leaveTypeName: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export default function ManagerTeamReportsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [summaries, setSummaries] = useState<TypeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get<LeaveRequest[]>('/leaves/requests');
      const all = res.data || [];
      setRequests(all);

      // Aggregate per leave type
      const map = new Map<string, TypeSummary>();

      all.forEach((r) => {
        const typeName = r.leaveTypeId?.name ?? 'Unknown';
        if (!map.has(typeName)) {
          map.set(typeName, {
            leaveTypeName: typeName,
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
          });
        }
        const entry = map.get(typeName)!;
        entry.total += 1;
        if (r.status === 'APPROVED') entry.approved += 1;
        else if (r.status === 'PENDING') entry.pending += 1;
        else if (r.status === 'REJECTED') entry.rejected += 1;
      });

      setSummaries(Array.from(map.values()));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team reports');
    } finally {
      setLoading(false);
    }
  };

  // Top-level quick stats
  const totalRequests = requests.length;
  const totalApproved = requests.filter((r) => r.status === 'APPROVED').length;
  const totalPending = requests.filter((r) => r.status === 'PENDING').length;
  const totalRejected = requests.filter((r) => r.status === 'REJECTED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading team reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Leave Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Overview of your team&apos;s leave usage by type and status.
          </p>
        </div>
        <Button variant="outline" asChild className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
          <Link href="/dashboard/manager/leaves">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Manager Dashboard
          </Link>
        </Button>
      </div>

      {/* High level stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRequests}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalApproved}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalPending}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalRejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary by leave type */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white">Requests by Leave Type</CardTitle>
          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{summaries.length} leave types</Badge>
        </CardHeader>
        <CardContent>
          {summaries.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No leave data available yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left py-2 px-3 text-gray-900 dark:text-gray-300">Leave Type</th>
                    <th className="text-center py-2 px-3 text-gray-900 dark:text-gray-300">Total</th>
                    <th className="text-center py-2 px-3 text-gray-900 dark:text-gray-300">Approved</th>
                    <th className="text-center py-2 px-3 text-gray-900 dark:text-gray-300">Pending</th>
                    <th className="text-center py-2 px-3 text-gray-900 dark:text-gray-300">Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => (
                    <tr key={s.leaveTypeName} className="border-b dark:border-gray-700 last:border-0">
                      <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-300">{s.leaveTypeName}</td>
                      <td className="py-2 px-3 text-center text-gray-900 dark:text-gray-300">{s.total}</td>
                      <td className="py-2 px-3 text-center text-green-600 dark:text-green-400">
                        {s.approved}
                      </td>
                      <td className="py-2 px-3 text-center text-yellow-600 dark:text-yellow-400">
                        {s.pending}
                      </td>
                      <td className="py-2 px-3 text-center text-red-600 dark:text-red-400">
                        {s.rejected}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
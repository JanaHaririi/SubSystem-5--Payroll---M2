'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';
import Link from 'next/link';

interface TeamLeaveStats {
  totalTeamMembers: number;
  pendingApprovals: number;
  approvedThisMonth: number;
  onLeaveToday: number;
}

interface LeaveRequest {
  _id: string;
  employeeId: { fullName: string; workEmail?: string };
  leaveTypeId: { name: string };
  dates: { from: string; to: string };
  status: string;
  createdAt?: string;
}

export default function ManagerLeavesOverview() {
  const [stats, setStats] = useState<TeamLeaveStats>({
    totalTeamMembers: 0,
    pendingApprovals: 0,
    approvedThisMonth: 0,
    onLeaveToday: 0,
  });

  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get<LeaveRequest[]>('/leaves/requests');
      const allRequests = res.data;
      const pending = allRequests.filter(r => r.status === 'PENDING');

      const memberSet = new Set(
        allRequests.map(r => r.employeeId?.fullName ?? r.employeeId)
      );
      const totalTeamMembers = memberSet.size;
      const pendingApprovals = pending.length;

      const now = new Date();
      const approvedThisMonth = allRequests.filter(r => {
        if (r.status !== 'APPROVED' || !r.createdAt) return false;
        const d = new Date(r.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;

      const onLeaveToday = allRequests.filter(r => {
        if (r.status !== 'APPROVED') return false;
        const from = new Date(r.dates.from);
        const to = new Date(r.dates.to);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        from.setHours(0, 0, 0, 0);
        to.setHours(0, 0, 0, 0);
        return today >= from && today <= to;
      }).length;

      setStats({
        totalTeamMembers,
        pendingApprovals,
        approvedThisMonth,
        onLeaveToday,
      });
      setPendingRequests(pending);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load manager data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading manager dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Leave Management</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your team&apos;s leave requests and approvals
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <Link href="/dashboard/manager/leaves/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Team Calendar
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Team Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTeamMembers}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pendingApprovals}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Approved This Month</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.approvedThisMonth}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">On Leave Today</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.onLeaveToday}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-gray-900 dark:text-white">Pending Approvals</CardTitle>
              <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                {pendingRequests.length} requests
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No pending approvals
                </p>
              ) : (
                pendingRequests.map(request => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.employeeId.fullName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {request.leaveTypeId.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(request.dates.from).toLocaleDateString()} -{' '}
                        {new Date(request.dates.to).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        <Link
                          href={`/dashboard/manager/requests/${request._id}`}
                        >
                          Review
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
              <Button className="w-full" asChild>
                <Link href="/dashboard/manager/requests">
                  View All Requests
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                asChild
              >
                <Link href="/dashboard/manager/requests">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Review Approvals</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Approve / reject leave requests
                    </p>
                  </div>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                asChild
              >
                <Link href="/dashboard/manager/leaves/calendar">
                  <Calendar className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Team Calendar</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      View team leave schedule
                    </p>
                  </div>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                asChild
              >
                <Link href="/dashboard/manager/leaves/reports">
                  <FileText className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Team Reports</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      View leave analytics
                    </p>
                  </div>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                asChild
              >
                <Link href="/dashboard/manager/team">
                  <Users className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">View Team</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      See all direct reports &amp; status
                    </p>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
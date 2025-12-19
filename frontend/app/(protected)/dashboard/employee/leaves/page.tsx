'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, FileText, PlusCircle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';

interface LeaveBalance {
  leaveTypeId: { name: string; code: string };
  yearlyEntitlement: number;
  taken: number;
  remaining: number;
  pending: number;
}

interface LeaveRequest {
  _id: string;
  leaveTypeId: { name: string };
  dates: { from: string; to: string };
  status: string;
}

export default function EmployeeLeavesOverview() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [balanceRes, requestsRes] = await Promise.all([
        axiosInstance.get('/leaves/my-balance'),
        axiosInstance.get('/leaves/my-requests')
      ]);
      setBalances(balanceRes.data);
      setRequests(requestsRes.data.slice(0, 5));
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalAvailable = balances.reduce((sum, b) => sum + b.remaining, 0);
  const totalTaken = balances.reduce((sum, b) => sum + b.taken, 0);
  const totalPending = balances.reduce((sum, b) => sum + b.pending, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your leaves and track balances</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/employee/leaves/new-request">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Leave Request
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Available Days</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalAvailable}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Taken This Year</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTaken}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Requests</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalPending}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Balances */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Leave Balances</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Your current leave entitlements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {balances.map((balance) => (
                <div key={balance.leaveTypeId.code} className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{balance.leaveTypeId.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Code: {balance.leaveTypeId.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{balance.remaining}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {balance.taken} taken / {balance.yearlyEntitlement} total
                    </p>
                    <Progress 
                      value={(balance.taken / balance.yearlyEntitlement) * 100} 
                      className="w-32 mt-1" 
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" asChild>
                <Link href="/dashboard/employee/leaves/my-balance">
                  View All Balances
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Requests</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Your latest leave applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No leave requests yet</p>
              ) : (
                requests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{request.leaveTypeId.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.dates.from).toLocaleDateString()} - {new Date(request.dates.to).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </Badge>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" asChild>
                <Link href="/dashboard/employee/leaves/my-requests">
                  View All Requests
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" asChild>
              <Link href="/dashboard/employee/leaves/new-request">
                <PlusCircle className="h-8 w-8 mb-2 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">New Request</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submit leave application</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" asChild>
              <Link href="/dashboard/employee/leaves/my-balance">
                <FileText className="h-8 w-8 mb-2 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-900 dark:text-white">Check Balance</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">View available leaves</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" asChild>
              <Link href="/dashboard/employee/leaves/my-requests">
                <Calendar className="h-8 w-8 mb-2 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-gray-900 dark:text-white">Track Requests</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor approval status</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
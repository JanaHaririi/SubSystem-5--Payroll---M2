'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Info, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';

interface LeaveBalance {
  _id: string;
  leaveTypeId: {
    _id: string;
    name: string;
    code: string;
    categoryId?: {
      name: string;
    };
  };
  yearlyEntitlement: number;
  accruedActual: number;
  accruedRounded: number;
  carryForward: number;
  taken: number;
  pending: number;
  remaining: number;
  lastAccrualDate: string | null;
  nextResetDate: string | null;
}

export default function MyBalancePage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const response = await axiosInstance.get('/leaves/my-balance');
      setBalances(response.data);
    } catch (error: any) {
      console.error('Error fetching balances:', error);
      toast.error(error.response?.data?.message || 'Failed to load leave balances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBalances();
  };

  const calculateUsagePercentage = (taken: number, yearlyEntitlement: number) => {
    if (yearlyEntitlement === 0) return 0;
    return Math.min((taken / yearlyEntitlement) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading your leave balances...</p> {/* Added dark:text */}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Leave Balance</h1> {/* Added dark:text */}
          <p className="text-gray-500 dark:text-gray-400">View your available leave days and usage</p> {/* Added dark:text */}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Available</h3> {/* Added dark:text */}
                <Badge variant="outline" className="text-green-600 dark:text-green-400">
                  {balances.reduce((sum, b) => sum + b.remaining, 0)} days
                </Badge>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Days Taken</h3> {/* Added dark:text */}
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                  {balances.reduce((sum, b) => sum + b.taken, 0)} days
                </Badge>
              </div>
              <Progress 
                value={calculateUsagePercentage(
                  balances.reduce((sum, b) => sum + b.taken, 0),
                  balances.reduce((sum, b) => sum + b.yearlyEntitlement, 0)
                )} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Requests</h3> {/* Added dark:text */}
                <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400">
                  {balances.reduce((sum, b) => sum + b.pending, 0)} days
                </Badge>
              </div>
              <Progress 
                value={calculateUsagePercentage(
                  balances.reduce((sum, b) => sum + b.pending, 0),
                  balances.reduce((sum, b) => sum + b.yearlyEntitlement, 0)
                )} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Carry Forward</h3> {/* Added dark:text */}
                <Badge variant="outline" className="text-purple-600 dark:text-purple-400">
                  {balances.reduce((sum, b) => sum + b.carryForward, 0)} days
                </Badge>
              </div>
              <Progress 
                value={calculateUsagePercentage(
                  balances.reduce((sum, b) => sum + b.carryForward, 0),
                  balances.reduce((sum, b) => sum + b.yearlyEntitlement, 0)
                )} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Balance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Leave Balance Details</CardTitle> {/* Added dark:text */}
          <CardDescription className="text-gray-500 dark:text-gray-400">Breakdown by leave type</CardDescription> {/* Added dark:text */}
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400"> {/* Added dark:text */}
              <Calendar className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" /> {/* Added dark:text */}
              <p>No leave balances found for your account</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700"> {/* Added dark:border */}
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-200">Leave Type</th> {/* Added dark:text */}
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-200">Yearly Entitlement</th> {/* Added dark:text */}
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-200">Taken</th> {/* Added dark:text */}
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-200">Pending</th> {/* Added dark:text */}
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-200">Carry Forward</th> {/* Added dark:text */}
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-200">Available</th> {/* Added dark:text */}
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-200">Usage</th> {/* Added dark:text */}
                  </tr>
                </thead>
                <tbody>
                  {balances.map((balance) => (
                    <tr key={balance._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"> {/* Added dark: classes */}
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{balance.leaveTypeId.name}</p> {/* Added dark:text */}
                          <p className="text-sm text-gray-500 dark:text-gray-400">{balance.leaveTypeId.code}</p> {/* Added dark:text */}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{balance.yearlyEntitlement} days</Badge> {/* Added dark: */}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 dark:text-white">{balance.taken}</span> {/* Added dark:text */}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                          {balance.pending}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                          {balance.carryForward}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40">
                          {balance.remaining} days
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-32">
                          <Progress 
                            value={calculateUsagePercentage(balance.taken, balance.yearlyEntitlement)} 
                            className="h-2" 
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1"> {/* Added dark:text */}
                            {Math.round(calculateUsagePercentage(balance.taken, balance.yearlyEntitlement))}%
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Additional Info */}
          {balances.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800"> {/* Added dark: */}
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" /> {/* Added dark:text */}
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-300">Important Information</p> {/* Added dark:text */}
                  <ul className="list-disc pl-5 space-y-1 text-blue-600 dark:text-blue-400"> {/* Added dark:text */}
                    <li>Leave balances reset annually according to company policy</li>
                    <li>Maximum carry forward is 5 days for most leave types</li>
                    <li>Unused leaves may be encashed upon termination (subject to policy)</li>
                    <li>Contact HR for any discrepancies in your leave balance</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
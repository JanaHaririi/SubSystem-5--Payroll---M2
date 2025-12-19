'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/app/utils/ApiClient';
import { toast } from 'sonner';

interface Adjustment {
  _id: string;
  employeeId: { _id: string; firstName: string; lastName: string; email: string };
  leaveTypeId: { _id: string; name: string };
  adjustmentType: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export default function LeaveAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/leaves/adjustments');
      setAdjustments(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Leave Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="dark:hover:bg-gray-700">
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Employee</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Leave Type</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Type</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Amount</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Reason</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="dark:hover:bg-gray-700/50">
                    <TableCell colSpan={6} className="text-center dark:border-gray-700 dark:text-gray-400">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : adjustments.length === 0 ? (
                  <TableRow className="dark:hover:bg-gray-700/50">
                    <TableCell colSpan={6} className="text-center dark:border-gray-700 dark:text-gray-400">
                      No adjustments found
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustments.map((adj) => (
                    <TableRow key={adj._id} className="dark:hover:bg-gray-700/50">
                      <TableCell className="dark:border-gray-700 dark:text-gray-300">
                        {`${adj.employeeId.firstName} ${adj.employeeId.lastName}`}
                      </TableCell>
                      <TableCell className="dark:border-gray-700 dark:text-gray-300">
                        {adj.leaveTypeId.name}
                      </TableCell>
                      <TableCell className="dark:border-gray-700 dark:text-gray-300">
                        {adj.adjustmentType}
                      </TableCell>
                      <TableCell className="dark:border-gray-700 dark:text-gray-300">
                        {adj.amount}
                      </TableCell>
                      <TableCell className="dark:border-gray-700 dark:text-gray-300">
                        {adj.reason}
                      </TableCell>
                      <TableCell className="dark:border-gray-700 dark:text-gray-300">
                        {new Date(adj.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
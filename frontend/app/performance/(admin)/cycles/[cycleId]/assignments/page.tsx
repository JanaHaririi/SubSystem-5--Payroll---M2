'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { AppraisalAssignment, AppraisalAssignmentStatus } from '@/app/types/performance';
import { ArrowLeft, Users, Calendar, User, Search } from 'lucide-react';

export default function CycleAssignmentsPage() {
  const params = useParams<{ cycleId: string }>();
  const cycleId = params?.cycleId;

  const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!cycleId) return;
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await performanceApi.getCycleAssignments(cycleId);
      setAssignments(data || []);
    } catch (err) {
      console.error('Error fetching cycle assignments:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return assignments;

    return assignments.filter((a) => {
      const employeeName =
        typeof a.employeeProfileId === 'object' && a.employeeProfileId && 'firstName' in a.employeeProfileId
          ? `${(a.employeeProfileId as any).firstName} ${(a.employeeProfileId as any).lastName}`.toLowerCase()
          : '';

      const status = (a.status || '').toLowerCase();
      return employeeName.includes(term) || status.includes(term);
    });
  }, [assignments, searchTerm]);

  const getStatusBadge = (status: AppraisalAssignmentStatus) => {
    switch (status) {
      case AppraisalAssignmentStatus.PUBLISHED:
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 rounded-full">Published</span>;
      case AppraisalAssignmentStatus.SUBMITTED:
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 rounded-full">Submitted</span>;
      case AppraisalAssignmentStatus.IN_PROGRESS:
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 rounded-full">In Progress</span>;
      case AppraisalAssignmentStatus.NOT_STARTED:
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full">Not Started</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/performance/cycles" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cycle Assignments</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">All assignments generated for this cycle</p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{assignments.length}</span>
              <span className="text-gray-500 dark:text-gray-400">Assignments</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by employee name or status..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center shadow-sm">
            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assignments found</h3>
            <p className="text-gray-500 dark:text-gray-300">Try changing the search term, or generate assignments from the cycle page.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {filtered.map((a) => {
                    // Extract employee data from populated employeeProfileId
                    const employee = typeof a.employeeProfileId === 'object' && a.employeeProfileId ? (a.employeeProfileId as any) : null;
                    const employeeName = employee
                      ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
                      : 'Unknown Employee';
                    const employeeNumber = employee?.employeeNumber || '—';
                    const positionTitle = employee?.primaryPositionId?.title || '—';

                    return (
                      <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{employeeName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-300">{employeeNumber} • {positionTitle}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(a.status)}</td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : '—'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/performance/assignments/evaluate/${a._id}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
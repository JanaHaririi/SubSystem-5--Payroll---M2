// app/performance/assignments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { useAuth } from '@/app/(system)/context/authContext';
import { AppraisalAssignment, AppraisalAssignmentStatus } from '@/app/types/performance';
import {
  Search,
  Filter,
  Users,
  Calendar,
  FileEdit,
  User,
  BarChart
} from 'lucide-react';

export default function ManagerAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AppraisalAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    filterAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, assignments]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const managerId = (user as any)?.userid || (user as any)?.employeeNumber || user?.email;

      if (!managerId) {
        console.error('No manager ID found in user data');
        return;
      }

      const data = await performanceApi.getManagerAppraisalAssignments(managerId);
      setAssignments(data);
      setFilteredAssignments(data);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = [...assignments];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((assignment) => {
        const employeeName =
          typeof assignment.employeeProfileId === 'object' && assignment.employeeProfileId && 'firstName' in assignment.employeeProfileId
            ? `${(assignment.employeeProfileId as any).firstName} ${(assignment.employeeProfileId as any).lastName}`.toLowerCase()
            : '';

        const cycleName =
          typeof assignment.cycleId === 'object' && assignment.cycleId && 'name' in assignment.cycleId
            ? (assignment.cycleId as any).name.toLowerCase()
            : '';

        return (
          employeeName.includes(term) ||
          cycleName.includes(term) ||
          assignment.status.toLowerCase().includes(term)
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((assignment) => assignment.status === statusFilter);
    }

    setFilteredAssignments(filtered);
  };

  const getStats = () => {
    const total = assignments.length;
    const notStarted = assignments.filter((a) => a.status === AppraisalAssignmentStatus.NOT_STARTED).length;
    const inProgress = assignments.filter((a) => a.status === AppraisalAssignmentStatus.IN_PROGRESS).length;
    const submitted = assignments.filter((a) => a.status === AppraisalAssignmentStatus.SUBMITTED).length;
    const published = assignments.filter((a) => a.status === AppraisalAssignmentStatus.PUBLISHED).length;

    const completionRate = total > 0 ? Math.round(((published + submitted) / total) * 100) : 0;

    const overdue = assignments.filter((a) => {
      if (!a.dueDate) return false;
      return (
        new Date(a.dueDate) < new Date() &&
        a.status !== AppraisalAssignmentStatus.PUBLISHED &&
        a.status !== AppraisalAssignmentStatus.SUBMITTED
      );
    }).length;

    return { total, notStarted, inProgress, submitted, published, completionRate, overdue };
  };

  const getStatusBadge = (status: AppraisalAssignmentStatus) => {
    switch (status) {
      case AppraisalAssignmentStatus.PUBLISHED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 rounded-full">
            Published
          </span>
        );
      case AppraisalAssignmentStatus.SUBMITTED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 rounded-full">
            Submitted
          </span>
        );
      case AppraisalAssignmentStatus.IN_PROGRESS:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 rounded-full">
            In Progress
          </span>
        );
      case AppraisalAssignmentStatus.NOT_STARTED:
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full">
            Not Started
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Evaluations</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Evaluate your team members&apos; performance
            </p>
          </div>
          <Link href="/performance/team">
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 shadow-sm">
              <BarChart size={16} />
              Team Analytics
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">Total</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">Published</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.submitted}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">Submitted</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{stats.inProgress}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">In Progress</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.notStarted}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">Not Started</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">Overdue</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.completionRate}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">Completion</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search team members..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                <select
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value={AppraisalAssignmentStatus.NOT_STARTED}>Not Started</option>
                  <option value={AppraisalAssignmentStatus.IN_PROGRESS}>In Progress</option>
                  <option value={AppraisalAssignmentStatus.SUBMITTED}>Submitted</option>
                  <option value={AppraisalAssignmentStatus.PUBLISHED}>Published</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center shadow-sm">
            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No evaluations found</h3>
            <p className="text-gray-500 dark:text-gray-300">
              {assignments.length === 0
                ? "You don't have any team members to evaluate yet."
                : "No evaluations match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const isOverdue =
                assignment.dueDate &&
                new Date(assignment.dueDate) < new Date() &&
                assignment.status !== AppraisalAssignmentStatus.PUBLISHED &&
                assignment.status !== AppraisalAssignmentStatus.SUBMITTED;

              return (
                <div
                  key={assignment._id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Employee Info */}
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="bg-blue-100 dark:bg-blue-950 p-3 rounded-full">
                        <User className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            {(() => {
                              // Extract employee data from populated employeeProfileId
                              const employee = typeof assignment.employeeProfileId === 'object' && assignment.employeeProfileId ? (assignment.employeeProfileId as any) : null;
                              const employeeName = employee
                                ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
                                : 'Unknown Employee';
                              const employeeNumber = employee?.employeeNumber || '—';
                              const positionTitle = employee?.primaryPositionId?.title || 'Position not set';

                              return (
                                <>
                                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                    {employeeName}
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-300">
                                    {employeeNumber} • {positionTitle}
                                  </p>
                                </>
                              );
                            })()}
                          </div>

                          <div className="flex items-center space-x-2">
                            {getStatusBadge(assignment.status)}
                            {isOverdue && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 rounded-full">
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span>
                              Cycle:{' '}
                              {typeof assignment.cycleId === 'object' && assignment.cycleId && 'name' in assignment.cycleId
                                ? (assignment.cycleId as any).name
                                : 'N/A'}
                            </span>
                          </div>

                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span>
                              Due:{' '}
                              {assignment.dueDate
                                ? new Date(assignment.dueDate).toLocaleDateString()
                                : 'No due date'}
                            </span>
                          </div>

                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {(assignment.status === AppraisalAssignmentStatus.NOT_STARTED ||
                        assignment.status === AppraisalAssignmentStatus.IN_PROGRESS) && (
                        <Link href={`/performance/assignments/evaluate/${assignment._id}`}>
                          <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-400 flex items-center gap-2">
                            <FileEdit className="h-4 w-4" />
                            {assignment.status === AppraisalAssignmentStatus.NOT_STARTED
                              ? 'Start Evaluation'
                              : 'Continue Evaluation'}
                          </button>
                        </Link>
                      )}

                      {assignment.status === AppraisalAssignmentStatus.SUBMITTED && (
                        <span className="text-sm text-gray-500 dark:text-gray-300">
                          Submitted for HR review
                        </span>
                      )}

                      {assignment.status === AppraisalAssignmentStatus.PUBLISHED && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Published to employee
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
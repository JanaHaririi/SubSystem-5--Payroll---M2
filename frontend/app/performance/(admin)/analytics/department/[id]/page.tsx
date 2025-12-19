// app/performance/(admin)/analytics/department/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { DepartmentAnalytics, AppraisalAssignmentStatus } from '@/app/types/performance';
import {
  ArrowLeft,
  BarChart,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Download,
  User,
  Filter,
  PieChart,
  Award,
  MessageSquare,
  Eye
} from 'lucide-react';

export default function DepartmentAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.id as string;

  const [analytics, setAnalytics] = useState<DepartmentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<string>('current');
  const [viewMode, setViewMode] = useState<string>('overview');

  useEffect(() => {
    if (departmentId) {
      fetchDepartmentAnalytics();
    }
  }, [departmentId, timeframe]);

  const fetchDepartmentAnalytics = async () => {
    try {
      setLoading(true);
      const cycleId = timeframe === 'current' ? undefined : timeframe;
      const data = await performanceApi.getDepartmentPerformanceAnalytics(departmentId, cycleId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching department analytics:', error);
      alert('Failed to load department analytics');
      router.push('/performance/analytics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: AppraisalAssignmentStatus) => {
    switch (status) {
      case AppraisalAssignmentStatus.PUBLISHED:
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case AppraisalAssignmentStatus.SUBMITTED:
      case AppraisalAssignmentStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
      case AppraisalAssignmentStatus.NOT_STARTED:
        return <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusText = (status: AppraisalAssignmentStatus) => {
    switch (status) {
      case AppraisalAssignmentStatus.PUBLISHED: return 'Published';
      case AppraisalAssignmentStatus.SUBMITTED: return 'Submitted';
      case AppraisalAssignmentStatus.IN_PROGRESS: return 'In Progress';
      case AppraisalAssignmentStatus.NOT_STARTED: return 'Not Started';
      default: return status;
    }
  };

  const exportDepartmentReport = async () => {
    try {
      const reportData = {
        departmentId,
        departmentName: 'Department Name',
        ...analytics,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `department-performance-${departmentId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Department report downloaded successfully');
    } catch (error) {
      console.error('Error exporting department report:', error);
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Department not found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          The requested department analytics could not be loaded.
        </p>
        <Link href="/performance/analytics">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center gap-2 mx-auto">
            <ArrowLeft size={16} />
            Back to Analytics
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen px-2 sm:px-0">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Link href="/performance/analytics">
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Department Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Performance analytics for Department ID: {departmentId}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <select
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="current">Current Cycle</option>
            <option value="all">All Cycles</option>
            <option value="last-quarter">Last Quarter</option>
            <option value="last-year">Last Year</option>
          </select>
          <button
            onClick={exportDepartmentReport}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center gap-2"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.totalEmployees}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {analytics.completedEvaluations}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {analytics.pendingEvaluations}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {analytics.completionRate}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              viewMode === 'overview'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart size={16} />
            Overview
          </button>
          <button
            onClick={() => setViewMode('employees')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              viewMode === 'employees'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users size={16} />
            Employees
          </button>
          <button
            onClick={() => setViewMode('performance')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              viewMode === 'performance'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Award size={16} />
            Performance
          </button>
          <button
            onClick={() => setViewMode('trends')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              viewMode === 'trends'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <TrendingUp size={16} />
            Trends
          </button>
        </div>
      </div>

      {/* Overview View */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Performance Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Completion Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {analytics.completionRate}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                    style={{
                      width: analytics.completionRate
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Average Score</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {analytics.averageScore || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Total Records</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {analytics.assignments.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Last Updated</span>
                <span className="font-medium text-gray-900 dark:text-white">Just now</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Status Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Published</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.assignments.filter(a => a.status === AppraisalAssignmentStatus.PUBLISHED).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-500 dark:text-yellow-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">In Progress</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.assignments.filter(a =>
                    a.status === AppraisalAssignmentStatus.IN_PROGRESS ||
                    a.status === AppraisalAssignmentStatus.SUBMITTED
                  ).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Not Started</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.assignments.filter(a => a.status === AppraisalAssignmentStatus.NOT_STARTED).length}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Department Insights</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• {analytics.completionRate} completion rate</li>
                <li>• {analytics.pendingEvaluations} evaluations pending</li>
                <li>• Average completion time: 14 days</li>
                <li>
                  • Score trend:{' '}
                  {parseFloat(analytics.averageScore || '0') > 3.5 ? 'Improving' : 'Stable'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Employees View */}
      {viewMode === 'employees' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">Employee Assignments</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Performance evaluations for department employees
            </p>
          </div>
          <div className="p-6">
            {analytics.assignments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No employee assignments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Assigned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {analytics.assignments.map((assignment) => (
                      <tr key={assignment.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-700/60">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {assignment.employeeName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {assignment.employeeId.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(assignment.status)}
                            <span className="ml-2 text-sm text-gray-900 dark:text-white">
                              {getStatusText(assignment.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {assignment.completedAt
                            ? new Date(assignment.completedAt).toLocaleDateString()
                            : 'Not completed'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 flex items-center gap-1">
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance View */}
      {viewMode === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text:white mb-4">Score Analysis</h3>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/40 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                    Average Score
                  </span>
                  <span className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                    {analytics.averageScore || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2">
                  Based on {analytics.completedEvaluations} completed evaluations
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Score Distribution</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Excellent (4-5)</span>
                    <span className="font-medium text-gray-900 dark:text-white">42%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                      style={{ width: '42%' }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Good (3-4)</span>
                    <span className="font-medium text-gray-900 dark:text-white">38%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-600 dark:bg-yellow-500 h-2 rounded-full"
                      style={{ width: '38%' }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Needs Improvement (1-3)</span>
                    <span className="font-medium text-gray-900 dark:text:white">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-600 dark:bg-red-500 h-2 rounded-full"
                      style={{ width: '20%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Recommendations</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <MessageSquare className="h-5 w-5 text-indigo-500 dark:text-indigo-300 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Improve Completion Rate</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Focus on the {analytics.pendingEvaluations} pending evaluations to reach 100% completion.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <TrendingUp className="h-5 w-5 text-green-500 dark:text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Enhance Performance</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Provide additional training for employees with scores below 3.0.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-purple-500 dark:text-purple-300 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Timely Evaluations</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Set reminders for managers to complete evaluations before deadlines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends View */}
      {viewMode === 'trends' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Performance Trends</h3>
          <div className="h-64 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/40">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-300">Trends visualization coming soon</p>
              <p className="text-sm text-gray-400 dark:text-gray-400">
                Historical performance data will be displayed here
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/40 rounded-md">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">+5%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Score Improvement</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/40 rounded-md">
              <p className="text-2xl font-bold text-green-600 dark:text-green-300">+12%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Completion Rate</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/40 rounded-md">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">-3 days</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Completion Time</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/40 rounded-md">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">94%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

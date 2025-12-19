// app/performance/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { performanceApi } from '@/app/utils/performanceApi';
import { PerformanceAnalytics } from '@/app/types/performance';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  LineChart,
  Award
} from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<string>('current');
  const [viewMode, setViewMode] = useState<string>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const cycleId = timeframe === 'current' ? undefined : timeframe;
      const data = await performanceApi.getPerformanceAnalytics(cycleId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const data = await performanceApi.exportPerformanceReport(
        timeframe === 'current' ? undefined : timeframe
      );

      // Create and download the report
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${new Date()
        .toISOString()
        .split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Report downloaded successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6 px-4 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Performance Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Comprehensive analytics and insights for performance management
              </p>
            </div>
            <div className="flex space-x-3">
              <select
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="current">Current Cycle</option>
                <option value="all">All Cycles</option>
                <option value="last-quarter">Last Quarter</option>
                <option value="last-year">Last Year</option>
              </select>
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={exportReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-2"
              >
                <Download size={16} />
                Export Report
              </button>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                  viewMode === 'overview'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <BarChart size={16} />
                Overview
              </button>
              <button
                onClick={() => setViewMode('trends')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                  viewMode === 'trends'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <LineChart size={16} />
                Trends
              </button>
              <button
                onClick={() => setViewMode('department')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                  viewMode === 'department'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <PieChart size={16} />
                By Department
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                  viewMode === 'detailed'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Award size={16} />
                Detailed
              </button>
            </div>
          </div>

          {/* Overview Stats */}
          {viewMode === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Total Assignments
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {analytics?.totalAssignments || 0}
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Completion Rate
                      </p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {analytics?.completionRate || '0%'}
                      </p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        In Progress
                      </p>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">
                        {analytics?.inProgressAssignments || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Average Score
                      </p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {analytics?.averageScore || '0'}
                      </p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                    Progress Distribution
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300">
                          Completed
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {analytics?.completedAssignments || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              ((analytics?.completedAssignments || 0) /
                                (analytics?.totalAssignments || 1)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300">
                          In Progress
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {analytics?.inProgressAssignments || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{
                            width: `${
                              ((analytics?.inProgressAssignments || 0) /
                                (analytics?.totalAssignments || 1)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300">
                          Not Started
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {analytics?.notStartedAssignments || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gray-400 h-2 rounded-full"
                          style={{
                            width: `${
                              ((analytics?.notStartedAssignments || 0) /
                                (analytics?.totalAssignments || 1)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                    Quick Insights
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Total Records
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {analytics?.totalRecords || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Trend
                      </span>
                      <div className="flex items-center">
                        {parseFloat(analytics?.averageScore || '0') > 3 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm font-medium text-green-600">
                              Improving
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm font-medium text-red-600">
                              Declining
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Data Updated
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Just now
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Based on {analytics?.totalAssignments || 0} total
                        assignments across all departments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Trends View */}
          {viewMode === 'trends' && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Performance Trends Over Time
              </h3>
              <div className="h-64 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/60">
                <div className="text-center">
                  <LineChart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-300">
                    Trends visualization coming soon
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-400">
                    Historical performance data will be displayed here
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/40 rounded-md">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                    85%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Completion Rate Trend
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-md">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                    +12%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Score Improvement
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">
                    3.2 days
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Avg. Time to Complete
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-md">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                    94%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Satisfaction Rate
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Department View */}
          {viewMode === 'department' && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Department Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/60">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Employees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Completion Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Avg. Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {/* Sample data - replace with actual department data */}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        Engineering
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        45
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        38
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        84%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        4.2
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        Sales
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        28
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        22
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                        79%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        3.8
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        Marketing
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        32
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        25
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                        78%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        3.9
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        HR
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        18
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        15
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        83%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        4.1
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed View */}
          {viewMode === 'detailed' && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Detailed Analytics
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/40 rounded-md">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Timeline Analysis
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-200">
                      Average completion time: 14.3 days
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-200">
                      On-time submissions: 87%
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-md">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      Score Distribution
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-200">
                      Excellent (4-5): 42%
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-200">
                      Good (3-4): 38%
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-200">
                      Needs Improvement (1-3): 20%
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-md">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                      Participation
                    </h4>
                    <p className="text-sm text-purple-600 dark:text-purple-200">
                      Manager participation: 95%
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-200">
                      Employee acknowledgment: 88%
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-200">
                      Dispute rate: 3.2%
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Recommendations
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        Increase focus on departments with completion rates below
                        75%
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        Provide additional training for managers with low
                        participation rates
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        Consider shortening evaluation cycles to improve
                        completion times
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

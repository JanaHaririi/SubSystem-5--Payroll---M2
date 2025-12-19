// app/performance/(admin)/analytics/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { performanceApi } from '@/app/utils/performanceApi';
import { AppraisalCycle } from '@/app/types/performance';
import {
  Download,
  FileText,
  BarChart,
  Calendar,
  Users,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Printer,
  Mail,
  Share2,
  Database
} from 'lucide-react';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  format: 'json' | 'csv' | 'pdf' | 'excel';
  lastGenerated?: Date;
  size?: string;
}

export default function ReportsPage() {
  const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
  const [reportTypes, setReportTypes] = useState<ReportType[]>([
    {
      id: 'performance-summary',
      name: 'Performance Summary',
      description: 'Overall performance metrics and completion rates',
      icon: <BarChart className="h-5 w-5" />,
      format: 'pdf',
    },
    {
      id: 'department-analytics',
      name: 'Department Analytics',
      description: 'Detailed department-wise performance analysis',
      icon: <Users className="h-5 w-5" />,
      format: 'excel',
    },
    {
      id: 'employee-reports',
      name: 'Employee Reports',
      description: 'Individual employee performance records',
      icon: <FileText className="h-5 w-5" />,
      format: 'csv',
    },
    {
      id: 'cycle-analysis',
      name: 'Cycle Analysis',
      description: 'Complete analysis of selected appraisal cycle',
      icon: <Calendar className="h-5 w-5" />,
      format: 'json',
    },
    {
      id: 'trend-reports',
      name: 'Trend Reports',
      description: 'Historical performance trends and patterns',
      icon: <TrendingUp className="h-5 w-5" />,
      format: 'pdf',
    },
    {
      id: 'raw-data',
      name: 'Raw Data Export',
      description: 'Complete raw data for external analysis',
      icon: <Database className="h-5 w-5" />,
      format: 'json',
    },
  ]);

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const data = await performanceApi.getAllAppraisalCycles();
      setCycles(data);
    } catch (error) {
      console.error('Error fetching cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportId: string) => {
    try {
      // Show loading state
      const button = document.getElementById(`report-btn-${reportId}`);
      if (button) {
        button.innerHTML =
          '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>';
        button.classList.add('opacity-50', 'cursor-not-allowed');
      }

      let reportData: any;

      // Generate report based on type
      switch (reportId) {
        case 'performance-summary':
          reportData = await performanceApi.getPerformanceAnalytics(
            selectedCycle === 'all' ? undefined : selectedCycle
          );
          break;
        case 'cycle-analysis':
          if (selectedCycle !== 'all') {
            reportData = await performanceApi.exportPerformanceReport(selectedCycle);
          } else {
            reportData = await performanceApi.exportPerformanceReport();
          }
          break;
        default:
          reportData = await performanceApi.exportPerformanceReport(
            selectedCycle === 'all' ? undefined : selectedCycle
          );
      }

      // Create and download the report
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${reportId}-${selectedCycle}-${timestamp}.${selectedFormat}`;

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Update report history
      setReportTypes(prev =>
        prev.map(report =>
          report.id === reportId
            ? {
                ...report,
                lastGenerated: new Date(),
                size: `${Math.round(blob.size / 1024)} KB`,
              }
            : report
        )
      );

      alert(`Report "${reportId}" generated and downloaded successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      // Restore button state
      const button = document.getElementById(`report-btn-${reportId}`);
      if (button) {
        button.textContent = 'Generate Report';
        button.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return '📄';
      case 'csv':
        return '📊';
      case 'excel':
        return '📈';
      case 'json':
        return '📋';
      default:
        return '📁';
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
      case 'csv':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
      case 'excel':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
      case 'json':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Performance Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Generate and download performance analytics reports
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchCycles}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Select Appraisal Cycle
            </label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCycle}
              onChange={e => setSelectedCycle(e.target.value)}
            >
              <option value="all">All Cycles</option>
              {cycles.map(cycle => (
                <option key={cycle._id} value={cycle._id}>
                  {cycle.name} (
                  {new Date(cycle.startDate).toLocaleDateString()} -{' '}
                  {new Date(cycle.endDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Report Format
            </label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedFormat}
              onChange={e => setSelectedFormat(e.target.value)}
            >
              <option value="json">JSON (Raw Data)</option>
              <option value="csv">CSV (Spreadsheet)</option>
              <option value="pdf">PDF (Document)</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Quick Actions
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Generate all reports
                  reportTypes.forEach(report => generateReport(report.id));
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Bulk Export
              </button>
              <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Printer size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map(report => (
          <div
            key={report.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  {report.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {report.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getFormatColor(
                      report.format
                    )}`}
                  >
                    {getFormatIcon(report.format)} {report.format.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {report.description}
            </p>

            <div className="space-y-3">
              {report.lastGenerated && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last Generated</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(report.lastGenerated).toLocaleDateString()}
                  </span>
                </div>
              )}

              {report.size && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">File Size</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {report.size}
                  </span>
                </div>
              )}
            </div>

            <div className="flex space-x-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                id={`report-btn-${report.id}`}
                onClick={() => generateReport(report.id)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Generate Report
              </button>
              <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Eye size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report History */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Recent Report History
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Recently generated performance reports
          </p>
        </div>
        <div className="p-6">
          {reportTypes.filter(r => r.lastGenerated).length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-300 mb-2">
                No reports generated yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Generate your first report to see history here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Report
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Cycle
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Format
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Generated
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportTypes
                    .filter(report => report.lastGenerated)
                    .sort(
                      (a, b) =>
                        new Date(b.lastGenerated!).getTime() -
                        new Date(a.lastGenerated!).getTime()
                    )
                    .slice(0, 5)
                    .map(report => (
                      <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-md mr-3">
                              {report.icon}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {report.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {report.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full">
                            {selectedCycle === 'all'
                              ? 'All Cycles'
                              : cycles.find(c => c._id === selectedCycle)?.name ||
                                'Selected Cycle'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${getFormatColor(
                              report.format
                            )}`}
                          >
                            {report.format.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {new Date(report.lastGenerated!).toLocaleDateString()}
                            <span className="text-gray-400 ml-2">
                              {new Date(report.lastGenerated!).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {report.size || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => generateReport(report.id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                              title="Regenerate"
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button
                              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-1"
                              title="Share"
                            >
                              <Share2 size={16} />
                            </button>
                            <button
                              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-1"
                              title="Email"
                            >
                              <Mail size={16} />
                            </button>
                            <button
                              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-1"
                              title="Print"
                            >
                              <Printer size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Additional Features Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Additional Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center mb-3">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <h5 className="font-medium text-gray-900 dark:text-white">
                  Schedule Reports
                </h5>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Automatically generate reports on a schedule
              </p>
              <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                Set up schedule →
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                <h5 className="font-medium text-gray-900 dark:text:white">
                  Shared Reports
                </h5>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Reports shared with your team
              </p>
              <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                View shared →
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center mb-3">
                <BarChart className="h-5 w-5 text-purple-600 mr-2" />
                <h5 className="font-medium text-gray-900 dark:text-white">
                  Custom Reports
                </h5>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Create custom report templates
              </p>
              <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                Create custom →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-gray-900 border border-blue-100 dark:border-blue-900/40 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Need help with reports?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Our reports system supports JSON, CSV, PDF, and Excel formats. JSON is
              recommended for data analysis, CSV for spreadsheets, PDF for
              presentations, and Excel for detailed analysis.
            </p>
            <div className="flex items-center space-x-4">
              <button className="text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">
                View documentation →
              </button>
              <button className="text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">
                Contact support →
              </button>
              <button className="text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">
                Watch tutorial →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

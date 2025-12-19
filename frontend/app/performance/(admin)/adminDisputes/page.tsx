// app/performance/adminDisputes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { AppraisalDispute, AppraisalDisputeStatus } from '@/app/types/performance';
import {
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  RefreshCw,
  Eye,
} from 'lucide-react';

// Helper to safely get employee name
const getEmployeeName = (employeeId: any): string => {
  if (!employeeId) return 'N/A';

  if (typeof employeeId === 'object' && employeeId !== null) {
    return `${employeeId.firstName || ''} ${employeeId.lastName || ''}`.trim();
  }

  return 'Employee';
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<AppraisalDispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<AppraisalDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('all');

  useEffect(() => {
    fetchDisputes();
  }, []);

  useEffect(() => {
    filterDisputes();
  }, [searchTerm, statusFilter, timeframeFilter, disputes]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const data = await performanceApi.getAppraisalDisputes();
      setDisputes(data);
      setFilteredDisputes(data);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDisputes = () => {
    let filtered = [...disputes];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((dispute) => {
        const employeeName = getEmployeeName(dispute.raisedByEmployeeId).toLowerCase();
        const reason = dispute.reason?.toLowerCase() || '';
        const details = dispute.details?.toLowerCase() || '';

        return (
          employeeName.includes(term) ||
          reason.includes(term) ||
          details.includes(term) ||
          dispute.status.toLowerCase().includes(term)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((dispute) => dispute.status === statusFilter);
    }

    // Timeframe filter
    if (timeframeFilter !== 'all') {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter((dispute) => {
        const submittedDate = new Date(dispute.submittedAt);

        switch (timeframeFilter) {
          case 'last-7-days':
            return submittedDate >= sevenDaysAgo;
          case 'last-30-days':
            return submittedDate >= thirtyDaysAgo;
          case 'open':
            return (
              dispute.status === AppraisalDisputeStatus.OPEN ||
              dispute.status === AppraisalDisputeStatus.UNDER_REVIEW
            );
          default:
            return true;
        }
      });
    }

    setFilteredDisputes(filtered);
  };

  const getStatusBadge = (status: AppraisalDisputeStatus) => {
    switch (status) {
      case AppraisalDisputeStatus.OPEN:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Open
          </span>
        );
      case AppraisalDisputeStatus.UNDER_REVIEW:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Under Review
          </span>
        );
      case AppraisalDisputeStatus.ADJUSTED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Adjusted
          </span>
        );
      case AppraisalDisputeStatus.REJECTED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full">
            {status}
          </span>
        );
    }
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleResolveDispute = async (
    disputeId: string,
    resolution: 'adjusted' | 'rejected',
    summary?: string
  ) => {
    try {
      const currentUserId = localStorage.getItem('userId') || 'admin-user-id';

      const data = {
        status:
          resolution === 'adjusted'
            ? AppraisalDisputeStatus.ADJUSTED
            : AppraisalDisputeStatus.REJECTED,
        resolutionSummary: summary || 'Resolved by HR',
        resolvedByEmployeeId: currentUserId,
      };

      await performanceApi.updateDisputeStatus(disputeId, data);
      alert(`Dispute ${resolution} successfully`);
      fetchDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert('Failed to resolve dispute');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    );
  }

  const stats = {
    total: disputes.length,
    open: disputes.filter((d) => d.status === AppraisalDisputeStatus.OPEN).length,
    underReview: disputes.filter((d) => d.status === AppraisalDisputeStatus.UNDER_REVIEW).length,
    resolved: disputes.filter(
      (d) =>
        d.status === AppraisalDisputeStatus.ADJUSTED ||
        d.status === AppraisalDisputeStatus.REJECTED
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Performance Disputes
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Review and resolve performance appraisal disputes
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchDisputes}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Disputes</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.open}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Open</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.underReview}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Under Review</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
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
              placeholder="Search disputes by employee name or reason..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <select
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value={AppraisalDisputeStatus.OPEN}>Open</option>
                <option value={AppraisalDisputeStatus.UNDER_REVIEW}>Under Review</option>
                <option value={AppraisalDisputeStatus.ADJUSTED}>Adjusted</option>
                <option value={AppraisalDisputeStatus.REJECTED}>Rejected</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={timeframeFilter}
                onChange={(e) => setTimeframeFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="last-7-days">Last 7 Days</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="open">Open &amp; Under Review</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Disputes List */}
      {filteredDisputes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center shadow-sm">
          <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No disputes found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {disputes.length === 0
              ? 'No performance disputes have been raised yet.'
              : 'No disputes match your search criteria.'}
          </p>
          <button
            onClick={fetchDisputes}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => (
            <div
              key={dispute._id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {dispute.reason}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(dispute.status)}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {getTimeSince(dispute.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <User className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                      <span>
                        Employee: {getEmployeeName(dispute.raisedByEmployeeId)}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                      <span>
                        Submitted: {new Date(dispute.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {dispute.assignedReviewerEmployeeId && (
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <User className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                        <span>
                          Reviewer: {getEmployeeName(dispute.assignedReviewerEmployeeId)}
                        </span>
                      </div>
                    )}
                  </div>

                  {dispute.details && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-700 dark:text-gray-100">
                        {dispute.details}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Section - Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                 
                  {(dispute.status === AppraisalDisputeStatus.OPEN ||
                    dispute.status === AppraisalDisputeStatus.UNDER_REVIEW) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const summary = prompt('Enter resolution summary:');
                          if (summary) {
                            handleResolveDispute(dispute._id, 'adjusted', summary);
                          }
                        }}
                        className="px-3 py-2 bg-green-600 dark:bg-green-500 text-white text-sm rounded-md hover:bg-green-700 dark:hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const summary = prompt('Enter rejection reason:');
                          if (summary) {
                            handleResolveDispute(dispute._id, 'rejected', summary);
                          }
                        }}
                        className="px-3 py-2 bg-red-600 dark:bg-red-500 text-white text-sm rounded-md hover:bg-red-700 dark:hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

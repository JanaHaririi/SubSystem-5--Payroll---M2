// app/performance/reviews/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { useAuth } from '@/app/(system)/context/authContext';
import { AppraisalAssignment, AppraisalAssignmentStatus } from '@/app/types/performance';
import {
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export default function EmployeeReviewsPage() {
  const { user } = useAuth();
  const [appraisals, setAppraisals] = useState<AppraisalAssignment[]>([]);
  const [filteredAppraisals, setFilteredAppraisals] = useState<AppraisalAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchAppraisals();
    }
  }, [user]);

  useEffect(() => {
    filterAppraisals();
  }, [searchTerm, statusFilter, appraisals]);

  const fetchAppraisals = async () => {
    try {
      setLoading(true);

      console.log('🔍 Fetching appraisals for user:', user);

      // Try different possible ID fields
      let employeeId = user?.userid || user?.employeeNumber || user?.email;

      console.log('   Using employeeId:', employeeId);

      if (!employeeId) {
        console.error('No employee ID found in user data');
        return;
      }

      const data = await performanceApi.getEmployeeAppraisals(employeeId);
      console.log('📊 Fetched appraisals:', data);
      setAppraisals(data);
      setFilteredAppraisals(data);
    } catch (error: any) {
      console.error('❌ Error fetching appraisals:', error);
      console.error('   Error response:', error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const filterAppraisals = () => {
    let filtered = [...appraisals];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(appraisal => {
        const cycleName =
          typeof appraisal.cycleId === 'object' && 'name' in appraisal.cycleId
            ? (appraisal.cycleId.name as string).toLowerCase()
            : '';
        const templateName =
          typeof appraisal.templateId === 'object' && 'name' in appraisal.templateId
            ? (appraisal.templateId.name as string).toLowerCase()
            : '';
        const managerName =
          typeof appraisal.managerProfileId === 'object' && 'firstName' in appraisal.managerProfileId
            ? `${appraisal.managerProfileId.firstName} ${appraisal.managerProfileId.lastName}`.toLowerCase()
            : '';

        return (
          cycleName.includes(term) ||
          templateName.includes(term) ||
          managerName.includes(term) ||
          appraisal.status.toLowerCase().includes(term)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appraisal => appraisal.status === statusFilter);
    }

    setFilteredAppraisals(filtered);
  };

  const getStatusBadge = (status: AppraisalAssignmentStatus) => {
    switch (status) {
      case AppraisalAssignmentStatus.PUBLISHED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-100">
            Published
          </span>
        );
      case AppraisalAssignmentStatus.SUBMITTED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Submitted
          </span>
        );
      case AppraisalAssignmentStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">
            In Progress
          </span>
        );
      case AppraisalAssignmentStatus.NOT_STARTED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-200">
            Not Started
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
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
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6 lg:py-8">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">My Performance Reviews</h1>
          <p className="text-sm text-slate-400 mt-1">
            View all your performance appraisals and reviews
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
           
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                className="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value={AppraisalAssignmentStatus.PUBLISHED}>Published</option>
                <option value={AppraisalAssignmentStatus.SUBMITTED}>Submitted</option>
                <option value={AppraisalAssignmentStatus.IN_PROGRESS}>In Progress</option>
                <option value={AppraisalAssignmentStatus.NOT_STARTED}>Not Started</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Appraisals List */}
      {filteredAppraisals.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-xl p-10 text-center shadow-sm">
          <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100 mb-2">No reviews found</h3>
          <p className="text-sm text-slate-400 mb-4">
            {appraisals.length === 0
              ? "You haven't been assigned any performance reviews yet."
              : "No reviews match your search criteria."}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="inline-flex items-center px-4 py-2 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppraisals.map((appraisal) => (
            <div
              key={appraisal._id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-800 transition-all duration-150"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-100">
                        {typeof appraisal.cycleId === 'object' && appraisal.cycleId && 'name' in appraisal.cycleId
                          ? appraisal.cycleId.name
                          : 'Performance Review'}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {typeof appraisal.templateId === 'object' && appraisal.templateId && 'name' in appraisal.templateId
                          ? appraisal.templateId.name
                          : 'Appraisal Template'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(appraisal.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                    <div className="flex items-center text-slate-400">
                      <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                      <span>Assigned: {new Date(appraisal.assignedAt).toLocaleDateString()}</span>
                    </div>
                    {appraisal.dueDate && (
                      <div className="flex items-center text-slate-400">
                        <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                        <span>Due: {new Date(appraisal.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center text-slate-400">
                      <User className="h-4 w-4 mr-2 text-slate-500" />
                      <span>
                        Manager:{' '}
                        {typeof appraisal.managerProfileId === 'object' &&
                        appraisal.managerProfileId &&
                        'firstName' in appraisal.managerProfileId
                          ? `${appraisal.managerProfileId.firstName} ${appraisal.managerProfileId.lastName}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {appraisal.status === AppraisalAssignmentStatus.PUBLISHED &&
                    appraisal.latestAppraisalId && (
                      <Link href={`/performance/reviews/${appraisal.latestAppraisalId}`}>
                        <button className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                          <Eye className="h-4 w-4 mr-1.5" />
                          View Review
                        </button>
                      </Link>
                    )}
                  {appraisal.status === AppraisalAssignmentStatus.SUBMITTED && (
                    <div className="text-sm text-slate-300 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-950 border border-blue-800">
                      <CheckCircle className="h-4 w-4 text-blue-400" />
                      <span>Awaiting HR review & publication</span>
                    </div>
                  )}
                  {appraisal.status === AppraisalAssignmentStatus.IN_PROGRESS && (
                    <div className="text-sm text-slate-300 flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-950 border border-yellow-800">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span>Awaiting manager evaluation</span>
                    </div>
                  )}
                  {appraisal.status === AppraisalAssignmentStatus.NOT_STARTED && (
                    <div className="text-sm text-slate-300 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                      <AlertCircle className="h-4 w-4 text-slate-400" />
                      <span>Not yet started</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {appraisals.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-100">{appraisals.length}</p>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">
                Total Reviews
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {appraisals.filter(a => a.status === AppraisalAssignmentStatus.PUBLISHED).length}
              </p>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">
                Published
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {appraisals.filter(a => a.status === AppraisalAssignmentStatus.IN_PROGRESS).length}
              </p>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">
                In Progress
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-400">
                {appraisals.filter(a => a.status === AppraisalAssignmentStatus.NOT_STARTED).length}
              </p>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">
                Not Started
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

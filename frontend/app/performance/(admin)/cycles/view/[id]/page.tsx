'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import {
  AppraisalCycle,
  AppraisalCycleStatus,
  AppraisalTemplateType,
  AppraisalAssignmentStatus
} from '@/app/types/performance';
import {
  ArrowLeft,
  Edit,
  Copy,
  Play,
  Pause,
  CheckCircle,
  Users,
  BarChart,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function ViewCyclePage() {
  const params = useParams();
  const router = useRouter();

  const [cycle, setCycle] = useState<AppraisalCycle | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const cycleId = params.id as string;

  useEffect(() => {
    if (cycleId) {
      fetchCycle();
      fetchAssignments();
    }
  }, [cycleId]);

  const fetchCycle = async () => {
    try {
      setLoading(true);
      const data = await performanceApi.getAppraisalCycleById(cycleId);
      setCycle(data);
    } catch (error) {
      console.error('Error fetching cycle:', error);
      alert('Cycle not found');
      router.push('/performance/cycles');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const data = await performanceApi.getCycleAssignments(cycleId);
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const getStatusBadge = (status: AppraisalCycleStatus) => {
    switch (status) {
      case AppraisalCycleStatus.ACTIVE:
        return (
          <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full flex items-center gap-1">
            <Play className="h-3 w-3" />
            Active
          </span>
        );
      case AppraisalCycleStatus.PLANNED:
        return (
          <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Planned
          </span>
        );
      case AppraisalCycleStatus.CLOSED:
        return (
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Closed
          </span>
        );
      case AppraisalCycleStatus.ARCHIVED:
        return (
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full flex items-center gap-1">
            <Pause className="h-3 w-3" />
            Archived
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full">
            {status}
          </span>
        );
    }
  };

  const getCycleTypeLabel = (type: AppraisalTemplateType) => {
    switch (type) {
      case AppraisalTemplateType.ANNUAL: return 'Annual';
      case AppraisalTemplateType.SEMI_ANNUAL: return 'Semi-Annual';
      case AppraisalTemplateType.PROBATIONARY: return 'Probationary';
      case AppraisalTemplateType.PROJECT: return 'Project';
      case AppraisalTemplateType.AD_HOC: return 'Ad Hoc';
      default: return type;
    }
  };

  const handleUpdateStatus = async (newStatus: AppraisalCycleStatus) => {
    if (!cycle) return;

    if (window.confirm(`Change cycle status to ${newStatus}?`)) {
      try {
        await performanceApi.updateAppraisalCycleStatus(cycle._id, newStatus);
        alert('Cycle status updated successfully');
        fetchCycle();
      } catch (error) {
        console.error('Error updating cycle status:', error);
        alert('Failed to update cycle status');
      }
    }
  };

  const handleCreateAssignments = async () => {
    if (!cycle) return;

    if (!window.confirm('Are you sure you want to create appraisal assignments for all employees in this cycle? This will generate individual appraisal forms based on the template assignments.')) {
      return;
    }

    try {
      setAssignmentsLoading(true);
      const createdAssignments = await performanceApi.createAppraisalAssignments(cycle._id);
      alert(`Success! Created ${createdAssignments.length} appraisal assignments for employees.`);
      fetchAssignments();
    } catch (error: any) {
      console.error('Error creating assignments:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create assignments';
      alert(`Error: ${errorMessage}`);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const getAssignmentStats = () => {
    const total = assignments.length;
    const completed = assignments.filter(a =>
      a.status === AppraisalAssignmentStatus.PUBLISHED ||
      a.status === AppraisalAssignmentStatus.ACKNOWLEDGED
    ).length;
    const inProgress = assignments.filter(a =>
      a.status === AppraisalAssignmentStatus.IN_PROGRESS ||
      a.status === AppraisalAssignmentStatus.SUBMITTED
    ).length;
    const notStarted = assignments.filter(a => a.status === AppraisalAssignmentStatus.NOT_STARTED).length;

    return { total, completed, inProgress, notStarted };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cycle Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The cycle you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/performance/cycles">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            Back to Cycles
          </button>
        </Link>
      </div>
    );
  }

  const stats = getAssignmentStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/performance/cycles"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{cycle.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(cycle.status)}
            <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 rounded-full">
              {getCycleTypeLabel(cycle.cycleType)}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link href={`/performance/cycles/edit/${cycle._id}`}>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <Edit size={16} />
              Edit
            </button>
          </Link>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
            <Copy size={16} />
            Duplicate
          </button>
        </div>
      </div>

      {/* Description */}
      {cycle.description && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
          <p className="text-gray-600 dark:text-gray-300">{cycle.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Cycle Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Start Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(cycle.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">End Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(cycle.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {cycle.managerDueDate && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Manager Due Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(cycle.managerDueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {cycle.employeeAcknowledgementDueDate && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Employee Acknowledgement Due</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(cycle.employeeAcknowledgementDueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Duration:{' '}
                  {Math.ceil(
                    (new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </p>
              </div>
            </div>
          </div>

          {/* Template Assignments */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white">Template Assignments</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {cycle.templateAssignments?.length || 0} template(s)
              </span>
            </div>

            {(!cycle.templateAssignments || cycle.templateAssignments.length === 0) ? (
              <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-900/40 dark:border-gray-700">
                <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-300">
                  No template assignments for this cycle.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cycle.templateAssignments.map((assignment, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/40"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Template ID: {assignment.templateId}
                          </h4>
                          <div className="mt-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Departments:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {assignment.departmentIds.map((deptId) => (
                                <span
                                  key={deptId}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-900/60 text-gray-700 dark:text-gray-200 text-xs rounded"
                                >
                                  {deptId}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Assignment Stats */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">Assignment Statistics</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/30 rounded">
                  <p className="text-lg font-bold text-green-600 dark:text-green-300">{stats.completed}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-300">{stats.inProgress}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/40 rounded">
                  <p className="text-lg font-bold text-gray-600 dark:text-gray-200">{stats.notStarted}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Not Started</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>

            {assignmentsLoading && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
              </div>
            )}
          </div>

          {/* Cycle Actions */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Cycle Management</h3>
            <div className="space-y-2">
              {cycle.status === AppraisalCycleStatus.PLANNED && (
                <button
                  onClick={() => handleUpdateStatus(AppraisalCycleStatus.ACTIVE)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Play size={14} />
                  Activate Cycle
                </button>
              )}

              {cycle.status === AppraisalCycleStatus.ACTIVE && (
                <>
                  <button
                    onClick={handleCreateAssignments}
                    disabled={assignmentsLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Users size={14} />
                    {assignmentsLoading ? 'Creating Assignments...' : 'Create Assignments'}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(AppraisalCycleStatus.CLOSED)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={14} />
                    Close Cycle
                  </button>
                </>
              )}

              {cycle.status === AppraisalCycleStatus.CLOSED && (
                <button
                  onClick={() => handleUpdateStatus(AppraisalCycleStatus.ARCHIVED)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <Pause size={14} />
                  Archive Cycle
                </button>
              )}

              

              <Link href={`/performance/analytics?cycleId=${cycle._id}`}>
                <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2">
                  <BarChart size={14} />
                  View Analytics
                </button>
              </Link>
            </div>
          </div>

          {/* Cycle Info */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text:white mb-4">Cycle Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Created</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(cycle.createdAt).toLocaleDateString()}
                </span>
              </div>
              {cycle.updatedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Last Updated</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(cycle.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {cycle.publishedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Published</span>
                  <span className="font-medium text-gray-900 dark:text:white">
                    {new Date(cycle.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {cycle.closedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Closed</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(cycle.closedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

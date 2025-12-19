'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { useAuth } from '@/app/(system)/context/authContext';
import { AppraisalAssignmentStatus } from '@/app/types/performance';
import {
  Eye,
  Send,
  CheckCircle,
  User,
  Calendar,
  Building2,
  FileText,
  Award
} from 'lucide-react';

export default function HRReviewPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmittedAssignments();
  }, []);

  const fetchSubmittedAssignments = async () => {
    try {
      setLoading(true);
      // Use the dedicated endpoint for submitted assignments
      const submitted = await performanceApi.getSubmittedAssignments();
      setAssignments(submitted);
    } catch (error) {
      console.error('Error fetching submitted assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to publish this appraisal? The employee will be able to view it.')) {
      return;
    }

    try {
      setPublishing(assignmentId);

      // Get user ID for publishedByEmployeeId
      const publisherId = user?.userid || user?.employeeNumber || user?.email;

      await performanceApi.publishAppraisalRecord(assignmentId, publisherId);

      alert('Appraisal published successfully! Employee can now view it.');

      // Refresh the list
      fetchSubmittedAssignments();
    } catch (error: any) {
      console.error('Error publishing appraisal:', error);
      alert(`Failed to publish: ${error?.response?.data?.message || error.message}`);
    } finally {
      setPublishing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Review & Publication</h1>
          <p className="text-gray-600 mt-1">
            Review and publish submitted appraisals for employees to view
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{assignments.length}</p>
              </div>
              <FileText className="h-12 w-12 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Assignments List */}
        {assignments.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg p-10 text-center">
            <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500">
              No appraisals are waiting for HR review and publication.
            </p>
          </div>
        ) : (
          <div className="bg-white border rounded-lg shadow-sm divide-y">
            <div className="px-6 py-4 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Submitted Appraisals</h2>
            </div>

            <div className="divide-y">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {typeof assignment.employeeProfileId === 'object' && assignment.employeeProfileId
                              ? `${assignment.employeeProfileId.firstName} ${assignment.employeeProfileId.lastName}`
                              : 'Employee'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {typeof assignment.employeeProfileId === 'object' && assignment.employeeProfileId?.employeeNumber
                              ? `ID: ${assignment.employeeProfileId.employeeNumber}`
                              : ''}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            Cycle: {typeof assignment.cycleId === 'object' && assignment.cycleId
                              ? assignment.cycleId.name
                              : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            Manager: {typeof assignment.managerProfileId === 'object' && assignment.managerProfileId
                              ? `${assignment.managerProfileId.firstName} ${assignment.managerProfileId.lastName}`
                              : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            Dept: {typeof assignment.departmentId === 'object' && assignment.departmentId
                              ? assignment.departmentId.name
                              : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {assignment.submittedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {new Date(assignment.submittedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {assignment.latestAppraisalId && (
                        <Link href={`/performance/admin/review/${assignment.latestAppraisalId}`}>
                          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </button>
                        </Link>
                      )}

                      <button
                        onClick={() => handlePublish(assignment._id)}
                        disabled={publishing === assignment._id}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {publishing === assignment._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Publish
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

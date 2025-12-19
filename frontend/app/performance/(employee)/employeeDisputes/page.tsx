// app/performance/employeeDisputes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { useAuth } from '@/app/(system)/context/authContext';
import { AppraisalDispute, AppraisalDisputeStatus } from '@/app/types/performance';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  Flag
} from 'lucide-react';

export default function EmployeeDisputesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const prefilledRecordId = searchParams.get('recordId');

  const [disputes, setDisputes] = useState<AppraisalDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    appraisalId: prefilledRecordId || '',
    reason: '',
    details: ''
  });

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user]);

  useEffect(() => {
    if (prefilledRecordId) {
      setFormData(prev => ({ ...prev, appraisalId: prefilledRecordId }));
    }
  }, [prefilledRecordId]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const myDisputes = await performanceApi.getMyDisputes();
      setDisputes(myDisputes);
    } catch (error: any) {
      console.error('Error fetching disputes:', error);
      alert(error.response?.data?.message || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.appraisalId) {
      alert('Please navigate from a specific appraisal to raise a dispute');
      return;
    }

    if (!formData.reason.trim()) {
      alert('Please provide a reason for the dispute');
      return;
    }

    setCreating(true);

    try {
      await performanceApi.createAppraisalDispute({
        appraisalId: formData.appraisalId,
        reason: formData.reason,
        details: formData.details
      });

      // Reset form
      setFormData({ appraisalId: '', reason: '', details: '' });

      // Refresh disputes list
      await fetchDisputes();

      alert('Dispute raised successfully!');
    } catch (error: any) {
      console.error('Error creating dispute:', error);
      alert(error.response?.data?.message || 'Failed to create dispute');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: AppraisalDisputeStatus) => {
    switch (status) {
      case AppraisalDisputeStatus.OPEN:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-800 rounded-full flex items-center gap-1 border border-yellow-100">
            <Clock className="h-3 w-3" />
            Open
          </span>
        );
      case AppraisalDisputeStatus.UNDER_REVIEW:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-800 rounded-full flex items-center gap-1 border border-blue-100">
            <AlertCircle className="h-3 w-3" />
            Under Review
          </span>
        );
      case AppraisalDisputeStatus.ADJUSTED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 rounded-full flex items-center gap-1 border border-emerald-100">
            <CheckCircle className="h-3 w-3" />
            Adjusted
          </span>
        );
      case AppraisalDisputeStatus.REJECTED:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-50 text-red-800 rounded-full flex items-center gap-1 border border-red-100">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-slate-50 text-slate-700 rounded-full border border-slate-200">
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Raise a Concern</h1>
          <p className="text-slate-400 mt-1">
            Submit and track disputes about your performance appraisals
          </p>
        </div>
        <Link href="/performance/reviews">
          <button className="px-4 py-2 border border-slate-700 rounded-full text-sm font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2 shadow-sm transition">
            <FileText size={16} />
            Back to Reviews
          </button>
        </Link>
      </div>

      {/* Create Dispute Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Flag className="h-5 w-5 text-red-500" />
          Raise a New Concern
        </h2>

        {prefilledRecordId ? (
          <div className="p-4 bg-blue-950 border border-blue-800 rounded-lg mb-4">
            <p className="text-sm text-blue-300">
              <strong>Disputing appraisal:</strong> You are raising a concern about the appraisal you just viewed.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-amber-950 border border-amber-800 rounded-lg mb-4">
            <p className="text-sm text-amber-300 flex items-center gap-2">
              <AlertCircle size={16} />
              To raise a dispute, please navigate to the specific appraisal you want to dispute and click "Raise Concern" from there.
            </p>
          </div>
        )}

        <form onSubmit={handleCreateDispute} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Reason for Dispute <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-950 disabled:cursor-not-allowed"
              placeholder="e.g., Unfair rating, Missing achievements, Incorrect criteria"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              disabled={!prefilledRecordId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Details (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-950 disabled:cursor-not-allowed"
              placeholder="Provide additional context and supporting evidence for your dispute..."
              rows={4}
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              disabled={!prefilledRecordId}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setFormData({ appraisalId: '', reason: '', details: '' })}
              className="px-4 py-2 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"
              disabled={creating || !prefilledRecordId}
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={creating || !prefilledRecordId}
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  Submit Dispute
                </>
              )}
            </button>
          </div>
        </form>
      </div>


      {/* My Previous Disputes */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-4">My Previous Disputes</h2>
        <p className="text-sm text-slate-400 mb-4">Track the status of your submitted disputes</p>

        {disputes.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-12 text-center shadow-sm">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-100 mb-2">No disputes submitted yet</h3>
            <p className="text-slate-400 mb-4">Submit your first dispute using the form above</p>
          </div>
        ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div
              key={dispute._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">
                        {dispute.reason}
                      </h3>
                      {dispute.details && (
                        <p className="text-sm text-slate-400 mt-1">
                          {dispute.details}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(dispute.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                    <div className="flex items-center text-slate-400">
                      <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                      <span>Submitted: {new Date(dispute.submittedAt).toLocaleDateString()}</span>
                    </div>
                    {dispute.resolvedAt && (
                      <div className="flex items-center text-slate-400">
                        <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                        <span>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {dispute.resolutionSummary && (
                      <div className="flex items-center text-slate-400">
                        <FileText className="h-4 w-4 mr-2 text-slate-500" />
                        <span className="truncate">Resolution: {dispute.resolutionSummary}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  
                 
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Important Information */}
      <div className="bg-yellow-950 border border-yellow-800 rounded-2xl p-6">
        <h3 className="font-medium text-yellow-300 mb-2">Important Information</h3>
        <ul className="text-sm text-yellow-400 space-y-1">
          <li>• Disputes must be raised within 7 days of appraisal publication</li>
          <li>• HR will review your dispute and provide a resolution</li>
          <li>• You will be notified when your dispute status changes</li>
          <li>• For urgent matters, contact HR directly</li>
        </ul>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { performanceApi } from '@/app/utils/performanceApi';
import { AppraisalDispute, AppraisalDisputeStatus } from '@/app/types/performance';
import { ArrowLeft, Calendar, User, AlertCircle } from 'lucide-react';

const getEmployeeName = (employeeId: any): string => {
  if (!employeeId) return 'N/A';
  if (typeof employeeId === 'object' && employeeId !== null) {
    return `${employeeId.firstName || ''} ${employeeId.lastName || ''}`.trim();
  }
  return 'Employee';
};

export default function DisputeViewPage() {
  const params = useParams<{ disputeId: string }>();
  const router = useRouter();
  const disputeId = params?.disputeId;

  const [dispute, setDispute] = useState<AppraisalDispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);

      try {
        // We reuse your existing API (get all) then find one by id.
        const all = await performanceApi.getAppraisalDisputes();
        const found = all.find((d: AppraisalDispute) => d._id === disputeId) || null;

        if (!found) {
          setDispute(null);
          setErr('Dispute not found.');
        } else {
          setDispute(found);
        }
      } catch (e: any) {
        setErr(e?.message || 'Failed to load dispute');
      } finally {
        setLoading(false);
      }
    };

    if (disputeId) run();
  }, [disputeId]);

  const canResolve =
    dispute?.status === AppraisalDisputeStatus.OPEN ||
    dispute?.status === AppraisalDisputeStatus.UNDER_REVIEW;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="bg-white border border-red-200 rounded-xl p-6">
          <p className="text-sm font-medium text-red-700">Couldn't load dispute</p>
          <p className="text-sm text-red-600 mt-1">{err}</p>
        </div>
      </div>
    );
  }

  if (!dispute) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/performance/adminDisputes"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Disputes
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mt-2">Dispute Details</h1>
          <p className="text-slate-600 mt-1">{dispute.reason}</p>
        </div>

        {canResolve && (
          <div className="flex gap-2">
            <Link
              href={`/performance/disputes/${dispute._id}/approve`}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              Approve
            </Link>
            <Link
              href={`/performance/disputes/${dispute._id}/reject`}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"
            >
              Reject
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium text-slate-900">Status:</span>
          <span>{dispute.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <User className="h-4 w-4" />
            <span className="font-medium text-slate-900">Employee:</span>
            <span>{getEmployeeName(dispute.raisedByEmployeeId)}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="h-4 w-4" />
            <span className="font-medium text-slate-900">Submitted:</span>
            <span>{new Date(dispute.submittedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {dispute.details && (
          <div className="bg-slate-50 border rounded-lg p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{dispute.details}</p>
          </div>
        )}

        {dispute.resolutionSummary && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm font-medium text-emerald-900">Resolution</p>
            <p className="text-sm text-emerald-800 mt-1 whitespace-pre-wrap">
              {dispute.resolutionSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { performanceApi } from '@/app/utils/performanceApi';
import { AppraisalDisputeStatus } from '@/app/types/performance';
import { ArrowLeft, XCircle } from 'lucide-react';

export default function DisputeRejectPage() {
  const params = useParams<{ disputeId: string }>();
  const router = useRouter();
  const disputeId = params?.disputeId;

  const [summary, setSummary] = useState('Rejected by HR');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!disputeId) return;
    setSaving(true);
    setErr(null);

    try {
      const currentUserId = localStorage.getItem('userId') || 'admin-user-id';

      await performanceApi.updateDisputeStatus(disputeId, {
        status: AppraisalDisputeStatus.REJECTED,
        resolutionSummary: summary,
        resolvedByEmployeeId: currentUserId,
      });

      router.push(`/performance/disputes/${disputeId}`);
    } catch (e: any) {
      setErr(e?.message || 'Failed to reject dispute');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/performance/disputes/${disputeId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-rose-600" />
          <h1 className="text-xl font-bold text-slate-900">Reject Dispute</h1>
        </div>

        <p className="text-sm text-slate-600 mt-2">
          Add a rejection reason, then confirm.
        </p>

        <div className="mt-4">
          <label className="text-sm font-medium text-slate-900">Rejection reason</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="mt-2 w-full min-h-[120px] border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {err && <p className="text-sm text-rose-600 mt-3">{err}</p>}

        <div className="mt-5 flex gap-2">
          <button
            disabled={saving}
            onClick={submit}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Confirm Reject'}
          </button>

          <Link
            href={`/performance/disputes/${disputeId}`}
            className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

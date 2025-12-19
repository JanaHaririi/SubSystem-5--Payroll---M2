"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function RefundPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const refundId = params?.id as string;
  const router = useRouter();

  const [refund, setRefund] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState("pending");
  const [payrollRunId, setPayrollRunId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const roles = (user as any)?.roles || [];
  const isFinanceStaff = useMemo(
    () => roles.some((r: string) => r.toLowerCase() === "finance staff"),
    [roles]
  );
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API ||
    "http://localhost:4000";

  useEffect(() => {
    if (loading || !isFinanceStaff || !refundId) return;

    async function loadRefund() {
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch(
          `${apiBase}/payroll-tracking/refunds/${refundId}`,
          { credentials: "include", cache: "no-store" }
        );

        if (res.status === 403) {
          setError("You do not have permission to view refunds.");
          setRefund(null);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Failed to load refund.");
          setRefund(null);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setRefund(data);
        setStatusUpdate(data?.status ?? "pending");
        setPayrollRunId(data?.paidInPayrollRunId ?? "");
      } catch (err) {
        console.error(err);
        setError("Network error. Please try again.");
      }

      setIsLoading(false);
    }

    loadRefund();
  }, [apiBase, isFinanceStaff, loading, refundId]);

  const handleStatusUpdate = async () => {
    if (!refundId) return;
    setIsUpdating(true);
    setError("");

    try {
      const res = await fetch(
        `${apiBase}/payroll-tracking/refunds/${refundId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: statusUpdate,
            financeStaffId: (user as any)?.userid || (user as any)?.employeeId,
            paidInPayrollRunId: payrollRunId || undefined,
          }),
        }
      );

      if (!res.ok) {
        setError("Failed to update refund status.");
        setIsUpdating(false);
        return;
      }

      const updated = await res.json();
      setRefund(updated);
    } catch (err) {
      console.error(err);
      setError("Network error while updating status.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading)
    return <div className="p-8 text-white">Loading...</div>;

  if (!isFinanceStaff) {
    return (
      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-300">Only Finance Staff can view refunds.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-white">Loading refund...</div>;
  }

  if (error || !refund) {
    return (
      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-4">Refund Unavailable</h1>
        <p className="text-gray-300">{error || "The refund is not available."}</p>
      </div>
    );
  }

  return (
    <div className="p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Refund Details</h1>
        <button
          onClick={() => router.back()}
          className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 transition text-white text-sm"
        >
          Back
        </button>
      </div>

      <div className="bg-white text-black shadow rounded-lg p-6 space-y-4">
        <p>
          <strong>ID:</strong> {refund._id}
        </p>

        <p>
          <strong>Refund Details:</strong>{" "}
          {refund.refundDetails?.description || JSON.stringify(refund.refundDetails) || "N/A"}
        </p>

        <p>
          <strong>Amount:</strong> {refund.refundDetails?.amount ?? "N/A"}
        </p>

        <p>
          <strong>Employee ID:</strong> {refund.employeeId || "N/A"}
        </p>

        <p>
          <strong>Status:</strong> {refund.status}
        </p>

        {refund.financeStaffId && (
          <p>
            <strong>Finance Staff ID:</strong> {refund.financeStaffId}
          </p>
        )}

        {refund.paidInPayrollRunId && (
          <p>
            <strong>Paid Payroll Run ID:</strong> {refund.paidInPayrollRunId}
          </p>
        )}

        {refund.updatedAt && (
          <p>
            <strong>Last Updated:</strong>{" "}
            {new Date(refund.updatedAt).toLocaleString()}
          </p>
        )}

        {/* Finance-only status update */}
        {isFinanceStaff && (
          <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Update Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col text-sm text-gray-700">
                Status
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="mt-1 rounded border border-gray-300 p-2"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
              <label className="flex flex-col text-sm text-gray-700">
                Payroll Run ID (optional)
                <input
                  value={payrollRunId}
                  onChange={(e) => setPayrollRunId(e.target.value)}
                  className="mt-1 rounded border border-gray-300 p-2"
                  placeholder="Link to payroll run"
                />
              </label>
            </div>
            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-500 disabled:opacity-60"
            >
              {isUpdating ? "Saving..." : "Save Status"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

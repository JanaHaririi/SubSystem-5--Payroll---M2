"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ChangeRequestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchRequest = async () => {
    try {
      const res = await axiosInstance.get(
        `/organization-structure/change-requests/${id}`
      );
      setRequest(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load change request");
      router.push("/organization-structure/change-requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, []);

  const approve = async () => {
    if (!confirm("Are you sure you want to approve this request?")) return;

    setProcessing(true);
    try {
      await axiosInstance.put(
        `/organization-structure/change-requests/${id}/approve`
      );
      alert("✅ Request approved successfully!");
      router.push("/organization-structure/change-requests");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to approve");
      setProcessing(false);
    }
  };

  const reject = async () => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason || reason.trim() === "") {
      alert("Rejection reason is required");
      return;
    }

    setProcessing(true);
    try {
      await axiosInstance.put(
        `/organization-structure/change-requests/${id}/reject`,
        { reason }
      );
      alert("❌ Request rejected");
      router.push("/organization-structure/change-requests");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to reject");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300">Loading request details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300">Request not found.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatRequestType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Link href="/organization-structure/change-requests">
          <button className="mb-6 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-2">
            ← Back to Change Requests
          </button>
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Change Request Details
                </h1>
                <span className={`px-4 py-1.5 text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Request Number:</span>
                  <p className="font-mono font-semibold text-gray-900 dark:text-white">{request.requestNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {request.submittedAt
                      ? new Date(request.submittedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requester Info */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Requested By
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-semibold">
                {request.requestedByEmployeeId?.firstName?.[0] || "?"}
                {request.requestedByEmployeeId?.lastName?.[0] || ""}
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {request.requestedByEmployeeId?.fullName || "Unknown"}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Employee #: {request.requestedByEmployeeId?.employeeNumber || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Request Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Request Type
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatRequestType(request.requestType)}
              </p>
            </div>

            {request.targetDepartmentId && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Target Department
                </label>
                <p className="text-gray-900 dark:text-white">
                  {request.targetDepartmentId}
                </p>
              </div>
            )}

            {request.targetPositionId && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Target Position
                </label>
                <p className="text-gray-900 dark:text-white">
                  {request.targetPositionId}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Details
              </label>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                {request.details || "No details provided"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Business Reason
              </label>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                {request.reason || "No reason provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (System Admin only) */}
        {request.status === "SUBMITTED" && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Admin Actions
            </h2>
            <div className="flex gap-4">
              <button
                onClick={approve}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "✓ Approve Request"}
              </button>
              <button
                onClick={reject}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "✗ Reject Request"}
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              Approving or rejecting will send a notification to the requester
            </p>
          </div>
        )}

        {request.status === "APPROVED" && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-500 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">✓</span>
              <div>
                <p className="text-lg font-semibold text-green-800 dark:text-green-300">
                  Request Approved
                </p>
                <p className="text-green-700 dark:text-green-400">
                  This request has been approved and the changes have been applied.
                </p>
              </div>
            </div>
          </div>
        )}

        {request.status === "REJECTED" && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">✗</span>
              <div>
                <p className="text-lg font-semibold text-red-800 dark:text-red-300">
                  Request Rejected
                </p>
                <p className="text-red-700 dark:text-red-400">
                  This request has been rejected.
                </p>
                {request.rejectionReason && (
                  <p className="mt-2 text-sm">
                    <strong>Reason:</strong> {request.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

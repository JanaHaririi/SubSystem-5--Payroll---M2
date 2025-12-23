"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import { 
  FaArrowLeft, 
  FaPlus, 
  FaFileExport, 
  FaFilter, 
  FaClock, 
  FaUser, 
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaEdit,
  FaSpinner,
  FaSave,
  FaTrash,
  FaEye,
  FaClock as FaClockIcon
} from "react-icons/fa";

/* ===================== ENUM TYPES (MATCH BACKEND) ===================== */

export type TimeExceptionType =
  | "MISSED_PUNCH"
  | "LATE"
  | "EARLY_LEAVE"
  | "SHORT_TIME"
  | "OVERTIME_REQUEST"
  | "MANUAL_ADJUSTMENT";

export type TimeExceptionStatus =
  | "OPEN"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ESCALATED"
  | "RESOLVED";

/* ===================== MODEL ===================== */

export interface TimeException {
  _id: string;
  employeeId: string;
  attendanceRecordId?: string;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | string;
  type: TimeExceptionType;
  reason: string;
  status: TimeExceptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/* ===================== PAGE ===================== */

export default function TimeExceptionPage() {
  const { user } = useAuth();

  const employeeId = user?.userid;

  const [requests, setRequests] = useState<TimeException[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeException | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | TimeExceptionStatus>("ALL");
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  /* ===================== ROLES ===================== */

  const roles = (user?.roles || []).map((r: string) => r.toLowerCase().trim());

  const isEmployee =
    roles.includes("hr employee") || roles.includes("department employee");

  const canWrite =
    roles.includes("hr admin") || roles.includes("department head");

  const canRead =
    roles.includes("payroll manager") || roles.includes("payroll specialist");

  /* ===================== FETCH ===================== */

  const fetchRequests = async () => {
    if (!employeeId) return;

    setLoading(true);
    try {
      const url =
        canWrite || canRead
          ? "http://localhost:4000/time-management/time-exception"
          : `http://localhost:4000/time-management/time-exception/my-exceptions/${employeeId}`;

      const res = await axios.get(url, { withCredentials: true });
      const data = res.data?.data ?? res.data ?? [];

      setRequests(
        data.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }))
      );
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!employeeId) return;
    fetchRequests();
  }, [employeeId]);

  /* ===================== FILTER ===================== */

  const visibleRequests = (() => {
    if (isEmployee && !canRead && !canWrite) return requests;
    if (canRead && !canWrite)
      return requests.filter(
        r => r.status === "APPROVED" || r.status === "REJECTED"
      );
    if (canWrite) return requests;
    return [];
  })();

  const filteredRequests =
    filterStatus === "ALL"
      ? visibleRequests
      : visibleRequests.filter(r => r.status === filterStatus);

  /* ===================== ACTIONS ===================== */

  const handleApprove = async (id: string) => {
    await axios.patch(
      `http://localhost:4000/time-management/time-exception/${id}/approve`,
      {},
      { withCredentials: true }
    );
    fetchRequests();
  };

  const handleOpen = async (id: string) => {
    await axios.patch(
      `http://localhost:4000/time-management/time-exception/${id}/open`,
      {},
      { withCredentials: true }
    );
    fetchRequests();
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    await axios.patch(
      `http://localhost:4000/time-management/time-exception/${id}/reject`,
      { reason },
      { withCredentials: true }
    );
    fetchRequests();
  };

  const handleEscalate = async (id: string) => {
    await axios.patch(
      `http://localhost:4000/time-management/time-exception/${id}/escalate`,
      {},
      { withCredentials: true }
    );
    fetchRequests();
  };

  const toggleExpand = (id: string) => {
    setExpandedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  /* ===================== EXPORT ===================== */

  const exportToCSV = () => {
    if (visibleRequests.length === 0) {
      alert("No requests to export");
      return;
    }

    const csvRows: string[] = [];

    csvRows.push([
      "Request ID",
      "Employee ID",
      "Type",
      "Reason",
      "Status",
      "Created At",
      "Updated At",
    ].join(","));

    visibleRequests.forEach(req => {
      csvRows.push([
        req._id,
        req.employeeId,
        req.type,
        `"${req.reason.replace(/"/g, '""')}"`,
        req.status,
        `"${new Date(req.createdAt).toLocaleString()}"`,
        `"${new Date(req.updatedAt).toLocaleString()}"`,
      ].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `time-exceptions-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ===================== UI ===================== */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-4 animate-pulse">
            <FaClock className="text-2xl text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-gray-400 font-medium">Loading time exceptions...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: TimeExceptionStatus) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "REJECTED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "PENDING": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "OPEN": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ESCALATED": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "RESOLVED": return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300";
    }
  };

  const getTypeColor = (type: TimeExceptionType) => {
    switch (type) {
      case "MISSED_PUNCH": return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300";
      case "LATE": return "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300";
      case "EARLY_LEAVE": return "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "SHORT_TIME": return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
      case "OVERTIME_REQUEST": return "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300";
      case "MANUAL_ADJUSTMENT": return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
      default: return "bg-gray-50 text-gray-700 dark:bg-gray-800/20 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link 
              href="/time-management/" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 group mb-4"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <FaClock className="text-2xl text-white" />
              </div>
              Time Exception Requests
            </h1>
          </div>

          <div className="flex gap-3">
            {canRead && (
              <button
                onClick={exportToCSV}
                disabled={visibleRequests.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                <FaFileExport />
                Export CSV
              </button>
            )}

            {isEmployee && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FaPlus />
                Submit Request
              </button>
            )}
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg">
                <FaFilter className="text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Filter Requests</h2>
                <p className="text-sm text-gray-400">Showing {filteredRequests.length} of {visibleRequests.length} requests</p>
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[180px]"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-12 text-center border-2 border-dashed border-gray-700/50 shadow-lg">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl mb-6 shadow-lg">
              <FaClockIcon className="text-4xl text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No time exception requests found
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              {filterStatus === "ALL" 
                ? "No requests have been submitted yet."
                : `No requests with status "${filterStatus}" found.`}
            </p>
            {isEmployee && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FaPlus />
                Submit Your First Request
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredRequests.map((req) => {
              const isExpanded = expandedRequests.has(req._id);
              const requestDate = new Date(req.createdAt).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={req._id}
                  className="bg-gradient-to-b from-gray-800 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl">
                        <FaClockIcon className="text-xl text-purple-400" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h2 className="font-bold text-xl text-white">
                            Request #{req._id}
                          </h2>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(req.type)}`}>
                            {req.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-xs" />
                            Employee ID: {req.employeeId.toString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleExpand(req._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        {isExpanded ? (
                          <>
                            <FaArrowUp />
                            Collapse
                          </>
                        ) : (
                          <>
                            <FaArrowDown />
                            Details
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-700/50 space-y-6">
                      {/* Reason Section */}
                      <div>
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <FaExclamationTriangle className="text-yellow-500" />
                          Reason
                        </h3>
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                          <p className="text-gray-300 whitespace-pre-wrap">{req.reason}</p>
                        </div>
                      </div>


                      {/* Action Buttons for Managers */}
                      {canWrite && (
                        <div className="pt-4 border-t border-gray-700/50">
                          <h3 className="font-semibold text-white mb-3">Actions</h3>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => handleApprove(req._id)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              <FaCheckCircle />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(req._id)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              <FaTimesCircle />
                              Reject
                            </button>
                            <button
                              onClick={() => handleEscalate(req._id)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              <FaArrowUp />
                              Escalate
                            </button>
                            <button
                              onClick={() => handleOpen(req._id)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl hover:from-pink-700 hover:to-pink-800 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              <FaEye />
                              Re-open
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || selectedRequest) && (
        <TimeExceptionModal
          request={selectedRequest}
          employeeId={employeeId!}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            fetchRequests();
            setShowCreateModal(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}

/* ===================== MODAL ===================== */

function TimeExceptionModal({
  request,
  employeeId,
  onClose,
  onSuccess,
}: {
  request: TimeException | null;
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [type, setType] = useState<TimeExceptionType>(
    request?.type || "MISSED_PUNCH"
  );
  const [reason, setReason] = useState(request?.reason || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (request) {
        await axios.patch(
          `http://localhost:4000/time-management/time-exception/${request._id}`,
          {
            type,
            reason,
          },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `http://localhost:4000/time-management/time-exception`,
          { employeeId, type, reason },
          { withCredentials: true }
        );
      }

      onSuccess();
    } catch (err: any) {
      console.error("Submit error:", err);
      alert(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-700/50">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <FaClock className="text-white text-lg" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {request ? "Edit Time Exception" : "Submit Time Exception"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-300"
          >
            <FaTimesCircle className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="space-y-2">
            <label className="block font-medium text-white flex items-center gap-2">
              <FaExclamationTriangle className="text-yellow-500" />
              Exception Type
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-xl blur-sm group-hover:blur"></div>
              <select
                value={type}
                onChange={e => setType(e.target.value as TimeExceptionType)}
                className="relative w-full p-3 rounded-xl bg-gray-800/70 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MISSED_PUNCH">Missed Punch</option>
                <option value="LATE">Late Arrival</option>
                <option value="EARLY_LEAVE">Early Leave</option>
                <option value="SHORT_TIME">Short Working Time</option>
                <option value="OVERTIME_REQUEST">Overtime Request</option>
                <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
              </select>
            </div>
          </div>

          {/* Reason Textarea */}
          <div className="space-y-2">
            <label className="block font-medium text-white flex items-center gap-2">
              <FaEdit className="text-blue-500" />
              Reason
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-xl blur-sm group-hover:blur"></div>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                rows={4}
                className="relative w-full p-3 rounded-xl bg-gray-800/70 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Please provide a detailed reason for this exception..."
              />
            </div>
          </div>

          {/* Note */}
          <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-800/30">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> All requests are logged and will be reviewed by management.
              Please provide accurate information.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FaSave />
                  {request ? "Update Request" : "Submit Request"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-medium rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <FaTimesCircle className="inline mr-2" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add animation style
const styles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
`;

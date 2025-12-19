"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";

export interface TimeException {
  _id: string;
  employeeId: string | { _id: string; firstName: string; lastName: string; email: string };
  type: string;
  attendanceRecordId: string;
  assignedTo: string | { _id: string; firstName: string; lastName: string; email: string };
  reason?: string;
  status: "OPEN" | "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED";
  createdAt: Date;
  updatedAt: Date;
}

export default function TimeExceptionsPage() {
  const [exceptions, setExceptions] = useState<TimeException[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedException, setSelectedException] = useState<TimeException | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const { user } = useAuth();

  const isEmployee = user?.roles?.some((role: string) => {
    const normalizedRole = role.toLowerCase().trim();
    return normalizedRole.includes("employee") || normalizedRole === "hr employee" || normalizedRole === "department employee";
  });

  const canApproveReject = user?.roles?.some((role: string) => {
    const normalizedRole = role.toLowerCase().trim();
    return normalizedRole.includes("department head") || normalizedRole.includes("hr admin") || normalizedRole.includes("system admin");
  });

  const fetchExceptions = async () => {
    if (!user?.userid) return;
    setLoading(true);
    try {
      const url = isEmployee
        ? `http://localhost:4000/time-management/time-exceptions/employee/${user.userid}`
        : `http://localhost:4000/time-management/time-exceptions/all`;

      const res = await axios.get(url, { withCredentials: true });
      let data = res.data.data || res.data || [];
      if (!Array.isArray(data) && data.data) data = data.data;

      setExceptions(Array.isArray(data) ? data.map((e: any) => ({
        ...e,
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
      })) : []);
    } catch (err) {
      console.error("Error fetching time exceptions:", err);
      setExceptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [user]);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this time exception?")) return;
    try {
      await axios.patch(`http://localhost:4000/time-management/time-exceptions/${id}/approve`, {}, { withCredentials: true });
      fetchExceptions();
    } catch (err) {
      console.error(err);
      alert("Failed to approve exception");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Provide reason for rejection:");
    if (!reason) return;
    try {
      await axios.patch(`http://localhost:4000/time-management/time-exceptions/${id}/reject`, { reason }, { withCredentials: true });
      fetchExceptions();
    } catch (err) {
      console.error(err);
      alert("Failed to reject exception");
    }
  };

  const handleEscalate = async () => {
    if (!confirm("Auto-escalate all pending exceptions older than 3 days?")) return;
    try {
      await axios.post(`http://localhost:4000/time-management/time-exceptions/auto-escalate`, {}, { withCredentials: true });
      alert("Pending exceptions escalated!");
      fetchExceptions();
    } catch (err) {
      console.error(err);
      alert("Failed to escalate exceptions");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "PENDING": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "APPROVED": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "REJECTED": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "ESCALATED": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN": return "📤";
      case "PENDING": return "🔍";
      case "APPROVED": return "✅";
      case "REJECTED": return "❌";
      case "ESCALATED": return "⚠️";
      default: return "📋";
    }
  };

  const filteredExceptions = exceptions.filter(e => filterStatus === "ALL" || e.status === filterStatus);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading time exceptions...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/time-management/attendance" className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block">&larr; Back to Attendance</Link>
          <div className="flex justify-between items-center mt-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Time Exceptions</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {canApproveReject ? "Review and manage time exceptions" : "Submit and track your time exceptions"}
              </p>
            </div>
            <div className="flex space-x-2">
              {isEmployee && <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md">➕ Submit Exception</button>}
              {canApproveReject && <button onClick={handleEscalate} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md">⚠️ Auto-Escalate</button>}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <label className="text-gray-700 dark:text-gray-300 font-medium">Filter by Status:</label>
            <select className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{exceptions.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Open</div>
            <div className="text-2xl font-bold text-blue-600">{exceptions.filter(e => e.status === "OPEN").length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{exceptions.filter(e => e.status === "PENDING").length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Approved</div>
            <div className="text-2xl font-bold text-green-600">{exceptions.filter(e => e.status === "APPROVED").length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Rejected</div>
            <div className="text-2xl font-bold text-red-600">{exceptions.filter(e => e.status === "REJECTED").length}</div>
          </div>
        </div>

        {/* Exceptions List */}
        <div className="space-y-4">
          {filteredExceptions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No time exceptions found.</p>
              {isEmployee && <button onClick={() => setShowCreateModal(true)} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Submit Your First Exception</button>}
            </div>
          ) : (
            filteredExceptions.map((e) => (
              <div key={e._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Exception #{e._id.slice(-8)}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(e.status)}`}>{getStatusIcon(e.status)} {e.status.replace(/_/g, " ")}</span>
                    </div>
                    {typeof e.employeeId === "object" && e.employeeId && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">👤 {e.employeeId.firstName} {e.employeeId.lastName} ({e.employeeId.email})</p>}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Reason:</strong> {e.reason}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {canApproveReject && (e.status === "OPEN" || e.status === "PENDING" || e.status === "ESCALATED") && (
                      <>
                        <button onClick={() => handleApprove(e._id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md text-sm font-medium">✅ Approve</button>
                        <button onClick={() => handleReject(e._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-md text-sm font-medium">❌ Reject</button>
                      </>
                    )}
                    {isEmployee && (e.status === "OPEN" || e.status === "PENDING" || e.status === "ESCALATED") && (
                      <button onClick={() => setSelectedException(e)} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition shadow-md text-sm font-medium">✏️ Edit</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || selectedException) && (
        <TimeExceptionModal
          exception={selectedException}
          onClose={() => { setShowCreateModal(false); setSelectedException(null); }}
          onSuccess={() => { fetchExceptions(); setShowCreateModal(false); setSelectedException(null); }}
          userId={user?.userid || ""}
        />
      )}
    </div>
  );
}

// Create/Edit Modal Component
function TimeExceptionModal({
  exception,
  onClose,
  onSuccess,
  userId,
}: {
  exception: TimeException | null;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}) {
  const [type, setType] = useState(exception?.type || "");
  const [attendanceRecordId, setAttendanceRecordId] = useState(exception?.attendanceRecordId || "");
  const [assignedTo, setAssignedTo] = useState(exception?.assignedTo as string || "");
  const [reason, setReason] = useState(exception?.reason || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (exception) {
        await axios.patch(`http://localhost:4000/time-management/time-exceptions/${exception._id}`, { reason }, { withCredentials: true });
      } else {
        await axios.post("http://localhost:4000/time-management/time-exceptions", { employeeId: userId, type, attendanceRecordId, assignedTo, reason }, { withCredentials: true });
      }
      onSuccess();
    } catch (err: any) {
      console.error("Error saving exception:", err);
      const errorMsg = err.response?.data?.message || "Failed to save exception. Please try again.";
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{exception ? "✏️ Edit Time Exception" : "➕ Submit Time Exception"}</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{exception ? "Update the reason for your time exception" : "Submit a new time exception"}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!exception && (
            <>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Type</label>
                <input type="text" required value={type} onChange={(e) => setType(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Attendance Record ID</label>
                <input type="text" required value={attendanceRecordId} onChange={(e) => setAttendanceRecordId(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Assigned To</label>
                <input type="text" required value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </>
          )}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Reason</label>
            <textarea required rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md font-medium">{submitting ? "Saving..." : "Save"}</button>
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition shadow-md font-medium">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

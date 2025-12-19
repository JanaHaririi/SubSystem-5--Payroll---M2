"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";

export interface CorrectionRequest {
  _id: string;
  employeeId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attendanceRecord: string;
  reason: string;
  status: "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "ESCALATED";
  createdAt: Date;
  updatedAt: Date;
}

export default function AttendanceCorrectionRequestPage() {
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CorrectionRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [record, setRecord] = useState<{ _id: string } | null>(null);

  const { user } = useAuth();

  const isEmployee = user?.roles?.some((role: string) => {
    const normalizedRole = role.toLowerCase().trim();
    return normalizedRole.includes('employee') || normalizedRole === 'hr employee' || normalizedRole === 'department employee';
  });

  const normalizedRoles = (user?.roles || []).map((r: string) =>
    r.toLowerCase().trim()
  );

  const isDepartmentHead = normalizedRoles.includes("department head");
  const isHrAdmin = normalizedRoles.includes("hr admin");
  const isSystemAdmin = normalizedRoles.includes("system admin");
  const isPayrollOfficer = normalizedRoles.includes("payroll manager");
  const isPayrollSpecialist = normalizedRoles.includes("payroll specialist");
  const isHRManager = normalizedRoles.includes("hr manager");


  const canWrite= isHrAdmin || isDepartmentHead  ;
  const canRead = isPayrollOfficer || isPayrollSpecialist || isSystemAdmin ;

 

  // Fetch correction requests
  const fetchRequests = async () => {
    if (!user?.userid) return;
    
    setLoading(true);
    try {
      let url;
      
      // Determine which endpoint to call based on role
      if (canWrite||canRead || isSystemAdmin) {
        url = `http://localhost:4000/time-management/attendance-correction-request/`;
      } else {
        url = `http://localhost:4000/time-management/attendance-correction-request/employee/${user.userid}`;      
      }

      if (canWrite||canRead) {
        const res = await axios.get(url, { withCredentials: true });
        
        let data = res.data.data || res.data || [];
        if (!Array.isArray(data) && data.data) data = data.data;

        const processedRequests = Array.isArray(data) ? data.map((req: any) => ({
          ...req,
          createdAt: new Date(req.createdAt),
          updatedAt: new Date(req.updatedAt),
        })) : [];

        setRequests(processedRequests);
      } else {
        const res = await axios.get(url, { withCredentials: true });
      
        let data = res.data.data || [];
        if (!Array.isArray(data) && data.data) data = data.data;
      
        const processedRequests = data.map((req: any) => ({
          ...req,
          createdAt: new Date(req.createdAt),
          updatedAt: new Date(req.updatedAt),
        }));
      
        setRequests(processedRequests);
      }
      
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.userid || !user.roles?.length) return;
    fetchRequests();
  }, [user?.userid, user?.roles]);

  // Filter requests based on role
  const getVisibleRequests = () => {
        if(isSystemAdmin){
            return requests.filter(r =>
        r.status === "ESCALATED" 
      );
    }
    // Employee: their own requests (already filtered by backend)
    if (isEmployee && !canRead && !canWrite) {
      return requests;
    }
  
    // Payroll: read-only approved + rejected
    if (canRead && !canWrite) {
      return requests.filter(r =>
        r.status === "APPROVED" || r.status === "REJECTED"
      );
    }
  
    // HR Admin & Department Head: see everything
    if (canWrite && !canRead) {
      return requests;
    }
      if (isHRManager) {
      return requests;
    }

  
    return [];
  };
  

  const visibleRequests = getVisibleRequests();

  const filteredRequests = visibleRequests.filter(
    (r) => filterStatus === "ALL" || r.status === filterStatus
  );

  const handleApprove = async (requestId: string) => {
    if (!confirm("Are you sure you want to approve this correction request?")) return;
    try {
      await axios.patch(
        `http://localhost:4000/time-management/attendance-correction-request/${requestId}/approve`,
        {},
        { withCredentials: true }
      );
      fetchRequests();
    } catch (err) {
      console.error("Error approving request:", err);
      alert("Failed to approve request");
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;
    try {
      await axios.patch(
        `http://localhost:4000/time-management/attendance-correction-request/${requestId}/reject`,
        { reason },
        { withCredentials: true }
      );
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert("Failed to reject request");
    }
  };

  const handleEscalateRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to escalate this correction request to admins?")) return;
    try {
      await axios.patch(
        `http://localhost:4000/time-management/attendance-correction-request/${requestId}/escalate`,
        {},
        { withCredentials: true }
      );
      fetchRequests();
    } catch (err) {
      console.error("Error escalating request:", err);
      alert("Failed to escalate request");
    }
  };

  const handleAutoEscalate = async () => {
    if (!confirm("This will escalate all pending requests older than 48 hours. Continue?")) return;
    try {
      await axios.post(
        `http://localhost:4000/time-management/attendance-correction-request/auto-escalate`,
        {},
        { withCredentials: true }
      );
      alert("Pending requests escalated successfully!");
      fetchRequests();
    } catch (err) {
      console.error("Error escalating requests:", err);
      alert("Failed to escalate requests");
    }
  };

  const exportToCSV = () => {
    if (visibleRequests.length === 0) {
      alert("No requests to export");
      return;
    }

    // Prepare CSV data
    const csvRows: string[] = [];
    
    // Header row
    const headers = [
      "Request ID",
      "Employee ID",
      "Employee Name",
      "Employee Email",
      "Attendance Record ID",
      "Reason",
      "Status",
      "Created At",
      "Updated At"
    ];
    csvRows.push(headers.join(","));

    // Data rows
    visibleRequests.forEach(request => {
      const employeeName = typeof request.employeeId === "object" 
        ? `${request.employeeId.firstName} ${request.employeeId.lastName}`
        : "N/A";
      
      const employeeEmail = typeof request.employeeId === "object"
        ? request.employeeId.email
        : "N/A";

      const employeeIdValue = typeof request.employeeId === "object"
        ? request.employeeId._id
        : request.employeeId;

      csvRows.push([
        request._id,
        employeeIdValue,
        `"${employeeName}"`,
        employeeEmail,
        request.attendanceRecord,
        `"${request.reason.replace(/"/g, '""')}"`, // Escape quotes in reason
        request.status,
        `"${new Date(request.createdAt).toLocaleString("en-US", { 
          year: "numeric", 
          month: "2-digit", 
          day: "2-digit",
          hour: "2-digit", 
          minute: "2-digit",
          second: "2-digit",
          hour12: false 
        })}"`,
        `"${new Date(request.updatedAt).toLocaleString("en-US", { 
          year: "numeric", 
          month: "2-digit", 
          day: "2-digit",
          hour: "2-digit", 
          minute: "2-digit",
          second: "2-digit",
          hour12: false 
        })}"`
      ].join(","));
    });

    // Create CSV content
    const csvContent = csvRows.join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance-correction-requests-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-800";
      case "IN_REVIEW": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-800";
      case "APPROVED": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800";
      case "REJECTED": return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200 border border-rose-200 dark:border-rose-800";
      case "ESCALATED": return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200 border border-violet-200 dark:border-violet-800";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUBMITTED": return "📤";
      case "IN_REVIEW": return "🔍";
      case "APPROVED": return "✅";
      case "REJECTED": return "❌";
      case "ESCALATED": return "🚨";
      default: return "📋";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 bg-blue-500/20 rounded-full animate-ping"></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
            Loading correction requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-800 p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <Link
              href="/time-management/attendance"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium mb-4 transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Attendance Records
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Attendance Correction Requests
                </h1>
                <p className="text-white/80 text-sm md:text-base max-w-2xl">
                  {canRead && "Review approved attendance correction requests"}
                  {canWrite && "Review and manage attendance correction requests"}
                  {isEmployee && !canRead && !canWrite && "Submit and track your attendance correction requests"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {isEmployee && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Submit Request
                  </button>
                )}
                
                {(canRead) && (
                  <button
                    onClick={exportToCSV}
                    disabled={visibleRequests.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to CSV
                  </button>
                )}
                
                {canWrite && (
                  <button
                    onClick={handleAutoEscalate}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Auto-Escalate Old
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="text-gray-700 dark:text-gray-300 font-medium min-w-[120px]">
                  Filter by Status:
                </label>
                <select
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">📊 All Statuses</option>
                  <option value="SUBMITTED">📤 Submitted</option>
                  <option value="IN_REVIEW">🔍 In Review</option>
                  <option value="APPROVED">✅ Approved</option>
                  <option value="REJECTED">❌ Rejected</option>
                  <option value="ESCALATED">🚨 Escalated</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredRequests.length}</span> of <span className="font-semibold text-gray-700 dark:text-gray-300">{visibleRequests.length}</span> requests
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{visibleRequests.length}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                <div className="text-sm text-blue-600 dark:text-blue-300 font-medium">Submitted</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-200 mt-1">
                  {visibleRequests.filter(r => r.status === "SUBMITTED").length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm">
                <div className="text-sm text-amber-600 dark:text-amber-300 font-medium">In Review</div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-200 mt-1">
                  {visibleRequests.filter(r => r.status === "IN_REVIEW").length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                <div className="text-sm text-emerald-600 dark:text-emerald-300 font-medium">Approved</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-200 mt-1">
                  {visibleRequests.filter(r => r.status === "APPROVED").length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/20 p-4 rounded-xl border border-rose-200 dark:border-rose-800 shadow-sm">
                <div className="text-sm text-rose-600 dark:text-rose-300 font-medium">Rejected</div>
                <div className="text-2xl font-bold text-rose-700 dark:text-rose-200 mt-1">
                  {visibleRequests.filter(r => r.status === "REJECTED").length}
                </div>
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="p-6">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No correction requests found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {filterStatus !== "ALL" 
                    ? `No requests match the "${filterStatus}" filter. Try changing the status filter.`
                    : "Start by submitting your first attendance correction request."}
                </p>
                {isEmployee && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Submit Your First Request
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request._id}
                    className="group bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Request #{request._id.slice(-8)}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)} flex items-center gap-1.5`}>
                                {getStatusIcon(request.status)} {request.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            {typeof request.employeeId === "object" && request.employeeId && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span className="font-medium">{request.employeeId.firstName} {request.employeeId.lastName}</span>
                                <span className="text-gray-400 dark:text-gray-500">•</span>
                                <span className="text-gray-500 dark:text-gray-500">{request.employeeId._id}</span>
                              </div>
                            )}

                            <div className="bg-gradient-to-r from-blue-50 to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <strong className="font-semibold text-gray-800 dark:text-gray-200">Reason:</strong> {request.reason}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:flex-col lg:min-w-[200px]">
                        {/* HR Manager buttons - can approve, reject, and escalate non-escalated requests */}
                        {canWrite && (
                          <>
                            <button
                              onClick={() => handleApprove(request._id)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex-1 lg:flex-none"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request._id)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex-1 lg:flex-none"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                            <button
                              onClick={() => handleEscalateRequest(request._id)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex-1 lg:flex-none"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Escalate
                            </button>
                          </>
                        )}

                        {/* Admin & HR Manager buttons - can only approve or reject escalated requests */}
                        {(isSystemAdmin || isHRManager) && (
                          <>
                            <button
                              onClick={() => handleApprove(request._id)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex-1 lg:flex-none"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request._id)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex-1 lg:flex-none"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </>
                        )}
                        
                        {/* Employees can edit their own requests if not approved/rejected */}
                        {isEmployee && ["SUBMITTED", "IN_REVIEW", "ESCALATED"].includes(request.status) && (
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex-1 lg:flex-none"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Request
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || selectedRequest) && (
        <CorrectionRequestModal
          request={selectedRequest}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            fetchRequests();
            setShowCreateModal(false);
            setSelectedRequest(null);
          }}
          userId={user?.userid || ""}
          recordId={record?._id || ""}
        />
      )}
    </div>
  );
}

// Create/Edit Modal Component
function CorrectionRequestModal({
  request,
  onClose,
  onSuccess,
  userId,
  recordId,
}: {
  request: CorrectionRequest | null;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  recordId: string;
}) {
  const [attendanceRecordId, setAttendanceRecordId] = useState(request?.attendanceRecord || recordId);
  const [reason, setReason] = useState(request?.reason || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (request) {
        await axios.patch(
          `http://localhost:4000/time-management/attendance-correction-request/${request._id}`,
          { reason },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          "http://localhost:4000/time-management/attendance-correction-request",
          { employeeId: userId, attendanceRecordId, reason },
          { withCredentials: true }
        );
      }
      onSuccess();
    } catch (err: any) {
      console.error("Error saving request:", err);
      const errorMsg = err.response?.data?.message || "Failed to save request. Please try again.";
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 transform transition-all duration-300 scale-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {request ? "✏️ Edit Correction Request" : "📝 Submit Correction Request"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {request ? "Update the reason for your correction request" : "Submit a request to correct your attendance record"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!request && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                📋 Attendance Record ID
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                value={attendanceRecordId}
                onChange={(e) => setAttendanceRecordId(e.target.value)}
                placeholder="Enter attendance record ID"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Provided with your attendance record.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              📝 Reason for Correction
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this attendance record needs correction..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Be specific about what needs to be corrected and why
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Your request will be reviewed by your line manager or HR admin. 
                Requests older than 48 hours may be auto-escalated.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {request ? "Update Request" : "Submit Request"}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-5 py-3.5 bg-gradient-to-r from-gray-500 to-gray-400 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
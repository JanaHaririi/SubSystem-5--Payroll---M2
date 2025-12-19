"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/app/(system)/context/authContext";
import Link from "next/link";
import { 
  FaArrowLeft, 
  FaDownload, 
  FaEdit, 
  FaChevronDown, 
  FaChevronUp, 
  FaSearch,
  FaClock,
  FaCalendarAlt,
  FaEnvelope,
  FaIdCard,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaFileExport,
  FaTimes,
  FaSave,
  FaSpinner
} from "react-icons/fa";

export interface Punch {
  time: Date;
  type: "IN" | "OUT";
}

export interface AttendanceRecord {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
  };
  punches: Punch[];
  totalWorkMinutes: number;
  hasMissedPunch: boolean;
  exceptionIds?: string[];
  finalisedForPayroll?: boolean;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [searchEmployeeId, setSearchEmployeeId] = useState("");
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const isAdmin =
    user?.roles?.some((role: string) =>
      [
        "department head", 
        "hr manager", 
        "hr admin",
        "system admin", 
        "payroll manager", 
        "payroll specialist"
      ].includes(role.toLowerCase())
    ) || false;

  const isDepartmentHead =
    user?.roles?.some((role: string) =>
      role.toLowerCase() === "department head"
    ) || false;

  const toggleExpand = (recordId: string) => {
    setExpandedRecords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) newSet.delete(recordId);
      else newSet.add(recordId);
      return newSet;
    });
  };

  const fetchRecords = async () => {
    if (!user?.userid) return;
    setLoading(true);

    try {
      let url = "";
      if (isAdmin) {
        // Admin: can view all or filter by employeeId
        const params = searchEmployeeId ? `?employeeId=${encodeURIComponent(searchEmployeeId)}` : "";
        url = `http://localhost:4000/time-management/attendance-record${params}`;
      } else {
        // Employee: only own record
        url = `http://localhost:4000/time-management/attendance-record/${user.userid}`;
      }

      const res = await axios.get(url, { withCredentials: true });

      // Normalize data to an array and ensure punch times are Date objects
      let data: AttendanceRecord[] = [];
      if (Array.isArray(res.data.data)) data = res.data.data;
      else if (res.data.data) data = [res.data.data];

      data = data.map((rec: any) => ({
        ...rec,
        punches: (rec.punches || [])
          .map((p: any) => ({ ...p, time: new Date(p.time) }))
          .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()),
      }));

      setRecords(data);
    } catch (err) {
      console.error("Error fetching attendance records:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const formatDateTimeForCSV = (date: Date) =>
    date.toLocaleString("en-US", { 
      year: "numeric", 
      month: "2-digit", 
      day: "2-digit",
      hour: "2-digit", 
      minute: "2-digit",
      second: "2-digit",
      hour12: false 
    });

  const exportToCSV = () => {
    if (records.length === 0) {
      alert("No records to export");
      return;
    }

    // Prepare CSV data
    const csvRows: string[] = [];
    
    // Header row
    const headers = [
      "Employee ID",
      "Employee Name",
      "Employee Email",
      "Punch Type",
      "Punch Time",
      "Total Work Minutes",
      "Total Work Hours",
      "Has Missed Punch",
      "Finalized for Payroll"
    ];
    csvRows.push(headers.join(","));

    // Data rows - one row per punch
    records.forEach(record => {
      const employeeName = `${record.employeeId.firstName} ${record.employeeId.lastName}`;
      const totalHours = (record.totalWorkMinutes / 60).toFixed(2);

      if (record.punches.length === 0) {
        // If no punches, still show the record
        csvRows.push([
          record.employeeId._id,
          `"${employeeName}"`,
          record.employeeId.workEmail,
          "No Punches",
          "",
          record.totalWorkMinutes,
          totalHours,
          record.hasMissedPunch ? "Yes" : "No",
          record.finalisedForPayroll ? "Yes" : "No"
        ].join(","));
      } else {
        // Create a row for each punch
        record.punches.forEach(punch => {
          csvRows.push([
            record.employeeId._id,
            `"${employeeName}"`,
            record.employeeId.workEmail,
            punch.type,
            `"${formatDateTimeForCSV(punch.time)}"`,
            record.totalWorkMinutes,
            totalHours,
            record.hasMissedPunch ? "Yes" : "No",
            record.finalisedForPayroll ? "Yes" : "No"
          ].join(","));
        });
      }
    });

    // Create CSV content
    const csvContent = csvRows.join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance-records-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedData: Partial<AttendanceRecord>) => {
    if (!editingRecord) return;

    try {
      await axios.patch(
        `http://localhost:4000/time-management/attendance-record/${editingRecord._id}`,
        updatedData,
        { withCredentials: true }
      );
      
      setShowEditModal(false);
      setEditingRecord(null);
      fetchRecords(); // Refresh the records
    } catch (err) {
      console.error("Error updating record:", err);
      alert("Failed to update record");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-2xl mb-4 animate-pulse">
            <FaClock className="text-2xl text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading attendance records...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link 
              href="/time-management" 
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 group mb-4"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <FaClock className="text-2xl text-white" />
              </div>
              {isAdmin ? "All Attendance Records" : "My Attendance Record"}
            </h1>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={records.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              <FaFileExport />
              Export CSV
            </button>
            
            <Link
              href="/time-management/attendance/correction-request"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FaEdit />
              Corrections
            </Link>
          </div>
        </div>

        {/* Search Bar for Admin */}
        {isAdmin && (
          <div className="bg-gradient-to-b from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 to-gray-900/10 dark:from-gray-800/20 dark:to-gray-900/20 rounded-xl blur-sm"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-gray-400">
                    <FaSearch />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by Employee ID or Name"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    value={searchEmployeeId}
                    onChange={(e) => setSearchEmployeeId(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={fetchRecords}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <FaSearch />
                Search
              </button>
            </div>
          </div>
        )}

        {/* Records Grid */}
        {records.length === 0 ? (
          <div className="bg-gradient-to-b from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm rounded-2xl p-12 text-center border-2 border-dashed border-gray-300/50 dark:border-gray-700/50 shadow-lg">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-3xl mb-6 shadow-lg">
              <FaCalendarAlt className="text-4xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No attendance records found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {isAdmin 
                ? "Try adjusting your search or check if employees have recorded attendance."
                : "You haven't recorded any attendance yet. Please check back later."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {records.map((record) => {
              const isExpanded = expandedRecords.has(record._id);
              const totalHours = (record.totalWorkMinutes / 60).toFixed(2);
              
              return (
                <div
                  key={record._id}
                  className="bg-gradient-to-b from-white to-white/80 dark:from-gray-800 dark:to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 rounded-xl">
                        <FaUser className="text-xl text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="font-bold text-xl text-gray-900 dark:text-white">
                          {record.employeeId.firstName} {record.employeeId.lastName}
                        </h2>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FaEnvelope className="text-xs" />
                            {record.employeeId.workEmail}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FaIdCard className="text-xs" />
                            ID: {record.employeeId._id}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleExpand(record._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        {isExpanded ? (
                          <>
                            <FaChevronUp />
                            Collapse
                          </>
                        ) : (
                          <>
                            <FaChevronDown />
                            Expand
                          </>
                        )}
                      </button>
                      {isDepartmentHead && (
                        <button
                          onClick={() => handleEdit(record)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-xl hover:from-yellow-700 hover:to-yellow-800 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          <FaEdit />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                          <FaClock className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Work</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {Math.round(record.totalWorkMinutes)}m
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{totalHours} hours</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${
                      record.hasMissedPunch
                        ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800/30'
                        : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          record.hasMissedPunch
                            ? 'bg-red-100 dark:bg-red-800/30'
                            : 'bg-green-100 dark:bg-green-800/30'
                        }`}>
                          {record.hasMissedPunch ? (
                            <FaExclamationTriangle className="text-red-600 dark:text-red-400" />
                          ) : (
                            <FaCheckCircle className="text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Missed Punches</p>
                          <p className={`text-lg font-bold ${
                            record.hasMissedPunch
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-green-700 dark:text-green-300'
                          }`}>
                            {record.hasMissedPunch ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${
                      record.finalisedForPayroll
                        ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30'
                        : 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          record.finalisedForPayroll
                            ? 'bg-green-100 dark:bg-green-800/30'
                            : 'bg-yellow-100 dark:bg-yellow-800/30'
                        }`}>
                          {record.finalisedForPayroll ? (
                            <FaCheckCircle className="text-green-600 dark:text-green-400" />
                          ) : (
                            <FaClock className="text-yellow-600 dark:text-yellow-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Payroll Status</p>
                          <p className={`text-lg font-bold ${
                            record.finalisedForPayroll
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {record.finalisedForPayroll ? "Finalized" : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800/30 rounded-lg">
                          <FaCalendarAlt className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Punches</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {record.punches.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Punches Section */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FaClock />
                        Punch History
                      </h3>
                      
                      {record.punches.length === 0 ? (
                        <div className="text-center py-8 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-dashed border-gray-300/50 dark:border-gray-700/50">
                          <p className="text-gray-500 dark:text-gray-400">No punches recorded</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {record.punches.map((punch, idx) => (
                            <div
                              key={idx}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                                punch.type === "IN"
                                  ? "bg-gradient-to-r from-green-50/50 to-green-100/30 dark:from-green-900/10 dark:to-green-800/10 border-l-4 border-green-500"
                                  : "bg-gradient-to-r from-red-50/50 to-red-100/30 dark:from-red-900/10 dark:to-red-800/10 border-l-4 border-red-500"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${
                                  punch.type === "IN"
                                    ? "bg-green-100 dark:bg-green-800/30"
                                    : "bg-red-100 dark:bg-red-800/30"
                                }`}>
                                  <span className={`font-bold ${
                                    punch.type === "IN"
                                      ? "text-green-700 dark:text-green-400"
                                      : "text-red-700 dark:text-red-400"
                                  }`}>
                                    {punch.type === "IN" ? "IN" : "OUT"}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-lg text-gray-900 dark:text-white">
                                    {formatTime(punch.time)}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatDate(punch.time)}
                                  </p>
                                </div>
                              </div>
                              <div className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-sm font-medium ${
                                punch.type === "IN"
                                  ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300"
                              }`}>
                                {punch.type === "IN" ? "Clock In" : "Clock Out"}
                              </div>
                            </div>
                          ))}
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

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onClose={() => {
            setShowEditModal(false);
            setEditingRecord(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

// Edit Record Modal Component
function EditRecordModal({
  record,
  onClose,
  onSave,
}: {
  record: AttendanceRecord;
  onClose: () => void;
  onSave: (data: Partial<AttendanceRecord>) => void;
}) {
  const [totalWorkMinutes, setTotalWorkMinutes] = useState(record.totalWorkMinutes);
  const [hasMissedPunch, setHasMissedPunch] = useState(record.hasMissedPunch);
  const [finalisedForPayroll, setFinalisedForPayroll] = useState(record.finalisedForPayroll || false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSave({
        totalWorkMinutes,
        hasMissedPunch,
        finalisedForPayroll,
      });
    } catch (err) {
      console.error("Error in modal:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-white to-white/90 dark:from-gray-800 dark:to-gray-800/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg">
              <FaEdit className="text-white text-lg" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Attendance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-300"
          >
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Employee Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/50 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
              <FaUser className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {record.employeeId.firstName} {record.employeeId.lastName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {record.employeeId.workEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Total Work Minutes */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <FaClock className="text-blue-500" />
              Total Work Minutes
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 to-gray-900/10 dark:from-gray-800/20 dark:to-gray-900/20 rounded-xl blur-sm group-hover:blur"></div>
              <input
                type="number"
                min="0"
                required
                className="relative w-full p-3 rounded-xl bg-white/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={totalWorkMinutes}
                onChange={(e) => setTotalWorkMinutes(Number(e.target.value))}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Equals {Math.floor(totalWorkMinutes / 60)}h {totalWorkMinutes % 60}m
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
              hasMissedPunch
                ? 'bg-gradient-to-r from-red-50/50 to-red-100/30 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800/30'
                : 'bg-gradient-to-r from-gray-50/50 to-gray-100/30 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700/30'
            }`}>
              <input
                type="checkbox"
                id="missedPunch"
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={hasMissedPunch}
                onChange={(e) => setHasMissedPunch(e.target.checked)}
              />
              <label htmlFor="missedPunch" className="flex-1 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                <FaExclamationTriangle className={hasMissedPunch ? "text-red-500" : "text-gray-400"} />
                Has Missed Punch
              </label>
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
              finalisedForPayroll
                ? 'bg-gradient-to-r from-green-50/50 to-green-100/30 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30'
                : 'bg-gradient-to-r from-gray-50/50 to-gray-100/30 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700/30'
            }`}>
              <input
                type="checkbox"
                id="finalized"
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={finalisedForPayroll}
                onChange={(e) => setFinalisedForPayroll(e.target.checked)}
              />
              <label htmlFor="finalized" className="flex-1 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                <FaCheckCircle className={finalisedForPayroll ? "text-green-500" : "text-gray-400"} />
                Finalized for Payroll
              </label>
            </div>
          </div>

          {/* Note */}
          <div className="p-4 bg-gradient-to-r from-blue-50/50 to-blue-100/30 dark:from-blue-900/10 dark:to-blue-800/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> All changes are audit-tracked with timestamp. 
              Manual corrections should include proper justification.
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
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <FaTimes className="inline mr-2" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

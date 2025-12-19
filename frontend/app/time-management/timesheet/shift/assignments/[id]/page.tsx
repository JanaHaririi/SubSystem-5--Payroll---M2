"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaClock, 
  FaBuilding, 
  FaUser, 
  FaBriefcase, 
  FaEdit, 
  FaTrash, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaCalendarPlus,
  FaIdCard,
  FaEnvelope,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaBusinessTime
} from "react-icons/fa";

/* ================= TYPES ================= */

interface ShiftType {
  _id: string;
  name: string;
}

interface Shift {
  _id: string;
  name: string;
  shiftType: ShiftType | string;
  startTime: string;
  endTime: string;
  punchPolicy: string;
  graceInMinutes: number;
  graceOutMinutes: number;
  requiresApprovalForOvertime: boolean;
  active: boolean;
}

interface Department {
  _id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface Position {
  _id: string;
  title: string;
  code?: string;
}

interface EmployeeProfile {
  _id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail?: string;
  status: string;
  primaryDepartmentId?: Department;
  primaryPositionId?: Position;
}

interface ShiftAssignment {
  _id: string;
  employeeId?: EmployeeProfile | string;
  departmentId?: Department | string;
  positionId?: Position | string;
  shiftId: Shift | string;
  startDate: string;
  endDate?: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "UPCOMING";
  createdAt: string;
  updatedAt: string;
}

/* ================= PAGE ================= */

export default function ShiftAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<ShiftAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  /* ================= FETCH ASSIGNMENT ================= */

  useEffect(() => {
    async function fetchAssignment() {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          `http://localhost:4000/time-management/assign-shift/${assignmentId}`,
          { withCredentials: true }
        );
        setAssignment(res.data.data);
      } catch (err: any) {
        console.error("Failed to fetch shift assignment:", err);
        setError(err.response?.data?.message || "Failed to load shift assignment");
        setAssignment(null);
      } finally {
        setLoading(false);
      }
    }

    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  /* ================= ACTIONS ================= */

  async function updateStatus(newStatus: "ACTIVE" | "INACTIVE") {
    try {
      setIsUpdating(true);
      await axios.put(
        `http://localhost:4000/time-management/assign-shift/${assignmentId}`,
        { status: newStatus },
        { withCredentials: true }
      );
      // Refresh the assignment data
      const res = await axios.get(
        `http://localhost:4000/time-management/assign-shift/${assignmentId}`,
        { withCredentials: true }
      );
      setAssignment(res.data.data);
      alert(`Status updated to ${newStatus}`);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleExtendAssignment() {
    const newEndDate = prompt("Enter new end date (YYYY-MM-DD):");
    if (!newEndDate) return;

    try {
      setIsUpdating(true);
      await axios.put(
        `http://localhost:4000/time-management/assign-shift/extend/${assignmentId}`,
        { endDate: newEndDate },
        { withCredentials: true }
      );
      // Refresh the assignment data
      const res = await axios.get(
        `http://localhost:4000/time-management/assign-shift/${assignmentId}`,
        { withCredentials: true }
      );
      setAssignment(res.data.data);
      alert("Assignment extended successfully");
    } catch (err: any) {
      console.error("Failed to extend assignment:", err);
      alert(err.response?.data?.message || "Failed to extend assignment");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeleteAssignment() {
    if (!confirm("Are you sure you want to delete this shift assignment? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      await axios.delete(
        `http://localhost:4000/time-management/${assignmentId}`,
        { withCredentials: true }
      );
      alert("Shift assignment deleted successfully");
      router.push("/time-management/timesheet/shift/assignments");
    } catch (err: any) {
      console.error("Failed to delete assignment:", err);
      alert(err.response?.data?.message || "Failed to delete assignment");
      setIsDeleting(false);
    }
  }

  /* ================= UTILITY FUNCTIONS ================= */

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "No End Date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const suffix = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${suffix}`;
    } catch {
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "INACTIVE": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "EXPIRED": return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
      case "UPCOMING": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getAssignmentType = (assignment: ShiftAssignment) => {
    if (assignment.employeeId) return "EMPLOYEE";
    if (assignment.departmentId) return "DEPARTMENT";
    if (assignment.positionId) return "POSITION";
    return "UNKNOWN";
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
            Loading shift assignment details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/time-management/timesheet/shift/assignments"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6"
          >
            <FaArrowLeft />
            Back to Assignments
          </Link>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-200 dark:border-red-800 p-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/20 rounded-3xl mb-6">
              <FaExclamationTriangle className="text-4xl text-red-500 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Shift Assignment Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "The requested shift assignment could not be found."}
            </p>
            <Link href="/time-management/timesheet/shift/assignments">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                <FaArrowLeft />
                View All Assignments
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/time-management/timesheet/shift/assignments"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Back to All Assignments
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
                  <FaBusinessTime className="text-2xl text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Shift Assignment Details
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    Assignment ID: {assignment._id.substring(0, 8)}...
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                  {assignment.status}
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                  {getAssignmentType(assignment)}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Assignment Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Timeline Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-500" />
                    Assignment Timeline
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Start Date</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(assignment.startDate)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">End Date</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(assignment.endDate)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Created</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(assignment.createdAt)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(assignment.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                

                {/* Actions Card */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
                  

                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300"></h3>
                      <button
                        onClick={handleExtendAssignment}
                        disabled={isUpdating}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <FaCalendarPlus /> Extend End Date
                      </button>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Link href={`/time-management/timesheet/shift/assignments/${assignmentId}`}>
                        <button className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors mb-2 flex items-center justify-center gap-2">
                          <FaEdit /> Edit Assignment
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
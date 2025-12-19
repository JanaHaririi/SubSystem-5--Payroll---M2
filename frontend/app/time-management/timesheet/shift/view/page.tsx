"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import toast from "react-hot-toast";
import { FaArrowLeft, FaClock, FaToggleOn, FaToggleOff, FaTrash, FaEdit, FaPlus, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaBusinessTime, FaRegClock, FaHourglassHalf } from "react-icons/fa";

/* ================= TYPES ================= */

type Shift = {
  _id: string;
  name: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  punchPolicy: string;
  graceInMinutes: number;
  graceOutMinutes: number;
  requiresApprovalForOvertime: boolean;
  active: boolean;
};

/* ================= PAGE ================= */

export default function Shifts() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const rolesLower = user?.roles?.map(r => r.toLowerCase()) || [];
  const isAdmin = rolesLower.some(role =>
    ["hr admin", "system admin"].includes(role)
  );

  /* ================= FETCH SHIFTS ================= */

  async function fetchShifts() {
    try {
      const res = await axios.get(
        "http://localhost:4000/time-management/shift",
        { withCredentials: true }
      );
      setShifts(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch shifts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) fetchShifts();
  }, [isAdmin]);

  /* ================= ACTIONS ================= */

  async function toggleShift(shift: Shift) {
    try {
      const url = shift.active
        ? `http://localhost:4000/time-management/shift/deactivate/${shift._id}`
        : `http://localhost:4000/time-management/shift/activate/${shift._id}`;

      await axios.put(url, {}, { withCredentials: true });

      toast.success(
        shift.active ? "Shift deactivated" : "Shift activated"
      );

      setShifts(prev =>
        prev.map(s =>
          s._id === shift._id ? { ...s, active: !s.active } : s
        )
      );
    } catch {
      toast.error("Action failed");
    }
  }

  async function deleteShift(id: string) {
    if (!confirm("Are you sure you want to delete this shift?")) return;

    try {
      await axios.delete(
        `http://localhost:4000/time-management/shift/${id}`,
        { withCredentials: true }
      );

      toast.success("Shift deleted");

      setShifts(prev => prev.filter(s => s._id !== id));
    } catch {
      toast.error("Failed to delete shift");
    }
  }

  /* ================= ACCESS CONTROL ================= */

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 rounded-3xl mb-6 shadow-lg">
            <FaTimesCircle className="text-4xl text-rose-500 dark:text-rose-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            You do not have permission to access the shift management system.
          </p>
          <Link href="/time-management">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <FaArrowLeft />
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-800 p-6 md:p-8 shadow-2xl mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <FaBusinessTime className="text-3xl text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                      Shift Management
                    </h1>
                    <p className="text-white/80 text-sm md:text-base">
                      View and manage all work shifts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link 
                    href="/time-management" 
                    className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                  >
                    <FaArrowLeft className="text-sm" />
                    Back to Dashboard
                  </Link>
                  <Link href="/time-management/timesheet/shift/create">
                    <button className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl active:scale-[0.98]">
                      <FaPlus />
                      Create Shift
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Stats Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    All Shifts
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {shifts.length} shift{shifts.length !== 1 ? 's' : ''} configured
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Active: {shifts.filter(s => s.active).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Inactive: {shifts.filter(s => !s.active).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shifts Grid */}
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-2xl mb-4 animate-pulse">
                    <FaClock className="text-2xl text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Loading shifts...
                  </p>
                </div>
              ) : shifts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FaClock className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No shifts found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Get started by creating your first work shift configuration.
                  </p>
                  <Link href="/time-management/timesheet/shift/create">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <FaPlus />
                      Create Your First Shift
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shifts.map(shift => (
                    <ShiftCard
                      key={shift._id}
                      shift={shift}
                      onToggle={() => toggleShift(shift)}
                      onDelete={() => deleteShift(shift._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function ShiftCard({
  shift,
  onToggle,
  onDelete,
}: {
  shift: Shift;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${suffix}`;
  };

  return (
    <div className="group bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-300 hover:-translate-y-1">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
              <FaClock className="text-blue-600 dark:text-blue-400 text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {shift.name}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium mt-1 ${shift.active 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
              } flex items-center gap-1.5`}>
                {shift.active ? <FaCheckCircle className="text-xs" /> : <FaTimesCircle className="text-xs" />}
                {shift.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shift Details */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaRegClock className="text-gray-400 dark:text-gray-500 text-sm" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Shift Hours</span>
            </div>
            <span className="text-sm text-gray-900 dark:text-white font-medium">
              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400 dark:text-gray-500 text-sm" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Punch Policy</span>
            </div>
            <span className="text-sm text-gray-900 dark:text-white font-medium">
              {shift.punchPolicy}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <FaHourglassHalf className="text-gray-400 dark:text-gray-500 text-sm" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Grace In</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {shift.graceInMinutes} min
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaHourglassHalf className="text-gray-400 dark:text-gray-500 text-sm" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Grace Out</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {shift.graceOutMinutes} min
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overtime Approval</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${shift.requiresApprovalForOvertime 
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
            }`}>
              {shift.requiresApprovalForOvertime ? 'Required' : 'Not Required'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onToggle}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
            shift.active
              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
          }`}
        >
          {shift.active ? <FaToggleOff /> : <FaToggleOn />}
          {shift.active ? "Deactivate" : "Activate"}
        </button>

        <Link href={`/time-management/timesheet/shift/${shift._id}/edit`} className="flex-1">
          <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2">
            <FaEdit />
            Edit
          </button>
        </Link>

        <button
          onClick={onDelete}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-lg font-medium transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <FaTrash />
          Delete
        </button>
      </div>
    </div>
  );
}
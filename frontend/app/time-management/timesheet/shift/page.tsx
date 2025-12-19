"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/(system)/context/authContext";
import Link from "next/link";
import axios from "axios";
import { FaArrowLeft, FaClock, FaUsers, FaEye, FaPlus, FaFileAlt, FaBusinessTime, FaCalendarCheck, FaUserCheck, FaListAlt, FaTag, FaChevronRight, FaCalendarAlt, FaCheckCircle } from "react-icons/fa";
import { isHRAdmin } from "@/app/utils/roleCheck";

/* ================= TYPES ================= */

type Shift = {
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

type ShiftAssignment = {
  startDate: string;
  endDate?: string;
  department?: string;
  position?: string;
  assignedBy?: string;
};

type ShiftType = {
  _id: string;
  name: string;
};

/* ================= HELPERS ================= */

function formatDate(date?: string) {
  if (!date) return "N/A";
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")} ${String(
    d.getMonth() + 1
  ).padStart(2, "0")} ${d.getFullYear()}`;
}

/* ================= PAGE ================= */

export default function ShiftPage() {
  const { user } = useAuth();

  if (!user) {
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
            Loading user session...
          </p>
        </div>
      </div>
    );
  }

  const rolesLower = user.roles?.map(r => r.toLowerCase()) || [];
  const isAdmin = rolesLower.some(role =>
    ["hr admin", "system admin"].includes(role)
  );
    const isAdminOrDepartmentHead = rolesLower.some(role =>
    ["department head", "system admin"].includes(role)
  );

  /* =====================================================
     ADMIN VIEW — DASHBOARD ONLY
     ===================================================== */
  if (isAdmin) {
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
                        Configure and manage work shifts for your organization
                      </p>
                    </div>
                  </div>

                  <Link 
                    href="/time-management" 
                    className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                  >
                    <FaArrowLeft className="text-sm" />
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Shift Management Dashboard
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Choose an action to manage shifts and shift assignments
                    </p>
                  </div>
                </div>
              </div>

              {/* DASHBOARD GRID */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Link href="/time-management/timesheet/shift/create-shift">
                    <DashboardCard
                      title="Create Shift"
                      description="Define working hours, punch policy, and grace periods"
                      icon={<FaPlus className="text-blue-500" />}
                      color="from-blue-500 to-blue-600"
                    />
                  </Link>

                  <Link href="/time-management/timesheet/shift/assign-shift">
                    <DashboardCard
                      title="Assign Shift"
                      description="Assign shifts to employees, departments, or positions"
                      icon={<FaUsers className="text-emerald-500" />}
                      color="from-emerald-500 to-emerald-600"
                    />
                  </Link>

                  <Link href="/time-management/timesheet/shift/view">
                    <DashboardCard
                      title="View Shifts"
                      description="View, update and delete existing shifts."
                      icon={<FaEye className="text-amber-500" />}
                      color="from-amber-500 to-amber-600"
                    />
                  </Link>
                  
                  {isAdminOrDepartmentHead && (
                    <Link href="/time-management/timesheet/shift/shift-types/create">
                      <DashboardCard
                        title="Create Shift Type"
                        description="Create new shift type."
                        icon={<FaTag className="text-purple-500" />}
                        color="from-purple-500 to-purple-600"
                      />
                    </Link>
                  )}
                  
                  <Link href="/time-management/timesheet/shift/shift-types/view">
                    <DashboardCard
                      title="View Shift Types"
                      description="View and delete existing shift types."
                      icon={<FaListAlt className="text-violet-500" />}
                      color="from-violet-500 to-violet-600"
                    />
                  </Link>

                  {isAdmin && <Link href="/time-management/timesheet/shift/assignments">
                    <DashboardCard
                      title="View Assignments"
                      description="View all shift assignments and their status."
                      icon={<FaCalendarCheck className="text-rose-500" />}
                      color="from-rose-500 to-rose-600"
                    />
                  </Link>}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     EMPLOYEE VIEW — CURRENT SHIFT ONLY
     ===================================================== */

  const [shift, setShift] = useState<
    (Shift & { assignment: ShiftAssignment; shiftTypeName?: string }) | null
  >(null);

  const [shiftTypeMap, setShiftTypeMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  /* Fetch Shift Types */
  useEffect(() => {
    async function fetchShiftTypes() {
      const res = await axios.get(
        "http://localhost:4000/time-management/shift-type",
        { withCredentials: true }
      );

      const map: Record<string, string> = {};
      res.data.data.forEach((st: ShiftType) => {
        map[st._id] = st.name;
      });

      setShiftTypeMap(map);
    }

    fetchShiftTypes();
  }, []);

  /* Fetch Current Shift */
  useEffect(() => {
    async function fetchCurrentShift() {
      try {
        const res = await axios.get(
          `http://localhost:4000/time-management/shift-assignment/employee/${user?.userid}`,
          { withCredentials: true }
        );

        const data = res.data.data;
        if (!data?.assignment) {
          setShift(null);
          return;
        }

        const now = new Date();
        const start = new Date(data.assignment.startDate);
        const end = data.assignment.endDate
          ? new Date(data.assignment.endDate)
          : null;

        if (start <= now && (!end || end >= now)) {
          setShift({
            ...data,
            shiftTypeName: shiftTypeMap[data.shiftType],
          });
        } else {
          setShift(null);
        }
      } catch {
        setShift(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentShift();
  }, [shiftTypeMap]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/time-management"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Dashboard
            </Link>
          </div>

          {/* Current Shift Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
                  <FaClock className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Current Shift
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    View your currently assigned work shift
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-2xl mb-4 animate-pulse">
                    <FaClock className="text-2xl text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Loading shift information...
                  </p>
                </div>
              ) : shift ? (
                <div className="space-y-6">
                  {/* Shift Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-lg">
                        <FaBusinessTime className="text-emerald-600 dark:text-emerald-400 text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {shift.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {shift.shiftTypeName || "Shift Type"}
                        </p>
                      </div>
                    </div>
                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-2">
                      <FaCheckCircle className="text-sm" />
                      Active
                    </span>
                  </div>

                  {/* Shift Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <Section title="Shift Details">
                        <Info label="Shift Type" value={shift.shiftTypeName} />
                        <Info label="Working Hours" value={`${formatTime(shift.startTime)} → ${formatTime(shift.endTime)}`} />
                        <Info label="Punch Policy" value={shift.punchPolicy} />
                      </Section>
                      
                      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <FaClock className="text-gray-500 dark:text-gray-400" />
                          Grace Periods
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Grace In</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {shift.graceInMinutes} min
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Grace Out</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {shift.graceOutMinutes} min
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Section title="Assignment Details">
                        <Info label="Start Date" value={formatDate(shift.assignment.startDate)} />
                        <Info label="End Date" value={formatDate(shift.assignment.endDate)} />
                        {shift.assignment.department && (
                          <Info label="Department" value={shift.assignment.department} />
                        )}
                        {shift.assignment.position && (
                          <Info label="Position" value={shift.assignment.position} />
                        )}
                      </Section>

                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <FaUserCheck className="text-blue-500 dark:text-blue-400" />
                          Overtime Policy
                        </h4>
                        <div className={`px-4 py-2 rounded-lg text-center font-medium ${
                          shift.requiresApprovalForOvertime
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }`}>
                          {shift.requiresApprovalForOvertime
                            ? "✅ Overtime Approval Required"
                            : "⏱️ Overtime Approval Not Required"}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {shift.requiresApprovalForOvertime
                            ? "You must obtain approval for any overtime work"
                            : "You can work overtime without additional approval"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FaClock className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No Active Shift
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    You don't have an active shift assignment at the moment. Please check with your manager for shift scheduling.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function DashboardCard({
  title,
  description,
  icon,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="group bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${color} rounded-xl shadow-sm`}>
          <div className="text-2xl text-white">
            {icon}
          </div>
        </div>
        <FaChevronRight className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300 transform group-hover:translate-x-1" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        {title}
      </h4>
      <div className="space-y-3 text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="font-medium text-gray-700 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-white font-medium">
        {value || "N/A"}
      </span>
    </div>
  );
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${suffix}`;
}
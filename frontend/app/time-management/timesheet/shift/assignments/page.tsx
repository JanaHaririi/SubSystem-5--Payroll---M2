"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaUsers, 
  FaEye, 
  FaFilter, 
  FaSearch, 
  FaClock, 
  FaBuilding, 
  FaUserTag, 
  FaCalendarCheck, 
  FaEdit, 
  FaTrash, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaChevronDown, 
  FaChevronUp,
  FaCalendarTimes,
  FaUser,
  FaExclamationTriangle,
  FaCalendarPlus,
  FaIdCard,
  FaBriefcase,
  FaEnvelope
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
  employeeId?: EmployeeProfile | string; // Could be populated object or string/ID
  departmentId?: Department | string;
  positionId?: Position | string;
  shiftId: Shift | string;
  startDate: string;
  endDate?: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "UPCOMING";
  createdAt: string;
  updatedAt: string;
}

interface ExpiringAssignment {
  shiftAssignment: ShiftAssignment;
  daysUntilExpiry: number;
}

/* ================= UTILITY FUNCTIONS ================= */

const isValidObjectId = (id: any): boolean => {
  if (!id) return false;
  const str = typeof id === 'object' ? id.toString() : String(id);
  return /^[0-9a-fA-F]{24}$/.test(str);
};

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

const getEmployeeInfo = (assignment: ShiftAssignment) => {
  if (!assignment.employeeId) return null;
  
  if (typeof assignment.employeeId === 'string') {
    return {
      _id: assignment.employeeId,
      firstName: "Unknown",
      lastName: "Employee",
      employeeNumber: "N/A",
      workEmail: "Invalid ID format",
      status: "UNKNOWN"
    };
  }
  
  return assignment.employeeId;
};

const getDepartmentInfo = (assignment: ShiftAssignment) => {
  if (!assignment.departmentId) return null;
  
  if (typeof assignment.departmentId === 'string') {
    return {
      _id: assignment.departmentId,
      name: "Unknown Department",
      code: "N/A",
      isActive: false
    };
  }
  
  return assignment.departmentId;
};

const getPositionInfo = (assignment: ShiftAssignment) => {
  if (!assignment.positionId) return null;
  
  if (typeof assignment.positionId === 'string') {
    return {
      _id: assignment.positionId,
      title: "Unknown Position",
      code: "N/A"
    };
  }
  
  return assignment.positionId;
};

const getShiftInfo = (assignment: ShiftAssignment) => {
  if (typeof assignment.shiftId === 'string') {
    return {
      _id: assignment.shiftId,
      name: "Unknown Shift",
      startTime: "00:00",
      endTime: "00:00",
      active: false,
      punchPolicy: "UNKNOWN",
      graceInMinutes: 0,
      graceOutMinutes: 0,
      requiresApprovalForOvertime: false
    };
  }
  
  return assignment.shiftId;
};

/* ================= PAGE ================= */

export default function ShiftAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [expiringAssignments, setExpiringAssignments] = useState<ExpiringAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExpiring, setLoadingExpiring] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [showExpiring, setShowExpiring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rolesLower = user?.roles?.map(r => r.toLowerCase()) || [];
  const isAdmin = rolesLower.some(role =>
    ["hr admin", "system admin"].includes(role)
  );

  /* ================= FETCH DATA ================= */

  async function fetchAllAssignments() {
    try {
      setError(null);
      const res = await axios.get(
        "http://localhost:4000/time-management/assign-shift",
        { withCredentials: true }
      );
      setAssignments(res.data.data || []);
    } catch (err: any) {
      console.error("Failed to fetch shift assignments:", err);
      setError(err.response?.data?.message || "Failed to load shift assignments");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchExpiringAssignments() {
    try {
      const res = await axios.get(
        "http://localhost:4000/time-management/assign-shift/expiring",
        { withCredentials: true }
      );
      setExpiringAssignments(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch expiring assignments:", err);
      setExpiringAssignments([]);
    } finally {
      setLoadingExpiring(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchAllAssignments();
      fetchExpiringAssignments();
    }
  }, [isAdmin]);

  /* ================= FILTERING ================= */

  const filteredAssignments = assignments.filter(assignment => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const employee = getEmployeeInfo(assignment);
    const department = getDepartmentInfo(assignment);
    const position = getPositionInfo(assignment);
    const shift = getShiftInfo(assignment);
    
    const matchesSearch = 
      employee?.firstName?.toLowerCase().includes(searchLower) ||
      employee?.lastName?.toLowerCase().includes(searchLower) ||
      employee?.workEmail?.toLowerCase().includes(searchLower) ||
      employee?.employeeNumber?.toLowerCase().includes(searchLower) ||
      department?.name?.toLowerCase().includes(searchLower) ||
      department?.code?.toLowerCase().includes(searchLower) ||
      position?.title?.toLowerCase().includes(searchLower) ||
      position?.code?.toLowerCase().includes(searchLower) ||
      shift?.name?.toLowerCase().includes(searchLower) ||
      false;

    // Status filter
    const matchesStatus = 
      statusFilter === "ALL" ||
      assignment.status === statusFilter;

    // Type filter
    const assignmentType = assignment.employeeId ? "EMPLOYEE" : 
                          assignment.departmentId ? "DEPARTMENT" : 
                          assignment.positionId ? "POSITION" : "UNKNOWN";
    
    const matchesType = 
      typeFilter === "ALL" ||
      assignmentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  /* ================= STATS ================= */

  const totalAssignments = assignments.length;
  const activeAssignments = assignments.filter(a => a.status === "ACTIVE").length;
  const expiringCount = expiringAssignments.length;
  const employeeAssignments = assignments.filter(a => a.employeeId).length;
  const departmentAssignments = assignments.filter(a => a.departmentId).length;
  const positionAssignments = assignments.filter(a => a.positionId).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "INACTIVE": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "EXPIRED": return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
      case "UPCOMING": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTypeIcon = (assignment: ShiftAssignment) => {
    if (assignment.employeeId) return <FaUser className="text-blue-500" />;
    if (assignment.departmentId) return <FaBuilding className="text-purple-500" />;
    if (assignment.positionId) return <FaBriefcase className="text-amber-500" />;
    return <FaUsers className="text-gray-500" />;
  };

  const getTypeLabel = (assignment: ShiftAssignment) => {
    if (assignment.employeeId) return "Employee";
    if (assignment.departmentId) return "Department";
    if (assignment.positionId) return "Position";
    return "Unknown";
  };

  /* ================= ACCESS CONTROL ================= */

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <AccessDeniedCard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <HeaderSection />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-red-500 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">Error Loading Data</h3>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
              <button
                onClick={fetchAllAssignments}
                className="ml-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard 
            title="Total" 
            value={totalAssignments} 
            color="text-gray-900 dark:text-white" 
          />
          <StatCard 
            title="Active" 
            value={activeAssignments} 
            color="text-emerald-600" 
          />
          <StatCard 
            title="Expiring Soon" 
            value={expiringCount} 
            color="text-amber-600" 
          />
          <StatCard 
            title="Employees" 
            value={employeeAssignments} 
            color="text-blue-600" 
          />
          <StatCard 
            title="Departments" 
            value={departmentAssignments} 
            color="text-purple-600" 
          />
          <StatCard 
            title="Positions" 
            value={positionAssignments} 
            color="text-amber-600" 
          />
        </div>

        {/* Expiring Assignments Warning */}
        <ExpiringAssignmentsSection 
          expiringAssignments={expiringAssignments}
          showExpiring={showExpiring}
          setShowExpiring={setShowExpiring}
          loadingExpiring={loadingExpiring}
        />

        {/* Main Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="text-gray-700 dark:text-gray-300 font-medium min-w-[100px]">
                  Search:
                </label>
                <div className="relative flex-1 max-w-md">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, department, or shift..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <FilterSelect 
                  icon={<FaFilter />}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: "ALL", label: "All Statuses" },
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                    { value: "EXPIRED", label: "Expired" },
                    { value: "UPCOMING", label: "Upcoming" }
                  ]}
                />

                <FilterSelect 
                  icon={<FaUsers />}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={[
                    { value: "ALL", label: "All Types" },
                    { value: "EMPLOYEE", label: "Employee" },
                    { value: "DEPARTMENT", label: "Department" },
                    { value: "POSITION", label: "Position" }
                  ]}
                />
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredAssignments.length}</span> of <span className="font-semibold text-gray-700 dark:text-gray-300">{totalAssignments}</span> assignments
            </div>
          </div>

          {/* Assignments List */}
          <div className="p-6">
            {loading ? (
              <LoadingState />
            ) : filteredAssignments.length === 0 ? (
              <EmptyState 
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
              />
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment._id}
                    assignment={assignment}
                    isExpanded={expandedAssignment === assignment._id}
                    onToggle={() => setExpandedAssignment(
                      expandedAssignment === assignment._id ? null : assignment._id
                    )}
                    getStatusColor={getStatusColor}
                    getTypeIcon={getTypeIcon}
                    getTypeLabel={getTypeLabel}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENT SUB-COMPONENTS ================= */

function AccessDeniedCard() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 rounded-3xl mb-6 shadow-lg">
        <FaTimesCircle className="text-4xl text-rose-500 dark:text-rose-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
        Access Restricted
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
        You do not have permission to access shift assignment management.
      </p>
      <Link href="/time-management">
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          <FaArrowLeft />
          Return to Dashboard
        </button>
      </Link>
    </div>
  );
}

function HeaderSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-800 p-6 md:p-8 shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <FaCalendarCheck className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Shift Assignments
              </h1>
              <p className="text-white/80 text-sm md:text-base">
                Manage work shift assignments across the organization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/time-management/timesheet/shift" 
              className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm"
            >
              <FaArrowLeft className="text-sm" />
              Back to Shifts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function ExpiringAssignmentsSection({ 
  expiringAssignments, 
  showExpiring, 
  setShowExpiring,
  loadingExpiring 
}: { 
  expiringAssignments: ExpiringAssignment[]; 
  showExpiring: boolean; 
  setShowExpiring: (show: boolean) => void;
  loadingExpiring: boolean;
}) {
  if (loadingExpiring) return null;
  if (expiringAssignments.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <FaExclamationTriangle className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">
              {expiringAssignments.length} shift assignment{expiringAssignments.length !== 1 ? 's' : ''} expiring soon
            </h3>
          </div>
        </div>
      </div>

      {showExpiring && (
        <div className="mt-4 space-y-2">
          {expiringAssignments.map(({ shiftAssignment, daysUntilExpiry }) => {
            const employee = getEmployeeInfo(shiftAssignment);
            const department = getDepartmentInfo(shiftAssignment);
            const position = getPositionInfo(shiftAssignment);
            const shift = getShiftInfo(shiftAssignment);

            const assignmentName = employee 
              ? `${employee.firstName} ${employee.lastName}`
              : department?.name || position?.title || "Unknown Assignment";

            return (
              <div key={shiftAssignment._id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {assignmentName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {shift.name} • Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link href={`/time-management/timesheet/shift/assignments/${shiftAssignment._id}`}>
                    <button className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm">
                      Extend
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ 
  icon, 
  value, 
  onChange, 
  options 
}: { 
  icon: React.ReactNode; 
  value: string; 
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      <select
        className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-2xl mb-4 animate-pulse">
        <FaCalendarCheck className="text-2xl text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-gray-600 dark:text-gray-400 font-medium">
        Loading shift assignments...
      </p>
    </div>
  );
}

function EmptyState({ searchTerm, statusFilter, typeFilter }: { 
  searchTerm: string; 
  statusFilter: string; 
  typeFilter: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <FaCalendarTimes className="w-12 h-12 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        No shift assignments found
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL" 
          ? "No assignments match your filters. Try adjusting your search criteria."
          : "Get started by creating your first shift assignment."}
      </p>
      <Link href="/time-management/timesheet/shift/assign-shift">
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl">
          <FaCalendarPlus />
          Create Assignment
        </button>
      </Link>
    </div>
  );
}

/* ================= ASSIGNMENT CARD COMPONENT ================= */

function AssignmentCard({
  assignment,
  isExpanded,
  onToggle,
  getStatusColor,
  getTypeIcon,
  getTypeLabel,
}: {
  assignment: ShiftAssignment;
  isExpanded: boolean;
  onToggle: () => void;
  getStatusColor: (status: string) => string;
  getTypeIcon: (assignment: ShiftAssignment) => React.ReactNode;
  getTypeLabel: (assignment: ShiftAssignment) => string;
}) {
  const employee = getEmployeeInfo(assignment);
  const department = getDepartmentInfo(assignment);
  const position = getPositionInfo(assignment);
  const shift = getShiftInfo(assignment);

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Card Header */}
      <div className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                {getTypeIcon(assignment)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {employee 
                      ? `${employee.firstName} ${employee.lastName}`
                      : department?.name || position?.title || "Unknown Assignment"}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                    {getTypeLabel(assignment)}
                  </span>
                  {employee?.employeeNumber && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 flex items-center gap-1">
                      <FaIdCard className="text-xs" />
                      {employee.employeeNumber}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <FaClock className="text-xs" />
                    {}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt className="text-xs" />
                    {formatDate(assignment.startDate)} → {formatDate(assignment.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaBriefcase className="text-xs" />
                    {shift?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2">
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-200 dark:border-gray-700 pt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Assignment Details */}
            <div className="space-y-6">
              {/* Timeline Section */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-500" />
                  Assignment Timeline
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(assignment.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(assignment.endDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(assignment.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(assignment.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Assignment Target Section */}
              {employee && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                  <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <FaUser className="text-blue-500" />
                    Assigned Employee
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700 dark:text-blue-400 font-medium">
                        {employee.firstName} {employee.lastName}
                      </span>
                      {employee.status && (
                        <span className={`px-2 py-1 rounded text-xs ${employee.status === "ACTIVE" 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" 
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"}`}>
                          {employee.status}
                        </span>
                      )}
                    </div>
                    {employee.employeeNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <FaIdCard className="text-blue-500" />
                        <span className="text-blue-600 dark:text-blue-400">ID: {employee.employeeNumber}</span>
                      </div>
                    )}
                    {employee.workEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <FaEnvelope className="text-blue-500" />
                        <span className="text-blue-600 dark:text-blue-400">{employee.workEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {department && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
                  <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                    <FaBuilding className="text-purple-500" />
                    Assigned Department
                  </h5>
                  <div className="space-y-2">
                    <div className="text-purple-700 dark:text-purple-400 font-medium">
                      {department?.name}
                    </div>
                    {department.code && (
                      <div className="text-sm text-purple-600 dark:text-purple-500">
                        Code: {department.code}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-purple-600 dark:text-purple-500">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${department.isActive 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" 
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"}`}>
                        {department.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {position && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
                  <h5 className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                    <FaBriefcase className="text-amber-500" />
                    Assigned Position
                  </h5>
                  <div className="space-y-2">
                    <div className="text-amber-700 dark:text-amber-400 font-medium">
                      {position.title}
                    </div>
                    {position.code && (
                      <div className="text-sm text-amber-600 dark:text-amber-500">
                        Code: {position.code}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Shift Details & Actions */}
            <div className="space-y-6">
              {/* Shift Information */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaClock className="text-emerald-500" />
                  Shift Information
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shift Name:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{shift?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Working Hours:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatTime(shift?.startTime)} - {formatTime(shift?.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Punch Policy:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {shift?.punchPolicy.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Grace In</div>
                      <div className="font-medium text-gray-900 dark:text-white">{shift?.graceInMinutes} min</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Grace Out</div>
                      <div className="font-medium text-gray-900 dark:text-white">{shift?.graceOutMinutes} min</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Shift Status:</span>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${shift?.active 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" 
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"}`}>
                      {shift?.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Overtime Approval:</span>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${shift?.requiresApprovalForOvertime 
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" 
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"}`}>
                      {shift?.requiresApprovalForOvertime ? "Required" : "Not Required"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Actions</h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Link href={`/time-management/timesheet/shift/assignments/${assignment._id}/`} className="w-full">
                      <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        <FaEdit />
                        Edit Assignment
                      </button>
                    </Link>
                    <Link href={`/time-management/timesheet/shift/assignments/${assignment._id}/`} className="w-full">
                      <button className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        <FaCalendarPlus />
                        Extend
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
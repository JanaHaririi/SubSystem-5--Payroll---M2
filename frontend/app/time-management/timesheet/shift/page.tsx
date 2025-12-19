"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/(system)/context/authContext";
import Link from "next/link";
import axios from "axios";

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
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">

            {/* Back */}
            <div className="mb-6">
              <Link
                href="/time-management/timesheet"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                &larr; Back to Timesheet
              </Link>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Shift Management
            </h2>

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              <Link href="/time-management/timesheet/shift/create-shift">
                <DashboardCard
                  title="Create Shift"
                  description="Define working hours, punch policy, and grace periods"
                  icon="➕"
                />
              </Link>

              <Link href="/time-management/timesheet/shift/assign-shift">
                <DashboardCard
                  title="Assign Shift"
                  description="Assign shifts to employees, departments, or positions"
                  icon="👥"
                />
              </Link>

              <Link href="/time-management/timesheet/shift/view">
                <DashboardCard
                  title="View Shifts"
                  description="View, update and delete existing shifts."
                  icon="📋"
                />
              </Link>
                {isAdminOrDepartmentHead &&                 
                <Link href="/time-management/timesheet/shift/shift-types/create">
                <DashboardCard
                  title="Create Shift Type"
                  description="Create new shift type."
                  icon="📝"
                />
              </Link>}
                <Link href="/time-management/timesheet/shift/shift-types/view">
                <DashboardCard
                  title="View Shift Types"
                  description="View and delete existing shift types."
                  icon="📝"
                />
              </Link>

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          <Link
            href="/time-management/timesheet"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            &larr; Back to Timesheet
          </Link>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-4 mb-6">
            Current Shift
          </h2>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : shift ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
              <div className="flex justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {shift.name}
                </h3>
                <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  Active
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Section title="Shift Details">
                  <Info label="Shift Type" value={shift.shiftTypeName} />
                  <Info label="Working Time" value={`${shift.startTime} → ${shift.endTime}`} />
                  <Info label="Punch Policy" value={shift.punchPolicy} />
                  <Info label="Grace In" value={`${shift.graceInMinutes} minutes`} />
                  <Info label="Grace Out" value={`${shift.graceOutMinutes} minutes`} />
                </Section>

                <Section title="Assignment Details">
                  <Info label="Start Date" value={formatDate(shift.assignment.startDate)} />
                  <Info label="End Date" value={formatDate(shift.assignment.endDate)} />
                </Section>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <p className="text-gray-500">No active shift right now.</p>
            </div>
          )}
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
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h4>
      <div className="space-y-2 text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <p>
      <span className="font-medium">{label}:</span>{" "}
      <span className="text-gray-600 dark:text-gray-400">
        {value || "N/A"}
      </span>
    </p>
  );
}

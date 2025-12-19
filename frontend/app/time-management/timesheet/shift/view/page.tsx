"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import toast from "react-hot-toast";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">
          You do not have access to this page.
        </p>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Back */}
          <div className="mb-6 flex justify-between items-center">
            <Link
              href="/time-management/timesheet/shift"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              &larr; Back to Shift Management
            </Link>

            <Link
              href="/time-management/timesheet/shift/create"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              + Create Shift
            </Link>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            All Shifts
          </h2>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : shifts.length === 0 ? (
            <p className="text-gray-500">No shifts found.</p>
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
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {shift.name}
        </h3>

        <span
          className={`px-3 py-1 text-xs rounded-full ${
            shift.active
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          }`}
        >
          {shift.active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
        <p><strong>Time:</strong> {shift.startTime} → {shift.endTime}</p>
        <p><strong>Punch Policy:</strong> {shift.punchPolicy}</p>
        <p><strong>Grace In:</strong> {shift.graceInMinutes} min</p>
        <p><strong>Grace Out:</strong> {shift.graceOutMinutes} min</p>
        <p>
          <strong>Overtime Approval:</strong>{" "}
          {shift.requiresApprovalForOvertime ? "Required" : "No"}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onToggle}
          className={`flex-1 px-3 py-2 text-sm rounded transition ${
            shift.active
              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {shift.active ? "Deactivate" : "Activate"}
        </button>

        <button
          onClick={onDelete}
          className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

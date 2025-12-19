"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/app/(system)/context/authContext";

/* ================= TYPES ================= */

type ShiftType = {
  _id: string;
  name: string;
  active: boolean;
};

/* ================= PAGE ================= */

export default function ShiftTypesPage() {
  const { user } = useAuth();

  const rolesLower = user?.roles?.map(r => r.toLowerCase()) || [];
  const canDelete = rolesLower.some(role =>
    ["system admin", "hr manager"].includes(role)
  );

  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH SHIFT TYPES ================= */

  async function fetchShiftTypes() {
    try {
      const res = await axios.get(
        "http://localhost:4000/time-management/shift-type",
        { withCredentials: true }
      );
      setShiftTypes(res.data.data || []);
    } catch {
      toast.error("Failed to load shift types");
    } finally {
      setLoading(false);
    }
  }

  /* ================= DELETE ================= */

  async function deleteShiftType(id: string) {
    if (!confirm("Are you sure you want to delete this shift type?")) return;

    try {
      await axios.delete(
        `http://localhost:4000/time-management/shift-type/${id}`,
        { withCredentials: true }
      );

      toast.success("Shift type deleted");
      setShiftTypes(prev => prev.filter(st => st._id !== id));
    } catch {
      toast.error("Failed to delete shift type");
    }
  }

  useEffect(() => {
    fetchShiftTypes();
  }, []);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading shift types...</p>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Back */}
          <div className="mb-6">
            <Link
              href="/time-management/timesheet/shift"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              &larr; Back to Shift Management
            </Link>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Shift Types
          </h2>

          {/* GRID */}
          {shiftTypes.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              No shift types found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shiftTypes.map((shiftType) => (
                <div
                  key={shiftType._id}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition"
                >
                  {/* Name */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {shiftType.name}
                  </h3>

                  {/* Status */}
                  <p className="text-sm mb-4">
                    Status:{" "}
                    <span
                      className={
                        shiftType.active
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {shiftType.active ? "Active" : "Inactive"}
                    </span>
                  </p>

                  {/* Delete */}
                  {canDelete && (
                    <button
                      onClick={() => deleteShiftType(shiftType._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

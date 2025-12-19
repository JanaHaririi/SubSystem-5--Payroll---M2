"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import toast from "react-hot-toast";

/* ================= TYPES ================= */

type CreateShiftTypePayload = {
  name: string;
  active: boolean;
};

/* ================= PAGE ================= */

export default function CreateShiftTypePage() {
  const { user } = useAuth();

  const rolesLower = user?.roles?.map(r => r.toLowerCase()) || [];
  const isAllowed = rolesLower.some(role =>
    ["system admin", "department head"].includes(role)
  );

  const [shiftTypeData, setShiftTypeData] = useState<CreateShiftTypePayload>({
    name: "",
    active: true,
  });

  const [loading, setLoading] = useState(false);

  /* ================= CREATE SHIFT TYPE ================= */

  async function createShiftType(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        "http://localhost:4000/time-management/shift-type",
        shiftTypeData,
        { withCredentials: true }
      );

      toast.success("Shift type created successfully!");

      setShiftTypeData({
        name: "",
        active: true,
      });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to create shift type"
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================= ACCESS CONTROL ================= */

  if (!isAllowed) {
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
            Create Shift Type
          </h2>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 w-full">
            <form onSubmit={createShiftType} className="space-y-6 max-w-xl">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shift Type Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning, Night, Flexible"
                  className="w-full p-2 rounded border dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  value={shiftTypeData.name}
                  onChange={(e) =>
                    setShiftTypeData({
                      ...shiftTypeData,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              {/* Active */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={shiftTypeData.active}
                  onChange={(e) =>
                    setShiftTypeData({
                      ...shiftTypeData,
                      active: e.target.checked,
                    })
                  }
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Active
                </span>
              </label>

              {/* Submit */}
              <button
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Shift Type"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import toast from "react-hot-toast";

/* ===================== TYPES ===================== */

type CreateShiftPayload = {
  name: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  punchPolicy: "FIRST_LAST" | "ONLY_FIRST" | "MULTIPLE";
  graceInMinutes: number;
  graceOutMinutes: number;
  requiresApprovalForOvertime: boolean;
  active: boolean;
};

type ShiftType = {
  _id: string;
  name: string;
};

/* ===================== PAGE ===================== */

export default function CreateShiftPage() {
  const { user } = useAuth();

  const isAdmin =
    user?.roles?.includes("System Admin") ||
    user?.roles?.includes("HR Admin");

  const [shiftData, setShiftData] = useState<CreateShiftPayload>({
    name: "",
    shiftType: "",
    startTime: "",
    endTime: "",
    punchPolicy: "FIRST_LAST",
    graceInMinutes: 0,
    graceOutMinutes: 0,
    requiresApprovalForOvertime: false,
    active: true,
  });

  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);

  /* ===================== FETCH SHIFT TYPES ===================== */

  useEffect(() => {
    if (!isAdmin) return;

    async function fetchShiftTypes() {
      try {
        const res = await axios.get(
          "http://localhost:4000/time-management/shift-type",
          { withCredentials: true }
        );
        setShiftTypes(res.data.data);
      } catch (err) {
        console.error("Failed to fetch shift types", err);
      }
    }

    fetchShiftTypes();
  }, [isAdmin]);

  /* ===================== CREATE SHIFT ===================== */

  async function createShift(e: React.FormEvent) {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:4000/time-management/shift",
        shiftData,
        { withCredentials: true }
      );

      toast.success("Shift created successfully!");

      setShiftData({
        name: "",
        shiftType: "",
        startTime: "",
        endTime: "",
        punchPolicy: "FIRST_LAST",
        graceInMinutes: 0,
        graceOutMinutes: 0,
        requiresApprovalForOvertime: false,
        active: true,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create shift");
    }
  }

  /* ===================== ACCESS CONTROL ===================== */

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">
          You do not have access to this page.
        </p>
      </div>
    );
  }

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Back */}
        <Link
          href="/time-management/timesheet/shift"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Shift
        </Link>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white my-6">
          Create Shift ⏱️
        </h2>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 w-full">
          <form onSubmit={createShift} className="space-y-6">

            {/* Shift Name */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Shift Name
              </label>
              <input
                placeholder="e.g. Morning Shift"
                required
                className="w-full p-2 rounded dark:bg-gray-700 dark:text-white"
                value={shiftData.name}
                onChange={(e) =>
                  setShiftData({ ...shiftData, name: e.target.value })
                }
              />
            </div>

            {/* Shift Type */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Shift Type
              </label>
              <select
                required
                className="w-full p-2 rounded dark:bg-gray-700 dark:text-white"
                value={shiftData.shiftType}
                onChange={(e) =>
                  setShiftData({ ...shiftData, shiftType: e.target.value })
                }
              >
                <option value="">Select shift type</option>
                {shiftTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Shift Time
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="time"
                  required
                  className="p-2 rounded dark:bg-gray-700 dark:text-white"
                  value={shiftData.startTime}
                  onChange={(e) =>
                    setShiftData({ ...shiftData, startTime: e.target.value })
                  }
                />
                <input
                  type="time"
                  required
                  className="p-2 rounded dark:bg-gray-700 dark:text-white"
                  value={shiftData.endTime}
                  onChange={(e) =>
                    setShiftData({ ...shiftData, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Punch Policy */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Punch Policy
              </label>
              <select
                className="w-full p-2 rounded dark:bg-gray-700 dark:text-white"
                value={shiftData.punchPolicy}
                onChange={(e) =>
                  setShiftData({
                    ...shiftData,
                    punchPolicy: e.target.value as "FIRST_LAST" | "MULTIPLE" | "ONLY_FIRST",
                  })
                }
              >
                <option value="FIRST_LAST">First In / Last Out</option>
                <option value="MULTIPLE">Multiple</option>
                <option value="ONLY_FIRST">Only First</option>
              </select>
            </div>

            {/* Grace Periods */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Grace Periods (minutes)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  min={0}
                  placeholder="Grace In"
                  className="p-2 rounded dark:bg-gray-700 dark:text-white"
                  value={shiftData.graceInMinutes}
                  onChange={(e) =>
                    setShiftData({
                      ...shiftData,
                      graceInMinutes: Number(e.target.value),
                    })
                  }
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Grace Out"
                  className="p-2 rounded dark:bg-gray-700 dark:text-white"
                  value={shiftData.graceOutMinutes}
                  onChange={(e) =>
                    setShiftData({
                      ...shiftData,
                      graceOutMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Overtime Approval */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={shiftData.requiresApprovalForOvertime}
                onChange={(e) =>
                  setShiftData({
                    ...shiftData,
                    requiresApprovalForOvertime: e.target.checked,
                  })
                }
              />
              <span className="text-gray-700 dark:text-gray-300">
                Requires approval for overtime
              </span>
            </label>

            {/* Active */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={shiftData.active}
                onChange={(e) =>
                  setShiftData({ ...shiftData, active: e.target.checked })
                }
              />
              <span className="text-gray-700 dark:text-gray-300">
                Shift is active
              </span>
            </label>

            {/* Submit */}
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
              Create Shift
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

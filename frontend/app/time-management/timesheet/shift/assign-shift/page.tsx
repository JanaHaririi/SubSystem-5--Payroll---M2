"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import toast from "react-hot-toast";

/* ===================== TYPES ===================== */

type AssignShiftPayload = {
  employeeId?: string;
  departmentId?: string;
  positionId?: string;
  shiftId: string;
  startDate: string;
  endDate?: string;
};

type Employee = {
  _id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
};

type Department = {
  _id: string;
  code: string;
  name: string;
};

type Position = {
  _id: string;
  code: string;
  title: string;
};

type Shift = {
  _id: string;
  name: string;
};

/* ===================== PAGE ===================== */

export default function AssignShiftPage() {
  const { user } = useAuth();
  const isAdmin =
    user?.roles?.includes("System Admin") ||
    user?.roles?.includes("HR Admin");

  const [assignData, setAssignData] = useState<AssignShiftPayload>({
    shiftId: "",
    startDate: "",
  });

  const [assignScope, setAssignScope] = useState<"employee" | "position" | "department">("employee");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    async function fetchData() {
      try {
        const [empRes, deptRes, posRes, shiftsRes] = await Promise.all([
          axios.get("http://localhost:4000/employee-profile/", { withCredentials: true }),
          axios.get("http://localhost:4000/organization-structure/departments", { withCredentials: true }),
          axios.get("http://localhost:4000/organization-structure/positions", { withCredentials: true }),
          axios.get("http://localhost:4000/time-management/shift", { withCredentials: true }),
        ]);

        setEmployees(empRes.data);
        setDepartments(deptRes.data);
        setPositions(posRes.data);
        setShifts(shiftsRes.data.data);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    }

    fetchData();
  }, [isAdmin]);

  async function assignShift(e: React.FormEvent) {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:4000/time-management/assign-shift",
        assignData,
        { withCredentials: true }
      );
      toast.success("Shift assigned successfully!");
      setAssignData({ shiftId: "", startDate: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign shift");
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">
          You do not have access to this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Link
          href="/time-management/timesheet/shift"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Shift
        </Link>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white my-6">
          Assign Shift ⏱️
        </h2>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <form onSubmit={assignShift} className="space-y-4">
            {/* Scope Selector */}
            <select
              className="w-full p-2 rounded dark:bg-gray-700 dark:text-white"
              value={assignScope}
              onChange={(e) => {
                const scope = e.target.value as "employee" | "position" | "department";
                setAssignScope(scope);
                setAssignData({
                  shiftId: "",
                  startDate: "",
                  employeeId: undefined,
                  departmentId: undefined,
                  positionId: undefined,
                });
              }}
            >
              <option value="employee">Assign by Employee</option>
              <option value="position">Assign by Position</option>
              <option value="department">Assign by Department</option>
            </select>

            {/* Conditional Fields */}
            {assignScope === "employee" && (
              <select
                className="w-full p-2 rounded dark:bg-gray-700 dark:text-white"
                value={assignData.employeeId || ""}
                onChange={(e) =>
                  setAssignData({ ...assignData, employeeId: e.target.value || undefined })
                }
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.workEmail})
                  </option>
                ))}
              </select>
            )}

            {assignScope === "position" && (
              <select
                className="w-full p-2 rounded dark:bg-gray-700 dark:text-white"
                value={assignData.positionId || ""}
                onChange={(e) =>
                  setAssignData({ ...assignData, positionId: e.target.value || undefined })
                }
              >
                <option value="">Select Position</option>
                {positions.map((pos) => (
                  <option key={pos._id} value={pos._id}>
                    {pos.code} - {pos.title}
                  </option>
                ))}
              </select>
            )}

            {assignScope === "department" && (
              <select
                className="w-full p-2 rounded dark:bg-gray-700 dark:text-white"
                value={assignData.departmentId || ""}
                onChange={(e) =>
                  setAssignData({ ...assignData, departmentId: e.target.value || undefined })
                }
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.code} - {dept.name}
                  </option>
                ))}
              </select>
            )}

            {/* Shift Selector */}
            <select
              required
              className="w-full p-2 rounded dark:bg-gray-700 dark:text-white"
              value={assignData.shiftId}
              onChange={(e) => setAssignData({ ...assignData, shiftId: e.target.value })}
            >
              <option value="">Select Shift</option>
              {shifts.map((shift) => (
                <option key={shift._id} value={shift._id}>
                  {shift.name}
                </option>
              ))}
            </select>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                required
                className="p-2 rounded dark:bg-gray-700 dark:text-white"
                value={assignData.startDate}
                onChange={(e) =>
                  setAssignData({ ...assignData, startDate: e.target.value })
                }
              />
              <input
                type="date"
                className="p-2 rounded dark:bg-gray-700 dark:text-white"
                value={assignData.endDate || ""}
                onChange={(e) =>
                  setAssignData({ ...assignData, endDate: e.target.value })
                }
              />
            </div>

            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Assign Shift
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import axiosInstance from "@/app/utils/ApiClient";
import { useState } from "react";
import Link from "next/link";

type AttendanceStatus = "IN" | "OUT";

export default function ClockInOutPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Local state + persistence (frontend only)
  const [status, setStatus] = useState<AttendanceStatus>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("attendanceStatus") as AttendanceStatus) || "OUT";
    }
    return "OUT";
  });

  if (!user) {
    return <p className="p-6">Loading...</p>;
  }

  const employeeId = user.userid;

  // ✅ Unified clock handler
  const handleClockAction = async () => {
    setLoading(true);
    setMessage("");

    try {
      if (status === "OUT") {
        await axiosInstance.post(
          "/time-management/attendance-record/clock-in",
          { employeeId, punchType: "IN" }
        );

        setStatus("IN");
        localStorage.setItem("attendanceStatus", "IN");
        setMessage("✅ Clocked in successfully");
      } else {
        const res = await axiosInstance.post(
          "/time-management/attendance-record/clock-out",
          { employeeId, punchType: "OUT" }
        );

        setStatus("OUT");
        localStorage.setItem("attendanceStatus", "OUT");
        setMessage(
          `✅ Clocked out. Total minutes today: ${res.data.data.totalWorkMinutes}`
        );
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Link href="/time-management" className="text-blue-500 underline">
        ← Back to Time Management
      </Link>

      <h1 className="text-2xl font-bold mt-6 mb-6 text-gray-900 dark:text-white">
        Clock In / Out
      </h1>

      <button
        onClick={handleClockAction}
        disabled={loading}
        className={`px-8 py-3 rounded-lg font-semibold text-white transition
          ${
            status === "OUT"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }
          ${loading ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {status === "OUT" ? "Clock In" : "Clock Out"}
      </button>

      {message && (
        <p className="mt-4 text-gray-800 dark:text-gray-200">{message}</p>
      )}
    </div>
  );
}
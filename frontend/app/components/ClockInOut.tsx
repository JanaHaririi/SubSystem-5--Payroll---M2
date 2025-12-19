"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import axiosInstance from "@/app/utils/ApiClient";
import { useState } from "react";

type AttendanceStatus = "IN" | "OUT";

export default function ClockInOut() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState<AttendanceStatus>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("attendanceStatus") as AttendanceStatus) || "OUT";
    }
    return "OUT";
  });

  if (!user) return null;

  const employeeId = user.userid;

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
    <div className="mt-4">
      <button
        onClick={handleClockAction}
        disabled={loading}
        className={`px-8 py-3 rounded-lg font-semibold text-white
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
        <p className="mt-3 text-sm text-gray-200">{message}</p>
      )}
    </div>
  );
}

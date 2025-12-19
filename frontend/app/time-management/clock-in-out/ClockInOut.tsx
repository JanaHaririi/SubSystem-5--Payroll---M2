"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import axiosInstance from "@/app/utils/ApiClient";
import { useEffect, useState, useRef } from "react";

type ButtonState = "IDLE" | "IN";

interface Punch {
  time: string;
  type: "IN" | "OUT";
}

interface AttendanceRecord {
  punches: Punch[];
}

export default function ClockInOut() {
  const { user } = useAuth();
  const [state, setState] = useState<ButtonState>("IDLE");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState<number>(0); // seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!user) return null;
  const employeeId = user.userid;

  // Fetch today's attendance to initialize button state
  const fetchTodayRecord = async () => {
    try {
      const res = await axiosInstance.get(
        `/time-management/attendance-record/${employeeId}`,
        { withCredentials: true }
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (res.data.data && res.data.data.punches.length > 0) {
        const todayPunches = res.data.data.punches.filter((p: Punch) => {
          const punchDate = new Date(p.time);
          punchDate.setHours(0, 0, 0, 0);
          return punchDate.getTime() === today.getTime();
        });

        if (todayPunches.length === 0) {
          setState("IDLE");
        } else {
          const lastPunch = todayPunches[todayPunches.length - 1];
          if (lastPunch.type === "IN") {
            setState("IN");
            const elapsedSeconds = Math.floor(
              (new Date().getTime() - new Date(lastPunch.time).getTime()) / 1000
            );
            setTimer(elapsedSeconds);
            startTimer();
          } else {
            // Last punch is OUT → allow new clock-in
            setState("IDLE");
          }
        }
      } else {
        setState("IDLE");
      }
    } catch (err) {
      console.error(err);
      setState("IDLE");
    }
  };

  useEffect(() => {
    fetchTodayRecord();
    return () => stopTimer();
  }, []);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleClick = async () => {
    setLoading(true);
    setMessage("");

    try {
      if (state === "IDLE") {
        await axiosInstance.post("/time-management/attendance-record/clock-in", {
          employeeId,
          punchType: "IN",
        });
        setState("IN");
        setMessage("✅ Clocked in successfully!");
        setTimer(0);
        startTimer();
      } else if (state === "IN") {
        await axiosInstance.post("/time-management/attendance-record/clock-out", {
          employeeId,
          punchType: "OUT",
        });
        setState("IDLE"); // allow new clock-in
        setMessage("✅ Clocked out successfully!");
        stopTimer();
        setTimer(0);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  // Button UI
  const buttonConfig = {
    IDLE: { label: "Clock In", className: "bg-gray-500 hover:bg-gray-600" },
    IN: { label: "Clock Out", className: "bg-red-600 hover:bg-red-700" },
  };

  const { label, className } = buttonConfig[state];

  return (
    <div className="mt-6 flex flex-col items-start space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-8 py-3 rounded-lg font-semibold text-white transition ${
          className
        } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {label}
      </button>

      {state === "IN" && (
        <p className="text-gray-200 mt-1">⏱️ Working time: {formatTime(timer)}</p>
      )}

      {message && <p className="mt-2 text-sm text-gray-200">{message}</p>}
    </div>
  );
}

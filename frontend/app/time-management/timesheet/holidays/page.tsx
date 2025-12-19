"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";

export interface Holiday {
  type: "NATIONAL" | "RELIGIOUS" | "COMPANY" | "ORGANIZATIONAL" | "WEEKLY_REST";
  startDate: Date;
  endDate?: Date;
  name?: string;
  active?: boolean;
}

export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showForm, setShowForm] = useState(false);

  const [newHoliday, setNewHoliday] = useState<Holiday>({
    type: "NATIONAL",
    startDate: new Date(),
    endDate: new Date(),
    name: "",
    active: true,
  });

  const { user } = useAuth();

  // Fetch holidays
  const fetchHolidays = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/time-management/holiday",
        { withCredentials: true }
      );
      const holidayArray = res.data.data.data; // nested response
      const parsed: Holiday[] = holidayArray.map((h: any) => ({
        ...h,
        startDate: new Date(h.startDate),
        endDate: h.endDate ? new Date(h.endDate) : new Date(h.startDate),
      }));
      setHolidays(parsed);
    } catch (err) {
      console.log("Error fetching holidays:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // Live date/time
  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  function daysInMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = daysInMonth(currentMonth, currentYear);

  function getHolidayForDay(day: number) {
    const date = new Date(currentYear, currentMonth, day);
    date.setHours(0, 0, 0, 0); // normalize to midnight

    return holidays.find((h) => {
      const start = new Date(h.startDate);
      start.setHours(0, 0, 0, 0);
      const end = h.endDate ? new Date(h.endDate) : new Date(h.startDate);
      end.setHours(0, 0, 0, 0);

      return date >= start && date <= end;
    });
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  const canAddHoliday =
    user?.roles?.some((role: string) =>
      ["HR Admin", "HR Manager", "System Admin"].includes(role)
    );

  async function submitHoliday(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        ...newHoliday,
        startDate: newHoliday.startDate.toISOString(),
        endDate: newHoliday.endDate?.toISOString(),
      };

      await axios.post(
        "http://localhost:4000/time-management/holiday",
        payload,
        { withCredentials: true }
      );

      // Refresh calendar
      fetchHolidays();

      // Reset form
      setShowForm(false);
      setNewHoliday({
        type: "NATIONAL",
        startDate: new Date(),
        endDate: new Date(),
        name: "",
        active: true,
      });
    } catch (err) {
      console.error("Error creating holiday:", err);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading holidays...</p>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      {/* Back button & Add Holiday */}
      <div className="mb-4 w-full max-w-3xl flex justify-between items-center">
        <Link
          href="/time-management/timesheet"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Dashboard
        </Link>

        {canAddHoliday && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {showForm ? "Cancel" : "Add Holiday"}
          </button>
        )}
      </div>

      {/* Add Holiday Form */}
      {showForm && (
        <form
          onSubmit={submitHoliday}
          className="mb-6 w-full max-w-3xl bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4"
        >
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              value={newHoliday.name}
              onChange={(e) =>
                setNewHoliday({ ...newHoliday, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              value={newHoliday.type}
              onChange={(e) =>
                setNewHoliday({
                  ...newHoliday,
                  type: e.target.value as Holiday["type"],
                })
              }
              required
            >
              <option value="NATIONAL">National</option>
              <option value="ORGANIZATIONAL">Organizational</option>
              <option value="WEEKLY_REST">Weekly Rest</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                value={newHoliday.startDate.toISOString().substring(0, 10)}
                onChange={(e) =>
                  setNewHoliday({
                    ...newHoliday,
                    startDate: new Date(e.target.value),
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                value={newHoliday.endDate?.toISOString().substring(0, 10)}
                onChange={(e) =>
                  setNewHoliday({
                    ...newHoliday,
                    endDate: new Date(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={newHoliday.active}
              onChange={(e) =>
                setNewHoliday({ ...newHoliday, active: e.target.checked })
              }
            />
            <span className="text-gray-700 dark:text-gray-300">Active</span>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Save Holiday
          </button>
        </form>
      )}

      {/* Calendar */}
      <div className="w-full max-w-3xl h-[650px] bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col justify-between">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevMonth}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            ◀
          </button>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {new Date(currentYear, currentMonth).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>

          <button
            onClick={nextMonth}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            ▶
          </button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 text-center text-gray-700 dark:text-gray-300 font-semibold mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-2 flex-grow overflow-y-auto">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={i}></div>
          ))}

          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const holiday = getHolidayForDay(day);

            let classes = "p-3 rounded-lg text-center border ";
            if (holiday) {
              classes += holiday.active
                ? "bg-green-600 text-white font-bold shadow-lg"
                : "bg-gray-400 text-white font-bold opacity-60";
            } else {
              classes +=
                "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white";
            }

            return (
              <div key={day} className={classes}>
                {day}
                {holiday && (
                  <div className="text-xs mt-1 opacity-90">{holiday.name}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live date/time */}
        <div className="mt-6 text-center text-gray-700 dark:text-gray-300">
          {currentDate.toLocaleDateString()} {currentDate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

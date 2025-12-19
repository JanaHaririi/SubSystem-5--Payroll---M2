"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import { FaArrowLeft, FaCalendarAlt, FaCalendarPlus, FaCalendarDay, FaChevronLeft, FaChevronRight, FaClock, FaCalendarCheck, FaCheckCircle, FaTimesCircle, FaFlag, FaChurch, FaBuilding, FaRestroom } from "react-icons/fa";

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

  const getHolidayIcon = (type: Holiday["type"]) => {
    switch (type) {
      case "NATIONAL": return <FaFlag />;
      case "RELIGIOUS": return <FaChurch />;
      case "COMPANY": return <FaBuilding />;
      case "ORGANIZATIONAL": return <FaCalendarCheck />;
      case "WEEKLY_REST": return <FaRestroom />;
      default: return <FaCalendarDay />;
    }
  };

  const getHolidayColor = (type: Holiday["type"]) => {
    switch (type) {
      case "NATIONAL": return "from-red-500 to-red-600";
      case "RELIGIOUS": return "from-purple-500 to-purple-600";
      case "COMPANY": return "from-blue-500 to-blue-600";
      case "ORGANIZATIONAL": return "from-green-500 to-green-600";
      case "WEEKLY_REST": return "from-gray-500 to-gray-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 bg-blue-500/20 rounded-full animate-ping"></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
            Loading holidays calendar...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-800 p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FaCalendarAlt className="text-3xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Holiday Calendar
                  </h1>
                  <p className="text-white/80 text-sm md:text-base">
                    View and manage organizational holidays
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link 
                  href="/time-management" 
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                >
                  <FaArrowLeft className="text-sm" />
                  Back to Dashboard
                </Link>
                {canAddHoliday && (
                  <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <FaCalendarPlus />
                    {showForm ? "Cancel" : "Add Holiday"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Holiday Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  <FaCalendarPlus className="inline mr-2 text-blue-500" />
                  Add New Holiday
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Configure a new holiday for the calendar
                </p>
              </div>
            </div>

            <form onSubmit={submitHoliday} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Holiday Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    value={newHoliday.name}
                    onChange={(e) =>
                      setNewHoliday({ ...newHoliday, name: e.target.value })
                    }
                    required
                    placeholder="Enter holiday name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Holiday Type
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    value={newHoliday.type}
                    onChange={(e) =>
                      setNewHoliday({
                        ...newHoliday,
                        type: e.target.value as Holiday["type"],
                      })
                    }
                    required
                  >
                    <option value="NATIONAL">National Holiday</option>
                    <option value="RELIGIOUS">Religious Holiday</option>
                    <option value="COMPANY">Company Holiday</option>
                    <option value="ORGANIZATIONAL">Organizational Holiday</option>
                    <option value="WEEKLY_REST">Weekly Rest</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
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

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    value={newHoliday.endDate?.toISOString().substring(0, 10)}
                    onChange={(e) =>
                      setNewHoliday({
                        ...newHoliday,
                        endDate: new Date(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave empty for single-day holidays
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <input
                  type="checkbox"
                  id="activeHoliday"
                  checked={newHoliday.active}
                  onChange={(e) =>
                    setNewHoliday({ ...newHoliday, active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-0"
                />
                <label htmlFor="activeHoliday" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Holiday
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  Save Holiday
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-gray-500 to-gray-400 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Calendar Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Calendar Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={prevMonth}
                  className="p-3 bg-gray-100 dark:bg-gray-900 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-105 shadow-sm"
                >
                  <FaChevronLeft className="text-gray-700 dark:text-gray-300" />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Date(currentYear, currentMonth).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>

                <button
                  onClick={nextMonth}
                  className="p-3 bg-gray-100 dark:bg-gray-900 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-105 shadow-sm"
                >
                  <FaChevronRight className="text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Live Clock */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-xl">
                <FaClock className="text-gray-500 dark:text-gray-400" />
                <span className="font-medium">
                  {currentDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })} 
                </span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span className="font-mono">
                  {currentDate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false 
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div 
                  key={day} 
                  className="text-center py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 rounded-lg"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24"></div>
              ))}

              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const holiday = getHolidayForDay(day);
                const isToday = day === currentDate.getDate() && 
                               currentMonth === currentDate.getMonth() && 
                               currentYear === currentDate.getFullYear();

                let dayClasses = "h-24 rounded-xl border p-3 transition-all duration-300 ";
                
                if (holiday) {
                  dayClasses += `bg-gradient-to-br ${getHolidayColor(holiday.type)} text-white border-transparent shadow-lg `;
                  if (!holiday.active) {
                    dayClasses += "opacity-60 ";
                  }
                } else {
                  dayClasses += "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white ";
                }

                if (isToday) {
                  dayClasses += "ring-2 ring-blue-500 ring-offset-2 ";
                }

                return (
                  <div 
                    key={day} 
                    className={`group relative ${dayClasses} hover:scale-[1.02] hover:shadow-xl`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-lg font-semibold ${holiday ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {day}
                      </span>
                      {holiday && (
                        <div className="text-xs bg-white/20 backdrop-blur-sm rounded-full p-1">
                          {getHolidayIcon(holiday.type)}
                        </div>
                      )}
                    </div>

                    {holiday && (
                      <div className="mt-2">
                        <div className={`text-xs font-semibold truncate ${holiday.active ? 'text-white/90' : 'text-white/70'}`}>
                          {holiday.name}
                        </div>
                        <div className={`text-xs mt-1 flex items-center gap-1 ${holiday.active ? 'text-white/80' : 'text-white/60'}`}>
                          {holiday.active ? (
                            <FaCheckCircle className="text-xs" />
                          ) : (
                            <FaTimesCircle className="text-xs" />
                          )}
                          {holiday.type.replace('_', ' ')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Holiday Types Legend
              </h3>
              <div className="flex flex-wrap gap-3">
                {["NATIONAL", "RELIGIOUS", "COMPANY", "ORGANIZATIONAL", "WEEKLY_REST"].map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded bg-gradient-to-br ${getHolidayColor(type as Holiday["type"])}`}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-blue-600"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Today
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
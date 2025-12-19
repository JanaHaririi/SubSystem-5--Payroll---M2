// app/(protected)/dashboard/manager/leaves/calendar/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

interface LeaveRequest {
  _id: string;
  employeeId: { fullName: string; workEmail?: string };
  leaveTypeId: { name: string };
  dates: { from: string; to: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface DayEntry {
  date: Date;
  employees: { name: string; leaveType: string }[];
}

function formatMonthYear(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatDateLabel(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function ManagerTeamCalendarPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [days, setDays] = useState<DayEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendar();
  }, []);

  useEffect(() => {
    buildCalendar(currentMonth, requests);
  }, [currentMonth, requests]);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get<LeaveRequest[]>('/leaves/requests');
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team calendar');
    } finally {
      setLoading(false);
    }
  };

  const buildCalendar = (monthStart: Date, allRequests: LeaveRequest[]) => {
    const month = monthStart.getMonth();
    const year = monthStart.getFullYear();

    const approved = allRequests.filter(r => r.status === 'APPROVED');
    const map = new Map<string, DayEntry>();

    approved.forEach(r => {
      const from = new Date(r.dates.from);
      const to = new Date(r.dates.to);

      const cur = new Date(from);
      cur.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(0, 0, 0, 0);

      while (cur <= end) {
        if (cur.getMonth() === month && cur.getFullYear() === year) {
          const key = cur.toISOString().slice(0, 10);
          if (!map.has(key)) {
            map.set(key, {
              date: new Date(cur),
              employees: [],
            });
          }
          const entry = map.get(key)!;
          entry.employees.push({
            name: r.employeeId?.fullName ?? 'Unknown',
            leaveType: r.leaveTypeId?.name ?? 'Leave',
          });
        }
        cur.setDate(cur.getDate() + 1);
      }
    });

    const list = Array.from(map.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    setDays(list);
  };

  const goPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading team calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Calendar</h1>
            <p className="text-gray-500 dark:text-gray-400">
              See which team members are on leave each day.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <Link href="/dashboard/manager/leaves">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Manager Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Month selector */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white">{formatMonthYear(currentMonth)}</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant="outline" 
              onClick={goPrevMonth}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              onClick={goNextMonth}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {days.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No approved leaves for this month.
            </p>
          ) : (
            <div className="space-y-3">
              {days.map(day => (
                <div
                  key={day.date.toISOString()}
                  className="flex items-start justify-between border dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatDateLabel(day.date)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {day.date.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end max-w-xl">
                    {day.employees.map((emp, idx) => (
                      <Badge key={idx} variant="outline" className="px-2 py-1 dark:border-gray-600">
                        <span className="font-medium text-gray-900 dark:text-white">{emp.name}</span>
                        <span className="mx-1 text-gray-300 dark:text-gray-500">•</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {emp.leaveType}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
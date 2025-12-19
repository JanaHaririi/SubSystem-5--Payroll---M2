 "use client";

import { useAuth } from "@/app/(system)/context/authContext";
import Link from "next/link";
import ClockInOut from "./clock-in-out/ClockInOut";


export default function TimeManagementPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // A simple check for manager/admin roles for demonstration
  const isManagerOrAdmin = user?.roles?.some(role =>
    [ 'system admin', 'manager'].includes(role.toLowerCase())
  );

  const isManagerOrAdminOrPayroll = user?.roles?.some(role =>
    ['hr admin', 'system admin', 'manager', 'payroll manager', 'payroll specialist', 'hr manager'].includes(role.toLowerCase())
  );
  const isEmployee = user?.roles?.some(role => ['department employee', 'hr employee'].includes(role.toLowerCase()))
  const isHRManager = user?.roles?.some(role =>
    ['hr manager'].includes(role.toLowerCase())
  );
    const isSystemAdmin = user?.roles?.some(role =>
    ['system admin'].includes(role.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link href="/home" className="text-blue-600 hover:underline dark:text-blue-400">
              &larr; Back to Dashboard
            </Link>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Time Management
          </h2>

          {/* Clock In/Out Component */}
          {isEmployee &&
          <div className="mb-8">
            <ClockInOut />
          </div>
          }


          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* My Timesheet */}
            <Link href={'/time-management/timesheet'}>
              <DashboardCard
                title="My Timesheet"
                description="View and manage your weekly timesheets"
                icon="🗒️"
              />
            </Link>

            {/* Attendance */}
            <Link href={'/time-management/attendance'}>
              <DashboardCard
                title="Attendance"
                description="Review your attendance history and patterns"
                icon="🗓️"
              />
            </Link>

            {/* Time Exceptions */}
            <Link href="/time-management/time-exceptions">
              <DashboardCard
                title="Time Exceptions"
                description="Submit and review time exception requests (late, early leave, permissions)"
                icon="⏰"
              />
            </Link>

            {/* Notifications */}
            <Link href={'/time-management/notifications'}>
              <DashboardCard
                title="Notifications"
                description="Manage your notifications"
                icon="🔔"
              />
            </Link>

            {/* Rules - only for managers/admins */}
            {(isManagerOrAdmin || isHRManager || isEmployee) && (
              <Link href={'/time-management/rules'}>
                <DashboardCard
                  title="Rules"
                  description="View lateness, overtime, schedule & exceptions"
                  icon="⚙️"
                />
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
  
 

 
function DashboardCard({ title, description, icon }: { title: string; description: string; icon: string; }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

// add shift assigment , employees can see their own shifts, admins can assign shifts, department heads can see their teams shifts
// attendance can be manually edited by department heads
// noificatioons should be added
// rules should be added for hr managers only
// reports should be added for hr and payroll only
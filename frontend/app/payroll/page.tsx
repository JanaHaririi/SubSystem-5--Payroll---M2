import { DashboardCard } from "../home/page";
import Link from "next/link";

export default function payroll(){
    return(
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Dashboard Section */}
        <div>
                      <div className="mb-6">
            <Link href="/home" className="text-blue-600 hover:underline dark:text-blue-400">
              &larr; Back to Dashboard
            </Link>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-6">
            Payroll
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Employee Profile */}
            <Link href="/payroll-configuration">
              <DashboardCard
                title="Payroll Configuration"
                description="View and manage employee information"
                icon="💸"
              />
            </Link>
            <Link href="/payroll-tracking">
              <DashboardCard
                title="Payroll Tracking"
                description="View and manage employee information"
                icon="💰"
              />
            </Link>
                        <Link href="/payroll-execution">
              <DashboardCard
                title="Payroll Execution"
                description="View and manage employee information"
                icon="💵"
              />
            </Link>
          </div>
        </div>

      </main>
    </div>
    )
}
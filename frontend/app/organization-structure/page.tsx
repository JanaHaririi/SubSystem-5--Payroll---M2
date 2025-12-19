"use client";

import Link from "next/link";

export default function OrgStructurePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header Row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Organization Structure
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage departments, positions, hierarchy, and change requests
            </p>
          </div>

          {/* ✅ Home Button */}
          <Link href="/home">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              ⬅ Home
            </button>
          </Link>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Link href="/organization-structure/departments">
            <DashboardCard
              title="Departments"
              description="View and manage company departments"
              icon="🏢"
            />
          </Link>

          <Link href="/organization-structure/positions">
            <DashboardCard
              title="Positions"
              description="Create and manage job positions"
              icon="🧩"
            />
          </Link>

          <Link href="/organization-structure/change-requests">
            <DashboardCard
              title="Change Requests"
              description="Submit, review and approve structure change requests"
              icon="📝"
            />
          </Link>

          <Link href="/organization-structure/hierarchy">
            <DashboardCard
              title="Organization Hierarchy"
              description="View full organizational structure"
              icon="🌳"
            />
          </Link>

          <Link href="/organization-structure/my-team">
            <DashboardCard
              title="My Team"
              description="View your team and reporting lines"
              icon="👥"
            />
          </Link>

        </div>
      </div>
    </div>
  );
}

/* 🔹 Same card style as Home page */
function DashboardCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        {description}
      </p>
    </div>
  );
}

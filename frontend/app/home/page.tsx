"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const { user, logout } = useAuth();
  const [showCreateUser, setShowCreateUser] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  function getNormalizedRoles(user: any): string[] {
  if (!user) return [];
  if (Array.isArray(user.roles)) return user.roles.map((r: string) => r.toLowerCase());
  if (user.role) return [String(user.role).toLowerCase()];
  return [];
}
  const roles = getNormalizedRoles(user);

  // Check both roles array AND userType for different user types
  const userRoles = user?.roles || [];
  const userType = user?.userType;

  const isHR =
    userRoles.includes("HR Manager") ||
    userRoles.includes("HR Employee");

  const isEmployee =
    userRoles.includes("department employee");

  const isCandidate =
    userRoles.includes("candidate") ||
    userType === "candidate";

  const isHRAdmin =
  roles.includes("hr admin") ||
  roles.includes("system admin");

      const isManager =
    roles.includes("department head") ||
    roles.includes("department_head") ||
    roles.includes("department manager") ||
    roles.includes("department_manager");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alert Message */}
        <button
                  onClick={() => setShowCreateUser(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mb-4"
                >
                  Create User
                </button>
        <div className="rounded-lg border-l-4 border-red-600 bg-red-950/40 px-4 py-3 text-white mb-6">
        
          <p className="text-sm">
            Note: The "Create User" button is for testing purposes only and will be removed later.
          </p>
        </div>

        {/* Dashboard Section */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-6">
            Dashboard
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Employee Profile */}
            <Link href="/employee-profile-management">
              <DashboardCard
                title="Employee Profile"
                description="View and manage employee information"
                icon="👤"
              />
            </Link>

            {/* Recruitment */}
            <Link
              href={
                isHR
                  ? "/recruitment/hr/dashboard"
                  : isEmployee
                  ? "/recruitment/newHire/dashboard"
                  : isCandidate
                  ? "/recruitment/candidate/dashboard"
                  : "/recruitment/hr/dashboard"
              }
            >
              <DashboardCard
                title="Recruitment"
                description="Manage job postings and applications"
                icon="🎯"
              />
            </Link>

            {/* Time Management */}
            <Link href="/time-management">
              <DashboardCard
                title="Time Management"
                description="Track attendance and work hours"
                icon="⏰"
              />
            </Link>

           {/* Leave Management (single card for all roles) */}
<Link
  href={
    isHRAdmin || isHR
      ? "/dashboard/admin/leaves"
      : isManager
      ? "/dashboard/manager"
      : "/dashboard/employee/leaves"
  }
>
  <DashboardCard
    title="Leave Management"
    description={
      isEmployee
        ? "View and submit your leave requests"
        : "Manage leave requests and balances"
    }
    icon="🏖️"
  />
</Link>


            <Link href={"/payroll"}>
                        {/* Payroll */}
            <DashboardCard
              title="Payroll"
              description="Process salaries and payroll"
              icon="💰"
            />
            </Link>

            {/* Performance */}
            <Link href="/performance">
              <DashboardCard
                title="Performance"
                description="Track goals and reviews"
                icon="📈"
              />
            </Link>

            {/* Organization Structure */}
            <Link href="/organization-structure">
              <DashboardCard
                title="Organization Structure"
                description="Manage departments and positions"
                icon="🏛️"
              />
            </Link>
                    

          </div>
        </div>

        {/* Your Information Section */}
        <div className="mt-8 bg-slate-800 border border-slate-700 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Your Information
          </h3>
          <div className="space-y-2 text-slate-200">
            <p>
              <strong className="text-white">Role:</strong> {user.roles?.join(", ") || user.role || "N/A"}
            </p>
            <p>
              <strong className="text-white">Email:</strong> {user.email || "N/A"}
            </p>
            {user.age && (
              <p>
                <strong className="text-white">Age:</strong> {user.age}
              </p>
            )}
            {showCreateUser && <CreateUserModal onClose={() => setShowCreateUser(false)} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export function DashboardCard({ title, description, icon }: { title: string; description: string; icon: string; }) {
  return (
    <div className="bg-slate-800 border border-slate-700 shadow rounded-lg p-6 hover:bg-slate-700 hover:border-slate-600 transition cursor-pointer">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-300 text-sm">
        {description}
      </p>
    </div>
  );
}
function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    employeeNumber: '',
    workEmail: '',
    password: '',
    firstName: '',
    lastName: '',
    nationalId: '',
    dateOfHire: '',
    roles: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create user');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const availableRoles = ['hr admin', 'system admin', 'department employee', 'manager'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New User</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-500 text-green-700 dark:text-green-400 p-4 rounded-lg">
            User created successfully! Closing...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employee Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.employeeNumber}
                  onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="EMP001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.workEmail}
                  onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="employee@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  National ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Hire *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfHire}
                  onChange={(e) => setFormData({ ...formData, dateOfHire: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Roles (select at least one)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableRoles.map((role) => (
                  <label key={role} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || formData.roles.length === 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
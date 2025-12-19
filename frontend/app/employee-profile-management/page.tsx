"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(system)/context/authContext";
import {
  canReviewChangeRequests,
  canViewTeamProfiles,
  canAccessAllEmployees
} from "@/app/utils/roleCheck";
import Link from "next/link";

export default function EmployeeProfileManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Check specific permissions per requirements
  const canReviewRequests = canReviewChangeRequests(user);
  const canViewTeam = canViewTeamProfiles(user);
  const canAccessAll = canAccessAllEmployees(user);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-900 dark:text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Employee Profile Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Access profile information, change requests, and team management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Employee View - My Change Requests */}
          <Link href="/profile/change-request">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer border-2 border-blue-500">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                My Change Requests
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Submit and track your profile change requests
              </p>
              <div className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                View My Requests →
              </div>
            </div>
          </Link>

          {/* HR Admin/Manager - Review Change Requests */}
          {canReviewRequests && (
            <Link href="/change-requests">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer border-2 border-green-500">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Review Change Requests
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Review and approve/reject employee profile change requests (HR Admin/Manager only)
                </p>
                <div className="mt-2 inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-semibold rounded-full">
                  HR ADMIN/MANAGER
                </div>
                <div className="mt-4 inline-flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                  View All Requests →
                </div>
              </div>
            </Link>
          )}

          {/* Department Manager - Team Profiles */}
          {canViewTeam && (
            <Link href="/team-profiles">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer border-2 border-purple-500">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  My Team Profiles
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  View non-sensitive, summarized profile data of direct reports (Department Managers)
                </p>
                <div className="mt-2 inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-xs font-semibold rounded-full">
                  DEPARTMENT MANAGER
                </div>
                <div className="mt-4 inline-flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                  View Team →
                </div>
              </div>
            </Link>
          )}

          {/* HR Admin/Manager - All Employee Profiles */}
          {canAccessAll && (
            <Link href="/hr-admin">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer border-2 border-orange-500">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  All Employee Profiles
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Search, view, and manage all employee profiles in the system
                </p>
                <div className="mt-2 inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs font-semibold rounded-full">
                  HR ADMIN ONLY
                </div>
                <div className="mt-4 inline-flex items-center text-orange-600 dark:text-orange-400 text-sm font-medium">
                  View All Employees →
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Note:</strong> You can access "My Profile" directly from the navigation bar at the top of the page.
                {canAccessAll && " As HR Admin/Manager, you have direct access to edit ANY employee profile field (PII, Pay Grade, Status, Hire Date)."}
                {canViewTeam && !canAccessAll && " As a Department Manager, you can view non-sensitive, summarized profile data of your direct reports."}
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/home')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

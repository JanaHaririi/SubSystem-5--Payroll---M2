"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/ApiClient";
import { useAuth } from "@/app/(system)/context/authContext";
import { isManager } from "@/app/utils/roleCheck";

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  employeeNumber: string;
  workEmail?: string;
  primaryPositionId?: {
    _id: string;
    title: string;
  };
  primaryDepartmentId?: {
    _id: string;
    name: string;
  };
  supervisorPositionId?: string;
  status: string;
}

export default function MyTeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      // Check if user is a manager
      if (!isManager(user)) {
        // Redirect non-managers away from this page
        router.push("/organization-structure/hierarchy");
        return;
      }
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/employee-profile/team");
      setTeamMembers(res.data || []);
      console.log("Fetched team members:", res.data?.length);
    } catch (err: any) {
      console.error("Error fetching team:", err);
      setError(err.response?.data?.message || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300">
          Loading team members...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Team Members
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            View and manage your direct reports 
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Info Note */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <strong>Note:</strong> This page shows only employees who directly report to you (where employee.supervisorPositionId matches your primaryPositionId).
          </p>
        </div>

        {/* Team Members Count */}
        <div className="mb-6">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Total Direct Reports: <span className="text-blue-600 dark:text-blue-400">{teamMembers.length}</span>
          </p>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No direct reports found. This could mean:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-500 mt-4 space-y-2">
                <li>• No employees have been assigned to report to your position</li>
              </ul>
            </div>
          ) : (
            teamMembers.map((member) => (
              <div
                key={member._id}
                className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                <div className="text-center">
                  {/* Avatar */}
                  <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {member.firstName} {member.lastName}
                  </h3>

                  {/* Employee Number */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {member.employeeNumber}
                  </p>

                  {/* Position */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {member.primaryPositionId?.title || "No Position"}
                    </p>
                  </div>

                  {/* Department */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 dark:text-gray-500">
                      {member.primaryDepartmentId?.name || "No Department"}
                    </p>
                  </div>

                  {/* Email */}
                  {member.workEmail && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 dark:text-gray-600 truncate">
                        {member.workEmail}
                      </p>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mt-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      member.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Additional Info */}
        {teamMembers.length > 0 && (
          <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Team Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {teamMembers.filter(m => m.status === 'ACTIVE').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {teamMembers.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Departments</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {new Set(teamMembers.map(m => m.primaryDepartmentId?.name).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

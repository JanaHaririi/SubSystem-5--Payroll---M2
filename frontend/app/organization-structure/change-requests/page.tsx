"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";

export default function ChangeRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      if (!user?.roles?.length) {
        setError("Unable to determine user role");
        setLoading(false);
        return;
      }

      const roles = user.roles.map((r: string) => r.toUpperCase().replace(/\s+/g, "_"));

      // 🔐 SYSTEM ADMIN
      if (roles.includes("SYSTEM_ADMIN")) {
        console.log("🔑 SYSTEM_ADMIN detected — loading ALL change requests");
        const res = await axiosInstance.get(
          "/organization-structure/change-requests"
        );
        setRequests(res.data || []);
        setUserRole("admin");
        return;
      }

      // 👔 MANAGER / DEPARTMENT HEAD
      if (
        roles.includes("HR_MANAGER") ||
        roles.includes("DEPARTMENT_HEAD")
      ) {
        console.log("👔 Manager detected — loading OWN change requests");
        const res = await axiosInstance.get(
          "/organization-structure/change-requests/my-requests"
        );
        setRequests(res.data || []);
        setUserRole("manager");
        return;
      }

      // 🚫 REGULAR EMPLOYEE
      console.warn("⛔ User not allowed to view change requests");
      setError(
        "You are not authorized to view organizational change requests."
      );
    } catch (err: any) {
      console.error("❌ Failed to load change requests:", err);
      setError(
        err.response?.data?.message ||
        "Failed to load change requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300">Loading change requests...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatRequestType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {userRole === "admin" ? "All Change Requests" : "My Change Requests"}
            </h1>
            {userRole === "manager" && (
              <p className="text-gray-600 dark:text-gray-400">
                Viewing only your submitted requests
              </p>
            )}
            {userRole === "admin" && (
              <p className="text-gray-600 dark:text-gray-400">
                Review and approve organizational structure change requests
              </p>
            )}
          </div>
          <Link href="/organization-structure/change-requests/create">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm">
              + Submit New Request
            </button>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No change requests found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {userRole === "manager"
                ? "You haven't submitted any change requests yet."
                : "No change requests have been submitted yet."}
            </p>
            <Link href="/organization-structure/change-requests/create">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
                Submit Your First Request
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Request #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((req: any) => (
                    <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900 dark:text-white">
                          {req.requestNumber || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {req.requestedByEmployeeId?.firstName?.[0] || "?"}
                              {req.requestedByEmployeeId?.lastName?.[0] || ""}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {req.requestedByEmployeeId?.fullName || "—"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {req.requestedByEmployeeId?.employeeNumber || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatRequestType(req.requestType) || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(req.status)}`}>
                          {req.status || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {req.submittedAt
                          ? new Date(req.submittedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/organization-structure/change-requests/${req._id}`}>
                          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                            View Details →
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

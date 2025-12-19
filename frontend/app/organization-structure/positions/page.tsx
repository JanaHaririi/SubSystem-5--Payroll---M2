"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import { isSystemAdmin } from "@/app/utils/roleCheck";
import { useRouter } from "next/navigation";

export default function PositionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================
  // ACCESS CONTROL — SYSTEM ADMIN ONLY
  // ============================
  useEffect(() => {
    if (user && !isSystemAdmin(user)) {
      router.replace("/home");
    }
  }, [user, router]);

  // ============================
  // FETCH POSITIONS
  // ============================
  const fetchPositions = async () => {
    try {
      const res = await axiosInstance.get(
        "/organization-structure/positions"
      );
      setPositions(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load positions");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // ACTIVATE / DEACTIVATE
  // ============================
  const togglePositionStatus = async (id: string, isActive: boolean) => {
    const action = isActive ? "deactivate" : "activate";

    const confirmed = confirm(
      `Are you sure you want to ${action} this position?`
    );
    if (!confirmed) return;

    try {
      const endpoint = isActive
        ? `/organization-structure/positions/${id}/deactivate`
        : `/organization-structure/positions/${id}/activate`;

      await axiosInstance.patch(endpoint);
      fetchPositions();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update position");
    }
  };

  useEffect(() => {
    if (user && isSystemAdmin(user)) {
      fetchPositions();
    }
  }, [user]);

  // ============================
  // BLOCK NON ADMINS
  // ============================
  if (!user || !isSystemAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Access denied
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <p className="text-gray-700 dark:text-gray-300">
          Loading positions...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Positions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage job positions across departments
            </p>
          </div>

          <Link href="/organization-structure/positions/create">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Create New Position
            </button>
          </Link>
        </div>

        {error && (
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error}
          </p>
        )}

        {/* Table */}
        {positions.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">
            No positions found.
          </p>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {positions.map((pos: any) => (
                  <tr
                    key={pos._id}
                    className="border-t dark:border-gray-700"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {pos.title}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {pos.departmentId?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          pos.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {pos.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <Link
                        href={`/organization-structure/positions/${pos._id}/edit`}
                      >
                        <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                          Edit
                        </button>
                      </Link>

                      <button
                        onClick={() =>
                          togglePositionStatus(pos._id, pos.isActive)
                        }
                        className="px-3 py-1 text-sm text-red-600 hover:underline"
                      >
                        {pos.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

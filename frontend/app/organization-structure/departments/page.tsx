"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import { isSystemAdmin } from "@/app/utils/roleCheck";
import { useRouter } from "next/navigation";

export default function DepartmentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 
 
  // 🔒 ACCESS CONTROL
  useEffect(() => {
    if (user && !isSystemAdmin(user)) {
      router.replace("/home");
    }
  }, [user, router]);

  const fetchDepartments = async () => {
    try {
      const res = await axiosInstance.get(
        "/organization-structure/departments?includeInactive=true"
      );
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isSystemAdmin(user)) {
      fetchDepartments();
    }
  }, [user]);

  if (!user || !isSystemAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Access denied
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading departments...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Departments
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage company departments
            </p>
          </div>

          <Link href="/organization-structure/departments/create">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + New Department
            </button>
          </Link>
        </div>

        {error && (
          <div className="mb-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
          {departments.length === 0 ? (
            <p className="p-6 text-gray-600 dark:text-gray-300">
              No departments found.
            </p>
          ) : (
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Code</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept._id} className="border-t">
                    <td className="px-6 py-4">{dept.name}</td>
                    <td className="px-6 py-4">{dept.code}</td>
                    <td className="px-6 py-4">
                      {dept.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/organization-structure/departments/${dept._id}/edit`}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

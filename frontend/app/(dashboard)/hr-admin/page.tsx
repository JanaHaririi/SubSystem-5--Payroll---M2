"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/ApiClient";
import Link from "next/link";
import { isHRAdmin,isHRManager, hasRole, debugRoles } from "@/app/utils/roleCheck";

interface Employee {
  _id: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  hireDate?: string;
  departmentId?: string;
  positionId?: string;
  payGrade?: string;
  profilePictureUrl?: string;
  roles?: string[];
}

export default function HRAdminPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await axiosInstance.get("/employee-profile/me");

      // Debug role structure
      debugRoles(response.data);

      // ✅ Unified role check (HR_ADMIN OR HR_MANAGER)
      if (!isHRAdmin(response.data) && !isHRManager(response.data)) {
        alert(
          "Access Denied: You don't have permission to access this page. Required role: HR_ADMIN or HR_MANAGER"
        );
        router.push("/profile");
        return;
      }

      setHasAccess(true);
      fetchEmployees();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/profile");
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get("/employee-profile");
      console.log("Employee data received:", response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      (emp.firstName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.lastName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.employeeNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">
          {loading ? "Loading..." : "Checking access..."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">HR Administration</h1>
          <p className="text-neutral-400">
            Manage employee profiles and master data
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/hr-admin/workflow-config"
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
          >
            View Logs
          </Link>
          <Link
            href="/change-requests"
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
          >
            Change Requests
          </Link>
          <Link
            href="/hr-admin/create"
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition"
          >
            Create Employee
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-sm text-neutral-400 mb-1">Total Employees</h3>
          <p className="text-3xl font-bold text-white">{employees.length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-sm text-neutral-400 mb-1">Active</h3>
          <p className="text-3xl font-bold text-green-400">
            {employees.filter((e) => e.status === "ACTIVE").length}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-sm text-neutral-400 mb-1">On Leave</h3>
          <p className="text-3xl font-bold text-yellow-400">
            {employees.filter((e) => e.status === "ON_LEAVE").length}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-sm text-neutral-400 mb-1">Inactive</h3>
          <p className="text-3xl font-bold text-red-400">
            {
              employees.filter(
                (e) =>
                  e.status !== "ACTIVE" &&
                  e.status !== "ON_LEAVE"
              ).length
            }
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, employee number, or email..."
            className="w-full rounded-lg bg-black border border-neutral-700 px-4 py-2 text-white placeholder-neutral-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg bg-black border border-neutral-700 px-4 py-2 text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">All Employees</h2>
        {filteredEmployees.length === 0 ? (
          <p className="text-neutral-400">No employees found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Employee #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Pay Grade
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp._id}
                    className="border-b border-neutral-800 hover:bg-neutral-800 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden">
                          {emp.profilePictureUrl ? (
                            <img
                              src={`http://localhost:4000/employee-profile/profile-picture/${emp.profilePictureUrl}`}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm text-neutral-400">
                              {emp.firstName?.[0]}
                              {emp.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {emp.firstName} {emp.middleName} {emp.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-white">{emp.employeeNumber}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-white text-sm">{emp.email}</p>
                      {emp.phone && (
                        <p className="text-neutral-400 text-xs">{emp.phone}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-white">{emp.payGrade || "N/A"}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          emp.status === "ACTIVE"
                            ? "bg-green-900 text-green-300"
                            : emp.status === "ON_LEAVE"
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/hr-admin/edit/${emp._id}`}
                        className="text-white hover:text-neutral-300 text-sm underline"
                      >
                        Edit
                      </Link>
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

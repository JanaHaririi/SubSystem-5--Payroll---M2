"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/ApiClient";
import { isHRAdmin } from "@/app/utils/roleCheck";
import toast from "react-hot-toast";

interface EmployeeProfile {
  _id: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    country?: string;
  };
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationalId?: string;
  hireDate?: string;
  status: string;
  payGrade?: string;
  primaryDepartmentId?: any;
  primaryPositionId?: any;
  roles?: string[];
}

interface Department {
  _id: string;
  name: string;
}

interface Position {
  _id: string;
  title: string;
}

interface PayGrade {
  _id: string;
  grade: string;
  isActive?: boolean;
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [payGrades, setPayGrades] = useState<PayGrade[]>([]);

  useEffect(() => {
    checkAccess();
  }, [params.id]);

  const checkAccess = async () => {
    try {
      const response = await axiosInstance.get("/employee-profile/me");

      // Use flexible role checking
      if (!isHRAdmin(response.data)) {
        alert("Access Denied: You don't have permission to access this page");
        router.push("/profile");
        return;
      }

      setHasAccess(true);
      await fetchDepartmentsAndPositions();
      fetchEmployee();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/profile");
    }
  };

  const fetchDepartmentsAndPositions = async () => {
    try {
      const [deptResponse, posResponse] = await Promise.all([
        axiosInstance.get("/organization-structure/departments"),
        axiosInstance.get("/organization-structure/positions"),
      ]);

      // Filter out any invalid data
      const validDepts = (deptResponse.data || []).filter((d: Department) => d._id && d.name);
      const validPos = (posResponse.data || []).filter((p: Position) => p._id && p.title);

      setDepartments(validDepts);
      setPositions(validPos);

      // Try to fetch pay grades, but don't fail if endpoint doesn't exist
      try {
        const payGradeResponse = await axiosInstance.get("/payroll-configuration/pay-grades");
        const validPayGrades = (payGradeResponse.data || []).filter((pg: PayGrade) => pg._id && pg.grade);
        setPayGrades(validPayGrades);
      } catch (pgError) {
        console.warn("Pay grades endpoint not available:", pgError);
        setPayGrades([]);
      }
    } catch (error) {
      console.error("Error fetching departments and positions:", error);
      setDepartments([]);
      setPositions([]);
      setPayGrades([]);
    }
  };

  const fetchEmployee = async () => {
    try {
      const response = await axiosInstance.get(`/employee-profile/${params.id}`);
      setEmployee(response.data);
      setSelectedRoles(response.data.roles || []);
      setFormData({
        firstName: response.data.firstName || "",
        middleName: response.data.middleName || "",
        lastName: response.data.lastName || "",
        workEmail: response.data.workEmail || response.data.email || "",
        personalEmail: response.data.personalEmail || "",
        mobilePhone: response.data.mobilePhone || "",
        homePhone: response.data.homePhone || "",
        address: {
          streetAddress: response.data.address?.streetAddress || "",
          city: response.data.address?.city || "",
          country: response.data.address?.country || "",
        },
        dateOfBirth: response.data.dateOfBirth
          ? new Date(response.data.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: response.data.gender || "",
        maritalStatus: response.data.maritalStatus || "",
        nationalId: response.data.nationalId || "",
        dateOfHire: response.data.dateOfHire || response.data.hireDate
          ? new Date(response.data.dateOfHire || response.data.hireDate).toISOString().split("T")[0]
          : "",
        status: response.data.status || "ACTIVE",
        payGradeId: response.data.payGradeId || "",
        primaryDepartmentId: response.data.primaryDepartmentId?._id || response.data.primaryDepartmentId || "",
        primaryPositionId: response.data.primaryPositionId?._id || response.data.primaryPositionId || "",
        supervisorPositionId: response.data.supervisorPositionId?._id || response.data.supervisorPositionId || "",
        contractType: response.data.contractType || "",
        workType: response.data.workType || "",
        contractStartDate: response.data.contractStartDate
          ? new Date(response.data.contractStartDate).toISOString().split("T")[0]
          : "",
        contractEndDate: response.data.contractEndDate
          ? new Date(response.data.contractEndDate).toISOString().split("T")[0]
          : "",
        bankName: response.data.bankName || "",
        bankAccountNumber: response.data.bankAccountNumber || "",
      });
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error("Failed to load employee data", {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Clean up empty strings to prevent MongoDB cast errors
      const cleanedData = { ...formData };
      if (!cleanedData.primaryDepartmentId || cleanedData.primaryDepartmentId === "") {
        delete cleanedData.primaryDepartmentId;
      }
      if (!cleanedData.primaryPositionId || cleanedData.primaryPositionId === "") {
        delete cleanedData.primaryPositionId;
      }
      if (!cleanedData.supervisorPositionId || cleanedData.supervisorPositionId === "") {
        delete cleanedData.supervisorPositionId;
      }
      if (!cleanedData.payGradeId || cleanedData.payGradeId === "") {
        delete cleanedData.payGradeId;
      }

      await axiosInstance.put(`/employee-profile/${params.id}`, cleanedData);

      toast.success("Employee profile updated successfully! 🎉", {
        duration: 3000,
        icon: '✅',
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });

      setTimeout(() => {
        router.push("/hr-admin");
      }, 1000);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update employee", {
        duration: 5000,
        icon: '❌',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const confirmed = window.confirm(`Are you sure you want to change status to ${newStatus}?`);
    if (!confirmed) {
      return;
    }

    try {
      await axiosInstance.patch(`/employee-profile/${params.id}/status`, {
        status: newStatus,
        effectiveDate: new Date(),
      });

      toast.success(`Status updated to ${newStatus} successfully! ✅`, {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });

      fetchEmployee();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update status", {
        duration: 4000,
        icon: '❌',
      });
    }
  };

  const handleRoleAssignment = async () => {
    if (selectedRoles.length === 0) {
      alert("Please select at least one role");
      return;
    }

    setSavingRoles(true);
    try {
      await axiosInstance.post(`/employee-profile/${params.id}/roles/assign`, {
        roles: selectedRoles,
        isActive: true,
      });
      alert("Roles updated successfully");
      fetchEmployee();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to update roles");
    } finally {
      setSavingRoles(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      const newRoles = prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role];

      // Prevent deselecting all roles - at least one must be selected
      if (newRoles.length === 0) {
        alert("At least one role must be selected");
        return prev;
      }

      return newRoles;
    });
  };

  if (loading || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">
          {loading ? "Loading..." : "Checking access..."}
        </div>
      </div>
    );
  }

  if (!employee) {
    return <div className="text-white">Employee not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Employee Profile</h1>
          <p className="text-neutral-400">
            {employee.firstName} {employee.lastName} ({employee.employeeNumber})
          </p>
        </div>
        <button
          onClick={() => router.push("/hr-admin")}
          className="text-neutral-400 hover:text-white"
        >
          ← Back to HR Admin
        </button>
      </div>

      {/* Status Management */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Status Management</h2>
        <div className="flex items-center space-x-4">
          <span className="text-neutral-400">Current Status:</span>
          <span
            className={`px-3 py-1 rounded font-medium ${
              employee.status === "ACTIVE"
                ? "bg-green-900 text-green-300"
                : employee.status === "ON_LEAVE"
                ? "bg-yellow-900 text-yellow-300"
                : "bg-red-900 text-red-300"
            }`}
          >
            {employee.status}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange("ACTIVE")}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Set Active
          </button>
          <button
            onClick={() => handleStatusChange("ON_LEAVE")}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
          >
            Set On Leave
          </button>
          <button
            onClick={() => handleStatusChange("SUSPENDED")}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
          >
            Suspend
          </button>
          <button
            onClick={() => handleStatusChange("TERMINATED")}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Terminate
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Middle Name
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) =>
                  setFormData({ ...formData, middleName: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Marital Status
              </label>
              <select
                value={formData.maritalStatus}
                onChange={(e) =>
                  setFormData({ ...formData, maritalStatus: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                National ID
              </label>
              <input
                type="text"
                value={formData.nationalId}
                onChange={(e) =>
                  setFormData({ ...formData, nationalId: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Work Email *</label>
              <input
                type="email"
                value={formData.workEmail}
                onChange={(e) =>
                  setFormData({ ...formData, workEmail: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Personal Email</label>
              <input
                type="email"
                value={formData.personalEmail}
                onChange={(e) =>
                  setFormData({ ...formData, personalEmail: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Mobile Phone</label>
              <input
                type="tel"
                value={formData.mobilePhone}
                onChange={(e) =>
                  setFormData({ ...formData, mobilePhone: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Home Phone</label>
              <input
                type="tel"
                value={formData.homePhone}
                onChange={(e) =>
                  setFormData({ ...formData, homePhone: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address?.streetAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, streetAddress: e.target.value }
                  })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">City</label>
              <input
                type="text"
                value={formData.address?.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-neutral-400 block mb-1">Country</label>
              <input
                type="text"
                value={formData.address?.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, country: e.target.value }
                  })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Employment Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Department
              </label>
              <select
                value={formData.primaryDepartmentId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, primaryDepartmentId: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Position
              </label>
              <select
                value={formData.primaryPositionId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, primaryPositionId: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select Position</option>
                {positions.map((pos) => (
                  <option key={pos._id} value={pos._id}>
                    {pos.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Reports To (Supervisor Position)
              </label>
              <select
                value={formData.supervisorPositionId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, supervisorPositionId: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">No Supervisor (Top Level)</option>
                {positions.map((pos) => (
                  <option key={pos._id} value={pos._id}>
                    {pos.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Hire Date
              </label>
              <input
                type="date"
                value={formData.dateOfHire}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfHire: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Pay Grade
              </label>
              <select
                value={formData.payGradeId}
                onChange={(e) =>
                  setFormData({ ...formData, payGradeId: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select Pay Grade</option>
                {payGrades.map((pg) => (
                  <option key={pg._id} value={pg._id}>
                    {pg.grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Contract Type
              </label>
              <select
                value={formData.contractType || ""}
                onChange={(e) =>
                  setFormData({ ...formData, contractType: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select Contract Type</option>
                <option value="FULL_TIME_CONTRACT">Full Time Contract</option>
                <option value="PART_TIME_CONTRACT">Part Time Contract</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Work Type
              </label>
              <select
                value={formData.workType || ""}
                onChange={(e) =>
                  setFormData({ ...formData, workType: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select Work Type</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Contract Start Date
              </label>
              <input
                type="date"
                value={formData.contractStartDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, contractStartDate: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Contract End Date
              </label>
              <input
                type="date"
                value={formData.contractEndDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, contractEndDate: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Banking Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
                placeholder="e.g., Bank of America"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                value={formData.bankAccountNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bankAccountNumber: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
                placeholder="Account number"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 disabled:opacity-50 font-medium"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/hr-admin")}
            className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Role Management Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">System Roles & Permissions</h2>
        <p className="text-neutral-400 text-sm mb-4">
          Assign roles to this employee. Changes are applied immediately.
        </p>

        <div className="space-y-3 mb-4">
          {[
            { value: "department employee", label: "Department Employee" },
            { value: "department head", label: "Department Head" },
            { value: "HR Admin", label: "HR Admin" },
            { value: "HR Manager", label: "HR Manager" },
            { value: "HR Employee", label: "HR Employee" },
            { value: "Payroll Specialist", label: "Payroll Specialist" },
            { value: "Payroll Manager", label: "Payroll Manager" },
            { value: "System Admin", label: "System Admin" },
            { value: "Legal & Policy Admin", label: "Legal & Policy Admin" },
            { value: "Recruiter", label: "Recruiter" },
            { value: "Finance Staff", label: "Finance Staff" },
          ].map((role) => (
            <label
              key={role.value}
              className="flex items-center space-x-3 cursor-pointer hover:bg-neutral-800 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.value)}
                onChange={() => toggleRole(role.value)}
                className="w-4 h-4 rounded border-neutral-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-neutral-900"
              />
              <span className="text-white">{role.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleRoleAssignment}
            disabled={savingRoles || selectedRoles.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {savingRoles ? "Saving Roles..." : "Update Roles"}
          </button>
          <span className="text-sm text-neutral-400">
            {selectedRoles.length} role(s) selected
          </span>
        </div>

        {employee?.roles && employee.roles.length > 0 && (
          <div className="mt-4 p-3 bg-neutral-800 rounded">
            <p className="text-xs text-neutral-400 mb-1">Current Roles:</p>
            <p className="text-white text-sm">{employee.roles.join(", ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

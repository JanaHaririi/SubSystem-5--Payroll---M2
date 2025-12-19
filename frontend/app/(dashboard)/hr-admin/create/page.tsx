"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/ApiClient";
import { isHRAdmin } from "@/app/utils/roleCheck";
import { isHRManager } from "@/app/utils/roleCheck";

import toast from "react-hot-toast";

interface Department {
  _id: string;
  name: string;
  isActive?: boolean;
}

interface Position {
  _id: string;
  title: string;
  isActive?: boolean;
}

interface PayGrade {
  _id: string;
  grade: string;
  isActive?: boolean;
}

export default function CreateEmployeePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [payGrades, setPayGrades] = useState<PayGrade[]>([]);
  const [formData, setFormData] = useState({
    employeeNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    workEmail: "",
    personalEmail: "",
    mobilePhone: "",
    homePhone: "",
    address: {
      streetAddress: "",
      city: "",
      country: "",
    },
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    nationalId: "",
    dateOfHire: "",
    status: "ACTIVE",
    payGradeId: "",
    password: "",
    role: "department employee", // Single role
    primaryDepartmentId: "",
    primaryPositionId: "",
    supervisorPositionId: "",
    contractType: "",
    workType: "",
    contractStartDate: "",
    contractEndDate: "",
    bankName: "",
    bankAccountNumber: "",
  });

  const handleRoleChange = (role: string) => {
    setFormData({ ...formData, role });
  };

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await axiosInstance.get("/employee-profile/me");

      // Use flexible role checking
      if (!isHRAdmin(response.data) && !isHRManager(response.data)) {
        toast.error("Access Denied: You don't have permission to access this page", {
          duration: 4000,
          icon: '🚫',
        });
        router.push("/profile");
        return;
      }

      setHasAccess(true);
      await fetchDepartmentsAndPositions();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentsAndPositions = async () => {
    try {
      const [deptResponse, posResponse] = await Promise.all([
        axiosInstance.get("/organization-structure/departments"),
        axiosInstance.get("/organization-structure/positions"),
      ]);

      // Filter out any invalid data and show all
      const validDepts = (deptResponse.data || []).filter((d: Department) => d._id && d.name);
      const validPos = (posResponse.data || []).filter((p: Position) => p._id && p.title);

      setDepartments(validDepts);
      setPositions(validPos);

      // Try to fetch pay grades, but don't fail if endpoint doesn't exist
      try {
        console.log("📊 Fetching pay grades...");
        const payGradeResponse = await axiosInstance.get("/payroll-configuration/pay-grades");
        console.log("📊 Pay grades response:", payGradeResponse.data);
        const validPayGrades = (payGradeResponse.data || []).filter((pg: PayGrade) => pg._id && pg.grade);
        console.log("✅ Valid pay grades:", validPayGrades.length);
        setPayGrades(validPayGrades);

        if (validPayGrades.length === 0) {
          console.warn("⚠️ No pay grades found in database");
          toast.error("No pay grades found. Please create pay grades first.", {
            duration: 4000,
          });
        }
      } catch (pgError: any) {
        console.error("❌ Pay grades fetch error:", pgError);
        console.error("❌ Error details:", pgError.response?.data || pgError.message);
        setPayGrades([]);
        toast.error("Failed to load pay grades. The dropdown may be empty.", {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching departments and positions:", error);
      // Set empty arrays on error to prevent crashes
      setDepartments([]);
      setPositions([]);
      setPayGrades([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert role (string) to systemRoles (array) for backend
      const payload = {
        ...formData,
        systemRoles: [formData.role], // Backend expects systemRoles as array
      };
      delete (payload as any).role; // Remove singular role field

      // Remove empty string fields to prevent MongoDB cast errors
      if (!payload.primaryDepartmentId || payload.primaryDepartmentId === "") {
        delete (payload as any).primaryDepartmentId;
      }
      if (!payload.primaryPositionId || payload.primaryPositionId === "") {
        delete (payload as any).primaryPositionId;
      }
      if (!payload.supervisorPositionId || payload.supervisorPositionId === "") {
        delete (payload as any).supervisorPositionId;
      }
      if (!payload.payGradeId || payload.payGradeId === "") {
        delete (payload as any).payGradeId;
      }

      await axiosInstance.post("/employee-profile", payload);

      toast.success("Employee created successfully! 🎉", {
        duration: 4000,
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
      toast.error(error?.response?.data?.message || "Failed to create employee", {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Employee</h1>
          <p className="text-neutral-400">Add a new employee to the system</p>
        </div>
        <button
          onClick={() => router.push("/hr-admin")}
          className="text-neutral-400 hover:text-white"
        >
          ← Back to HR Admin
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Employee Number *
              </label>
              <input
                type="text"
                value={formData.employeeNumber}
                onChange={(e) =>
                  setFormData({ ...formData, employeeNumber: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
                placeholder="EMP12345"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
                placeholder="Initial password"
              />
            </div>
          </div>
        </div>

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
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Marital Status *
              </label>
              <select
                value={formData.maritalStatus}
                onChange={(e) =>
                  setFormData({ ...formData, maritalStatus: e.target.value })
                }
                required
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
                National ID *
              </label>
              <input
                type="text"
                value={formData.nationalId}
                onChange={(e) =>
                  setFormData({ ...formData, nationalId: e.target.value })
                }
                required
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
                value={formData.address.streetAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, streetAddress: e.target.value },
                  })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">City</label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Country</label>
              <input
                type="text"
                value={formData.address.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, country: e.target.value },
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
                Department *
              </label>
              <select
                value={formData.primaryDepartmentId}
                onChange={(e) =>
                  setFormData({ ...formData, primaryDepartmentId: e.target.value })
                }
                required
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
                Position *
              </label>
              <select
                value={formData.primaryPositionId}
                onChange={(e) =>
                  setFormData({ ...formData, primaryPositionId: e.target.value })
                }
                required
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
                Reports To (Supervisor Position) *
              </label>
              <select
                value={formData.supervisorPositionId}
                onChange={(e) =>
                  setFormData({ ...formData, supervisorPositionId: e.target.value })
                }
                required
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
                Hire Date *
              </label>
              <input
                type="date"
                value={formData.dateOfHire}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfHire: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Pay Grade *
              </label>
              <select
                value={formData.payGradeId}
                onChange={(e) =>
                  setFormData({ ...formData, payGradeId: e.target.value })
                }
                required
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
                Contract Type *
              </label>
              <select
                value={formData.contractType}
                onChange={(e) =>
                  setFormData({ ...formData, contractType: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select Contract Type</option>
                <option value="FULL_TIME_CONTRACT">Full Time Contract</option>
                <option value="PART_TIME_CONTRACT">Part Time Contract</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Work Type *
              </label>
              <select
                value={formData.workType}
                onChange={(e) =>
                  setFormData({ ...formData, workType: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select Work Type</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Contract Start Date *
              </label>
              <input
                type="date"
                value={formData.contractStartDate}
                onChange={(e) =>
                  setFormData({ ...formData, contractStartDate: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Contract End Date *
              </label>
              <input
                type="date"
                value={formData.contractEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, contractEndDate: e.target.value })
                }
                required
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
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
                placeholder="e.g., Bank of America"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Bank Account Number *
              </label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, bankAccountNumber: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
                placeholder="Account number"
              />
            </div>
          </div>
        </div>

        {/* System Role */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">System Role *</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Select one role for this employee.
          </p>

          <div className="space-y-3">
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
            ].map((roleOption) => (
              <label
                key={roleOption.value}
                className="flex items-center space-x-3 cursor-pointer hover:bg-neutral-800 p-2 rounded"
              >
                <input
                  type="radio"
                  name="role"
                  checked={formData.role === roleOption.value}
                  onChange={() => handleRoleChange(roleOption.value)}
                  className="w-4 h-4 border-neutral-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-neutral-900"
                />
                <span className="text-white">{roleOption.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 p-3 bg-neutral-800 rounded">
            <p className="text-sm text-neutral-400">
              Selected role: {formData.role}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 disabled:opacity-50 font-medium"
          >
            {saving ? "Creating..." : "Create Employee"}
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
    </div>
  );
}
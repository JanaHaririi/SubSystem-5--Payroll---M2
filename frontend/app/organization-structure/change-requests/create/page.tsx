"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/ApiClient";

export default function CreateChangeRequestPage() {
  const router = useRouter();

  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [form, setForm] = useState({
    requestType: "",
    targetDepartmentId: "",
    targetPositionId: "",
    details: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================
  // LOAD DEPARTMENTS AND POSITIONS
  // ============================
  const fetchData = async () => {
    try {
      const [deptRes, posRes] = await Promise.all([
        axiosInstance.get("/organization-structure/departments"),
        axiosInstance.get("/organization-structure/positions"),
      ]);
      setDepartments(deptRes.data);
      setPositions(posRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================
  // SUBMIT FORM
  // ============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: any = {
        requestType: form.requestType,
        details: form.details,
        reason: form.reason,
      };

      // Add optional fields based on request type
      if (form.targetDepartmentId) {
        payload.targetDepartmentId = form.targetDepartmentId;
      }
      if (form.targetPositionId) {
        payload.targetPositionId = form.targetPositionId;
      }

      await axiosInstance.post(
        "/organization-structure/change-requests",
        payload
      );

      alert("Change request submitted successfully!");
      router.push("/organization-structure/change-requests");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to submit change request"
      );
    } finally {
      setLoading(false);
    }
  };

  // Determine which fields to show based on request type
  const showDepartmentField =
    form.requestType === "NEW_DEPARTMENT" ||
    form.requestType === "UPDATE_DEPARTMENT" ||
    form.requestType === "NEW_POSITION";

  const showPositionField =
    form.requestType === "UPDATE_POSITION" ||
    form.requestType === "CLOSE_POSITION";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Submit Change Request
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Request changes to team assignments and organizational structure
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          {error && (
            <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* REQUEST TYPE */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Request Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.requestType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    requestType: e.target.value,
                    targetDepartmentId: "",
                    targetPositionId: "",
                  })
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select Request Type</option>
                <option value="NEW_DEPARTMENT">New Department</option>
                <option value="UPDATE_DEPARTMENT">Update Department</option>
                <option value="NEW_POSITION">New Position</option>
                <option value="UPDATE_POSITION">Update Position</option>
                <option value="CLOSE_POSITION">Close Position</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Choose the type of organizational change you want to request
              </p>
            </div>

            {/* TARGET DEPARTMENT (conditional) */}
            {showDepartmentField && (
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Department{" "}
                  {form.requestType === "NEW_POSITION" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <select
                  required={form.requestType === "NEW_POSITION"}
                  value={form.targetDepartmentId}
                  onChange={(e) =>
                    setForm({ ...form, targetDepartmentId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d: any) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* TARGET POSITION (conditional) */}
            {showPositionField && (
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Position <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.targetPositionId}
                  onChange={(e) =>
                    setForm({ ...form, targetPositionId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Position</option>
                  {positions.map((p: any) => (
                    <option key={p._id} value={p._id}>
                      {p.title} - {p.departmentId?.name || "N/A"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DETAILS */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Details <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder="Describe the changes you want to request in detail..."
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Provide specific details about the requested change
              </p>
            </div>

            {/* REASON */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Business Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Explain why this change is needed..."
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Justify the business need for this organizational change
              </p>
            </div>

            {/* INFO BOX */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> Your request will be submitted to System
                Admins for review and approval. You will receive a notification
                once your request is processed.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/organization-structure/change-requests")
                }
                className="px-5 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

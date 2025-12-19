"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/app/utils/ApiClient";

export default function EditPositionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    departmentId: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ============================
  // FETCH POSITION
  // ============================
  const fetchPosition = async () => {
    try {
      const res = await axiosInstance.get(
        `/organization-structure/positions/${id}`
      );
      const pos = res.data;

      setForm({
        code: pos.code,
        title: pos.title,
        description: pos.description || "",
        departmentId: pos.departmentId?._id || pos.departmentId || "",
        status: pos.isActive ? "Active" : "Inactive",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load position");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // FETCH DEPARTMENTS
  // ============================
  const fetchDepartments = async () => {
    try {
      const res = await axiosInstance.get(
        "/organization-structure/departments"
      );
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load departments");
    }
  };

  useEffect(() => {
    fetchPosition();
    fetchDepartments();
  }, [id]);

  // ============================
  // SUBMIT
  // ============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        code: form.code,
        title: form.title,
        description: form.description || "",
        departmentId: form.departmentId,
      };

      await axiosInstance.put(
        `/organization-structure/positions/${id}`,
        payload
      );

      router.push("/organization-structure/positions");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update position");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-600 dark:text-gray-400">
        Loading position...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Edit Position
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update position details
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">

          {error && (
            <p className="mb-4 text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* CODE */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Code
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* TITLE */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* DEPARTMENT */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                required
                value={form.departmentId}
                onChange={(e) =>
                  setForm({ ...form, departmentId: e.target.value })
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

            {/* ACTIONS */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? "Saving..." : "Update Position"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/organization-structure/positions")
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

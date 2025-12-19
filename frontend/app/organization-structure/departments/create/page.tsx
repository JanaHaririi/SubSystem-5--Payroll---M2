"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(system)/context/authContext";
import { isSystemAdmin } from "@/app/utils/roleCheck";

export default function CreateDepartmentPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // ===============================
  // STATE
  // ===============================
  const [form, setForm] = useState({
    name: "",
    code: "",
    status: "Active",
    headPositionId: "", // 👈 Head Position (position-based)
  });

  const [positions, setPositions] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ===============================
  // ROLE CHECK - System Admin Only
  // ===============================
  useEffect(() => {
    if (!authLoading && user && !isSystemAdmin(user)) {
      router.push("/organization-structure/departments");
    }
  }, [user, authLoading, router]);

  // ===============================
  // FETCH POSITIONS
  // ===============================
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch(
          "http://localhost:4000/organization-structure/positions",
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("Failed to load positions");

        const data = await res.json();
        console.log("📋 Loaded positions for department head selection:", data);
        setPositions(data);
      } catch (err) {
        console.error("❌ Error loading positions:", err);
      }
    };

    fetchPositions();
  }, []);

  // ===============================
  // SUBMIT
  // ===============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:4000/organization-structure/departments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            headPositionId: form.headPositionId || undefined,
            isActive: form.status === "Active",
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create department");
      }

      router.push("/organization-structure/departments");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // UI
  // ===============================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user || !isSystemAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Access denied. System Admin only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Create Department
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add a new department to the organization
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-xl">

          {error && (
            <div className="mb-4 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>

            {/* Code */}
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
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>

            {/* Head Position */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Head Position
              </label>
              <select
                value={form.headPositionId}
                onChange={(e) =>
                  setForm({ ...form, headPositionId: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">-- No Head Position --</option>
                {positions.map((pos) => (
                  <option key={pos._id} value={pos._id}>
                    {pos.title} ({pos.code})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Select which position is the head of this department
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Creating..." : "Create Department"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/organization-structure/departments")
                }
                className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
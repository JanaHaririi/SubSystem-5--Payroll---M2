"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [form, setForm] = useState({
    name: "",
    code: "",
    status: "Active",
    headPositionId: "",
  });

  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===============================
  // 🔥 FETCH department and positions
  // ===============================
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch department details
        const deptRes = await fetch(
          `http://localhost:4000/organization-structure/departments/${id}`,
          { credentials: "include" }
        );

        if (!deptRes.ok) throw new Error("Failed to load department");

        const dept = await deptRes.json();
        console.log("📊 Department data:", dept);

        // Handle headPositionId - could be ObjectId object or string
        let headPosId = "";
        if (dept.headPositionId) {
          headPosId = typeof dept.headPositionId === 'string'
            ? dept.headPositionId
            : dept.headPositionId._id || dept.headPositionId.toString();
        }
        console.log("🎯 Head Position ID:", headPosId);

        setForm({
          name: dept.name,
          code: dept.code,
          status: dept.isActive ? "Active" : "Inactive",
          headPositionId: headPosId,
        });

        // Fetch all positions
        const posRes = await fetch(
          `http://localhost:4000/organization-structure/positions`,
          { credentials: "include" }
        );

        if (posRes.ok) {
          const allPositions = await posRes.json();
          console.log("📋 All positions loaded:", allPositions);

          // Show ALL positions, not just department positions
          // This allows flexibility in assigning any position as department head
          setPositions(allPositions);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    if (id) fetchData();
  }, [id]);

  // ===============================
  // 🔥 SUBMIT
  // ===============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: form.name,
        code: form.code,
        isActive: form.status === "Active",
        headPositionId: form.headPositionId || undefined,
      };

      const res = await fetch(
        `http://localhost:4000/organization-structure/departments/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Update failed");
      }

      router.push("/organization-structure/departments");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // 🔥 UI
  // ===============================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Edit Department
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update department details and status
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
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              />
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

            {/* Head Position */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Department Head Position
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

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Saving..." : "Save Changes"}
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

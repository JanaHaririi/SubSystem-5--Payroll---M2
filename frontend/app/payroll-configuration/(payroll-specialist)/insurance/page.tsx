"use client";
import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useAuth } from "../../../(system)/context/authContext";

type Insurance = {
  _id: string;
  name: string;
  amount: number;
  minSalary: number;
  maxSalary: number;
  employeeRate: number;
  employerRate: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

const emptyForm: Omit<Insurance, "_id"> = {
  name: "",
  amount: 0,
  minSalary: 0,
  maxSalary: 0,
  employeeRate: 0,
  employerRate: 0,
  status: "draft",
};

export default function InsurancePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Insurance[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [apiBase, setApiBase] = useState<string | null>(null);

  const canManageDrafts = useMemo(
    () =>
      user?.roles?.some((r) =>
        ["payroll specialist", "hr manager"].includes(r.toLowerCase())
      ),
    [user?.roles]
  );

  const isHRManager = useMemo(
    () => user?.roles?.some((r) => r.toLowerCase() === "hr manager"),
    [user?.roles]
  );

  const fetchList = async () => {
    try {
      const res = await axiosInstance.get<Insurance[]>(
        "/payroll-configuration/insurance-brackets"
      );
      setItems(res.data);
      setStatusMsg(null);
    } catch (e: any) {
      const msg =
        e?.response?.status === 404
          ? "Backend endpoint not reachable. Please ensure the backend is running on http://localhost:4000 and you are logged in."
          : e?.response?.data?.message || "Failed to load insurance brackets";
      setError(msg);
    }
  };

  useEffect(() => {
    setApiBase(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");
    fetchList();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setStatusMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      setStatusMsg(null);
      if (editingId) {
        await axiosInstance.put(
          `/payroll-configuration/insurance-brackets/${editingId}`,
          form
        );
        setStatusMsg("Draft updated");
      } else {
        await axiosInstance.post(
          "/payroll-configuration/insurance-brackets",
          form
        );
        setStatusMsg("Draft created");
      }
      resetForm();
      await fetchList();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 404
          ? "Backend endpoint not reachable. Please ensure backend at 4000 is running."
          : "Save failed");
      if (form.status === 'approved' || form.status === 'rejected') {
        setError('You are not authorized to edit this insurance bracket');
      } else {
      setError(msg);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Insurance) => {
    if (item.status !== "draft") return;
    setEditingId(item._id);
    setForm({
      name: item.name,
      amount: item.amount,
      minSalary: item.minSalary,
      maxSalary: item.maxSalary,
      employeeRate: item.employeeRate,
      employerRate: item.employerRate,
      status: item.status,
    });
  };

  // NOTE: Payroll Specialist is not allowed to delete insurance brackets.

  const approve = async (id: string) => {
    try {
      await axiosInstance.post(
        `/payroll-configuration/approve/insurance/${id}`
      );
      await fetchList();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Approve failed");
    }
  };

  const reject = async (id: string) => {
    try {
      await axiosInstance.post(
        `/payroll-configuration/reject/insurance/${id}`
      );
      await fetchList();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Reject failed");
    }
  };

  return (
    <div className="text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Insurance Brackets</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Configure Insurance Brackets</h1>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col items-end">
            <span>Role: {user?.roles?.join(", ")}</span>
            {apiBase && <span className="text-xs text-gray-400 dark:text-gray-500">API: {apiBase}</span>}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200">
            {error}
          </div>
        )}
        {statusMsg && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200">
            {statusMsg}
          </div>
        )}

        {canManageDrafts && (
          <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Edit Draft" : "Create Draft"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700 dark:text-gray-300">Name</label>
                <input
                  className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  placeholder="Health Insurance"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700 dark:text-gray-300">Amount</label>
                <input
                  className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  placeholder="750"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700 dark:text-gray-300">Minimum Salary</label>
                <input
                  className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  placeholder="3000"
                  type="number"
                  value={form.minSalary}
                  onChange={(e) => setForm({ ...form, minSalary: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700 dark:text-gray-300">Maximum Salary</label>
                <input
                  className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  placeholder="7000"
                  type="number"
                  value={form.maxSalary}
                  onChange={(e) => setForm({ ...form, maxSalary: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700 dark:text-gray-300">Employee Rate (%)</label>
                <input
                  className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  placeholder="4"
                  type="number"
                  value={form.employeeRate}
                  onChange={(e) =>
                    setForm({ ...form, employeeRate: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700 dark:text-gray-300">Employer Rate (%)</label>
                <input
                  className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  placeholder="14"
                  type="number"
                  value={form.employerRate}
                  onChange={(e) =>
                    setForm({ ...form, employerRate: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-blue-600 px-5 py-2 text-white disabled:opacity-50 hover:bg-blue-700 transition"
                >
                  {loading ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded border px-5 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Insurance Brackets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                  <th className="py-2">Name</th>
                  <th>Range</th>
                  <th>Emp %</th>
                  <th>Employer %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition">
                    <td className="py-2 font-medium">{item.name}</td>
                    <td>
                      ${item.minSalary.toLocaleString()} - ${item.maxSalary.toLocaleString()}
                    </td>
                    <td>{item.employeeRate}%</td>
                    <td>{item.employerRate}%</td>
                    <td>
                      <span className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs capitalize">
                        {item.status}
                      </span>
                    </td>
                    <td className="space-x-2 py-2">
                      {canManageDrafts && item.status === "draft" && (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Edit
                          </button>
                        </>
                      )}
                      {isHRManager && item.status === "draft" && (
                        <>
                          <button
                            onClick={() => approve(item._id)}
                            className="text-green-600 dark:text-green-400 hover:underline"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reject(item._id)}
                            className="text-orange-600 dark:text-orange-400 hover:underline"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


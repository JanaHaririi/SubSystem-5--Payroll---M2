"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useRouter } from "next/navigation";

interface BenefitData {
  _id: string;
  name: string;
  amount: number;
  terms?: string;
  status: "draft" | "approved" | "rejected";
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CompensationBenefitsPage() {
  const [benefits, setBenefits] = useState<BenefitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "approved" | "rejected">("all");
  const [selected, setSelected] = useState<BenefitData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/payroll-configuration/termination-resignation-benefits");
        setBenefits(Array.isArray(res.data) ? res.data : []);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to fetch benefits");
      } finally {
        setLoading(false);
      }
    };
    fetchBenefits();
  }, []);

  const handleView = async (id: string) => {
    try {
      const res = await axiosInstance.get(`/payroll-configuration/termination-resignation-benefits/${id}`);
      setSelected(res.data);
      setShowModal(true);
    } catch (err: any) {
      alert("Failed to fetch benefit details");
    }
  };

  // NOTE: Payroll Specialist is not allowed to delete benefits.

  const filtered = statusFilter === "all" ? benefits : benefits.filter(i => i.status === statusFilter);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-200 text-gray-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500">Loading compensation benefits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Termination & Resignation Compensation Benefits</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage termination and resignation compensation benefits for employees</p>
        </div>
        <button
          onClick={() => router.push(`./config-benefits/create`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Create Benefit
        </button>
      </div>

      {/* Filter Dropdown */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">{error}</div>
      )}

      {/* Benefits Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-gray-900 dark:text-gray-100">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">BENEFIT NAME</th>
              <th className="px-6 py-3 text-left font-semibold">AMOUNT</th>
              <th className="px-6 py-3 text-left font-semibold">STATUS</th>
              <th className="px-6 py-3 text-left font-semibold">CREATED DATE</th>
              <th className="px-6 py-3 text-left font-semibold">LAST MODIFIED</th>
              <th className="px-6 py-3 text-center font-semibold">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.length > 0 ? (
              filtered.map(item => (
                <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{item.terms || "No terms"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">${item.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td>
                  <td className="px-6 py-4 text-sm">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleView(item._id)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition" title="View">👁️</button>
                      <button onClick={() => router.push(`./config-benefits/${item._id}/edit`)} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition" title="Edit">✏️</button>
                      {/* Payroll Specialist: view/edit only, no delete */}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No compensation benefits found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for viewing benefit details */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{selected.name}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Amount</label>
                <p className="mt-2 text-gray-900 dark:text-gray-100">${selected.amount.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</label>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selected.status)}`}>
                      {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Created Date</label>
                  <p className="mt-2 text-gray-900 dark:text-gray-100">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}</p>
                </div>
              </div>
              {selected.terms && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Terms & Conditions</label>
                  <p className="mt-2 text-gray-900 dark:text-gray-100">{selected.terms}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

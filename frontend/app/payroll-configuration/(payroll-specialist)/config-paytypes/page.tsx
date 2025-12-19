"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useRouter } from "next/navigation";

interface PayTypeData {
  _id: string;
  type: string;
  amount: number;
  status: "draft" | "approved" | "rejected";
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ConfigPayTypesPage() {
  const [payTypes, setPayTypes] = useState<PayTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "approved" | "rejected">("all");
  const [selectedPayType, setSelectedPayType] = useState<PayTypeData | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PayTypeData>>({});
  const router = useRouter();

  // Fetch all pay types
  useEffect(() => {
    fetchPayTypes();
  }, []);

  const fetchPayTypes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/payroll-configuration/pay-types");
      setPayTypes(response.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch pay types");
    } finally {
      setLoading(false);
    }
  };

  // View pay type details
  const handleView = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/payroll-configuration/pay-types/${id}`);
      setSelectedPayType(response.data);
      setShowViewModal(true);
    } catch (err: any) {
      setError("Failed to fetch pay type details");
    }
  };

  // Open edit modal
  const handleEditOpen = (payType: PayTypeData) => {
    setEditForm({ ...payType });
    setSelectedPayType(payType);
    setShowEditModal(true);
  };

  // Update pay type
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayType?._id) return;

    try {
      setLoading(true);
      await axiosInstance.put(`/payroll-configuration/pay-types/${selectedPayType._id}`, {
        type: editForm.type,
        amount: editForm.amount,
      });
      setSuccess("Pay type updated successfully");
      setShowEditModal(false);
      fetchPayTypes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update pay type");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/payroll-configuration/pay-types/${id}/approve`);
      setSuccess("Pay type approved");
      fetchPayTypes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to approve pay type");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/payroll-configuration/pay-types/${id}/reject`);
      setSuccess("Pay type rejected");
      fetchPayTypes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reject pay type");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/payroll-configuration/pay-types/${id}`);
      setSuccess("Pay type deleted");
      fetchPayTypes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete pay type");
    } finally {
      setLoading(false);
    }
  };

  // Filter pay types
  const filteredPayTypes = statusFilter === "all" 
    ? payTypes 
    : payTypes.filter(p => p.status === statusFilter);

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && payTypes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#0b1220] text-gray-100">
        <div className="text-lg text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-gray-100 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pay Types Configuration</h1>
          <p className="mt-1 text-gray-300">Manage salary components and pay types for your organization</p>
        </div>
        <button
          onClick={() => router.push("./config-paytypes/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Create Pay Type
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-900/40 text-red-100 rounded-lg border border-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/30 text-green-100 rounded-lg border border-green-700">
          {success}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-700 rounded-lg bg-[#0f172a] text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <table className="w-full text-sm text-gray-100">
          <thead className="bg-[#111827] border-b border-gray-800 text-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Pay Type</th>
              <th className="px-6 py-3 text-left font-semibold">Amount</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Created</th>
              <th className="px-6 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredPayTypes.length > 0 ? (
              filteredPayTypes.map((payType) => (
                <tr key={payType._id} className="hover:bg-[#111827] transition">
                  <td className="px-6 py-4 font-medium text-white">{payType.type}</td>
                  <td className="px-6 py-4 text-gray-200">${payType.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(payType.status)}`}>
                      {payType.status.charAt(0).toUpperCase() + payType.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {payType.createdAt
                      ? new Date(payType.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleView(payType._id)}
                        className="text-blue-300 hover:text-blue-200 transition text-lg"
                        title="View"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEditOpen(payType)}
                        className={`transition text-lg ${payType.status === "draft" ? "text-yellow-300 hover:text-yellow-200" : "text-gray-500 cursor-not-allowed"}`}
                        title={payType.status === "draft" ? "Edit" : "Edit allowed only for drafts"}
                        disabled={payType.status !== "draft"}
                      >
                        ✏️
                      </button>
                      {payType.status === "draft" && (
                        <>
                          <button
                            onClick={() => handleApprove(payType._id)}
                            className="text-green-300 hover:text-green-200 transition text-lg"
                            title="Approve"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => handleReject(payType._id)}
                            className="text-red-300 hover:text-red-200 transition text-lg"
                            title="Reject"
                          >
                            🚫
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(payType._id)}
                        className="text-red-400 hover:text-red-200 transition text-lg"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No pay types found. <button onClick={() => router.push("./config-paytypes/create")} className="text-blue-600 hover:underline">Create one now</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {showViewModal && selectedPayType && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] text-gray-100 rounded-lg shadow-lg max-w-md w-full border border-gray-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">{selectedPayType.type}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-300 hover:text-gray-100 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-300">Amount</label>
                <p className="mt-1 text-lg font-medium text-gray-100">${selectedPayType.amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300">Status</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedPayType.status)}`}>
                    {selectedPayType.status.charAt(0).toUpperCase() + selectedPayType.status.slice(1)}
                  </span>
                </div>
              </div>
              {selectedPayType.approvedAt && (
                <div>
                  <label className="text-sm font-semibold text-gray-300">Approved At</label>
                  <p className="mt-1 text-gray-100">{new Date(selectedPayType.approvedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPayType && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] text-gray-100 rounded-lg shadow-lg max-w-md w-full border border-gray-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Edit Pay Type</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-300 hover:text-gray-100 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Pay Type Name</label>
                <input
                  type="text"
                  value={editForm.type || ""}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0f172a] text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  value={editForm.amount || ""}
                  onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                  min="6000"
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0f172a] text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
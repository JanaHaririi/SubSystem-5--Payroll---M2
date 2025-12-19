"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useAuth } from "@/app/(system)/context/authContext";
import { useRouter } from "next/navigation";

interface SigningBonusData {
  _id: string;
  positionName: string;
  amount: number;
  status: "draft" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

export default function ReviewSigningBonusesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bonuses, setBonuses] = useState<SigningBonusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "approved" | "rejected">("all");
  const [selectedBonus, setSelectedBonus] = useState<SigningBonusData | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SigningBonusData>>({});

  // Role protection: Only Payroll Manager can access
  useEffect(() => {
    if (user && !user.roles?.includes("Payroll Manager")) {
      router.push("/unauthorized");
    }
  }, [user, router]);

  useEffect(() => {
    fetchBonuses();
  }, []);

  const fetchBonuses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/payroll-configuration/signing-bonuses");
      setBonuses(response.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch signing bonuses");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/payroll-configuration/signing-bonuses/${id}`);
      setSelectedBonus(response.data);
      setShowViewModal(true);
    } catch (err: any) {
      setError("Failed to fetch signing bonus details");
    }
  };

  const handleEditOpen = (bonus: SigningBonusData) => {
    if (bonus.status !== "draft") {
      setError("Only draft signing bonuses can be edited");
      return;
    }
    setEditForm({ ...bonus });
    setSelectedBonus(bonus);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBonus?._id) return;
    if (selectedBonus.status !== "draft") {
      setError("Only draft signing bonuses can be edited");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.put(`/payroll-configuration/signing-bonuses/${selectedBonus._id}`, {
        positionName: editForm.positionName,
        amount: editForm.amount,
      });
      setSuccess("Signing bonus updated successfully");
      setShowEditModal(false);
      fetchBonuses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update signing bonus");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/payroll-configuration/signing-bonuses/${id}/approve`);
      setSuccess("Signing bonus approved");
      fetchBonuses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to approve signing bonus");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/payroll-configuration/signing-bonuses/${id}/reject`);
      setSuccess("Signing bonus rejected");
      fetchBonuses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reject signing bonus");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this signing bonus?")) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/payroll-configuration/signing-bonuses/${id}`);
      setSuccess("Signing bonus deleted");
      fetchBonuses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete signing bonus");
    } finally {
      setLoading(false);
    }
  };

  const filteredBonuses = statusFilter === "all" 
    ? bonuses 
    : bonuses.filter(b => b.status === statusFilter);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (loading && bonuses.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#0b1220] text-gray-100">
        <div className="text-lg text-gray-300">Loading signing bonuses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-gray-100 space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Review & Approve Signing Bonuses</h1>
          <p className="mt-1 text-gray-300">Review, edit, approve, reject, or delete signing bonuses</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-900/60 text-red-100 rounded-lg">{error}</div>}
      {success && <div className="p-4 bg-green-900/60 text-green-100 rounded-lg">{success}</div>}

      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-700 rounded-lg bg-[#0f172a] text-gray-100"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <table className="w-full text-sm text-gray-100">
          <thead className="bg-[#111827] border-b border-gray-800 text-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Position Name</th>
              <th className="px-6 py-3 text-left font-semibold">Amount</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Created</th>
              <th className="px-6 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredBonuses.length > 0 ? (
              filteredBonuses.map((bonus) => (
                <tr key={bonus._id} className="hover:bg-[#111827] transition">
                  <td className="px-6 py-4 font-medium">{bonus.positionName}</td>
                  <td className="px-6 py-4">${bonus.amount?.toLocaleString() || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(bonus.status)}`}>
                      {bonus.status.charAt(0).toUpperCase() + bonus.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {bonus.createdAt ? new Date(bonus.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleView(bonus._id)}
                        className="text-blue-300 hover:text-blue-200 font-medium"
                        title="View"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEditOpen(bonus)}
                        disabled={bonus.status !== "draft"}
                        className={`font-medium ${
                          bonus.status === "draft"
                            ? "text-yellow-300 hover:text-yellow-200"
                            : "text-gray-600 cursor-not-allowed"
                        }`}
                        title={bonus.status === "draft" ? "Edit (draft only)" : "Cannot edit approved/rejected"}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleApprove(bonus._id)}
                        disabled={bonus.status !== "draft"}
                        className={`font-medium ${
                          bonus.status === "draft"
                            ? "text-green-300 hover:text-green-200"
                            : "text-gray-600 cursor-not-allowed"
                        }`}
                        title={bonus.status === "draft" ? "Approve" : "Only draft can be approved"}
                      >
                        ✅
                      </button>
                      <button
                        onClick={() => handleReject(bonus._id)}
                        disabled={bonus.status !== "draft"}
                        className={`font-medium ${
                          bonus.status === "draft"
                            ? "text-red-300 hover:text-red-200"
                            : "text-gray-600 cursor-not-allowed"
                        }`}
                        title={bonus.status === "draft" ? "Reject" : "Only draft can be rejected"}
                      >
                        🚫
                      </button>
                      <button
                        onClick={() => handleDelete(bonus._id)}
                        className="text-red-400 hover:text-red-200 font-medium"
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
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  No signing bonuses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {showViewModal && selectedBonus && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] text-gray-100 rounded-lg shadow-lg max-w-md w-full border border-gray-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">{selectedBonus.positionName}</h2>
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
                <p className="mt-1 text-lg font-medium text-gray-100">${selectedBonus.amount?.toLocaleString() || 0}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300">Status</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedBonus.status)}`}>
                    {selectedBonus.status.charAt(0).toUpperCase() + selectedBonus.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
              {selectedBonus.status === "draft" && (
                <>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditOpen(selectedBonus);
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleApprove(selectedBonus._id);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleReject(selectedBonus._id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleDelete(selectedBonus._id);
                }}
                className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition"
              >
                Delete
              </button>
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
      {showEditModal && selectedBonus && selectedBonus.status === "draft" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] text-gray-100 rounded-lg shadow-lg max-w-md w-full border border-gray-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Edit Signing Bonus</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-300 hover:text-gray-100 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Position Name</label>
                <input
                  type="text"
                  value={editForm.positionName || ""}
                  onChange={(e) => setEditForm({ ...editForm, positionName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#111827] text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  value={editForm.amount || ""}
                  onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                  min="0"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#111827] text-gray-100"
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
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


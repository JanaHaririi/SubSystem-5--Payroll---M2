"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(system)/context/authContext";

interface PolicyData {
  _id: string;
  policyName: string;
  policyType: string;
  description: string;
  effectiveDate: string;
  ruleDefinition: {
    percentage: number;
    fixedAmount: number;
    thresholdAmount: number;
  };
  status: "draft" | "approved" | "rejected";
  applicability: string;
  createdBy?: string;
  updatedAt?: string;
}

export default function ReviewPoliciesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "approved" | "rejected">("all");
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PolicyData>>({});

  // Role protection: Only Payroll Manager can access
  useEffect(() => {
    if (user && !user.roles?.includes("Payroll Manager")) {
      router.push("/unauthorized");
    }
  }, [user, router]);

  useEffect(() => {
    fetchAllPolicies();
  }, []);

  const fetchAllPolicies = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/payroll-configuration/policies");
      setPolicies(response.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch policies");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/payroll-configuration/policies/${id}`);
      setSelectedPolicy(response.data);
      setShowModal(true);
    } catch {
      setError("Failed to fetch policy details");
    }
  };

  const handleEditOpen = (policy: PolicyData) => {
    if (policy.status !== "draft") {
      setError("Only draft policies can be edited");
      return;
    }
    setEditForm({ ...policy });
    setSelectedPolicy(policy);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy?._id) return;
    if (selectedPolicy.status !== "draft") {
      setError("Only draft policies can be edited");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.put(`/payroll-configuration/policies/${selectedPolicy._id}`, {
        policyName: editForm.policyName,
        policyType: editForm.policyType,
        description: editForm.description,
        effectiveDate: editForm.effectiveDate,
        ruleDefinition: editForm.ruleDefinition,
        applicability: editForm.applicability,
      });
      setSuccess("Policy updated successfully");
      setShowEditModal(false);
      fetchAllPolicies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update policy");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/payroll-configuration/${id}/approve`);
      setSuccess("Policy approved");
      fetchAllPolicies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to approve policy");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/payroll-configuration/${id}/reject`);
      setSuccess("Policy rejected");
      fetchAllPolicies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reject policy");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/payroll-configuration/policies/${id}`);
      setSuccess("Policy deleted");
      fetchAllPolicies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete policy");
    } finally {
      setLoading(false);
    }
  };

  const filteredPolicies =
    statusFilter === "all" ? policies : policies.filter((p) => p.status === statusFilter);

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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Deduction":
        return "text-red-400";
      case "Allowance":
        return "text-green-300";
      case "Benefit":
        return "text-blue-300";
      case "Leave":
        return "text-purple-300";
      case "Misconduct":
        return "text-red-400";
      default:
        return "text-gray-300";
    }
  };

  if (loading && policies.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#0b1220] text-gray-100">
        <div className="text-lg text-gray-300">Loading policies...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-gray-100 space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Review & Approve Policies</h1>
          <p className="mt-1 text-gray-300">
            Review, edit, approve, reject, or delete payroll policies
          </p>
        </div>
      </div>

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

      {error && <div className="p-4 bg-red-900/60 text-red-100 rounded-lg">{error}</div>}
      {success && <div className="p-4 bg-green-900/60 text-green-100 rounded-lg">{success}</div>}

      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <table className="w-full text-sm text-gray-100">
          <thead className="bg-[#111827] border-b border-gray-800 text-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">POLICY NAME</th>
              <th className="px-6 py-3 text-left font-semibold">TYPE</th>
              <th className="px-6 py-3 text-left font-semibold">STATUS</th>
              <th className="px-6 py-3 text-left font-semibold">EFFECTIVE DATE</th>
              <th className="px-6 py-3 text-left font-semibold">LAST MODIFIED</th>
              <th className="px-6 py-3 text-center font-semibold">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredPolicies.length > 0 ? (
              filteredPolicies.map((policy) => (
                <tr key={policy._id} className="hover:bg-[#111827] transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{policy.policyName}</p>
                      <p className="text-gray-400 text-xs">{policy.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${getTypeBadgeColor(policy.policyType)}`}>
                      {policy.policyType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        policy.status
                      )}`}
                    >
                      {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(policy.effectiveDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleView(policy._id)}
                        className="text-blue-300 hover:text-blue-200 font-medium"
                        title="View"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEditOpen(policy)}
                        disabled={policy.status !== "draft"}
                        className={`font-medium ${
                          policy.status === "draft"
                            ? "text-yellow-300 hover:text-yellow-200"
                            : "text-gray-600 cursor-not-allowed"
                        }`}
                        title={policy.status === "draft" ? "Edit (draft only)" : "Cannot edit approved/rejected"}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleApprove(policy._id)}
                        disabled={policy.status !== "draft"}
                        className={`font-medium ${
                          policy.status === "draft"
                            ? "text-green-300 hover:text-green-200"
                            : "text-gray-600 cursor-not-allowed"
                        }`}
                        title={policy.status === "draft" ? "Approve" : "Only draft can be approved"}
                      >
                        ✅
                      </button>
                      <button
                        onClick={() => handleReject(policy._id)}
                        disabled={policy.status !== "draft"}
                        className={`font-medium ${
                          policy.status === "draft"
                            ? "text-red-300 hover:text-red-200"
                            : "text-gray-600 cursor-not-allowed"
                        }`}
                        title={policy.status === "draft" ? "Reject" : "Only draft can be rejected"}
                      >
                        🚫
                      </button>
                      <button
                        onClick={() => handleDelete(policy._id)}
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
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No policies found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {showModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] text-gray-100 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-[#0f172a]">
              <h2 className="text-2xl font-bold text-white">{selectedPolicy.policyName}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-300 hover:text-gray-100 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-300">Description</label>
                <p className="mt-2 text-gray-100">{selectedPolicy.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-300">Policy Type</label>
                  <p className={`mt-2 font-medium ${getTypeBadgeColor(selectedPolicy.policyType)}`}>
                    {selectedPolicy.policyType}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-300">Status</label>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedPolicy.status)}`}>
                      {selectedPolicy.status.charAt(0).toUpperCase() + selectedPolicy.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-300">Effective Date</label>
                  <p className="mt-2 text-gray-100">
                    {new Date(selectedPolicy.effectiveDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-300">Applicability</label>
                  <p className="mt-2 text-gray-100">{selectedPolicy.applicability}</p>
                </div>
              </div>

              <div className="bg-[#111827] p-4 rounded-lg border border-gray-800">
                <h3 className="font-semibold text-white mb-4">Rule Definition</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400">Percentage</label>
                    <p className="mt-1 text-lg font-semibold text-gray-100">{selectedPolicy.ruleDefinition.percentage}%</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400">Fixed Amount</label>
                    <p className="mt-1 text-lg font-semibold text-gray-100">${selectedPolicy.ruleDefinition.fixedAmount}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400">Threshold Amount</label>
                    <p className="mt-1 text-lg font-semibold text-gray-100">${selectedPolicy.ruleDefinition.thresholdAmount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-800 bg-[#0f172a]">
              {selectedPolicy.status === "draft" && (
                <>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      handleEditOpen(selectedPolicy);
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      handleApprove(selectedPolicy._id);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      handleReject(selectedPolicy._id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowModal(false);
                  handleDelete(selectedPolicy._id);
                }}
                className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPolicy && selectedPolicy.status === "draft" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] text-gray-100 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-[#0f172a]">
              <h2 className="text-2xl font-bold text-white">Edit Policy</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-300 hover:text-gray-100 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Policy Name</label>
                <input
                  type="text"
                  value={editForm.policyName || ""}
                  onChange={(e) => setEditForm({ ...editForm, policyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#111827] text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#111827] text-gray-100"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Policy Type</label>
                  <select
                    value={editForm.policyType || ""}
                    onChange={(e) => setEditForm({ ...editForm, policyType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#111827] text-gray-100"
                    required
                  >
                    <option value="Deduction">Deduction</option>
                    <option value="Allowance">Allowance</option>
                    <option value="Benefit">Benefit</option>
                    <option value="Misconduct">Misconduct</option>
                    <option value="Leave">Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={editForm.effectiveDate ? editForm.effectiveDate.slice(0, 10) : ""}
                    onChange={(e) => setEditForm({ ...editForm, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#111827] text-gray-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Rule Definition</label>
                <div className="grid grid-cols-3 gap-4 bg-[#111827] p-4 rounded-lg">
                  <div>
                    <label className="text-xs font-medium text-gray-400">Percentage</label>
                    <input
                      type="number"
                      value={editForm.ruleDefinition?.percentage || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          ruleDefinition: {
                            ...editForm.ruleDefinition!,
                            percentage: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0f172a] text-gray-100 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400">Fixed Amount</label>
                    <input
                      type="number"
                      value={editForm.ruleDefinition?.fixedAmount || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          ruleDefinition: {
                            ...editForm.ruleDefinition!,
                            fixedAmount: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0f172a] text-gray-100 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400">Threshold Amount</label>
                    <input
                      type="number"
                      value={editForm.ruleDefinition?.thresholdAmount || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          ruleDefinition: {
                            ...editForm.ruleDefinition!,
                            thresholdAmount: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0f172a] text-gray-100 mt-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Applicability</label>
                <input
                  type="text"
                  value={editForm.applicability || ""}
                  onChange={(e) => setEditForm({ ...editForm, applicability: e.target.value })}
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

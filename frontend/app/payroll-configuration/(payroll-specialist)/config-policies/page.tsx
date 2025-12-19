"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useRouter } from "next/navigation";

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

export default function ConfigPoliciesPage() {
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "approved" | "rejected">("all");
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchAllPolicies = async () => {
      try {
        const response = await axiosInstance.get("/payroll-configuration/policies");
        setPolicies(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to fetch policies");
      } finally {
        setLoading(false);
      }
    };
    fetchAllPolicies();
  }, []);

  const handleView = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/payroll-configuration/policies/${id}`);
      setSelectedPolicy(response.data);
      setShowModal(true);
    } catch {
      setError("Failed to fetch policy details");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await axiosInstance.put(`/payroll-configuration/${id}/approve`);
      setPolicies((prev) => prev.map((p) => (p._id === id ? { ...p, status: "approved" } : p)));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Approve failed");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await axiosInstance.put(`/payroll-configuration/${id}/reject`);
      setPolicies((prev) => prev.map((p) => (p._id === id ? { ...p, status: "rejected" } : p)));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Reject failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/payroll-configuration/${id}`);
      setPolicies((prev) => prev.filter((p) => p._id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Delete failed");
    }
  };

  const filteredPolicies =
    statusFilter === "all" ? policies : policies.filter((p) => p.status === statusFilter);

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

  if (loading) {
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
          <h1 className="text-3xl font-bold text-white">Payroll Policies</h1>
          <p className="mt-1 text-gray-300">
            Manage misconduct penalties, leave policies, and allowances
          </p>
        </div>
        <button
          onClick={() => router.push("./config-policies/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Create Policy
        </button>
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
                        onClick={() => router.push(`./config-policies/${policy._id}/edit`)}
                        className="text-yellow-300 hover:text-yellow-200 font-medium"
                        title="Edit (draft only)"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleApprove(policy._id)}
                        className="text-green-300 hover:text-green-200 font-medium"
                        title="Approve"
                      >
                        ✅
                      </button>
                      <button
                        onClick={() => handleReject(policy._id)}
                        className="text-red-300 hover:text-red-200 font-medium"
                        title="Reject"
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
              <button
                onClick={() => handleApprove(selectedPolicy._id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(selectedPolicy._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Reject
              </button>
              <button
                onClick={() => handleDelete(selectedPolicy._id)}
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
    </div>
  );
}

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

export default function ConfigPoliciesPage() {
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "approved" | "rejected">("all");
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();


  //get all policies
  useEffect(() => {
    const fetchAllPolicies = async () => {
      try {
        const response = await axiosInstance.get("/payroll-configuration/policies");
        setPolicies(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to fetch policies");
      } finally {
        setLoading(false);
      }
    };
    fetchAllPolicies();
  }, []);

  //get policy by id
  const handleView = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/payroll-configuration/policies/${id}`);
      setSelectedPolicy(response.data);
      setShowModal(true);
    } catch (err: any) {
      alert("Failed to fetch policy details");
    }
  };

  // NOTE: Payroll Specialist is not allowed to delete policies.

  //for filtering
  const filteredPolicies = statusFilter === "all" 
    ? policies 
    : policies.filter(p => p.status === statusFilter);
/*
  const handleApprove = async (id: string) => {
    try {
      await axiosInstance.put(`/payroll-configuration/${id}/approve`);
      setPolicies((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: "approved" } : p))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "Approve failed");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await axiosInstance.put(`/payroll-configuration/${id}/reject`);
      setPolicies((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: "rejected" } : p))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "Reject failed");
    }
  };
*/

  //colours
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Deduction":
        return "text-red-600";
      case "Allowance":
        return "text-green-600";
      case "Benefit":
        return "text-blue-600";
      case "Leave":
        return "text-purple-600";
      case "Misconduct":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500">Loading policies...</div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Payroll Policies</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage misconduct penalties, leave policies, and allowances</p>
        </div>
        <button
          onClick={() => router.push("./config-policies/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Create Policy
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
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Policies Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-gray-900 dark:text-gray-100">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">POLICY NAME</th>
              <th className="px-6 py-3 text-left font-semibold">TYPE</th>
              <th className="px-6 py-3 text-left font-semibold">STATUS</th>
              <th className="px-6 py-3 text-left font-semibold">EFFECTIVE DATE</th>
              <th className="px-6 py-3 text-left font-semibold">LAST MODIFIED</th>
              <th className="px-6 py-3 text-center font-semibold">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPolicies.length > 0 ? (
              filteredPolicies.map((policy) => (
                <tr key={policy._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{policy.policyName}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{policy.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${getTypeBadgeColor(policy.policyType)}`}>
                      {policy.policyType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(policy.status)}`}>
                      {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(policy.effectiveDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {policy.updatedAt
                      ? new Date(policy.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleView(policy._id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                        title="View"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => router.push(`./config-policies/${policy._id}/edit`)}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition"
                        title="Edit"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No policies found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for viewing policy details */}
      {showModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{selectedPolicy.policyName}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Description</label>
                <p className="mt-2 text-gray-900 dark:text-gray-100">{selectedPolicy.description}</p>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Policy Type */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Policy Type</label>
                  <p className={`mt-2 font-medium ${getTypeBadgeColor(selectedPolicy.policyType)}`}>
                    {selectedPolicy.policyType}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</label>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedPolicy.status)}`}>
                      {selectedPolicy.status.charAt(0).toUpperCase() + selectedPolicy.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Effective Date */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Effective Date</label>
                  <p className="mt-2 text-gray-900 dark:text-gray-100">
                    {new Date(selectedPolicy.effectiveDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Applicability */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Applicability</label>
                  <p className="mt-2 text-gray-900 dark:text-gray-100">{selectedPolicy.applicability}</p>
                </div>
              </div>

              {/* Rule Definition */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Rule Definition</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Percentage</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedPolicy.ruleDefinition.percentage}%</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Fixed Amount</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">${selectedPolicy.ruleDefinition.fixedAmount}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Threshold Amount</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">${selectedPolicy.ruleDefinition.thresholdAmount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
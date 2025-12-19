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
                  <td className="px-6 py-4 flex items-center justify-center gap-4">
                    <button
                      onClick={() => handleView(policy._id)}
                      className="text-blue-300 hover:text-blue-200 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-4 text-center text-gray-400" colSpan={6}>
                  No policies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] text-gray-100 rounded-lg shadow-lg max-w-lg w-full border border-gray-800">
            <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Policy Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-100">
                ✕
              </button>
            </div>
            <div className="px-4 py-3 space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-200">Name:</span> {selectedPolicy.policyName}
              </div>
              <div>
                <span className="font-medium text-gray-200">Type:</span> {selectedPolicy.policyType}
              </div>
              <div>
                <span className="font-medium text-gray-200">Applicability:</span>{" "}
                {selectedPolicy.applicability}
              </div>
              <div>
                <span className="font-medium text-gray-200">Effective:</span>{" "}
                {new Date(selectedPolicy.effectiveDate).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium text-gray-200">Status:</span> {selectedPolicy.status}
              </div>
              <div>
                <span className="font-medium text-gray-200">Rule:</span>{" "}
                {selectedPolicy.ruleDefinition?.percentage}% | {selectedPolicy.ruleDefinition?.fixedAmount} |{" "}
                {selectedPolicy.ruleDefinition?.thresholdAmount}
              </div>
              <div>
                <span className="font-medium text-gray-200">Description:</span>{" "}
                {selectedPolicy.description}
              </div>
            </div>
            <div className="border-t border-gray-800 px-4 py-3 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded bg-gray-800 text-gray-100 hover:bg-gray-700"
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


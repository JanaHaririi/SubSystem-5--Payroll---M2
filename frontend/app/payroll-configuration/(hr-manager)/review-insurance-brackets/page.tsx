"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllInsuranceBracketsForHR,
  getInsuranceBracketByIdForHR,
  approveInsuranceBracket,
  rejectInsuranceBracket,
  type InsuranceBracket,
} from "@/app/utils/insuranceBracketsApi";

export default function ReviewInsuranceBracketsPage() {
  const [brackets, setBrackets] = useState<InsuranceBracket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "approved" | "rejected">("all");
  const [selectedBracket, setSelectedBracket] = useState<InsuranceBracket | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const router = useRouter();

  // Get all insurance brackets
  useEffect(() => {
    const fetchBrackets = async () => {
      try {
        const data = await getAllInsuranceBracketsForHR();
        setBrackets(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to fetch insurance brackets");
      } finally {
        setLoading(false);
      }
    };
    fetchBrackets();
  }, []);

  // Get bracket by id
  const handleView = async (id: string) => {
    try {
      const data = await getInsuranceBracketByIdForHR(id);
      setSelectedBracket(data);
      setShowModal(true);
    } catch (err: any) {
      alert("Failed to fetch insurance bracket details");
    }
  };

  // Approve insurance bracket
  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this insurance bracket?")) return;
    
    setProcessing(id);
    try {
      await approveInsuranceBracket(id);
      // Refresh the list
      const data = await getAllInsuranceBracketsForHR();
      setBrackets(data);
      if (selectedBracket?._id === id) {
        setShowModal(false);
      }
      alert("Insurance bracket approved successfully");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve insurance bracket");
    } finally {
      setProcessing(null);
    }
  };

  // Reject insurance bracket
  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this insurance bracket?")) return;
    
    setProcessing(id);
    try {
      await rejectInsuranceBracket(id);
      // Refresh the list
      const data = await getAllInsuranceBracketsForHR();
      setBrackets(data);
      if (selectedBracket?._id === id) {
        setShowModal(false);
      }
      alert("Insurance bracket rejected successfully");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reject insurance bracket");
    } finally {
      setProcessing(null);
    }
  };

  // Filter brackets
  const filteredBrackets = statusFilter === "all"
    ? brackets
    : brackets.filter(b => b.status === statusFilter);

  // Status badge colors
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "draft":
        return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading insurance brackets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Review Insurance Brackets
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Review and approve/reject insurance bracket configurations
          </p>
        </div>
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

      {/* Brackets Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-gray-900 dark:text-gray-100">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">INSURANCE NAME</th>
              <th className="px-6 py-3 text-left font-semibold">SALARY RANGE</th>
              <th className="px-6 py-3 text-left font-semibold">EMPLOYEE RATE</th>
              <th className="px-6 py-3 text-left font-semibold">EMPLOYER RATE</th>
              <th className="px-6 py-3 text-left font-semibold">AMOUNT</th>
              <th className="px-6 py-3 text-left font-semibold">STATUS</th>
              <th className="px-6 py-3 text-center font-semibold">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredBrackets.length > 0 ? (
              filteredBrackets.map((bracket) => (
                <tr
                  key={bracket._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium">{bracket.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 dark:text-gray-100">
                      ${bracket.minSalary.toLocaleString()} - ${bracket.maxSalary.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {bracket.employeeRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {bracket.employerRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">${bracket.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        bracket.status
                      )}`}
                    >
                      {bracket.status.charAt(0).toUpperCase() + bracket.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleView(bracket._id!)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                        title="View"
                      >
                        👁️
                      </button>
                      {bracket.status === "draft" && (
                        <>
                          <button
                            onClick={() => handleApprove(bracket._id!)}
                            disabled={processing === bracket._id}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition disabled:opacity-50"
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleReject(bracket._id!)}
                            disabled={processing === bracket._id}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition disabled:opacity-50"
                            title="Reject"
                          >
                            ✗
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No insurance brackets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showModal && selectedBracket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {selectedBracket.name}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Insurance Name
                  </label>
                  <p className="mt-2 text-gray-900 dark:text-gray-100">{selectedBracket.name}</p>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Status
                  </label>
                  <div className="mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        selectedBracket.status
                      )}`}
                    >
                      {selectedBracket.status.charAt(0).toUpperCase() + selectedBracket.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Salary Range
                  </label>
                  <p className="mt-2 text-gray-900 dark:text-gray-100">
                    ${selectedBracket.minSalary.toLocaleString()} - ${selectedBracket.maxSalary.toLocaleString()}
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Amount
                  </label>
                  <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${selectedBracket.amount.toLocaleString()}
                  </p>
                </div>

                {/* Employee Rate */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Employee Rate
                  </label>
                  <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {selectedBracket.employeeRate}%
                  </p>
                </div>

                {/* Employer Rate */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Employer Rate
                  </label>
                  <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {selectedBracket.employerRate}%
                  </p>
                </div>
              </div>

              {/* Approved Info */}
              {selectedBracket.status === "approved" && selectedBracket.approvedAt && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                    Approval Information
                  </h3>
                  {selectedBracket.approvedBy && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Approved by: {selectedBracket.approvedBy}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Approved on:{" "}
                    {new Date(selectedBracket.approvedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              {selectedBracket.status === "draft" && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedBracket._id!);
                    }}
                    disabled={processing === selectedBracket._id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {processing === selectedBracket._id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedBracket._id!);
                    }}
                    disabled={processing === selectedBracket._id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {processing === selectedBracket._id ? "Processing..." : "Reject"}
                  </button>
                </>
              )}
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
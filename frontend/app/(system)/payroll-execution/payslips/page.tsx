// frontend/app/(system)/payroll-execution/payslips/page.tsx
"use client";

import { useState, useEffect } from "react";
import RoleGate from "../components/RoleGate";
import { payrollExecutionService } from "@/app/(system)/services/payrollExecutionService";

export default function PayslipsPage() {
  const [runId, setRunId] = useState("PR-2025-0001");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  async function fetchPayslips() {
    if (!runId.trim()) return;
    setFetchLoading(true);
    try {
      const response = await payrollExecutionService.getPayslipsByRunId(runId);
      // Handle both direct array and wrapped response
      const payslipsData = Array.isArray(response) ? response : (response?.data || []);
      setPayslips(payslipsData);
      console.log("Payslips fetched:", payslipsData);
    } catch (e: any) {
      setPayslips([]);
      console.error("Failed to fetch payslips:", e);
    } finally {
      setFetchLoading(false);
    }
  }

  useEffect(() => {
    fetchPayslips();
  }, [runId]);

  async function generate() {
    setMsg(null);
    setLoading(true);
    try {
      await payrollExecutionService.generatePayslips({ payrollRunId: runId });
      setMsg("Payslips generated successfully.");
      await fetchPayslips(); // Refresh the list
    } catch (e: any) {
      setMsg(e?.message || "Payslips generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payslips</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">View and manage payslips by payroll run</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payroll Run ID
            </label>
            <input
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
              type="text"
              placeholder="e.g., PR-2025-0001"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <RoleGate allow={["PAYROLL_SPECIALIST"]}>
          <button
            onClick={generate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Payslips"}
          </button>
        </RoleGate>

        {msg && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm">
            {msg}
          </div>
        )}
      </div>

      {/* Payslips List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payslips for: <span className="text-blue-600 dark:text-blue-400">{runId}</span>
          </h3>
        </div>

        <div className="px-6 py-4">
          {fetchLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Loading payslips...</p>
            </div>
          ) : payslips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No payslips found for this run.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Employee</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Email</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Base Salary</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Allowances</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Deductions</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Net Pay</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {payslips.map((slip: any) => (
                    <tr key={slip._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {slip.employeeId?.firstName} {slip.employeeId?.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{slip.employeeId?.email}</td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                        ${(slip.baseSalary ?? slip.earningsDetails?.baseSalary ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                        ${((slip.totalGrossSalary ?? 0) - (slip.baseSalary ?? slip.earningsDetails?.baseSalary ?? 0)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                        ${(slip.totaDeductions ?? slip.deductions ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-bold">
                        ${(slip.netPay ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          {slip.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// frontend/app/(system)/payroll-execution/runs/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(system)/context/authContext";
import { payrollExecutionService } from "@/app/(system)/services/payrollExecutionService";

export default function CreateRunPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [runId, setRunId] = useState("PR-2025-0001");
  const [period, setPeriod] = useState("2025-01-31");
  const [entity, setEntity] = useState("MyCompany");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit() {
    const employeeId = user?.userid;
    
    if (!employeeId) {
      setMsg("Error: User not authenticated or employee ID not found");
      console.log("User object:", user);
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      // Create the payroll run
      await payrollExecutionService.createRun({
        runId,
        entity,
        payrollPeriod: period,
        payrollSpecialistId: employeeId,
      });

      setMsg("Payroll run created successfully!");
      setTimeout(() => router.push("/payroll-execution/runs"), 1500);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || "Failed to create payroll run.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create Payroll Run</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Run ID
          </label>
          <input
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
            placeholder="PR-2025-0001"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Format: PR-YYYY-XXXX</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payroll Period (End Date)
          </label>
          <input
            type="date"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">End of payroll period (e.g., last day of month)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Entity Name
          </label>
          <input
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            placeholder="MyCompany"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Company or entity name (for reference only)</p>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading || !runId || !period}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
        >
          {loading ? "Creating..." : "Create Payroll Run"}
        </button>

        {msg && (
          <div className={`p-3 rounded-lg text-sm ${msg.includes("success") ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

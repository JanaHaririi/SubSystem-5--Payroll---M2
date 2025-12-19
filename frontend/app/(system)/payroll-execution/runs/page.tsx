// frontend/app/(system)/payroll-execution/runs/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DataTable from "../components/DataTable";
import StatusChip from "../components/StatusChip";
import { payrollExecutionService } from "@/app/(system)/services/payrollExecutionService";

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRuns() {
      try {
        const response = await payrollExecutionService.getAllRuns();
        setRuns(response.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to fetch payroll runs");
      } finally {
        setLoading(false);
      }
    }
    fetchRuns();
  }, []);

  if (loading) return <div className="text-gray-700 dark:text-gray-300" style={{ padding: 20 }}>Loading payroll runs...</div>;
  if (error) return <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-4" style={{ padding: 20 }}>{error}</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div className="text-gray-900 dark:text-white" style={{ fontSize: 18, fontWeight: 700 }}>Payroll Runs</div>
          <div className="text-gray-600 dark:text-gray-400" style={{ fontSize: 13 }}>Manage and process payroll runs across all entities</div>
        </div>

        <Link href="/payroll-execution/runs/new" style={{ padding: "10px 14px", borderRadius: 10, background: "#2563eb", color: "white" }}>
          + Create Run
        </Link>
      </div>

      <DataTable
        rows={runs}
        columns={[
          { key: "runId", title: "RUN ID / PERIOD", render: (r) => <div><div style={{ fontWeight: 700 }}>{r.runId}</div><div className="text-gray-600 dark:text-gray-400" style={{ fontSize: 12 }}>{new Date(r.payrollPeriod).toLocaleDateString()}</div></div> },
          { key: "entity", title: "ENTITY" },
          { key: "status", title: "STATUS", render: (r) => <StatusChip value={r.status} /> },
          { key: "employees", title: "EMPLOYEES / EXCEPTIONS", render: (r) => `${r.employees || 0} / ${r.exceptions || 0}` },
          { key: "totalnetpay", title: "TOTAL NET PAY", render: (r) => `$${(r.totalnetpay || 0).toLocaleString()}` },
          { key: "createdBy", title: "CREATED BY / DATE", render: (r) => (
            <div>
              <div style={{ fontWeight: 500 }}>{r.payrollSpecialistId?.firstName ? `${r.payrollSpecialistId.firstName} ${r.payrollSpecialistId.lastName}` : '—'}</div>
              <div className="text-gray-500 dark:text-gray-400" style={{ fontSize: 12 }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</div>
            </div>
          ) },
          { key: "actions", title: "ACTIONS", render: (r) => <Link href={`/payroll-execution/runs/${r.runId}`}>View</Link> },
        ]}
      />
    </div>
  );
}

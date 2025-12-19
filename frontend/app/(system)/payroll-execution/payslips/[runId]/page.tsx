// frontend/app/(system)/payroll-execution/payslips/[runId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RoleGate from "../../components/RoleGate";
import DataTable from "../../components/DataTable";
import { payrollExecutionService } from "@/app/(system)/services/payrollExecutionService";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function toCSV(rows: any[]): string {
  const headers = ["Employee", "Base", "Allowances", "Deductions", "Net Pay"];
  const body = rows.map(r => [
    `${r.employeeId?.firstName || ""} ${r.employeeId?.lastName || ""}`,
    r.baseSalary ?? 0,
    r.allowances ?? 0,
    r.deductions ?? 0,
    r.netPay ?? 0,
  ]);
  return [headers, ...body].map(arr => arr.join(",")).join("\n");
}

export default function PayslipsPage() {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [runId]);

  async function fetchData() {
    setLoading(true);
    setMsg(null);
    try {
      const runRes = await payrollExecutionService.getRunById(runId as string);
      setRun(runRes.data || runRes);
      const psRes = await payrollExecutionService.getPayslipsByRunId(runId as string);
      // Handle both direct array and wrapped response
      const payslipsData = Array.isArray(psRes) ? psRes : (psRes.data || []);
      setRows(payslipsData);
      console.log("Payslips loaded:", payslipsData);
    } catch (e: any) {
      const errorMsg = e?.response?.status === 404 
        ? `Payroll run "${runId}" not found. Please check the run ID exists.`
        : (e?.response?.data?.message || e?.message || "Failed to load payslips");
      setMsg(errorMsg);
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function generatePayslips() {
    setGenLoading(true);
    setMsg(null);
    try {
      const res = await payrollExecutionService.generatePayslips({ payrollRunId: runId });
      setMsg(res.data?.message || "Payslips generated");
      await fetchData();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Generate payslips failed");
    } finally {
      setGenLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading payslips...</div>;
  if (msg && !run) return <div style={{ padding: 20, color: "#dc2626" }}>{msg}</div>;
  if (!run) return <div style={{ padding: 20 }}>Run not found</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Payslips — {run.runId}</div>
          <div style={{ fontSize: 13, color: "#666" }}>Period: {new Date(run.payrollPeriod).toLocaleDateString()}</div>
          <div style={{ fontSize: 12, color: "#999" }}>Found {rows.length} payslips</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <RoleGate allow={[ "Payroll Specialist"]}>
            <button onClick={generatePayslips} disabled={genLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50">
              {genLoading ? "Generating..." : "Generate Payslips"}
            </button>
          </RoleGate>
          <button
            onClick={() => downloadFile(toCSV(rows), `payslips-${run.runId}.csv`, "text/csv")}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
          >
            Export CSV
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 20, background: "#fef3c7", borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "#92400e" }}>No payslips found for this run. Generate them first.</div>
        </div>
      ) : (
        <DataTable
          rows={rows}
          columns={[
            { key: "employee", title: "EMPLOYEE", render: (r) => `${r.employeeId?.firstName || ""} ${r.employeeId?.lastName || ""}` },
            { key: "baseSalary", title: "BASE", render: (r) => `$${(r.baseSalary ?? r.earningsDetails?.baseSalary ?? 0).toLocaleString()}` },
            { key: "allowances", title: "ALLOWANCES", render: (r) => {
                // Calculate allowances from totalGrossSalary - baseSalary
                const baseSalary = r.baseSalary ?? r.earningsDetails?.baseSalary ?? 0;
                const totalGross = r.totalGrossSalary ?? 0;
                const allowances = totalGross - baseSalary;
                return `$${(allowances || 0).toLocaleString()}`;
              }
            },
            { key: "deductions", title: "DEDUCTIONS", render: (r) => {
                const d = r.deductions ?? r.totaDeductions ?? 0;
                return `$${(d || 0).toLocaleString()}`;
              }
            },
            { key: "netPay", title: "NET PAY", render: (r) => `$${(r.netPay ?? 0).toLocaleString()}` },
          ]}
        />
      )}

      {msg && <div style={{ marginTop: 12, fontSize: 13, padding: 12, background: "#f0f9ff", borderRadius: 8 }}>{msg}</div>}
    </div>
  );
}

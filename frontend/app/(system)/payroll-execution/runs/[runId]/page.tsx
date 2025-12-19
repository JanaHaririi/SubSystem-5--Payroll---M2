// frontend/app/(system)/payroll-execution/runs/[runId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RunSummaryCards from "../../components/RunSummaryCards";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import RoleGate from "../../components/RoleGate";
import { payrollExecutionService } from "@/app/(system)/services/payrollExecutionService";

// Helper function to generate CSV
function generateCSV(employees: any[]): string {
  const headers = ["Employee", "Department", "Base Salary", "Allowances", "Deductions", "Net Pay", "Bank Status"];
  const rows = employees.map(e => [
    `${e.employeeId?.firstName} ${e.employeeId?.lastName}`,
    e.employeeId?.department || "—",
    e.baseSalary || 0,
    e.allowances || 0,
    e.deductions || 0,
    e.netPay || 0,
    e.bankStatus || "—",
  ]);
  
  const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  return csvContent;
}

// Helper function to generate PDF (basic text format)
function generatePDF(run: any, employees: any[]): string {
  let pdf = `PAYROLL REPORT - ${run.runId}\n`;
  pdf += `Period: ${new Date(run.payrollPeriod).toLocaleDateString()}\n`;
  pdf += `Entity: ${run.entity}\n`;
  pdf += `Total Employees: ${run.employees}\n`;
  pdf += `Total Net Pay: $${(run.totalnetpay || 0).toLocaleString()}\n`;
  pdf += `\n--- EMPLOYEE DETAILS ---\n\n`;
  
  employees.forEach(e => {
    pdf += `${e.employeeId?.firstName} ${e.employeeId?.lastName} (${e.employeeId?.department})\n`;
    pdf += `  Base Salary: $${(e.baseSalary || 0).toLocaleString()}\n`;
    pdf += `  Allowances: $${(e.allowances || 0).toLocaleString()}\n`;
    pdf += `  Deductions: $${(e.deductions || 0).toLocaleString()}\n`;
    pdf += `  Net Pay: $${(e.netPay || 0).toLocaleString()}\n`;
    pdf += `  Bank Status: ${e.bankStatus || "—"}\n\n`;
  });
  
  return pdf;
}

// Helper function to download file
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

export default function RunPreviewPage() {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();
  const [run, setRun] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isPeriodApproved, setIsPeriodApproved] = useState(false);

  useEffect(() => {
    fetchData();
  }, [runId]);

  useEffect(() => {
    // Check if the payroll period has been approved
    if (runId) {
      const approved = localStorage.getItem(`payroll-period-approved-${runId}`) === "true";
      setIsPeriodApproved(approved);
    }
  }, [runId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [runRes, empRes] = await Promise.all([
        payrollExecutionService.getRunById(runId),
        payrollExecutionService.getEmployeesByRunId(runId),
      ]);
      setRun(runRes.data);
      setEmployees(empRes.data || []);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Failed to fetch run details");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(name: string, fn: () => Promise<any>) {
    setMsg(null);
    setActionLoading(name);
    try {
      const res = await fn();
      setMsg(res?.data?.message || `${name} succeeded.`);
      await fetchData();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || `${name} failed.`);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="text-gray-700 dark:text-gray-300" style={{ padding: 20 }}>Loading run details...</div>;
  if (!run) return <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-4" style={{ padding: 20 }}>Run not found</div>;

  const grossTotal = employees.reduce(
    (sum, e) => sum + Number(e.baseSalary || 0) + Number(e.allowances || 0),
    0,
  );
  const deductionsTotal = employees.reduce(
    (sum, e) => sum + Number(e.deductions || 0),
    0,
  );

  const summary = [
    { label: "Total Employees", value: String(run.employees || employees.length || 0) },
    { label: "Total Net Pay", value: `$${(run.totalnetpay || 0).toLocaleString()}` },
    { label: "Exceptions", value: String(run.exceptions || 0) },
    { label: "Total Gross", value: `$${grossTotal.toLocaleString()}` },
    { label: "Total Deductions", value: `$${deductionsTotal.toLocaleString()}` },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div className="text-gray-900 dark:text-white" style={{ fontSize: 18, fontWeight: 700 }}>Payroll Preview — {run.runId}</div>
          <div className="text-gray-600 dark:text-gray-400" style={{ fontSize: 13 }}>Period: {new Date(run.payrollPeriod).toLocaleDateString()}</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <RoleGate allow={["Payroll Specialist"]}>
            <button
              onClick={() => router.push(`/payroll-execution/runs/${runId}/phase1`)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition"
              title="Review and approve payroll period"
            >
              📋 Phase 1: Review Period
            </button>
          </RoleGate>

          <RoleGate allow={["Payroll Specialist"]}>
            <button
              onClick={() => runAction("Generate Draft", () => payrollExecutionService.generateDraft({ payrollRunId: runId, payrollSpecialistId: run.payrollSpecialistId?._id || run.payrollSpecialistId }))}
              disabled={actionLoading !== null || !isPeriodApproved}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              title={!isPeriodApproved ? "Please approve the payroll period in Phase 1 first" : "Generate draft payslips"}
            >
              {actionLoading === "Generate Draft" ? "Simulating..." : "Run Simulation"}
            </button>
          </RoleGate>

          <RoleGate allow={["Payroll Specialist"]}>
            <button
              onClick={() => {
                const csv = generateCSV(employees);
                downloadFile(csv, `payroll-${run.runId}.csv`, "text/csv");
              }}
              title="Download as CSV"
              className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
            >
              📊 CSV
            </button>
          </RoleGate>

          <RoleGate allow={["Payroll Specialist"]}>
            <button
              onClick={() => {
                const pdf = generatePDF(run, employees);
                downloadFile(pdf, `payroll-${run.runId}.pdf`, "application/pdf");
              }}
              title="Download as PDF"
              className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
            >
              📄 PDF
            </button>
          </RoleGate>

          <RoleGate allow={["Payroll Specialist"]}>
            <button
              onClick={() => runAction("Send for Approval", () => payrollExecutionService.reviewDraft({ payrollRunId: runId }))}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {actionLoading === "Send for Approval" ? "Publishing..." : "Send for Approval"}
            </button>
          </RoleGate>

          <RoleGate allow={["Payroll Specialist", "Finance Staff", "Payroll Manager"]}>
            <a
              href={`/payroll-execution/payslips/${runId}`}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              title="View and export payslips"
            >
              🧾 Payslips
            </a>
          </RoleGate>
        </div>
      </div>

      <RunSummaryCards items={summary} />

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <RoleGate allow={["Payroll Specialist"]}>
          <button onClick={() => runAction("Generate Draft File", () => payrollExecutionService.generateDraftFile({ payrollRunId: runId, format: "csv" }))} style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 10 }}>
            Export Draft File
          </button>
        </RoleGate>

        <RoleGate allow={["Payroll Manager"]}>
          <button onClick={() => runAction("Manager Review", () => payrollExecutionService.managerReview(String(runId)))} style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 10 }}>
            Manager Review
          </button>
        </RoleGate>

        <RoleGate allow={["Payroll Manager"]}>
          <button onClick={() => runAction("Manager Approve", () => payrollExecutionService.managerApprove({ payrollRunId: runId }))} style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 10 }}>
            Manager Approve
          </button>
        </RoleGate>

        <RoleGate allow={["Finance Staff"]}>
          <button onClick={() => runAction("Finance Approve", () => payrollExecutionService.financeApprove({ payrollRunId: runId }))} style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 10 }}>
            Finance Approve
          </button>
        </RoleGate>

        <RoleGate allow={["Payroll Manager"]}>
          <button onClick={() => runAction("Lock Payroll", () => payrollExecutionService.lock({ payrollRunId: runId }))} style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 10 }}>
            Lock
          </button>
        </RoleGate>

        <RoleGate allow={["Payroll Manager"]}>
          <button onClick={() => runAction("Unfreeze Payroll", () => payrollExecutionService.unfreeze({ payrollRunId: runId, reason: "Manual adjustment needed" }))} style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 10 }}>
            Unfreeze
          </button>
        </RoleGate>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }} className="text-gray-900 dark:text-white">Employee Payroll Details ({employees.length})</div>

      <DataTable
        rows={employees}
        columns={[
          { key: "name", title: "EMPLOYEE", render: (r) => <div><div style={{ fontWeight: 700 }}>{r.employeeId?.firstName} {r.employeeId?.lastName}</div><div className="text-gray-600 dark:text-gray-400" style={{ fontSize: 12 }}>{r.employeeId?.department || "—"}</div></div> },
          { key: "baseSalary", title: "BASE SALARY", render: (r) => `$${(r.baseSalary || 0).toLocaleString()}` },
          { key: "allowances", title: "ALLOWANCES", render: (r) => `$${(r.allowances || 0).toLocaleString()}` },
          { key: "deductions", title: "DEDUCTIONS", render: (r) => `$${(r.deductions || 0).toLocaleString()}` },
          { key: "netPay", title: "NET PAY", render: (r) => `$${(r.netPay || 0).toLocaleString()}` },
          { key: "bankStatus", title: "BANK STATUS", render: (r) => <StatusChip value={r.bankStatus} /> },
          { key: "exceptions", title: "FLAGS", render: (r) => (r.exceptions ? <StatusChip value={r.exceptions} /> : "—") },
        ]}
      />

      {msg && <div style={{ marginTop: 12, fontSize: 13, padding: 12, background: "#f0f9ff", borderRadius: 8 }}>{msg}</div>}
    </div>
  );
}

// frontend/app/(system)/payroll-execution/pre-run/page.tsx
"use client";

import { useState, useEffect } from "react";
import DataTable from "../components/DataTable";
import StatusChip from "../components/StatusChip";
import { payrollExecutionService } from "@/app/(system)/services/payrollExecutionService";
import RoleGate from "../components/RoleGate";
import Modal from "../components/Modal";

type EventRow = {
  _id: string;
  employeeId: any;
  type: "Signing Bonus" | "Exit Benefits";
  status: string;
  amount: number;
  givenAmount: number;
  createdAt: string;
};

export default function PreRunPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<EventRow | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const [bonusRes, benefitRes] = await Promise.all([
        payrollExecutionService.getAllSigningBonuses(),
        payrollExecutionService.getAllExitBenefits(),
      ]);

      const bonuses = (bonusRes.data || []).map((b: any) => ({
        ...b,
        type: "Signing Bonus" as const,
        amount: b.givenAmount || b.signingBonusId?.amount || 0,
      }));

      const benefits = (benefitRes.data || []).map((b: any) => ({
        ...b,
        type: "Exit Benefits" as const,
        amount: b.givenAmount || b.benefitId?.benefitAmount || 0,
      }));

      setRows([...bonuses, ...benefits]);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }

  async function approve(r: EventRow) {
    setMsg(null);
    try {
      if (r.type === "Signing Bonus") await payrollExecutionService.approveSigningBonus(r._id);
      else await payrollExecutionService.approveExitBenefits(r._id);
      setMsg(`Approved ${r.type} for ${r.employeeId?.firstName || "employee"}`);
      await fetchEvents();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Approve failed");
    }
  }

  async function reject(r: EventRow) {
    setMsg(null);
    try {
      if (r.type === "Signing Bonus") await payrollExecutionService.rejectSigningBonus(r._id);
      else await payrollExecutionService.rejectExitBenefits(r._id);
      setMsg(`Rejected ${r.type} for ${r.employeeId?.firstName || "employee"}`);
      await fetchEvents();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Reject failed");
    }
  }

  async function validate() {
    setMsg(null);
    try {
      const res = await payrollExecutionService.validatePhase0();
      setMsg(res.data?.message || "Phase 0 validation passed.");
      // Store Phase 0 validation state in localStorage
      localStorage.setItem("phase0-validated", "true");
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Phase 0 validation failed.");
      localStorage.removeItem("phase0-validated");
    }
  }

  function openEditModal(r: EventRow) {
    setEditingRow(r);
    setEditAmount(r.givenAmount || 0);
  }

  async function saveEdit() {
    if (!editingRow) return;
    setMsg(null);
    try {
      if (editingRow.type === "Signing Bonus") {
        await payrollExecutionService.editSigningBonus(editingRow._id, { givenAmount: editAmount });
      } else {
        await payrollExecutionService.editExitBenefits(editingRow._id, { givenAmount: editAmount });
      }
      setMsg(`Updated ${editingRow.type} amount to $${editAmount.toLocaleString()}`);
      setEditingRow(null);
      await fetchEvents();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Update failed");
    }
  }

  function cancelEdit() {
    setEditingRow(null);
    setEditAmount(0);
  }

  if (loading) return <div style={{ padding: 20 }}>Loading pre-run events...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Pre-Run HR Events</div>
          <div style={{ fontSize: 13, color: "#666" }}>Approve/Reject Signing Bonus & Exit Benefits before starting payroll</div>
        </div>

        <RoleGate allow={["Payroll Specialist"]}>
          <button onClick={validate} style={{ padding: "10px 14px", borderRadius: 10, background: "#111827", color: "white", border: "none" }}>
            Validate Phase 0
          </button>
        </RoleGate>
      </div>

      <DataTable
        rows={rows}
        columns={[
          { key: "employee", title: "EMPLOYEE", render: (r) => `${r.employeeId?.firstName || ""} ${r.employeeId?.lastName || ""}` },
          { key: "type", title: "TYPE", render: (r) => <StatusChip value={r.type} /> },
          { key: "status", title: "STATUS", render: (r) => <StatusChip value={r.status} /> },
          { key: "amount", title: "AMOUNT", render: (r) => `$${r.amount?.toLocaleString()}` },
          { key: "createdAt", title: "CREATED DATE", render: (r) => new Date(r.createdAt).toLocaleDateString() },
          {
            key: "actions",
            title: "ACTIONS",
            render: (r) => (
              <RoleGate allow={["Payroll Specialist"]} fallback={<span style={{ color: "#888" }}>—</span>}>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => openEditModal(r)} disabled={r.status !== "pending"} style={{ border: "1px solid #ddd", padding: "6px 10px", borderRadius: 8 }}>Edit</button>
                  <button onClick={() => approve(r)} disabled={r.status !== "pending"} style={{ border: "1px solid #ddd", padding: "6px 10px", borderRadius: 8 }}>Approve</button>
                  <button onClick={() => reject(r)} disabled={r.status !== "pending"} style={{ border: "1px solid #ddd", padding: "6px 10px", borderRadius: 8 }}>Reject</button>
                </div>
              </RoleGate>
            ),
          },
        ]}
      />

      {msg && <div style={{ marginTop: 12, fontSize: 13, padding: 12, background: "#f0f9ff", borderRadius: 8 }}>{msg}</div>}

      {editingRow && (
        <Modal
          title={`Edit ${editingRow.type} Amount`}
          onClose={cancelEdit}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Employee: {editingRow.employeeId?.firstName} {editingRow.employeeId?.lastName}
              </label>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Amount (USD)
              </label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
              <button
                onClick={cancelEdit}
                style={{
                  padding: "8px 14px",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  background: "#111827",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Save Amount
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

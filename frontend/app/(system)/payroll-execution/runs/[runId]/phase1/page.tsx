// frontend/app/(system)/payroll-execution/runs/[runId]/phase1/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { payrollExecutionService } from "@/app/(system)/services/payrollExecutionService";
import RoleGate from "../../../components/RoleGate";
import Modal from "../../../components/Modal";
import { useAuth } from "@/app/(system)/context/authContext";

interface PayrollRun {
  _id: string;
  runId: string;
  entity: string;
  payrollPeriod: string;
  status: string;
  payrollSpecialistId: any;
}

export default function Phase1Page() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [editingPeriod, setEditingPeriod] = useState(false);
  const [newPeriod, setNewPeriod] = useState("");
  const [hasApproved, setHasApproved] = useState(false);
  const [isPhase0Validated, setIsPhase0Validated] = useState(false);

  useEffect(() => {
    fetchRun();
  }, []);

  useEffect(() => {
    // Check if this payroll period was already approved
    if (run) {
      const isApproved = localStorage.getItem(`payroll-period-approved-${run.runId}`) === "true";
      setHasApproved(isApproved);
    }
  }, [run]);

  useEffect(() => {
    // Check if Phase 0 has been validated
    const phase0Valid = localStorage.getItem("phase0-validated") === "true";
    setIsPhase0Validated(phase0Valid);
  }, []);

  async function fetchRun() {
    setLoading(true);
    try {
      console.log("Fetching run with ID:", params.runId);
      const res = await payrollExecutionService.getRunById(params.runId as string);
      console.log("Run fetch response:", res);
      if (!res.data) {
        setMsg("No data received from server");
        return;
      }
      setRun(res.data);
      setNewPeriod(res.data?.payrollPeriod || "");
    } catch (e: any) {
      console.error("Fetch error:", e);
      const errorMsg = e?.response?.data?.message || e?.message || "Failed to fetch payroll run";
      setMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function approvePeriod() {
    if (!run) return;
    setMsg(null);
    try {
      console.log("Approving with run status:", run.status);
      await payrollExecutionService.updatePayrollPeriod({
        payrollRunId: run.runId,
        payrollPeriod: run.payrollPeriod,
      });
      setMsg("✓ Payroll period approved. You can now start payroll initiation.");
      setHasApproved(true);
      // Store approval state in localStorage for the Run Simulation button
      localStorage.setItem(`payroll-period-approved-${run.runId}`, "true");
    } catch (e: any) {
      console.error("Approval error:", e?.response?.data);
      setMsg(e?.response?.data?.message || "Approval failed");
    }
  }

  async function rejectPeriod() {
    if (!run) return;
    setMsg(null);
    setEditingPeriod(true);
  }

  async function savePeriodEdit() {
    if (!run || !newPeriod) {
      setMsg("Please enter a valid payroll period");
      return;
    }
    setMsg(null);
    try {
      await payrollExecutionService.updatePayrollPeriod({
        payrollRunId: run.runId,
        payrollPeriod: newPeriod,
      });
      setMsg("Payroll period updated. Please review and resubmit for approval.");
      setEditingPeriod(false);
      await fetchRun();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Update failed");
    }
  }

  async function startInitiation() {
    if (!run) return;
    setMsg(null);
    try {
      await payrollExecutionService.startPayrollInitiation({
        payrollRunId: run.runId,
        payrollSpecialistId: (user as any)?.userid,
      });
      setMsg("Payroll initiation started! Proceeding to Phase 1.1 (Draft Generation)...");
      setTimeout(() => {
        router.push(`/payroll-execution/runs/${params.runId}`);
      }, 2000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Initiation failed");
    }
  }

  if (loading)
    return (
      <div style={{ padding: 20 }}>Loading Phase 1: Payroll Period Review...</div>
    );

  if (!run) return <div style={{ padding: 20 }}>Payroll run not found</div>;

  const periodDate = new Date(run.payrollPeriod).toLocaleDateString();
  const showInitiationButton = hasApproved;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Phase 1: Payroll Period Review
        </h1>
        <p style={{ fontSize: 14, color: "#666" }}>
          Review the payroll period to ensure it matches the current cycle. Approve to proceed with payroll initiation or reject to edit the period.
        </p>
      </div>

      {/* Phase 0 Warning */}
      {!isPhase0Validated && (
        <div
          style={{
            marginBottom: 20,
            fontSize: 14,
            padding: 12,
            backgroundColor: "#fef3c7",
            color: "#92400e",
            borderRadius: 8,
            border: "1px solid #fcd34d",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <strong>Phase 0 Not Validated:</strong> Please complete and validate Pre-Run HR Events before approving the payroll period.
          </div>
        </div>
      )}

      {/* Run Details Card */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          backgroundColor: "#ffffff25",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
              RUN ID
            </label>
            <p style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
              {run.runId}
            </p>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
              ENTITY
            </label>
            <p style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
              {run.entity}
            </p>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
              PAYROLL PERIOD (END DATE)
            </label>
            <p style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: "#0369a1" }}>
              {periodDate}
            </p>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
              STATUS :
            </label>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginTop: 4,
                color: showInitiationButton ? "#16a34a" : "#f59e0b",
                padding: "4px 6px",
                backgroundColor: showInitiationButton ? "#dcfce7" : "#fef3c7",
                borderRadius: 4,
                display: "inline-block",
              }}
            >
              {showInitiationButton ? "✓ APPROVED" : " PENDING APPROVAL"}
            </p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {msg && (
        <div
          style={{
            marginBottom: 20,
            fontSize: 14,
            padding: 12,
            backgroundColor: msg.includes("failed") ? "#fee2e2" : "#dcfce7",
            color: msg.includes("failed") ? "#991b1b" : "#166534",
            borderRadius: 8,
            border: `1px solid ${msg.includes("failed") ? "#fecaca" : "#86efac"}`,
          }}
        >
          {msg}
        </div>
      )}

      {/* Action Buttons */}
      <RoleGate allow={["Payroll Specialist"]}>
        <div style={{ display: "flex", gap: 12 }}>
          {!showInitiationButton ? (
            <>
              <button
                onClick={approvePeriod}
                disabled={!isPhase0Validated}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  backgroundColor: isPhase0Validated ? "#16a34a" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: isPhase0Validated ? "pointer" : "not-allowed",
                  opacity: isPhase0Validated ? 1 : 0.5,
                }}
                title={!isPhase0Validated ? "Please validate Phase 0 (Pre-Run HR Events) first" : ""}
              >
                ✓ Approve Period
              </button>
              <button
                onClick={rejectPeriod}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✗ Reject & Edit
              </button>
            </>
          ) : (
            <button
              onClick={startInitiation}
              style={{
                flex: 1,
                padding: "12px 16px",
                backgroundColor: "#0369a1",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ▶ Start Payroll Initiation
            </button>
          )}
        </div>
      </RoleGate>

      {/* Edit Period Modal */}
      {editingPeriod && (
        <Modal
          title="Reject & Edit Payroll Period"
          onClose={() => setEditingPeriod(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, color: "#666" }}>
              The payroll period has been rejected. Please enter the correct period end date and resubmit for approval.
            </p>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                New Payroll Period (End Date)
              </label>
              <input
                type="date"
                value={newPeriod ? new Date(newPeriod).toISOString().split("T")[0] : ""}
                onChange={(e) => setNewPeriod(new Date(e.target.value).toISOString())}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingPeriod(false)}
                style={{
                  padding: "10px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={savePeriodEdit}
                style={{
                  padding: "10px 16px",
                  borderRadius: 6,
                  backgroundColor: "#111827",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Save & Resubmit
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Claim = {
  _id: string;
  claimId?: string;
  description?: string;
  claimType?: string;
  amount?: number;
  employeeId?: string;
  status?: string;
  resolutionComment?: string;
};

type Dispute = {
  _id: string;
  disputeId?: string;
  description?: string;
  payslipId?: string;
  employeeId?: string;
  status?: string;
  resolutionComment?: string;
};

type DecisionKind = "claims" | "disputes";
type DecisionAction = "approve" | "reject";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API ||
  "http://localhost:4000";

export default function PayrollTrackingAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const normalizedRoles = useMemo(
    () =>
      ((user as any)?.roles || []).map((r: string) => r.toLowerCase().trim()),
    [user]
  );

  const isSpecialist = normalizedRoles.includes("payroll specialist");
  const isManager = normalizedRoles.includes("payroll manager");

  const [activeView, setActiveView] = useState<"specialist" | "manager">(
    isManager ? "manager" : "specialist"
  );
  const [claims, setClaims] = useState<Claim[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isManager && isSpecialist) {
      setActiveView("specialist");
    }
    if (isManager) {
      setActiveView("manager");
    }
  }, [isManager, isSpecialist]);

  useEffect(() => {
    if (loading) return;
    if (!isSpecialist && !isManager) return;

    const fetchQueues = async () => {
      setQueueLoading(true);
      setQueueError(null);
      try {
        const [claimsRes, disputesRes] = await Promise.all([
          fetch(`${API_BASE}/payroll-tracking/claims/pending`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`${API_BASE}/payroll-tracking/disputes/pending`, {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (claimsRes.status === 403 || disputesRes.status === 403) {
          setQueueError(
            "Access denied. Backend manager/specialist endpoints may need to allow your role."
          );
          setClaims([]);
          setDisputes([]);
          setQueueLoading(false);
          return;
        }

        if (!claimsRes.ok || !disputesRes.ok) {
          setQueueError("Failed to load queues.");
          setClaims([]);
          setDisputes([]);
          setQueueLoading(false);
          return;
        }

        const claimsJson = await claimsRes.json();
        const disputesJson = await disputesRes.json();

        setClaims(Array.isArray(claimsJson) ? claimsJson : []);
        setDisputes(Array.isArray(disputesJson) ? disputesJson : []);
      } catch (err) {
        console.error(err);
        setQueueError("Network error while loading queues.");
      } finally {
        setQueueLoading(false);
      }
    };

    fetchQueues();
  }, [loading, isSpecialist, isManager]);

  const handleDecision = async (
    kind: DecisionKind,
    id: string,
    action: DecisionAction
  ) => {
    setProcessingId(id);
    const resolutionComment = notes[id] || "";
    const status = action === "approve" ? "approved" : "rejected";

    try {
      const res = await fetch(
        `${API_BASE}/payroll-tracking/${kind}/${id}/${action}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, resolutionComment }),
        }
      );

      if (!res.ok) {
        setQueueError("Failed to submit decision. Check your role/permissions.");
        return;
      }

      // Refresh queues
      const updated = await res.json();
      console.log("Updated item", updated);
      // Filter out the decided item locally
      if (kind === "claims") {
        setClaims((prev) => prev.filter((c) => c._id !== id));
      } else {
        setDisputes((prev) => prev.filter((d) => d._id !== id));
      }
    } catch (err) {
      console.error(err);
      setQueueError("Network error while sending decision.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-white text-xl">Loading...</div>;
  }

  if (!isSpecialist && !isManager) {
    return (
      <div className="p-10 text-white space-y-3">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-gray-300">
          Only Payroll Specialists or Payroll Managers can view this panel.
        </p>
      </div>
    );
  }

  const renderQueueCard = (
    title: string,
    items: (Claim | Dispute)[],
    kind: DecisionKind
  ) => (
    <div className="bg-white text-black rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-gray-500">
          {items.length} pending item{items.length === 1 ? "" : "s"}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-600">No items in queue.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="border border-gray-200 rounded-lg p-3 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    ID: {(item as Claim).claimId || (item as Dispute).disputeId || item._id}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {item.description || "No description"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Employee: {item.employeeId || "N/A"}
                  </p>
                  {kind === "claims" && (
                    <p className="text-sm text-gray-500">
                      Amount: {(item as Claim).amount ?? "N/A"}
                    </p>
                  )}
                  {kind === "disputes" && (
                    <p className="text-sm text-gray-500">
                      Payslip: {(item as Dispute).payslipId || "N/A"}
                    </p>
                  )}
                </div>
              </div>

              {item.resolutionComment && (
                <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-700">
                  Specialist note: {item.resolutionComment}
                </div>
              )}

              <div className="space-y-2">
                <textarea
                  value={notes[item._id] || ""}
                  onChange={(e) =>
                    setNotes((prev) => ({
                      ...prev,
                      [item._id]: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add a manager note or justification (optional)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision(kind, item._id, "approve")}
                    disabled={processingId === item._id}
                    className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-500 disabled:opacity-60"
                  >
                    {processingId === item._id ? "Saving..." : "Final Approve"}
                  </button>
                  <button
                    onClick={() => handleDecision(kind, item._id, "reject")}
                    disabled={processingId === item._id}
                    className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-500 disabled:opacity-60"
                  >
                    {processingId === item._id ? "Saving..." : "Final Reject"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 text-white space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-400">Payroll Tracking</p>
          <h1 className="text-3xl font-bold">
            {activeView === "manager" ? "Manager Dashboard" : "Specialist Panel"}
          </h1>
          <p className="text-gray-300">
            Review claims and disputes. Specialists triage; managers finalize.
          </p>
        </div>
        <div className="flex gap-2">
          {isSpecialist && (
            <button
              onClick={() => setActiveView("specialist")}
              className={`px-3 py-2 rounded text-sm ${
                activeView === "specialist"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              Specialist View
            </button>
          )}
          {isManager && (
            <button
              onClick={() => setActiveView("manager")}
              className={`px-3 py-2 rounded text-sm ${
                activeView === "manager"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              Manager View
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="px-3 py-2 bg-gray-700 rounded text-sm hover:bg-gray-600"
          >
            Back
          </button>
        </div>
      </div>

      {queueError && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-lg p-3">
          {queueError}
        </div>
      )}

      {queueLoading ? (
        <div className="text-gray-300">Loading queues...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderQueueCard(
            activeView === "manager" ? "Claims (final approval)" : "Claims (triage)",
            claims,
            "claims"
          )}
          {renderQueueCard(
            activeView === "manager"
              ? "Disputes (final approval)"
              : "Disputes (triage)",
            disputes,
            "disputes"
          )}
        </div>
      )}
    </div>
  );
}

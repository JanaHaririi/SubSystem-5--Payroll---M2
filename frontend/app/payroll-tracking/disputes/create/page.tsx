"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateDisputePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [payslipId, setPayslipId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="text-white p-6">Loading...</div>;

  const employeeId = (user as any)?.userid || (user as any)?.employeeId;
  const apiBase = process.env.NEXT_PUBLIC_API || "http://localhost:4000";


  if (!employeeId) {
    return (
      <div className="p-10 text-red-400 text-xl">
        Error: Employee ID not found.  
        The authentication response must include "userid".
      </div>
    );
  }

  const submit = async () => {
    setError("");

    if (!message.trim() || !payslipId.trim()) {
      setError("Dispute description and payslip ID are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `${apiBase}/payroll-tracking/disputes`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            message, // preserved for DTO
            description: message, // align with schema requirement
            payslipId,
            disputeType: "GENERAL",
          }),
        }
      );

      if (res.status === 403) {
        setError("You do not have permission to create disputes.");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to create dispute.");
        setSubmitting(false);
        return;
      }

      router.push("/payroll-tracking/disputes/list");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-10 text-white">
      <h1 className="text-2xl font-bold mb-4">Create Dispute</h1>

      <div className="bg-white text-black p-6 rounded-lg space-y-4 shadow">
        {error && <p className="text-red-600">{error}</p>}

        <textarea
          className="border p-2 w-full rounded"
          placeholder="Describe your dispute..."
          value={message}
          rows={5}
          onChange={(e) => setMessage(e.target.value)}
        />

        <input
          className="border p-2 w-full rounded"
          placeholder="Payslip ID (required)"
          value={payslipId}
          onChange={(e) => setPayslipId(e.target.value)}
        />

        <button
          disabled={submitting}
          onClick={submit}
          className={`${
            submitting ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-500"
          } text-white px-4 py-2 rounded w-full transition`}
        >
          {submitting ? "Submitting..." : "Submit Dispute"}
        </button>
      </div>
    </div>
  );
}

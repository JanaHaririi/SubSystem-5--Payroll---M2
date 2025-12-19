"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function CreateRefundPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [employeeIdInput, setEmployeeIdInput] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const roles = (user as any)?.roles || [];
  const isFinanceStaff = useMemo(
    () => roles.some((r: string) => r.toLowerCase() === "finance staff"),
    [roles]
  );
  const apiBase = process.env.NEXT_PUBLIC_API || "http://localhost:4000";

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  if (!isFinanceStaff) {
    return (
      <div className="p-10 text-red-500 text-xl">
        Access denied. Only Finance Staff can create refunds.
      </div>
    );
  }

  const submit = async () => {
    setError("");

    if (!employeeIdInput.trim() || !description.trim() || !amount) {
      setError("Employee ID, amount, and description are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `${apiBase}/payroll-tracking/refunds`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: employeeIdInput.trim(),
            refundDetails: {
              description: description.trim(),
              amount: Number(amount),
            },
            financeStaffId: (user as any)?.userid,
          }),
        }
      );

      if (res.status === 403) {
        setError("You are not allowed to submit refunds.");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to submit refund.");
        setSubmitting(false);
        return;
      }

      router.push("/payroll-tracking/refunds/list");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-10 text-white">
      <h1 className="text-2xl font-bold mb-4">Create Refund</h1>

      <div className="bg-white text-black p-6 rounded-lg space-y-4 shadow">
        {error && <p className="text-red-600">{error}</p>}

        <input
          className="border p-2 w-full rounded"
          placeholder="Employee ID (required)"
          value={employeeIdInput}
          onChange={(e) => setEmployeeIdInput(e.target.value)}
        />

        <input
          type="number"
          className="border p-2 w-full rounded"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <textarea
          className="border p-2 w-full rounded"
          placeholder="Describe the refund..."
          value={description}
          rows={5}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          disabled={submitting}
          onClick={submit}
          className={`${
            submitting ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-500"
          } text-white px-4 py-2 rounded w-full transition`}
        >
          {submitting ? "Submitting..." : "Submit Refund"}
        </button>
      </div>
    </div>
  );
}

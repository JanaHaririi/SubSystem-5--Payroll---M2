"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateClaimPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="text-white p-6">Loading...</div>;

  const employeeId = (user as any)?.userid || (user as any)?.employeeId;
  const apiBase = process.env.NEXT_PUBLIC_API || "http://localhost:4000";


  if (!employeeId) {
    return (
      <div className="p-10 text-red-400 text-xl">
        Error: Employee ID not found.  
        Your authContext user object must contain "userid".
      </div>
    );
  }

  const submit = async () => {
    setError("");

    if (!amount || !description) {
      setError("Amount and description are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `${apiBase}/payroll-tracking/claims`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            amount: Number(amount),
            description,
            claimType: "GENERAL",
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to create claim.");
        setSubmitting(false);
        return;
      }

      router.push("/payroll-tracking/claims/list");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-10 text-white">
      <h1 className="text-2xl font-bold mb-4">Create Claim</h1>

      <div className="bg-white text-black p-6 rounded-lg space-y-4">
        {error && <p className="text-red-600">{error}</p>}

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Amount (EGP)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Describe your claim..."
          value={description}
          rows={4}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          disabled={submitting}
          className={`${
            submitting ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-500"
          } text-white px-4 py-2 rounded w-full`}
          onClick={submit}
        >
          {submitting ? "Submitting..." : "Submit Claim"}
        </button>
      </div>
    </div>
  );
}

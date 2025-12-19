"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DisputePage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const disputeId = params?.id as string;
  const router = useRouter();

  const [dispute, setDispute] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const employeeId = (user as any)?.userid || (user as any)?.employeeId;
  const apiBase = process.env.NEXT_PUBLIC_API || "http://localhost:4000";

  useEffect(() => {
    if (loading || !employeeId || !disputeId) return;

    async function loadDispute() {
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch(
          `${apiBase}/payroll-tracking/disputes/me/${employeeId}`,
          { credentials: "include", cache: "no-store" }
        );

        if (res.status === 403) {
          setError("You do not have permission to view this dispute.");
          setDispute(null);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Failed to load dispute.");
          setDispute(null);
          setIsLoading(false);
          return;
        }

        const disputes = await res.json();
        const found = Array.isArray(disputes)
          ? disputes.find((d: any) => d._id === disputeId)
          : null;

        if (!found) {
          setError("Dispute not found for your account.");
        } else {
          setDispute(found);
        }
      } catch (err) {
        console.error(err);
        setError("Network error. Please try again.");
      }

      setIsLoading(false);
    }

    loadDispute();
  }, [apiBase, disputeId, employeeId, loading]);

  if (loading)
    return <div className="p-8 text-white">Loading...</div>;

  if (!employeeId) {
    return (
      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-300">Employee ID is missing from your session.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-white">Loading dispute...</div>;
  }

  if (error || !dispute) {
    return (
      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-4">Dispute Unavailable</h1>
        <p className="text-gray-300">{error || "The dispute may not exist or is not accessible."}</p>
      </div>
    );
  }

  return (
    <div className="p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dispute Details</h1>
        <button
          onClick={() => router.back()}
          className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 transition text-white text-sm"
        >
          Back
        </button>
      </div>

      <div className="bg-white text-black shadow rounded-lg p-6 space-y-4">
        <p>
          <strong>ID:</strong> {dispute._id}
        </p>

        <p>
          <strong>Dispute Code:</strong> {dispute.disputeId || "N/A"}
        </p>

        <p>
          <strong>Employee ID:</strong> {dispute.employeeId || "N/A"}
        </p>

        <p>
          <strong>Description:</strong> {dispute.description || dispute.message}
        </p>

        <p>
          <strong>Status:</strong> {dispute.status}
        </p>

        {dispute.resolutionComment && (
          <p>
            <strong>Resolution Comment:</strong>{" "}
            {dispute.resolutionComment}
          </p>
        )}

        {dispute.updatedAt && (
          <p>
            <strong>Last Updated:</strong>{" "}
            {new Date(dispute.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

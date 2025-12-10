"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClaimPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const claimId = params?.id as string;
  const router = useRouter();

  const [claim, setClaim] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const employeeId = (user as any)?.userid || (user as any)?.employeeId;
  const apiBase = process.env.NEXT_PUBLIC_API || "http://localhost:4000";

  useEffect(() => {
    if (loading || !employeeId || !claimId) return;

    async function loadClaim() {
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch(
          `${apiBase}/payroll-tracking/claims/me/${employeeId}`,
          { credentials: "include", cache: "no-store" }
        );

        if (res.status === 403) {
          setError("You do not have permission to view this claim.");
          setClaim(null);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Failed to load claim.");
          setClaim(null);
          setIsLoading(false);
          return;
        }

        const claims = await res.json();
        const found = Array.isArray(claims)
          ? claims.find((c: any) => c._id === claimId)
          : null;

        if (!found) {
          setError("Claim not found for your account.");
        } else {
          setClaim(found);
        }
      } catch (err) {
        console.error(err);
        setError("Network error. Please try again.");
      }

      setIsLoading(false);
    }

    loadClaim();
  }, [apiBase, claimId, employeeId, loading]);

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
    return <div className="p-8 text-white">Loading claim...</div>;
  }

  if (error || !claim) {
    return (
      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-4">Claim Unavailable</h1>
        <p className="text-gray-300">{error || "The requested claim is not available."}</p>
      </div>
    );
  }

  return (
    <div className="p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Claim Details</h1>
        <button
          onClick={() => router.back()}
          className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 transition text-white text-sm"
        >
          Back
        </button>
      </div>

      <div className="bg-white text-black shadow rounded-lg p-6 space-y-4">
        <p>
          <strong>ID:</strong> {claim._id}
        </p>

        <p>
          <strong>Claim Code:</strong> {claim.claimId || "N/A"}
        </p>

        <p>
          <strong>Employee ID:</strong> {claim.employeeId || "N/A"}
        </p>

        <p>
          <strong>Amount:</strong> {claim.amount}
        </p>

        <p>
          <strong>Status:</strong> {claim.status}
        </p>

        <p>
          <strong>Description:</strong> {claim.description}
        </p>

        {claim.resolutionComment && (
          <p>
            <strong>Resolution Comment:</strong> {claim.resolutionComment}
          </p>
        )}

        {claim.updatedAt && (
          <p>
            <strong>Last Updated:</strong> {new Date(claim.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

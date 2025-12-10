"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ClaimsListPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [claims, setClaims] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);

  const employeeId = (user as any)?.userid || (user as any)?.employeeId;
  const apiBase = process.env.NEXT_PUBLIC_API || "http://localhost:4000";

  useEffect(() => {
    if (loading || !employeeId) return;

    async function loadClaims() {
      setIsLoadingClaims(true);

      try {
        const res = await fetch(
          `${apiBase}/payroll-tracking/claims/me/${employeeId}`,
          { credentials: "include", cache: "no-store" }
        );

        if (res.status === 403) {
          setError("You do not have permission to view claims.");
          setClaims([]);
          setIsLoadingClaims(false);
          return;
        }

        if (!res.ok) {
          setError("Failed to load claims.");
          setClaims([]);
          setIsLoadingClaims(false);
          return;
        }

        const data = await res.json();

        setClaims(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Network error. Please try again.");
      }

      setIsLoadingClaims(false);
    }

    loadClaims();
  }, [employeeId, loading]);

  if (loading)
    return <div className="text-white p-6 text-xl">Loading...</div>;

  return (
    <div className="p-10 text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 transition text-white text-sm"
          >
            Back
          </button>
          <h1 className="text-3xl font-bold">Claims</h1>
        </div>

        {/* CREATE BUTTON */}
        <Link href="/payroll-tracking/claims/create">
          <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition">
            Create Claim
          </button>
        </Link>
      </div>

      {/* CONTENT CARD */}
      <div className="bg-white text-black p-6 rounded-lg shadow space-y-4">
        {error && <p className="text-red-600">{error}</p>}

        {isLoadingClaims ? (
          <p>Loading your claims...</p>
        ) : claims.length === 0 ? (
          <p className="text-gray-500">No claims found.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="text-left py-2">Claim Code</th>
                <th className="text-left py-2">Description</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {claims.map((c) => (
                <tr
                  key={c._id}
                  className="border-b hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="py-2">{c.claimId}</td>
                  <td>{c.description}</td>
                  <td>{c.amount}</td>
                  <td className="font-semibold">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

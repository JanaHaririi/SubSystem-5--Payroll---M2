"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DisputesListPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const employeeId = (user as any)?.userid || (user as any)?.employeeId;
  const apiBase = process.env.NEXT_PUBLIC_API || "http://localhost:4000";

  useEffect(() => {
    if (loading || !employeeId) return;

    async function loadDisputes() {
      setIsLoading(true);

      try {
        const res = await fetch(
          `${apiBase}/payroll-tracking/disputes/me/${employeeId}`,
          { credentials: "include", cache: "no-store" }
        );

        if (res.status === 403) {
          setError("You are not allowed to view disputes.");
          setDisputes([]);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Failed to load disputes.");
          setDisputes([]);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setDisputes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Network error. Please try again.");
      }

      setIsLoading(false);
    }

    loadDisputes();
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
          <h1 className="text-3xl font-bold">Disputes</h1>
        </div>

        {/* Create Dispute Button */}
        <Link href="/payroll-tracking/disputes/create">
          <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition">
            Create Dispute
          </button>
        </Link>
      </div>

      {/* DISPUTE LIST */}
      <div className="bg-white text-black p-6 rounded-lg shadow space-y-4">
        {error && <p className="text-red-600">{error}</p>}

        {isLoading ? (
          <p>Loading your disputes...</p>
        ) : disputes.length === 0 ? (
          <p className="text-gray-500">No disputes found.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="text-left py-2">Dispute Code</th>
                <th className="text-left py-2">Message</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {disputes.map((d) => (
                <tr
                  key={d._id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-2">{d.disputeId || "N/A"}</td>
                  <td>{d.description || d.message}</td>
                  <td className="font-semibold">{d.status}</td>

                  <td>
                    <Link
                      href={`/payroll-tracking/disputes/${d._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

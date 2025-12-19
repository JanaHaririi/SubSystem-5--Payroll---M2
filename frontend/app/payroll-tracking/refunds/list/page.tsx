"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function RefundsListPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const roles = (user as any)?.roles || [];
  const isFinanceStaff = useMemo(
    () => roles.some((r: string) => r.toLowerCase() === "finance staff"),
    [roles]
  );
  const apiBase = process.env.NEXT_PUBLIC_API || "http://localhost:4000";

  useEffect(() => {
    if (loading || !isFinanceStaff) return;

    async function loadRefunds() {
      setIsLoading(true);

      try {
        const res = await fetch(
          `${apiBase}/payroll-tracking/refunds`,
          { credentials: "include", cache: "no-store" }
        );

        if (res.status === 403) {
          setError("You are not allowed to view refunds.");
          setRefunds([]);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Failed to load refunds.");
          setRefunds([]);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setRefunds(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Network error. Please try again.");
      }

      setIsLoading(false);
    }

    loadRefunds();
  }, [apiBase, isFinanceStaff, loading]);

  if (loading)
    return <div className="p-6 text-white text-xl">Loading...</div>;

  if (!isFinanceStaff) {
    return (
      <div className="p-10 text-white">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-300">Only Finance Staff can view refunds.</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Refund Requests</h1>
        </div>

        {/* CREATE REFUND BUTTON */}
        <Link href="/payroll-tracking/refunds/create">
          <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition">
            Create Refund
          </button>
        </Link>
      </div>

      {/* CONTENT */}
      <div className="bg-white text-black p-6 rounded-lg shadow space-y-4">
        {error && <p className="text-red-600">{error}</p>}

        {isLoading ? (
          <p>Loading refunds...</p>
        ) : refunds.length === 0 ? (
          <p className="text-gray-500">No refund requests found.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="text-left py-2">Refund ID</th>
                <th className="text-left py-2">Employee</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {refunds.map((r) => (
                <tr
                  key={r._id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-2">{r._id}</td>
                  <td>{r.employeeId || "N/A"}</td>
                  <td className="font-semibold">{r.status}</td>
                  <td>{r.refundDetails?.amount ?? "N/A"}</td>

                  <td>
                    <Link
                      href={`/payroll-tracking/refunds/${r._id}`}
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

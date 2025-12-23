"use client";

import Link from "next/link";
import { useAuth } from "@/app/(system)/context/authContext";
import {
  FiFileText,
  FiAlertTriangle,
  FiRotateCw,
  FiShield,
} from "react-icons/fi";

export default function PayrollTrackingHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-10 text-white text-xl">
        Loading payroll tracking...
      </div>
    );
  }

  const roles = (user as any)?.roles || [];
  const hasPayrollSpecialist = roles.some(
    (r: string) => r.toLowerCase() === "payroll specialist"
  );

  const cardClass =
    "bg-white shadow-md p-6 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border border-gray-200";

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-8">Payroll Tracking</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* CLAIMS */}
        <Link href="/payroll-tracking/claims/list">
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-3">
              <FiFileText size={26} className="text-blue-700" />
              <h2 className="text-xl font-semibold text-gray-900">Claims</h2>
            </div>
            <p className="text-gray-800">
              Submit, view, and manage reimbursement claims.
            </p>
          </div>
        </Link>

        {/* DISPUTES */}
        <Link href="/payroll-tracking/disputes/list">
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-3">
              <FiAlertTriangle size={26} className="text-yellow-700" />
              <h2 className="text-xl font-semibold text-gray-900">Disputes</h2>
            </div>
            <p className="text-gray-800">
              Report issues and monitor dispute resolutions.
            </p>
          </div>
        </Link>

        {/* REFUNDS */}
        <Link href="/payroll-tracking/refunds/list">
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-3">
              <FiRotateCw size={26} className="text-green-700" />
              <h2 className="text-xl font-semibold text-gray-900">Refunds</h2>
            </div>
            <p className="text-gray-800">
              Request refunds or track the status of refund submissions.
            </p>
          </div>
        </Link>

        {/* SPECIALIST PANEL */}
        {hasPayrollSpecialist && (
          <Link href="/payroll-tracking/admin">
            <div className={cardClass}>
              <div className="flex items-center gap-3 mb-3">
                <FiShield size={26} className="text-purple-700" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Specialist Panel
                </h2>
              </div>
              <p className="text-gray-800">
                Review and approve claims, disputes, and refund operations.
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

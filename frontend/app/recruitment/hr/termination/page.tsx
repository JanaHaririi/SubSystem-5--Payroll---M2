// app/offboarding/termination/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

type TerminationRequest = {
  _id: string;
  employeeId?: string;
  reason?: string;
  status?: string;
};

export default function TerminationRequestsPage() {
  const [requests, setRequests] = useState<TerminationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<TerminationRequest[]>("/offboarding/requests")
      .then((res) => setRequests(res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Termination Requests</h1>
      <div className={styles.fullLine}></div>

      <div style={{ marginBottom: 20 }}>
        <Link href="/recruitment/hr/termination/create" className={styles.createButton}>
          + Create Termination Request
        </Link>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>ID</th>
                <th className={styles.tableHeaderCell}>Employee</th>
                <th className={styles.tableHeaderCell}>Reason</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{req._id}</td>
                  <td className={styles.tableCell}>{req.employeeId || "-"}</td>
                  <td className={styles.tableCell}>{req.reason || "-"}</td>
                  <td className={styles.tableCell}>
                    <span className={styles.statusBadge}>
                      {req.status}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <Link
                      href={`/recruitment/hr/termination/${req._id}/update`}
                      className={styles.updateButton}
                    >
                      Update
                    </Link>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr className={styles.tableRow}>
                  <td className={styles.tableCell} colSpan={5}>
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
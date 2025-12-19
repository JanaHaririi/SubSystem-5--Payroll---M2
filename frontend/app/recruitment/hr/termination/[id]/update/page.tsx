// app/offboarding/termination/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

type TerminationRequest = {
  _id: string;
  employeeId: string;
  terminationType: string;
  status: string;
  reason: string;
  noticeDate: string;
  lastWorkingDay: string;
  requestedBy: string;
  managerComments?: string;
  createdAt: string;
  updatedAt: string;
};

export default function TerminationRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [request, setRequest] = useState<TerminationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadRequestDetails();
    }
  }, [id]);

  const loadRequestDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get<TerminationRequest>(`/offboarding/requests/${id}`);
      setRequest(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load request details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequest = async (data: Record<string, any>) => {
    try {
      await axiosInstance.patch(`/offboarding/requests/${id}`, data);
      await loadRequestDetails();
      setShowEditForm(false);
      alert("Request updated successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update request");
    }
  };

  const updateRequestStatus = async (newStatus: string) => {
    try {
      await axiosInstance.patch(`/offboarding/requests/${id}`, { status: newStatus });
      await loadRequestDetails();
      alert(`Request status updated to: ${newStatus}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return styles.statusPending;
      case "approved": return styles.statusActive;
      case "rejected": return styles.statusDraft;
      case "in_review": 
      case "under review": return styles.statusPending;
      case "completed": return styles.statusActive;
      default: return "";
    }
  };

  const formFields: FieldConfig[] = [
    {
      name: "employeeId",
      label: "Employee ID",
      type: "text",
      required: true,
    },
    {
      name: "terminationType",
      label: "Termination Type",
      type: "select",
      required: true,
      options: [
        { value: "Resignation", label: "Resignation" },
        { value: "Termination", label: "Termination" },
        { value: "Layoff", label: "Layoff" },
        { value: "Retirement", label: "Retirement" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "pending", label: "Pending" },
        { value: "in_review", label: "In Review" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "completed", label: "Completed" },
      ],
    },
    {
      name: "reason",
      label: "Reason",
      type: "textarea",
      required: true,
    },
    {
      name: "noticeDate",
      label: "Notice Date",
      type: "date",
      required: true,
    },
    {
      name: "lastWorkingDay",
      label: "Last Working Day",
      type: "date",
      required: true,
    },
    {
      name: "requestedBy",
      label: "Requested By",
      type: "text",
      required: true,
    },
    {
      name: "managerComments",
      label: "Manager Comments",
      type: "textarea",
      required: false,
    },
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBanner}>
          <p>{error || "Request not found"}</p>
        </div>
        <button onClick={() => router.push("/recruitment/hr/termination")} className={styles.updateButton}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => router.push("/recruitment/hr/termination")}
          className={styles.updateButton}
        >
          ← Back to Dashboard
        </button>
      </div>

      <h1 className={styles.pageTitle}>Termination Request Details</h1>
      <div className={styles.fullLine}></div>

      {/* Header Card */}
      <div className={styles.card} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 8 }}>Employee ID: {request.employeeId}</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={styles.statusBadge}>
                {request.terminationType}
              </span>
              <span className={`${styles.statusBadge} ${getStatusClass(request.status)}`}>
                {request.status}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            className={styles.updateButton}
          >
            {showEditForm ? "Cancel Edit" : "Edit Request"}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {showEditForm && (
        <div className={styles.card} style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Update Request</h3>
          <GenericForm
            fields={formFields}
            onSubmit={handleUpdateRequest}
            submitButtonText="Update Request"
            showResetButton={false}
            initialValues={{
              employeeId: request.employeeId,
              terminationType: request.terminationType,
              status: request.status,
              reason: request.reason,
              noticeDate: request.noticeDate ? request.noticeDate.split('T')[0] : "",
              lastWorkingDay: request.lastWorkingDay ? request.lastWorkingDay.split('T')[0] : "",
              requestedBy: request.requestedBy,
              managerComments: request.managerComments || "",
            }}
          />
        </div>
      )}

      {/* Key Information */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className={styles.card}>
          <p className={styles.textMuted} style={{ margin: 0, marginBottom: 4 }}>Request ID</p>
          <p className={styles.strong} style={{ margin: 0 }}>{request._id.slice(-8)}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.textMuted} style={{ margin: 0, marginBottom: 4 }}>Notice Date</p>
          <p className={styles.strong} style={{ margin: 0 }}>{new Date(request.noticeDate).toLocaleDateString()}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.textMuted} style={{ margin: 0, marginBottom: 4 }}>Last Working Day</p>
          <p className={styles.strong} style={{ margin: 0 }}>{new Date(request.lastWorkingDay).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Details */}
      <div className={styles.card} style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Termination Details</h3>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <p className={styles.strong} style={{ margin: 0, marginBottom: 4 }}>Requested By</p>
            <p style={{ margin: 0 }}>{request.requestedBy}</p>
          </div>
          <div>
            <p className={styles.strong} style={{ margin: 0, marginBottom: 4 }}>Reason</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{request.reason}</p>
          </div>
          {request.managerComments && (
            <div>
              <p className={styles.strong} style={{ margin: 0, marginBottom: 4 }}>Manager Comments</p>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{request.managerComments}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Actions */}
      <div className={styles.card}>
        <h3 style={{ marginTop: 0 }}>Quick Status Actions</h3>
        <div className={styles.actions}>
          {request.status === "pending" && (
            <>
              <button
                onClick={() => updateRequestStatus("in_review")}
                className={styles.updateButton}
              >
                Start Review
              </button>
              <button
                onClick={() => updateRequestStatus("rejected")}
                className={styles.deleteButton}
              >
                Reject Request
              </button>
            </>
          )}
          {(request.status === "in_review" || request.status === "under review") && (
            <>
              <button
                onClick={() => updateRequestStatus("approved")}
                className={styles.createButton}
              >
                Approve Termination
              </button>
              <button
                onClick={() => updateRequestStatus("rejected")}
                className={styles.deleteButton}
              >
                Reject Request
              </button>
            </>
          )}
          {request.status === "approved" && (
            <button
              onClick={() => updateRequestStatus("completed")}
              className={styles.createButton}
            >
              Complete Offboarding
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
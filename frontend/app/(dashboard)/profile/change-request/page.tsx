"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useRouter } from "next/navigation";

interface ChangeRequest {
  _id: string;
  requestId: string;
  requestDescription: string;
  requestedChanges?: Record<string, any>;
  reason: string;
  status: string;
  submittedAt: string;
}

// Enum values from backend
const MARITAL_STATUS_OPTIONS = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];
const GENDER_OPTIONS = ["MALE", "FEMALE"];
const CONTRACT_TYPE_OPTIONS = ["FULL_TIME_CONTRACT", "PART_TIME_CONTRACT"];
const WORK_TYPE_OPTIONS = ["FULL_TIME", "PART_TIME"];

export default function ChangeRequestPage() {
  const router = useRouter();
  const [myRequests, setMyRequests] = useState<ChangeRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fieldName: "",
    requestedValue: "",
    reason: "",
    requestDescription: "",
  });

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const response = await axiosInstance.get("/employee-profile/me/change-requests");
      setMyRequests(response.data);
    } catch (error) {
      console.error("Error fetching change requests:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build the payload according to CreateChangeRequestDto
    const payload: any = {
      requestDescription: formData.requestDescription,
      reason: formData.reason,
      requestedChanges: {
        [formData.fieldName]: formData.requestedValue
      }
    };

    try {
      await axiosInstance.post("/employee-profile/me/change-requests", payload);
      alert("Change request submitted successfully");
      setShowForm(false);
      setFormData({
        fieldName: "",
        requestedValue: "",
        reason: "",
        requestDescription: ""
      });
      fetchMyRequests();
    } catch (error: any) {
      console.error("Error submitting change request:", error);
      alert(error?.response?.data?.message || "Failed to submit change request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "text-green-400";
      case "rejected":
        return "text-red-400";
      case "pending":
        return "text-yellow-400";
      default:
        return "text-neutral-400";
    }
  };

  // Determine input type based on selected field
  const renderValueInput = () => {
    const { fieldName, requestedValue } = formData;

    // Dropdown for maritalStatus
    if (fieldName === "maritalStatus") {
      return (
        <select
          value={requestedValue}
          onChange={(e) =>
            setFormData({ ...formData, requestedValue: e.target.value })
          }
          required
          className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
        >
          <option value="">Select marital status</option>
          {MARITAL_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      );
    }

    // Dropdown for gender
    if (fieldName === "gender") {
      return (
        <select
          value={requestedValue}
          onChange={(e) =>
            setFormData({ ...formData, requestedValue: e.target.value })
          }
          required
          className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
        >
          <option value="">Select gender</option>
          {GENDER_OPTIONS.map((gender) => (
            <option key={gender} value={gender}>
              {gender.charAt(0) + gender.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      );
    }

    // Dropdown for contractType
    if (fieldName === "contractType") {
      return (
        <select
          value={requestedValue}
          onChange={(e) =>
            setFormData({ ...formData, requestedValue: e.target.value })
          }
          required
          className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
        >
          <option value="">Select contract type</option>
          {CONTRACT_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ").charAt(0) + type.replace(/_/g, " ").slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      );
    }

    // Dropdown for workType
    if (fieldName === "workType") {
      return (
        <select
          value={requestedValue}
          onChange={(e) =>
            setFormData({ ...formData, requestedValue: e.target.value })
          }
          required
          className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
        >
          <option value="">Select work type</option>
          {WORK_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ").charAt(0) + type.replace(/_/g, " ").slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      );
    }

    // Date input for dateOfBirth
    if (fieldName === "dateOfBirth") {
      return (
        <input
          type="date"
          value={requestedValue}
          onChange={(e) =>
            setFormData({ ...formData, requestedValue: e.target.value })
          }
          required
          className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
        />
      );
    }

    // Text input for other fields
    return (
      <input
        type="text"
        value={requestedValue}
        onChange={(e) =>
          setFormData({ ...formData, requestedValue: e.target.value })
        }
        required
        className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
        placeholder="Enter new value"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Profile Change Requests</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition"
        >
          {showForm ? "Cancel" : "New Request"}
        </button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Submit Change Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Request Description
              </label>
              <input
                type="text"
                value={formData.requestDescription}
                onChange={(e) =>
                  setFormData({ ...formData, requestDescription: e.target.value })
                }
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
                placeholder="Brief description of requested changes"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Field to Change
              </label>
              <select
                value={formData.fieldName}
                onChange={(e) => {
                  setFormData({ ...formData, fieldName: e.target.value, requestedValue: "" });
                }}
                required
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              >
                <option value="">Select a field</option>
                <option value="firstName">First Name</option>
                <option value="middleName">Middle Name</option>
                <option value="lastName">Last Name</option>
                <option value="nationalId">National ID</option>
                <option value="maritalStatus">Marital Status</option>
                <option value="dateOfBirth">Date of Birth</option>
                <option value="gender">Gender</option>
                <option value="personalEmail">Personal Email</option>
                <option value="mobilePhone">Mobile Phone</option>
                <option value="homePhone">Home Phone</option>
                <option value="contractType">Contract Type</option>
                <option value="workType">Work Type</option>
                <option value="bankName">Bank Name</option>
                <option value="bankAccountNumber">Bank Account Number</option>
                <option value="primaryDepartmentId">Department</option>
                <option value="primaryPositionId">Position</option>
              </select>
            </div>

            {formData.fieldName && (
              <div>
                <label className="text-sm text-neutral-400 block mb-1">
                  Requested Value
                </label>
                {renderValueInput()}
              </div>
            )}

            <div>
              <label className="text-sm text-neutral-400 block mb-1">
                Reason for Change
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                required
                rows={4}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
                placeholder="Explain why this change is needed"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition"
            >
              Submit Request
            </button>
          </form>
        </div>
      )}

      {/* My Requests List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">My Requests</h2>
        {myRequests.length === 0 ? (
          <p className="text-neutral-400">No change requests found</p>
        ) : (
          <div className="space-y-4">
            {myRequests.map((request) => (
              <div
                key={request._id}
                className="border border-neutral-700 rounded-lg p-4 bg-black"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-semibold">
                      {request.requestId || "N/A"}
                    </h3>
                    <p className="text-sm text-neutral-400">{request.requestDescription}</p>
                  </div>
                  <span
                    className={`text-sm font-medium ${getStatusColor(
                      request.status || "pending"
                    )}`}
                  >
                    {request.status ? request.status.toUpperCase() : "PENDING"}
                  </span>
                </div>

                {request.requestedChanges && (
                  <div className="mb-2 p-3 bg-neutral-800 rounded">
                    <label className="text-xs text-neutral-500 block mb-1">Requested Changes</label>
                    <div className="space-y-1">
                      {Object.entries(request.requestedChanges).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-white text-sm font-medium">{key}:</span>
                          <span className="text-neutral-300 text-sm">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-neutral-500">Reason</label>
                  <p className="text-white text-sm">{request.reason}</p>
                </div>
                <div className="mt-2">
                  <label className="text-xs text-neutral-500">Submitted</label>
                  <p className="text-neutral-400 text-xs">
                    {new Date(request.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => router.push("/profile")}
        className="text-neutral-400 hover:text-white"
      >
        ← Back to Profile
      </button>
    </div>
  );
}

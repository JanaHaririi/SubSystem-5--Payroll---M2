"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/ApiClient";
import Link from "next/link";
import { isSystemAdmin, isHRAdmin } from "@/app/utils/roleCheck";
import { FileText, ArrowLeft, CheckCircle, XCircle, Clock, Filter } from "lucide-react";

interface ChangeRequest {
  _id: string;
  requestId: string;
  requestDescription: string;
  reason?: string;
  status: string;
  submittedAt: string;
  processedAt?: string;
  employeeProfileId: {
    _id: string;
    fullName: string;
    employeeNumber: string;
  };
}

export default function ChangeRequestLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [allRequests, setAllRequests] = useState<ChangeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ChangeRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterStatus, searchTerm, allRequests]);

  const checkAccess = async () => {
    try {
      const response = await axiosInstance.get("/employee-profile/me");

      if (!isSystemAdmin(response.data) && !isHRAdmin(response.data)) {
        alert("Access Denied: You need System Admin or HR Admin permissions");
        router.push("/hr-admin");
        return;
      }

      setHasAccess(true);
      await fetchAllChangeRequests();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/hr-admin");
    }
  };

  const fetchAllChangeRequests = async () => {
    try {
      const response = await axiosInstance.get("/employee-profile/change-requests/all");
      const requests = response.data || [];

      // Sort by most recent first
      const sortedRequests = requests.sort((a: ChangeRequest, b: ChangeRequest) => {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });

      setAllRequests(sortedRequests);
      setFilteredRequests(sortedRequests);
    } catch (error) {
      console.error("Error fetching change requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allRequests];

    // Filter by status
    if (filterStatus !== "ALL") {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Filter by search term (employee name or request ID)
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.employeeProfileId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeProfileId?.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requestId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-3 py-1 bg-green-900 text-green-300 text-xs rounded-full flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-3 py-1 bg-red-900 text-red-300 text-xs rounded-full flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      case "PENDING":
        return (
          <span className="px-3 py-1 bg-yellow-900 text-yellow-300 text-xs rounded-full flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      default:
        return <span className="px-3 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-full">{status}</span>;
    }
  };

  if (loading || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">
          {loading ? "Loading..." : "Checking access..."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/hr-admin" className="text-neutral-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <FileText className="h-8 w-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Change Request Logs</h1>
          </div>
          <p className="text-neutral-400">
            View history and audit trail of all employee profile change requests (BR 22)
          </p>
        </div>
        <Link
          href="/change-requests"
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition"
        >
          View Pending Requests
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by employee name, number, or request ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-black border border-neutral-700 rounded-lg text-white placeholder-neutral-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-black border border-neutral-700 rounded-lg text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-400">Request ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-400">Employee</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-400">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-400">Submitted</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-400">Processed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                    No change requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-neutral-800 transition">
                    <td className="px-6 py-4">
                      <span className="text-white font-mono text-sm">{request.requestId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">
                          {request.employeeProfileId?.fullName || "N/A"}
                        </p>
                        <p className="text-neutral-400 text-sm">
                          {request.employeeProfileId?.employeeNumber || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm max-w-md truncate">
                        {request.requestDescription || request.reason || "No description"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 text-neutral-400 text-sm">
                      {new Date(request.submittedAt).toLocaleDateString()}<br />
                      <span className="text-neutral-500 text-xs">
                        {new Date(request.submittedAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400 text-sm">
                      {request.processedAt ? (
                        <>
                          {new Date(request.processedAt).toLocaleDateString()}<br />
                          <span className="text-neutral-500 text-xs">
                            {new Date(request.processedAt).toLocaleTimeString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-neutral-400">Total Requests</p>
            <p className="text-white text-2xl font-bold">{allRequests.length}</p>
          </div>
          <div>
            <p className="text-neutral-400">Pending</p>
            <p className="text-yellow-400 text-2xl font-bold">
              {allRequests.filter(r => r.status === "PENDING").length}
            </p>
          </div>
          <div>
            <p className="text-neutral-400">Approved</p>
            <p className="text-green-400 text-2xl font-bold">
              {allRequests.filter(r => r.status === "APPROVED").length}
            </p>
          </div>
          <div>
            <p className="text-neutral-400">Rejected</p>
            <p className="text-red-400 text-2xl font-bold">
              {allRequests.filter(r => r.status === "REJECTED").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import axiosInstance from "@/app/utils/ApiClient";
import { CheckCircle, XCircle, RefreshCcw } from "lucide-react";

interface LeaveRequest {
  _id: string;
  employeeId: {
    fullName: string;
    workEmail?: string;
  };
  leaveTypeId: {
    name: string;
  };
  dates: {
    from: string;
    to: string;
  };
  status: string;
  justification?: string;
  createdAt?: string;
  isEscalated?: boolean;
  delegateTo?: { fullName: string } | null;
}

export default function ManagerRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get<LeaveRequest[]>("/leaves/requests");
      const pending = res.data.filter(
        (r) => (r.status || "").toLowerCase() === "pending"
      );

      setRequests(pending);
      setSelectedIds((prev) => {
        const next = new Set<string>();
        const ids = new Set(pending.map((p) => p._id));
        prev.forEach((id) => {
          if (ids.has(id)) next.add(id);
        });
        return next;
      });
    } catch (err: any) {
      console.error("Error loading manager requests", err);
      const msg =
        err?.response?.data?.message || "Failed to load leave requests";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id: string, decision: "approved" | "rejected") => {
    setActionLoadingId(id);
    try {
      await axiosInstance.patch(`/leaves/requests/${id}/manager-decision`, {
        decision,
      });

      toast.success(`Request ${decision}`);
      await loadRequests();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      console.error("Error submitting manager decision", err);
      const msg = err?.response?.data?.message || "Failed to submit decision";
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const selectableIds = useMemo(() => {
    return requests
      .filter((r) => !r.isEscalated)
      .map((r) => r._id);
  }, [requests]);

  const allSelectableSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectableSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDecision = async (decision: "approved" | "rejected") => {
    const ids = requests
      .filter((r) => selectedIds.has(r._id) && !r.isEscalated)
      .map((r) => r._id);

    if (ids.length === 0) {
      toast.error("Select at least 1 request (non-escalated)");
      return;
    }

    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          axiosInstance.patch(`/leaves/requests/${id}/manager-decision`, { decision })
        )
      );

      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;

      toast.success(`Bulk ${decision}: ${ok} succeeded${fail ? `, ${fail} failed` : ""}`);

      clearSelection();
      await loadRequests();
    } catch (err: any) {
      console.error("Bulk decision failed", err);
      toast.error(err?.response?.data?.message || "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-gray-900 dark:text-white">Pending Leave Requests</CardTitle>
            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
              {requests.length} pending
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <>
                <Button
                  onClick={() => handleBulkDecision("approved")}
                  disabled={bulkLoading || !!actionLoadingId}
                >
                  Approve Selected ({selectedIds.size})
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleBulkDecision("rejected")}
                  disabled={bulkLoading || !!actionLoadingId}
                >
                  Reject Selected ({selectedIds.size})
                </Button>
                <Button
                  variant="outline"
                  onClick={clearSelection}
                  disabled={bulkLoading || !!actionLoadingId}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Clear
                </Button>
              </>
            )}

            <Button 
              variant="outline" 
              onClick={loadRequests} 
              disabled={loading || bulkLoading}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {requests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No pending requests at the moment.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="dark:hover:bg-gray-700">
                  {/* Checkbox header */}
                  <TableHead className="w-[50px] dark:bg-gray-700/50 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={allSelectableSelected}
                      onChange={toggleSelectAll}
                      title="Select all non-escalated requests"
                      className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Employee</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Leave Type</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Dates</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Justification</TableHead>
                  <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-right dark:bg-gray-700/50 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {requests.map((req) => {
                  const disabledRow = !!req.isEscalated;

                  return (
                    <TableRow key={req._id} className="dark:hover:bg-gray-700/50">
                      {/* Row checkbox */}
                      <TableCell className="dark:border-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(req._id)}
                          onChange={() => toggleOne(req._id)}
                          disabled={disabledRow}
                          title={disabledRow ? "Escalated requests can't be bulk processed" : ""}
                          className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </TableCell>

                      <TableCell className="dark:border-gray-700">
                        <div className="font-medium text-gray-900 dark:text-white">{req.employeeId.fullName}</div>
                        {req.employeeId.workEmail && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {req.employeeId.workEmail}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="dark:border-gray-700 dark:text-gray-300">
                        {req.leaveTypeId.name}
                      </TableCell>

                      <TableCell className="dark:border-gray-700 dark:text-gray-300">
                        <div className="text-sm">
                          {new Date(req.dates.from).toLocaleDateString()} –{" "}
                          {new Date(req.dates.to).toLocaleDateString()}
                        </div>
                      </TableCell>

                      <TableCell className="max-w-xs dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {req.justification || "-"}
                        </span>
                      </TableCell>

                      <TableCell className="dark:border-gray-700">
                        {(req.isEscalated && (
                          <Badge variant="destructive" className="dark:bg-red-900/30 dark:text-red-300">
                            Escalated
                          </Badge>
                        )) ||
                          (req.delegateTo && (
                            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                              Delegated to {req.delegateTo.fullName}
                            </Badge>
                          )) || 
                          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                            {req.status}
                          </Badge>}
                      </TableCell>

                      <TableCell className="text-right dark:border-gray-700">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              actionLoadingId === req._id || disabledRow || bulkLoading
                            }
                            onClick={() => handleDecision(req._id, "rejected")}
                            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:dark:opacity-50"
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>

                          <Button
                            size="sm"
                            disabled={
                              actionLoadingId === req._id || disabledRow || bulkLoading
                            }
                            onClick={() => handleDecision(req._id, "approved")}
                            className="disabled:dark:opacity-50"
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
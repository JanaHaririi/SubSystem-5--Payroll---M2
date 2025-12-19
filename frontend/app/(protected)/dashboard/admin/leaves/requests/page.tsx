'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';
import { Eye, Check, X, RefreshCcw, Search, Clock } from 'lucide-react';

export default function LeaveRequestsAdminPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ NEW: bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRequests();
  }, []);

  // 🔹 Fetch all leave requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/leaves/requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Normalize status (handles APPROVED/approved/etc.)
  const normStatus = (s: any) => String(s || '').toLowerCase();

  // 🔹 Handle approval or rejection (single)
  const handleDecision = async (id: string, action: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      const rawRole = localStorage.getItem('role') || '';
      const normalized = rawRole.toLowerCase();

      const isManager = normalized.includes('manager');
      const isHR = normalized.includes('hr');

      let endpoint: string;
      let payload: any;

      if (isManager && !isHR) {
        endpoint = `/leaves/requests/${id}/manager-decision`;
        payload = { decision: action };
      } else if (isHR) {
        endpoint = `/leaves/requests/${id}/hr-review`;
        payload = { action };
      } else {
        endpoint = `/leaves/requests/${id}`;
        payload = { status: action };
      }

      await axiosInstance.patch(endpoint, payload);

      toast.success(`Request ${action}`);
      await fetchRequests();
      setSelected(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Error updating request');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: bulk helpers
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // 🔹 Safe helper for employee name
  const getEmployeeName = (emp: any) => {
    if (!emp) return 'Unknown';
    if (typeof emp === 'string') return emp;
    if (emp.fullName) return emp.fullName;
    if (emp.firstName && emp.lastName) return `${emp.firstName} ${emp.lastName}`;
    return emp.firstName || emp.lastName || 'Unknown';
  };

  // 🔹 Filter safely by employee or leave type
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const empName = getEmployeeName(r.employeeId)?.toLowerCase() ?? '';
      const leaveName = r?.leaveTypeId?.name?.toLowerCase() ?? '';
      return (
        empName.includes(search.toLowerCase()) ||
        leaveName.includes(search.toLowerCase())
      );
    });
  }, [requests, search]);

  const pendingIdsInFiltered = useMemo(() => {
    return filtered
      .filter((r) => normStatus(r.status) === 'pending')
      .map((r) => r._id);
  }, [filtered]);

  const allPendingSelected =
    pendingIdsInFiltered.length > 0 &&
    pendingIdsInFiltered.every((id) => selectedIds.has(id));

  const toggleSelectAllPendingInFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPendingSelected) {
        // unselect only pending ones in filtered
        pendingIdsInFiltered.forEach((id) => next.delete(id));
      } else {
        // select all pending ones in filtered
        pendingIdsInFiltered.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBulkDecision = async (action: 'approved' | 'rejected') => {
    // only operate on selected + pending
    const ids = filtered
      .filter((r) => selectedIds.has(r._id) && normStatus(r.status) === 'pending')
      .map((r) => r._id);

    if (ids.length === 0) {
      toast.error('Select at least 1 pending request');
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => handleDecision(id, action)));

      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const fail = results.length - ok;

      toast.success(`Bulk ${action}: ${ok} succeeded${fail ? `, ${fail} failed` : ''}`);

      clearSelection();
      await fetchRequests();
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Requests</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Review, approve, or reject employee leave submissions.
          </p>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {selectedIds.size > 0 && (
            <>
              <Button onClick={() => handleBulkDecision('approved')} disabled={loading}>
                Approve Selected ({selectedIds.size})
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleBulkDecision('rejected')}
                disabled={loading}
              >
                Reject Selected ({selectedIds.size})
              </Button>
              <Button 
                variant="outline" 
                onClick={clearSelection} 
                disabled={loading}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Clear
              </Button>
            </>
          )}

          <Button 
            variant="outline" 
            onClick={fetchRequests} 
            disabled={loading}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by employee or leave type..."
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">All Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">Loading requests...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500">No requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:hover:bg-gray-700">
                    {/* ✅ NEW: select-all (only for pending in current filter) */}
                    <TableHead className="w-[50px] dark:bg-gray-700/50 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={toggleSelectAllPendingInFiltered}
                        title="Select all pending in this list"
                        className="dark:accent-blue-500"
                      />
                    </TableHead>

                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Employee</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Leave Type</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">From → To</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Days</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Status</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Irregular</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((r) => {
                    const status = normStatus(r.status);
                    const isPending = status === 'pending';

                    return (
                      <TableRow key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        {/* ✅ NEW: per-row checkbox (disabled if not pending) */}
                        <TableCell className="dark:border-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r._id)}
                            onChange={() => toggleOne(r._id)}
                            disabled={!isPending}
                            title={!isPending ? 'Only pending requests can be bulk processed' : ''}
                            className="dark:accent-blue-500"
                          />
                        </TableCell>

                        <TableCell className="text-gray-900 dark:text-white dark:border-gray-700">
                          {getEmployeeName(r.employeeId)}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white dark:border-gray-700">
                          {r.leaveTypeId?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white dark:border-gray-700">
                          {r.dates?.from ? new Date(r.dates.from).toLocaleDateString() : '—'} →{' '}
                          {r.dates?.to ? new Date(r.dates.to).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white dark:border-gray-700">
                          {r.durationDays ?? '-'}
                        </TableCell>

                        <TableCell className="dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            {status === 'approved' ? (
                              <Check className="text-green-600 dark:text-green-400 h-4 w-4" />
                            ) : status === 'rejected' ? (
                              <X className="text-red-600 dark:text-red-400 h-4 w-4" />
                            ) : (
                              <Clock className="text-yellow-600 dark:text-yellow-400 h-4 w-4" />
                            )}

                            <Badge
                              className={
                                status === 'approved'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : status === 'rejected'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              }
                            >
                              {status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="dark:border-gray-700">
                          {r.irregularPatternFlag ? (
                            <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">No</Badge>
                          )}
                        </TableCell>

                        <TableCell className="flex gap-2 dark:border-gray-700">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelected(r)}
                            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {isPending && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleDecision(r._id, 'approved')}
                                disabled={loading}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDecision(r._id, 'rejected')}
                                disabled={loading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-[550px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Request Details</DialogTitle>
            <DialogDescription asChild>
              {selected && (
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mt-3">
                  <p>
                    <b className="text-gray-900 dark:text-white">Employee:</b> {getEmployeeName(selected.employeeId)}
                  </p>
                  <p>
                    <b className="text-gray-900 dark:text-white">Leave Type:</b> {selected.leaveTypeId?.name || 'Unknown'}
                  </p>
                  <p>
                    <b className="text-gray-900 dark:text-white">Duration:</b> {selected.durationDays} days
                  </p>
                  <p>
                    <b className="text-gray-900 dark:text-white">From:</b>{' '}
                    {selected.dates?.from
                      ? new Date(selected.dates.from).toLocaleDateString()
                      : '—'}
                  </p>
                  <p>
                    <b className="text-gray-900 dark:text-white">To:</b>{' '}
                    {selected.dates?.to
                      ? new Date(selected.dates.to).toLocaleDateString()
                      : '—'}
                  </p>
                  
                  <p>
                    <b className="text-gray-900 dark:text-white">Irregular Pattern:</b> {selected.irregularPatternFlag ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <b className="text-gray-900 dark:text-white">Justification:</b> {selected.justification || 'N/A'}
                  </p>

                  {selected.attachmentId && (
                    <p>
                      <b className="text-gray-900 dark:text-white">Attachment:</b> {selected.attachmentId.fileName || 'Uploaded file'}
                    </p>
                  )}

                  {selected.approvalFlow?.length > 0 && (
                    <div className="mt-4">
                      <p className="font-semibold mb-2 text-gray-900 dark:text-white">Approval Flow:</p>
                      <ul className="space-y-1 text-sm">
                        {selected.approvalFlow.map((step: any, idx: number) => (
                          <li
                            key={idx}
                            className={`p-2 rounded-md border ${
                              String(step.status).toLowerCase() === 'approved'
                                ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                                : String(step.status).toLowerCase() === 'rejected'
                                ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                                : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
                            }`}
                          >
                            <b className="text-gray-900 dark:text-white">{step.role}</b> — {String(step.status).toLowerCase()}
                            {step.decidedAt && (
                              <span className="text-gray-500 dark:text-gray-400 ml-2">
                                ({new Date(step.decidedAt).toLocaleString()})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            {selected && normStatus(selected.status) === 'pending' && (
              <>
                <Button
                  onClick={() => handleDecision(selected._id, 'approved')}
                  disabled={loading}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDecision(selected._id, 'rejected')}
                  disabled={loading}
                >
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
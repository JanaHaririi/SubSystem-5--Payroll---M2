'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Eye, Edit, Trash2, RefreshCw, Filter, Calendar, FileText, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';

interface LeaveRequest {
  _id: string;
  leaveTypeId: {
    _id: string;
    name: string;
  };
  dates: {
    from: string;
    to: string;
  };
  durationDays: number;
  justification: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  attachmentId?: {
    fileName: string;
    url: string;
  };
  approvalFlow: Array<{
    role: string;
    status: string;
    decidedBy?: string;
    decidedAt?: string;
  }>;
  createdAt: string;
}

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      const response = await axiosInstance.get('/leaves/my-requests');
      setRequests(response.data);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast.error(error.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.leaveTypeId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.justification.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;

    try {
      await axiosInstance.patch(`/leaves/requests/${requestId}`, {
        status: 'cancelled'
      });
      toast.success('Leave request cancelled successfully');
      fetchRequests();
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCurrentStep = (request: LeaveRequest) => {
    const pendingStep = request.approvalFlow.find(step => step.status === 'pending');
    if (pendingStep) {
      return `Waiting for ${pendingStep.role} approval`;
    }
    return 'Process completed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 dark:text-gray-500" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading your leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Leave Requests</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage your leave applications</p>
        </div>
        <Button onClick={() => router.push('/dashboard/employee/leaves/new-request')}>
          + New Leave Request
        </Button>
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by leave type or justification..."
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <Filter className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">All Status</SelectItem>
                  <SelectItem value="pending" className="dark:text-gray-300 dark:hover:bg-gray-700">Pending</SelectItem>
                  <SelectItem value="approved" className="dark:text-gray-300 dark:hover:bg-gray-700">Approved</SelectItem>
                  <SelectItem value="rejected" className="dark:text-gray-300 dark:hover:bg-gray-700">Rejected</SelectItem>
                  <SelectItem value="cancelled" className="dark:text-gray-300 dark:hover:bg-gray-700">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchRequests} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No leave requests found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {requests.length === 0 
                  ? "You haven't submitted any leave requests yet."
                  : "No requests match your filters."
                }
              </p>
              {requests.length === 0 && (
                <Button onClick={() => router.push('/dashboard/employee/leaves/new-request')}>
                  Submit Your First Request
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequests.map((request) => (
            <Card key={request._id} className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">{request.leaveTypeId.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1 text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(request.dates.from)} - {formatDate(request.dates.to)}
                      <span className="mx-2">•</span>
                      {request.durationDays} day{request.durationDays !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(request.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                      className="dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Justification</p>
                    <p className="text-sm line-clamp-2 text-gray-900 dark:text-gray-300">{request.justification || 'No justification provided'}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      Submitted {formatDate(request.createdAt)}
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/employee/leaves/new-request?edit=${request._id}`)}
                            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelRequest(request._id)}
                            className="dark:text-gray-400 dark:hover:bg-gray-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Approval Flow Preview */}
                  {request.approvalFlow.length > 0 && (
                    <div className="pt-3 border-t dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Approval Progress</p>
                      <div className="flex items-center">
                        {request.approvalFlow.map((step, index) => (
                          <div key={index} className="flex items-center">
                            <div className={`w-2 h-2 rounded-full ${
                              step.status === 'approved' ? 'bg-green-500 dark:bg-green-400' :
                              step.status === 'rejected' ? 'bg-red-500 dark:bg-red-400' :
                              'bg-yellow-500 dark:bg-yellow-400'
                            }`} />
                            <span className="text-xs ml-1 mr-2 text-gray-900 dark:text-gray-300">{step.role}</span>
                            {index < request.approvalFlow.length - 1 && (
                              <div className="w-4 h-px bg-gray-300 dark:bg-gray-600 mx-1" />
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getCurrentStep(request)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Request Details Dialog */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Leave Request Details</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">ID: {selectedRequest._id}</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedRequest(null)}
                  className="dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Leave Type</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.leaveTypeId.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">From Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedRequest.dates.from)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">To Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedRequest.dates.to)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.durationDays} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Justification</p>
                <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-300">{selectedRequest.justification}</p>
              </div>

              {selectedRequest.attachmentId && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Attachment</p>
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <FileText className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-900 dark:text-gray-300">{selectedRequest.attachmentId.fileName}</span>
                    <Button variant="ghost" size="sm" className="ml-auto dark:text-gray-400 dark:hover:bg-gray-600">
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {selectedRequest.approvalFlow.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Approval History</p>
                  <div className="space-y-2">
                    {selectedRequest.approvalFlow.map((step, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md border ${
                          step.status === 'approved' 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                          step.status === 'rejected' 
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                            'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{step.role}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{step.status}</p>
                          </div>
                          {step.decidedAt && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(step.decidedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {step.decidedBy && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Decided by: {step.decidedBy}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
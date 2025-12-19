'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  FileText,
  Calendar as CalendarIcon,
  Upload,
  AlertCircle,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';
import { useAuth } from '@/app/(system)/context/authContext';

interface LeaveType {
  _id: string;
  name: string;
  code: string;
  requiresAttachment: boolean;
  maxConsecutiveDays?: number;
}

interface BalanceInfo {
  _id: string;
  leaveTypeId: {
    _id: string;
    name: string;
    code: string;
    categoryId?: {
      name: string;
    };
  };
  yearlyEntitlement: number;
  accruedActual: number;
  accruedRounded: number;
  carryForward: number;
  taken: number;
  pending: number;
  remaining: number;
  lastAccrualDate: string | null;
  nextResetDate: string | null;
}

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<BalanceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    from: undefined as Date | undefined,
    to: undefined as Date | undefined,
    justification: '',
    attachment: null as File | null,
    attachmentId: '',
  });
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const [typesRes, balanceRes] = await Promise.all([
        axiosInstance.get('/leaves/types'),
        axiosInstance.get('/leaves/my-balance'),
      ]);

      setLeaveTypes(typesRes.data);
      setBalances(balanceRes.data);

      if (editId) {
        const requestRes = await axiosInstance.get(`/leaves/requests/${editId}`);
        const request = requestRes.data;

        setFormData({
          leaveTypeId: request.leaveTypeId._id,
          from: new Date(request.dates.from),
          to: new Date(request.dates.to),
          justification: request.justification,
          attachment: null,
          attachmentId: request.attachmentId || '',
        });

        setCalculatedDays(request.durationDays);
      }
    } catch (error: any) {
      console.error('Error initializing data:', error);
      toast.error(error.response?.data?.message || 'Failed to load required data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.from && formData.to) {
      calculateDays();
      validateDates();
    } else {
      setCalculatedDays(null);
      setValidationError('');
    }
  }, [formData.from, formData.to, formData.leaveTypeId]);

  const calculateDays = () => {
    if (formData.from && formData.to) {
      const diffTime = Math.abs(formData.to.getTime() - formData.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setCalculatedDays(diffDays);
    }
  };

  const validateDates = () => {
    if (!formData.from || !formData.to) {
      setValidationError('');
      return;
    }

    if (formData.to < formData.from) {
      setValidationError('End date must be after start date');
      return;
    }

    const today = new Date();
    const startDate = new Date(
      formData.from.getFullYear(),
      formData.from.getMonth(),
      formData.from.getDate(),
    );
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    if (startDate < todayDate) {
      setValidationError('Cannot request leave for past dates');
      return;
    }

    const diffTime = Math.abs(formData.to.getTime() - formData.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const selectedType = leaveTypes.find((t) => t._id === formData.leaveTypeId);
    if (selectedType?.maxConsecutiveDays && diffDays > selectedType.maxConsecutiveDays) {
      setValidationError(
        `Maximum ${selectedType.maxConsecutiveDays} consecutive days allowed`,
      );
      return;
    }

    const balance = balances.find((b) => b.leaveTypeId._id === formData.leaveTypeId);
    if (balance && diffDays > balance.remaining) {
      setValidationError(
        `Insufficient balance. Available: ${balance.remaining} days`,
      );
      return;
    }

    setValidationError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPEG, and PNG files are allowed');
        return;
      }

      setFormData((prev) => ({ ...prev, attachment: file }));
    }
  };

  const uploadAttachment = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);

    const response = await axiosInstance.post('/leaves/attachments/upload', fd);
    return response.data.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!formData.leaveTypeId || !formData.from || !formData.to) {
      toast.error('Please fill all required fields');
      return;
    }

    const selectedType = leaveTypes.find((t) => t._id === formData.leaveTypeId);
    if (
      selectedType?.requiresAttachment &&
      !formData.attachment &&
      !formData.attachmentId
    ) {
      toast.error('Attachment is required for this leave type');
      return;
    }

    setSubmitting(true);

    try {
      let attachmentId = formData.attachmentId;

      if (formData.attachment) {
        attachmentId = await uploadAttachment(formData.attachment);
      }

      const requestData = {
        leaveTypeId: formData.leaveTypeId,
        from: formData.from.toISOString(),
        to: formData.to.toISOString(),
        justification: formData.justification,
        ...(attachmentId && { attachmentId }),
      };

      if (editId) {
        await axiosInstance.patch(`/leaves/requests/${editId}`, requestData);
        toast.success('Leave request updated successfully!');
      } else {
        await axiosInstance.post('/leaves/requests', requestData);
        toast.success('Leave request submitted successfully!');
      }

      router.push('/dashboard/employee/leaves/my-requests');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const getBalanceInfo = () => {
    if (!formData.leaveTypeId) return null;
    return balances.find((b) => b.leaveTypeId._id === formData.leaveTypeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  const selectedType = leaveTypes.find((t) => t._id === formData.leaveTypeId);
  const balanceInfo = getBalanceInfo();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {editId ? 'Edit Leave Request' : 'New Leave Request'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Submit a new leave request for approval
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Request Details</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Provide all necessary information for your leave request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Leave Type */}
                <div className="space-y-2">
                  <Label htmlFor="leaveType" className="text-gray-700 dark:text-gray-300">Leave Type *</Label>
                  <Select
                    value={formData.leaveTypeId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, leaveTypeId: value }))
                    }
                    required
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {leaveTypes.map((type) => (
                        <SelectItem key={type._id} value={type._id} className="dark:text-gray-300 dark:hover:bg-gray-700">
                          <div className="flex items-center justify-between">
                            <span>{type.name}</span>
                            {type.requiresAttachment && (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-2">
                                (Requires attachment)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {balanceInfo && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Available balance:{' '}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {balanceInfo.remaining}
                      </span>{' '}
                      out of {balanceInfo.yearlyEntitlement} days
                    </p>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                            !formData.from && 'text-muted-foreground dark:text-gray-400',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.from
                            ? format(formData.from, 'PPP')
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700">
                        <Calendar
                          mode="single"
                          selected={formData.from}
                          onSelect={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              from: date || undefined,
                            }))
                          }
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                            !formData.to && 'text-muted-foreground dark:text-gray-400',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.to
                            ? format(formData.to, 'PPP')
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700">
                        <Calendar
                          mode="single"
                          selected={formData.to}
                          onSelect={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              to: date || undefined,
                            }))
                          }
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Duration Display */}
                {calculatedDays && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-blue-700 dark:text-blue-300">
                          Leave Duration
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {formData.from && formData.to && (
                            <>
                              {format(formData.from, 'MMM d, yyyy')} to{' '}
                              {format(formData.to, 'MMM d, yyyy')}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {calculatedDays}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Days</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Error */}
                {validationError && (
                  <Alert variant="destructive" className="dark:bg-red-900/20 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="dark:text-red-300">{validationError}</AlertDescription>
                  </Alert>
                )}

                {/* Justification */}
                <div className="space-y-2">
                  <Label htmlFor="justification" className="text-gray-700 dark:text-gray-300">Justification *</Label>
                  <Textarea
                    id="justification"
                    placeholder="Please provide a reason for your leave request..."
                    value={formData.justification}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        justification: e.target.value,
                      }))
                    }
                    rows={4}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Provide clear details to help with the approval process
                  </p>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">
                    Supporting Document
                    {selectedType?.requiresAttachment && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 dark:bg-gray-700/50">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Upload supporting document (e.g., medical certificate)
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                        Max file size: 5MB • Supported: PDF, JPEG, PNG
                      </p>

                      <Input
                        ref={fileInputRef}
                        type="file"
                        id="attachment"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />

                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Choose File
                      </Button>
                    </div>

                    {formData.attachment && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                          <div className="flex-1">
                            <p className="font-medium text-green-700 dark:text-green-300">
                              {formData.attachment.name}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {(
                                formData.attachment.size /
                                1024 /
                                1024
                              ).toFixed(2)}{' '}
                              MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                attachment: null,
                              }))
                            }
                            className="dark:text-gray-400 dark:hover:bg-gray-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Leave Type</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {leaveTypes.find((t) => t._id === formData.leaveTypeId)
                        ?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Duration</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {calculatedDays
                        ? `${calculatedDays} days`
                        : 'Not calculated'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">From Date</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.from
                        ? format(formData.from, 'MMM d, yyyy')
                        : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">To Date</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.to
                        ? format(formData.to, 'MMM d, yyyy')
                        : 'Not set'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Approval Process</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 dark:bg-yellow-400 rounded-full mr-2" />
                      Submit request
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mr-2" />
                      Manager review (48 hours)
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full mr-2" />
                      HR compliance check
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2" />
                      Final approval
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Balance Card */}
            {balanceInfo && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Balance Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Yearly Entitlement</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {balanceInfo.yearlyEntitlement} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Already Taken</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {balanceInfo.taken} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Available Balance</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {balanceInfo.remaining} days
                      </span>
                    </div>

                    {calculatedDays && (
                      <div className="pt-3 border-t dark:border-gray-700">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500 dark:text-gray-400">This Request</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {calculatedDays} days
                          </span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-700 dark:text-gray-300">
                            Remaining After
                          </span>
                          <span
                            className={
                              calculatedDays > balanceInfo.remaining
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }
                          >
                            {balanceInfo.remaining - calculatedDays} days
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Card */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitting || !!validationError}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {editId ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editId ? 'Update Request' : 'Submit Request'}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
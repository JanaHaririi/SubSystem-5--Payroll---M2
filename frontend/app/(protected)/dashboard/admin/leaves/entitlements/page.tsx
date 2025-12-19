// app/(protected)/dashboard/admin/leaves/entitlements/page.tsx
// app/(protected)/dashboard/admin/leaves/entitlements/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Search, Filter, Download, Upload,
  RefreshCw, User, Calendar, Calculator, Eye, AlertCircle,
  ChevronDown, ChevronUp, Users, FileText, CheckCircle,
  XCircle, Clock, TrendingUp, TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

// ---------------- Types ----------------

type AdjustmentType = 'add' | 'deduct' | 'encashment';

interface Employee {
  _id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  department?: string;
  position?: string;
  grade?: string;
  tenure?: number;
  contractType?: string;
  status?: string;
}

interface LeaveType {
  _id: string;
  name: string;
  code: string;
  category?: any;
}

interface LeaveEntitlement {
  _id: string;
  employeeId: Employee;
  leaveTypeId: LeaveType;
  yearlyEntitlement: number;
  accruedActual: number;
  accruedRounded: number;
  carryForward: number;
  taken: number;
  pending: number;
  remaining: number;
  lastAccrualDate?: string;
  nextResetDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Adjustment {
  _id: string;
  employeeId: string;
  leaveTypeId: string;
  adjustmentType: AdjustmentType;
}

interface AdjustFormState {
  adjustmentType: AdjustmentType;
  amount: string;
  reason: string;
}

// ---------------- Component ----------------

export default function LeaveEntitlementsPage() {
  // States
  const [entitlements, setEntitlements] = useState<LeaveEntitlement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('all');
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [sortField, setSortField] = useState<'employee' | 'remaining' | 'taken'>('employee');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Dialog states
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected items
  const [selectedEntitlement, setSelectedEntitlement] = useState<LeaveEntitlement | null>(null);
  const [selectedForAdjustment, setSelectedForAdjustment] = useState<LeaveEntitlement | null>(null);

  // Form states
  const [generateEmployeeId, setGenerateEmployeeId] = useState('');
  const [adjustForm, setAdjustForm] = useState<AdjustFormState>({
    adjustmentType: 'add',
    amount: '',
    reason: '',
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all'); // all, low, high, expiring
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Initialize
  useEffect(() => {
    fetchEntitlements();
    fetchEmployees();
  }, []);

  // Fetch entitlements
  const fetchEntitlements = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/leaves/entitlements');
      setEntitlements(response.data);
      toast.success('Entitlements loaded successfully');
    } catch (error: any) {
      console.error('Error fetching entitlements:', error);
      toast.error(error.response?.data?.message || 'Failed to load entitlements');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await axiosInstance.get('/employee-profile'); // Adjust endpoint if needed
      setEmployees(response.data);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Generate entitlements for an employee
  const handleGenerateEntitlements = async () => {
    if (!generateEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    try {
      await axiosInstance.post(`/leaves/entitlements/${generateEmployeeId}`);
      toast.success('Entitlements generated successfully');
      setIsGenerateDialogOpen(false);
      setGenerateEmployeeId('');
      fetchEntitlements(); // Refresh list
    } catch (error: any) {
      console.error('Error generating entitlements:', error);
      if (error.response?.status === 404) {
        toast.error('Employee not found');
      } else if (error.response?.status === 400) {
        toast.error('Entitlements already exist for this employee');
      } else {
        toast.error(error.response?.data?.message || 'Failed to generate entitlements');
      }
    }
  };

  // Manual adjustment
  const handleAdjustEntitlement = async () => {
    if (
      !selectedForAdjustment ||
      !adjustForm.amount ||
      parseFloat(adjustForm.amount) <= 0
    ) {
      toast.error('Please enter valid adjustment amount');
      return;
    }

    try {
      const payload = {
        employeeId: selectedForAdjustment.employeeId._id,
        leaveTypeId: selectedForAdjustment.leaveTypeId._id,
        adjustmentType: adjustForm.adjustmentType,
        amount: parseFloat(adjustForm.amount),
        reason: adjustForm.reason,
      };

      await axiosInstance.post('/leaves/adjustments', payload);
      toast.success('Adjustment applied successfully');
      setIsAdjustDialogOpen(false);
      setSelectedForAdjustment(null);
      setAdjustForm({ adjustmentType: 'add', amount: '', reason: '' });
      fetchEntitlements(); // Refresh list
    } catch (error: any) {
      console.error('Error adjusting entitlement:', error);
      toast.error(error.response?.data?.message || 'Failed to apply adjustment');
    }
  };

  // Calculate utilization percentage
  const calculateUtilization = (entitlement: LeaveEntitlement) => {
    const totalAvailable = entitlement.yearlyEntitlement + entitlement.carryForward;
    if (totalAvailable === 0) return 0;
    return Math.round((entitlement.taken / totalAvailable) * 100);
  };

  // Get status color
  const getStatusColor = (entitlement: LeaveEntitlement) => {
    const utilization = calculateUtilization(entitlement);
    if (utilization >= 80) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    if (utilization >= 50) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
  };

  // Get leave type color
  const getLeaveTypeColor = (typeName: string) => {
    const colors: Record<string, string> = {
      Annual: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      Sick: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      Maternity: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      Paternity: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
      Emergency: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      Unpaid: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    };
    return colors[typeName] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  };

  // Filter and sort entitlements
  const filteredEntitlements = entitlements
    .filter((ent) => {
      // Employee filter
      if (selectedEmployee !== 'all' && ent.employeeId._id !== selectedEmployee) {
        return false;
      }

      // Leave type filter
      if (selectedLeaveType !== 'all' && ent.leaveTypeId._id !== selectedLeaveType) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const employeeName = `${ent.employeeId.firstName} ${ent.employeeId.lastName}`.toLowerCase();
        const leaveTypeName = ent.leaveTypeId.name.toLowerCase();
        if (!employeeName.includes(searchLower) && !leaveTypeName.includes(searchLower)) {
          return false;
        }
      }

      // Low balance filter
      if (showLowBalance && ent.remaining > 5) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const utilization = calculateUtilization(ent);
        if (statusFilter === 'low' && utilization < 50) return false;
        if (statusFilter === 'high' && utilization < 80) return false;
        if (statusFilter === 'expiring') {
          if (!ent.nextResetDate) return false;
          const resetDate = new Date(ent.nextResetDate);
          const today = new Date();
          const daysUntilReset = Math.ceil(
            (resetDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
          );
          if (daysUntilReset > 30) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'employee':
          aVal = `${a.employeeId.firstName} ${a.employeeId.lastName}`;
          bVal = `${b.employeeId.firstName} ${b.employeeId.lastName}`;
          break;
        case 'remaining':
          aVal = a.remaining;
          bVal = b.remaining;
          break;
        case 'taken':
          aVal = a.taken;
          bVal = b.taken;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Get unique leave types
  const leaveTypesMap = new Map<string, LeaveType>();

  entitlements.forEach((e) => {
    const lt = e.leaveTypeId;
    if (lt && !leaveTypesMap.has(lt._id)) {
      leaveTypesMap.set(lt._id, lt);
    }
  });

  const leaveTypes = Array.from(leaveTypesMap.values());


  // Handle sort click
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get employee full name
  const getEmployeeName = (employee: Employee) => {
    return employee.fullName || `${employee.firstName} ${employee.lastName}`;
  };

  // Calculate low balance (less than 20% remaining)
  const isLowBalance = (entitlement: LeaveEntitlement) => {
    const total = entitlement.yearlyEntitlement + entitlement.carryForward;
    return total > 0 && entitlement.remaining / total < 0.2;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Entitlements</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage employee leave balances, accruals, and adjustments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchEntitlements}
            disabled={loading}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Entitlements
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-300">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(entitlements.map((e) => e.employeeId._id)).size}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">With leave entitlements</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-300">Low Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {entitlements.filter(isLowBalance).length}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Need attention</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-300">Avg Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {entitlements.length > 0
                ? Math.round(
                  entitlements.reduce(
                    (sum, e) => sum + calculateUtilization(e),
                    0,
                  ) / entitlements.length,
                )
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Across all entitlements</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-300">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {entitlements.reduce((sum, e) => sum + e.pending, 0)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by employee name or leave type..."
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <User className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Employee" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">All Employees</SelectItem>
                  {employees.map((emp, index) => (
                    <SelectItem
                      key={`${emp._id}-${index}`}
                      value={emp._id}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {getEmployeeName(emp)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
                <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">All Leave Types</SelectItem>
                  {leaveTypes.map((type, index) => (
                    <SelectItem
                      key={`${type._id}-${index}`}
                      value={type._id}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">All Status</SelectItem>
                  <SelectItem value="low" className="dark:text-gray-300 dark:hover:bg-gray-700">Low Balance (&lt;20%)</SelectItem>
                  <SelectItem value="high" className="dark:text-gray-300 dark:hover:bg-gray-700">High Utilization (&gt;80%)</SelectItem>
                  <SelectItem value="expiring" className="dark:text-gray-300 dark:hover:bg-gray-700">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showLowBalance ? 'default' : 'outline'}
                onClick={() => setShowLowBalance(!showLowBalance)}
                className="flex items-center dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Low Balance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entitlements Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-gray-900 dark:text-white">
            <span>Leave Entitlements</span>
            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
              {filteredEntitlements.length} record
              {filteredEntitlements.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            // Skeleton loader
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : filteredEntitlements.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No entitlements found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || selectedEmployee !== 'all' || selectedLeaveType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by generating entitlements for employees'}
              </p>
              {!searchTerm &&
                selectedEmployee === 'all' &&
                selectedLeaveType === 'all' && (
                  <Button className="mt-4" onClick={() => setIsGenerateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Entitlements
                  </Button>
                )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:hover:bg-gray-700">
                    <TableHead
                      className="cursor-pointer dark:bg-gray-700/50 dark:text-gray-300"
                      onClick={() => handleSort('employee')}
                    >
                      <div className="flex items-center">
                        Employee
                        {sortField === 'employee' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Leave Type</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Yearly</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Carry Forward</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Taken</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Pending</TableHead>
                    <TableHead
                      className="cursor-pointer dark:bg-gray-700/50 dark:text-gray-300"
                      onClick={() => handleSort('remaining')}
                    >
                      <div className="flex items-center">
                        Remaining
                        {sortField === 'remaining' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Utilization</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Last Accrual</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntitlements.map((entitlement, index) => {
                    const utilization = calculateUtilization(entitlement);
                    const isLow = isLowBalance(entitlement);

                    return (
                      <TableRow
                        key={`${entitlement._id}-${index}`}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isLow ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                      >
                        <TableCell className="dark:border-gray-700">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {getEmployeeName(entitlement.employeeId)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {entitlement.employeeId.email}
                          </div>
                        </TableCell>
                        <TableCell className="dark:border-gray-700">
                          <Badge
                            className={getLeaveTypeColor(entitlement.leaveTypeId.name)}
                          >
                            {entitlement.leaveTypeId.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium dark:border-gray-700 text-gray-900 dark:text-white">
                          {entitlement.yearlyEntitlement} days
                        </TableCell>
                        <TableCell className="dark:border-gray-700">
                          {entitlement.carryForward > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                            >
                              +{entitlement.carryForward}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">0</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium dark:border-gray-700 text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            {entitlement.taken}
                            {entitlement.taken > 0 && (
                              <TrendingUp className="ml-1 h-4 w-4 text-red-500 dark:text-red-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="dark:border-gray-700">
                          {entitlement.pending > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                            >
                              {entitlement.pending}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">0</span>
                          )}
                        </TableCell>
                        <TableCell className="dark:border-gray-700">
                          <div
                            className={`font-bold ${isLow ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                              }`}
                          >
                            {entitlement.remaining} days
                          </div>
                          {isLow && (
                            <div className="text-xs text-red-500 dark:text-red-400 flex items-center">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Low balance
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="dark:border-gray-700">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-900 dark:text-white">{utilization}%</span>
                            </div>
                            <Progress
                              value={utilization}
                              className={`h-2 ${utilization >= 80
                                ? 'bg-red-200 dark:bg-red-900/30'
                                : utilization >= 50
                                  ? 'bg-yellow-200 dark:bg-yellow-900/30'
                                  : 'bg-green-200 dark:bg-green-900/30'
                                }`}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="dark:border-gray-700">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(entitlement.lastAccrualDate)}
                          </div>
                        </TableCell>
                        <TableCell className="dark:border-gray-700">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEntitlement(entitlement);
                                setIsDetailsDialogOpen(true);
                              }}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  •••
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="dark:bg-gray-800 dark:border-gray-700"
                              >
                                <DropdownMenuLabel className="dark:text-gray-300">Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedForAdjustment(entitlement);
                                    setIsAdjustDialogOpen(true);
                                  }}
                                  className="dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  <Calculator className="mr-2 h-4 w-4" />
                                  Adjust Balance
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // TODO: view employee's leave requests
                                  }}
                                  className="dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Requests
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="dark:bg-gray-700" />
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                                  onClick={() => {
                                    setSelectedEntitlement(entitlement);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Entitlement
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

      {/* Generate Entitlements Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Generate Leave Entitlements</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Create leave entitlements for an employee based on their grade, tenure,
              and contract type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee" className="text-gray-900 dark:text-gray-300">Select Employee *</Label>
              <Select
                value={generateEmployeeId}
                onValueChange={setGenerateEmployeeId}
                disabled={loadingEmployees}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {loadingEmployees ? (
                    <SelectItem value="loading" disabled className="dark:text-gray-300">
                      Loading employees...
                    </SelectItem>
                  ) : employees.length === 0 ? (
                    <SelectItem value="none" disabled className="dark:text-gray-300">
                      No employees found
                    </SelectItem>
                  ) : (
                    employees.map((emp, index) => (
                      <SelectItem
                        key={`${emp._id}-${index}`}
                        value={emp._id}
                        className="dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {getEmployeeName(emp)} ({emp.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Entitlements will be calculated based on employee&apos;s grade and tenure
              </p>
            </div>

            {generateEmployeeId && (
              <Card className="dark:bg-gray-700/50 dark:border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-300">Calculated Entitlements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>The system will generate entitlements for all leave types:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Annual Leave: Based on grade and tenure</li>
                      <li>Sick Leave: Standard policy</li>
                      <li>Other leave types as configured</li>
                    </ul>
                    <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                      Note: If entitlements already exist, this action will fail.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenerateDialogOpen(false)}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateEntitlements}
              disabled={!generateEmployeeId || loadingEmployees}
            >
              Generate Entitlements
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Balance Dialog */}
      <Dialog
        open={isAdjustDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedForAdjustment(null);
            setAdjustForm({ adjustmentType: 'add', amount: '', reason: '' });
          }
          setIsAdjustDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Adjust Leave Balance</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Manually adjust leave balance for{' '}
              {selectedForAdjustment &&
                `${getEmployeeName(selectedForAdjustment.employeeId)} - ${selectedForAdjustment.leaveTypeId.name
                }`}
            </DialogDescription>
          </DialogHeader>

          {selectedForAdjustment && (
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Current balance summary */}
              <Card className="dark:bg-gray-700/50 dark:border-gray-600">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Current Balance</p>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">
                        {selectedForAdjustment.remaining} days
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Yearly Entitlement</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedForAdjustment.yearlyEntitlement} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="adjustmentType" className="text-gray-900 dark:text-gray-300">Adjustment Type</Label>
                <Select
                  value={adjustForm.adjustmentType}
                  onValueChange={(value: AdjustmentType) =>
                    setAdjustForm((prev) => ({ ...prev, adjustmentType: value }))
                  }
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="add" className="dark:text-gray-300 dark:hover:bg-gray-700">Add Days</SelectItem>
                    <SelectItem value="deduct" className="dark:text-gray-300 dark:hover:bg-gray-700">Deduct Days</SelectItem>
                    <SelectItem value="encashment" className="dark:text-gray-300 dark:hover:bg-gray-700">Encashment (Pay Out)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-gray-900 dark:text-gray-300">
                  {adjustForm.adjustmentType === 'add'
                    ? 'Days to Add'
                    : adjustForm.adjustmentType === 'deduct'
                      ? 'Days to Deduct'
                      : 'Days to Encash (deduct from balance)'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={adjustForm.amount}
                  onChange={(e) =>
                    setAdjustForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="Enter number of days"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-gray-900 dark:text-gray-300">Reason for Adjustment *</Label>
                <Input
                  value={adjustForm.reason}
                  onChange={(e) =>
                    setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="e.g., Manual correction, Special approval, etc."
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              {adjustForm.amount && (
                <Card className="bg-gray-50 dark:bg-gray-700/50">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-300">Preview:</p>
                    <div className="text-sm space-y-1 text-gray-900 dark:text-gray-300">
                      <p>Current: {selectedForAdjustment.remaining} days</p>
                      <p>
                        Adjustment: {adjustForm.adjustmentType}{' '}
                        {adjustForm.amount} days
                      </p>
                      <p className="font-bold dark:text-white">
                        New Balance:{' '}
                        {(() => {
                          const current = selectedForAdjustment.remaining;
                          const amt = parseFloat(adjustForm.amount || '0');

                          if (adjustForm.adjustmentType === 'add') {
                            return current + amt;
                          }

                          // both deduct and encashment reduce balance
                          return Math.max(0, current - amt);
                        })()}{' '}
                        days
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAdjustDialogOpen(false)}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustEntitlement}
              disabled={
                !adjustForm.amount ||
                !adjustForm.reason ||
                parseFloat(adjustForm.amount) <= 0
              }
            >
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entitlement Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Entitlement Details</DialogTitle>
          </DialogHeader>

          {selectedEntitlement && (
            <div className="space-y-6">
              <Tabs defaultValue="overview">
                <TabsList className="grid grid-cols-2 dark:bg-gray-700">
                  <TabsTrigger value="overview" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white">Overview</TabsTrigger>
                  <TabsTrigger value="history" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Employee Info */}
                  <Card className="dark:bg-gray-700/50 dark:border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        Employee Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Name</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {getEmployeeName(selectedEntitlement.employeeId)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedEntitlement.employeeId.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Grade</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedEntitlement.employeeId.grade || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Tenure</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedEntitlement.employeeId.tenure || 0} years
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Balance Details */}
                  <Card className="dark:bg-gray-700/50 dark:border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        Balance Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Leave Type</p>
                            <Badge
                              className={getLeaveTypeColor(
                                selectedEntitlement.leaveTypeId.name,
                              )}
                            >
                              {selectedEntitlement.leaveTypeId.name}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Yearly Entitlement
                            </p>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {selectedEntitlement.yearlyEntitlement} days
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 pt-4 border-t dark:border-gray-600">
                          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                            <p className="text-xs text-blue-700 dark:text-blue-300">Carry Forward</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-200">
                              {selectedEntitlement.carryForward}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-red-50 dark:bg-red-900/30 rounded">
                            <p className="text-xs text-red-700 dark:text-red-300">Taken</p>
                            <p className="text-lg font-bold text-red-900 dark:text-red-200">
                              {selectedEntitlement.taken}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">Pending</p>
                            <p className="text-lg font-bold text-yellow-900 dark:text-yellow-200">
                              {selectedEntitlement.pending}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-green-50 dark:bg-green-900/30 rounded">
                            <p className="text-xs text-green-700 dark:text-green-300">Remaining</p>
                            <p className="text-lg font-bold text-green-900 dark:text-green-200">
                              {selectedEntitlement.remaining}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t dark:border-gray-600">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-900 dark:text-white">
                              Utilization:{' '}
                              {calculateUtilization(selectedEntitlement)}%
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {selectedEntitlement.taken} of{' '}
                              {selectedEntitlement.yearlyEntitlement +
                                selectedEntitlement.carryForward}{' '}
                              days
                            </span>
                          </div>
                          <Progress
                            value={calculateUtilization(selectedEntitlement)}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Accrual Info */}
                  <Card className="dark:bg-gray-700/50 dark:border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        Accrual Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Last Accrual</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDate(selectedEntitlement.lastAccrualDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Next Reset</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDate(selectedEntitlement.nextResetDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Accrued (Actual)</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedEntitlement.accruedActual.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Accrued (Rounded)</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedEntitlement.accruedRounded}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Adjustment history will be shown here once adjustments are
                    made.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedForAdjustment(selectedEntitlement);
                      setIsAdjustDialogOpen(true);
                      setIsDetailsDialogOpen(false);
                    }}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Make Adjustment
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              This action cannot be undone. This will permanently delete the leave
              entitlement for{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedEntitlement &&
                  getEmployeeName(selectedEntitlement.employeeId)}
              </span>{' '}
              for leave type{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedEntitlement?.leaveTypeId.name}
              </span>
              .
              <br />
              <br />
              <span className="text-red-600 dark:text-red-400 font-medium">
                Warning: This will remove all accrual history and cannot be
                recovered. The employee will need new entitlements generated.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSelectedEntitlement(null)}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selectedEntitlement) return;
                // Backend delete endpoint not implemented yet
                toast.error('Delete endpoint not implemented in backend');
                setIsDeleteDialogOpen(false);
                setSelectedEntitlement(null);
              }}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900"
            >
              Delete Entitlement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Search, Filter, Download, Upload,
  RefreshCcw, Calendar, Layers, Settings, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';

interface LeaveType {
  _id: string;
  name: string;
}

interface LeavePolicy {
  _id: string;
  leaveTypeId: string;
  leaveType?: LeaveType;
  accrualMethod: string;
  monthlyRate: number;
  yearlyRate: number;
  carryForwardAllowed: boolean;
  maxCarryForward: number;
  expiryAfterMonths?: number;
  roundingRule: string;
  minNoticeDays: number;
  maxConsecutiveDays?: number;
  createdAt: string;
}

export default function LeavePoliciesPage() {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPolicies, setFilteredPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<LeavePolicy | null>(null);

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    accrualMethod: 'monthly',
    monthlyRate: '',
    yearlyRate: '',
    carryForwardAllowed: false,
    maxCarryForward: '',
    expiryAfterMonths: '',
    roundingRule: 'none',
    minNoticeDays: '',
    maxConsecutiveDays: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) setFilteredPolicies(policies);
    else {
      setFilteredPolicies(
        policies.filter(
          (p) =>
            p.leaveType?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.accrualMethod.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [policies, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, policiesRes] = await Promise.all([
        axiosInstance.get('/leaves/types'),
        axiosInstance.get('/leaves/policies'),
      ]);
      setTypes(typesRes.data);
      setPolicies(policiesRes.data);
      setFilteredPolicies(policiesRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        monthlyRate: Number(formData.monthlyRate) || 0,
        yearlyRate: Number(formData.yearlyRate) || 0,
        maxCarryForward: Number(formData.maxCarryForward) || 0,
        expiryAfterMonths: formData.expiryAfterMonths
          ? Number(formData.expiryAfterMonths)
          : undefined,
        minNoticeDays: Number(formData.minNoticeDays) || 0,
        maxConsecutiveDays: formData.maxConsecutiveDays
          ? Number(formData.maxConsecutiveDays)
          : undefined,
      };
      await axiosInstance.post('/leaves/policies', payload);
      toast.success('Policy created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/leaves/policies/${selectedPolicy._id}`, {
        ...formData,
        monthlyRate: Number(formData.monthlyRate) || 0,
        yearlyRate: Number(formData.yearlyRate) || 0,
        maxCarryForward: Number(formData.maxCarryForward) || 0,
        expiryAfterMonths: formData.expiryAfterMonths
          ? Number(formData.expiryAfterMonths)
          : undefined,
        minNoticeDays: Number(formData.minNoticeDays) || 0,
        maxConsecutiveDays: formData.maxConsecutiveDays
          ? Number(formData.maxConsecutiveDays)
          : undefined,
      });
      toast.success('Policy updated successfully');
      setIsEditDialogOpen(false);
      setSelectedPolicy(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPolicy) return;
    try {
      await axiosInstance.delete(`/leaves/policies/${selectedPolicy._id}`);
      toast.success('Policy deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedPolicy(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete policy');
    }
  };

  const handleEditClick = (policy: LeavePolicy) => {
    setSelectedPolicy(policy);
    setFormData({
      leaveTypeId: policy.leaveTypeId,
      accrualMethod: policy.accrualMethod,
      monthlyRate: policy.monthlyRate.toString(),
      yearlyRate: policy.yearlyRate.toString(),
      carryForwardAllowed: policy.carryForwardAllowed,
      maxCarryForward: policy.maxCarryForward.toString(),
      expiryAfterMonths: policy.expiryAfterMonths?.toString() || '',
      roundingRule: policy.roundingRule,
      minNoticeDays: policy.minNoticeDays.toString(),
      maxConsecutiveDays: policy.maxConsecutiveDays?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      leaveTypeId: '',
      accrualMethod: 'monthly',
      monthlyRate: '',
      yearlyRate: '',
      carryForwardAllowed: false,
      maxCarryForward: '',
      expiryAfterMonths: '',
      roundingRule: 'none',
      minNoticeDays: '',
      maxConsecutiveDays: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Policies</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure accrual, carry forward, and leave constraints for each leave type.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchData}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Policy
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by leave type or method..."
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-gray-900 dark:text-white">
            <span>All Policies</span>
            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
              {filteredPolicies.length} policy{filteredPolicies.length !== 1 && 'ies'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading policies...</div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">No policies found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:hover:bg-gray-700">
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Leave Type</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Accrual</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Carry Fwd</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Rounding</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Notice (days)</TableHead>
                    <TableHead className="text-right dark:bg-gray-700/50 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((p) => (
                    <TableRow key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <TableCell className="text-gray-900 dark:text-white dark:border-gray-700">
                        {p.leaveType?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white dark:border-gray-700">
                        {p.accrualMethod}
                      </TableCell>
                      <TableCell className="dark:border-gray-700">
                        {p.carryForwardAllowed ? (
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white dark:border-gray-700">
                        {p.roundingRule}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white dark:border-gray-700">
                        {p.minNoticeDays}
                      </TableCell>
                      <TableCell className="text-right dark:border-gray-700">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(p)}
                          className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="ml-2"
                          onClick={() => {
                            setSelectedPolicy(p);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(v) => {
        if (!v) { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {isEditDialogOpen ? 'Edit Policy' : 'Create Policy'}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              {isEditDialogOpen ? 'Update policy details.' : 'Define new leave policy.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={isEditDialogOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
            {/* Leave Type */}
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-300">Leave Type *</Label>
              <Select
                value={formData.leaveTypeId}
                onValueChange={(v) => setFormData({ ...formData, leaveTypeId: v })}
                disabled={isSubmitting || types.length === 0}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {types.map((t) => (
                    <SelectItem 
                      key={t._id} 
                      value={t._id}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Accrual */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900 dark:text-gray-300">Accrual Method</Label>
                <Select
                  value={formData.accrualMethod}
                  onValueChange={(v) => setFormData({ ...formData, accrualMethod: v })}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="monthly" className="dark:text-gray-300 dark:hover:bg-gray-700">Monthly</SelectItem>
                    <SelectItem value="yearly" className="dark:text-gray-300 dark:hover:bg-gray-700">Yearly</SelectItem>
                    <SelectItem value="per-term" className="dark:text-gray-300 dark:hover:bg-gray-700">Per Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-900 dark:text-gray-300">Rounding Rule</Label>
                <Select
                  value={formData.roundingRule}
                  onValueChange={(v) => setFormData({ ...formData, roundingRule: v })}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="none" className="dark:text-gray-300 dark:hover:bg-gray-700">None</SelectItem>
                    <SelectItem value="round" className="dark:text-gray-300 dark:hover:bg-gray-700">Round</SelectItem>
                    <SelectItem value="round_up" className="dark:text-gray-300 dark:hover:bg-gray-700">Round Up</SelectItem>
                    <SelectItem value="round_down" className="dark:text-gray-300 dark:hover:bg-gray-700">Round Down</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Numeric fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Monthly Rate"
                value={formData.monthlyRate}
                onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              <Input
                type="number"
                placeholder="Yearly Rate"
                value={formData.yearlyRate}
                onChange={(e) => setFormData({ ...formData, yearlyRate: e.target.value })}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div className="space-y-2 border p-4 rounded-md dark:border-gray-600">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="carry"
                  checked={formData.carryForwardAllowed}
                  onCheckedChange={(c) => setFormData({ ...formData, carryForwardAllowed: c === true })}
                  className="dark:border-gray-400"
                />
                <Label htmlFor="carry" className="text-gray-900 dark:text-gray-300">Allow Carry Forward</Label>
              </div>
              {formData.carryForwardAllowed && (
                <Input
                  type="number"
                  placeholder="Max Carry Forward"
                  value={formData.maxCarryForward}
                  onChange={(e) => setFormData({ ...formData, maxCarryForward: e.target.value })}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Expiry After (months)"
                value={formData.expiryAfterMonths}
                onChange={(e) => setFormData({ ...formData, expiryAfterMonths: e.target.value })}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              <Input
                type="number"
                placeholder="Min Notice (days)"
                value={formData.minNoticeDays}
                onChange={(e) => setFormData({ ...formData, minNoticeDays: e.target.value })}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <Input
              type="number"
              placeholder="Max Consecutive Days"
              value={formData.maxConsecutiveDays}
              onChange={(e) => setFormData({ ...formData, maxConsecutiveDays: e.target.value })}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Delete Policy</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this leave policy? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
// app/(protected)/dashboard/admin/leaves/types/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, Filter, Download, Upload, 
  FileText, Calendar, AlertCircle, CheckCircle, XCircle,
  Eye, EyeOff, Lock, Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/ApiClient';

interface LeaveCategory {
  _id: string;
  name: string;
  description?: string;
}

interface LeaveType {
  _id: string;
  code: string;
  name: string;
  categoryId: string;
  category?: LeaveCategory;
  description?: string;
  paid: boolean;
  deductible: boolean;
  requiresAttachment: boolean;
  attachmentType?: 'medical' | 'document' | 'other';
  minTenureMonths?: number;
  maxDurationDays?: number;
  createdAt: string;
  updatedAt: string;
}

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [categories, setCategories] = useState<LeaveCategory[]>([]);
  const [filteredLeaveTypes, setFilteredLeaveTypes] = useState<LeaveType[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: '',
    description: '',
    paid: true,
    deductible: true,
    requiresAttachment: false,
    attachmentType: '' as 'medical' | 'document' | 'other' | '',
    minTenureMonths: '',
    maxDurationDays: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter leave types based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLeaveTypes(leaveTypes);
    } else {
      const filtered = leaveTypes.filter(type =>
        type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLeaveTypes(filtered);
    }
  }, [leaveTypes, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories for dropdown
      const categoriesResponse = await axiosInstance.get('/leaves/categories');
      setCategories(categoriesResponse.data);

      // Fetch leave types
      const leaveTypesResponse = await axiosInstance.get('/leaves/types');
      setLeaveTypes(leaveTypesResponse.data);
      setFilteredLeaveTypes(leaveTypesResponse.data);
      
      toast.success('Data loaded successfully');
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for API
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        description: formData.description.trim() || undefined,
        paid: formData.paid,
        deductible: formData.deductible,
        requiresAttachment: formData.requiresAttachment,
        attachmentType: formData.requiresAttachment && formData.attachmentType 
          ? formData.attachmentType 
          : undefined,
        minTenureMonths: formData.minTenureMonths ? parseInt(formData.minTenureMonths) : undefined,
        maxDurationDays: formData.maxDurationDays ? parseInt(formData.maxDurationDays) : undefined,
      };

      await axiosInstance.post('/leaves/types', payload);
      toast.success('Leave type created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData(); // Refresh the list
    } catch (error: any) {
      console.error('Error creating leave type:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create leave type';
      
      if (errorMessage.includes('already exists')) {
        toast.error('A leave type with this code already exists');
      } else if (error.response?.status === 400) {
        toast.error('Please check your input. All required fields must be valid.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaveType) return;
    
    setIsSubmitting(true);

    try {
      // Prepare data for API
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        description: formData.description.trim() || undefined,
        paid: formData.paid,
        deductible: formData.deductible,
        requiresAttachment: formData.requiresAttachment,
        attachmentType: formData.requiresAttachment && formData.attachmentType 
          ? formData.attachmentType 
          : undefined,
        minTenureMonths: formData.minTenureMonths ? parseInt(formData.minTenureMonths) : undefined,
        maxDurationDays: formData.maxDurationDays ? parseInt(formData.maxDurationDays) : undefined,
      };

      await axiosInstance.patch(`/leaves/types/${selectedLeaveType._id}`, payload);
      toast.success('Leave type updated successfully');
      setIsEditDialogOpen(false);
      setSelectedLeaveType(null);
      resetForm();
      fetchData(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating leave type:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update leave type';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLeaveType) return;

    try {
      await axiosInstance.delete(`/leaves/types/${selectedLeaveType._id}`);
      toast.success('Leave type deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedLeaveType(null);
      fetchData(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting leave type:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete leave type';
      
      if (errorMessage.includes('linked')) {
        toast.error('Cannot delete: This leave type is linked to active policies or requests.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleEditClick = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setFormData({
      code: leaveType.code,
      name: leaveType.name,
      categoryId: leaveType.categoryId,
      description: leaveType.description || '',
      paid: leaveType.paid,
      deductible: leaveType.deductible,
      requiresAttachment: leaveType.requiresAttachment,
      attachmentType: leaveType.attachmentType || '',
      minTenureMonths: leaveType.minTenureMonths?.toString() || '',
      maxDurationDays: leaveType.maxDurationDays?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      categoryId: '',
      description: '',
      paid: true,
      deductible: true,
      requiresAttachment: false,
      attachmentType: '',
      minTenureMonths: '',
      maxDurationDays: '',
    });
  };

  const getAttachmentTypeLabel = (type?: string) => {
    switch (type) {
      case 'medical': return 'Medical';
      case 'document': return 'Document';
      case 'other': return 'Other';
      default: return 'Not Required';
    }
  };

  const getAttachmentTypeColor = (type?: string) => {
    switch (type) {
      case 'medical': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'document': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'other': return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Types</h1>
          <p className="text-gray-500 dark:text-gray-400">Define different types of leaves (Annual, Sick, Maternity, etc.)</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Leave Type
          </Button>
        </div>
      </div>

      {/* Search and Filter Card */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by code, name, category, or description..."
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon"
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Types Table Card */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-gray-900 dark:text-white">
            <span>All Leave Types</span>
            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
              {filteredLeaveTypes.length} type{filteredLeaveTypes.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Loading leave types...</p>
            </div>
          ) : filteredLeaveTypes.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
                <FileText className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No leave types found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating a new leave type'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Leave Type
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:hover:bg-gray-700">
                    <TableHead className="w-[120px] dark:bg-gray-700/50 dark:text-gray-300">Code</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Name</TableHead>
                    <TableHead className="dark:bg-gray-700/50 dark:text-gray-300">Category</TableHead>
                    <TableHead className="w-[100px] dark:bg-gray-700/50 dark:text-gray-300">Paid</TableHead>
                    <TableHead className="w-[100px] dark:bg-gray-700/50 dark:text-gray-300">Attachment</TableHead>
                    <TableHead className="w-[120px] dark:bg-gray-700/50 dark:text-gray-300">Created</TableHead>
                    <TableHead className="w-[100px] text-right dark:bg-gray-700/50 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaveTypes.map((type) => (
                    <TableRow key={type._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <TableCell className="font-mono font-bold dark:border-gray-700">
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          {type.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 dark:text-white">{type.name}</span>
                          {type.deductible ? (
                            <Lock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                          ) : (
                            <Unlock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                        {type.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {type.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="dark:border-gray-700">
                        <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                          {type.category?.name || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="dark:border-gray-700">
                        {type.paid ? (
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 dark:text-gray-400 dark:border-gray-600">
                            <XCircle className="mr-1 h-3 w-3" />
                            Unpaid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="dark:border-gray-700">
                        {type.requiresAttachment ? (
                          <Badge className={getAttachmentTypeColor(type.attachmentType)}>
                            {getAttachmentTypeLabel(type.attachmentType)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 dark:text-gray-400 dark:border-gray-600">
                            Not Required
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(type.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right dark:border-gray-700">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(type)}
                            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(type)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Leave Type Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Create New Leave Type</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Define a new type of leave with all necessary parameters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {/* Code and Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-900 dark:text-gray-300">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., ANNUAL, SICK, MATERNITY"
                  required
                  maxLength={10}
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Unique identifier (uppercase)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900 dark:text-gray-300">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Annual Leave, Sick Leave"
                  required
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Display name for the leave type</p>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-900 dark:text-gray-300">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                disabled={isSubmitting || categories.length === 0}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {categories.map((category) => (
                    <SelectItem 
                      key={category._id} 
                      value={category._id}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose the category this leave type belongs to</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-900 dark:text-gray-300">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of the leave type"
                disabled={isSubmitting}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="paid"
                  checked={formData.paid}
                  onCheckedChange={(checked) => setFormData({ ...formData, paid: checked === true })}
                  disabled={isSubmitting}
                  className="dark:border-gray-400"
                />
                <Label htmlFor="paid" className="cursor-pointer text-gray-900 dark:text-gray-300">
                  Paid Leave
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deductible"
                  checked={formData.deductible}
                  onCheckedChange={(checked) => setFormData({ ...formData, deductible: checked === true })}
                  disabled={isSubmitting}
                  className="dark:border-gray-400"
                />
                <Label htmlFor="deductible" className="cursor-pointer text-gray-900 dark:text-gray-300">
                  Deductible from Balance
                </Label>
              </div>
            </div>

            {/* Attachment Section */}
            <div className="space-y-3 border rounded-lg p-4 dark:border-gray-600">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresAttachment"
                  checked={formData.requiresAttachment}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    requiresAttachment: checked === true,
                    attachmentType: checked === true ? 'medical' : ''
                  })}
                  disabled={isSubmitting}
                  className="dark:border-gray-400"
                />
                <Label htmlFor="requiresAttachment" className="cursor-pointer font-medium text-gray-900 dark:text-gray-300">
                  Requires Supporting Attachment
                </Label>
              </div>
              
              {formData.requiresAttachment && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="attachmentType" className="text-gray-900 dark:text-gray-300">Attachment Type *</Label>
                  <Select
                    value={formData.attachmentType}
                    onValueChange={(value: 'medical' | 'document' | 'other') => 
                      setFormData({ ...formData, attachmentType: value })
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select attachment type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="medical" className="dark:text-gray-300 dark:hover:bg-gray-700">Medical Certificate</SelectItem>
                      <SelectItem value="document" className="dark:text-gray-300 dark:hover:bg-gray-700">Official Document</SelectItem>
                      <SelectItem value="other" className="dark:text-gray-300 dark:hover:bg-gray-700">Other Supporting Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Tenure and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minTenureMonths" className="text-gray-900 dark:text-gray-300">Minimum Tenure (months)</Label>
                <Input
                  id="minTenureMonths"
                  type="number"
                  min="0"
                  value={formData.minTenureMonths}
                  onChange={(e) => setFormData({ ...formData, minTenureMonths: e.target.value })}
                  placeholder="e.g., 6"
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Minimum months of service required</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDurationDays" className="text-gray-900 dark:text-gray-300">Maximum Duration (days)</Label>
                <Input
                  id="maxDurationDays"
                  type="number"
                  min="1"
                  value={formData.maxDurationDays}
                  onChange={(e) => setFormData({ ...formData, maxDurationDays: e.target.value })}
                  placeholder="e.g., 30"
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Maximum consecutive days allowed</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.code || !formData.name || !formData.categoryId}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  'Create Leave Type'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Leave Type Dialog (similar to create) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Edit Leave Type</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Update the leave type details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code" className="text-gray-900 dark:text-gray-300">Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  maxLength={10}
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-gray-900 dark:text-gray-300">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-gray-900 dark:text-gray-300">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {categories.map((category) => (
                    <SelectItem 
                      key={category._id} 
                      value={category._id}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-gray-900 dark:text-gray-300">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-paid"
                  checked={formData.paid}
                  onCheckedChange={(checked) => setFormData({ ...formData, paid: checked === true })}
                  disabled={isSubmitting}
                  className="dark:border-gray-400"
                />
                <Label htmlFor="edit-paid" className="cursor-pointer text-gray-900 dark:text-gray-300">
                  Paid Leave
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-deductible"
                  checked={formData.deductible}
                  onCheckedChange={(checked) => setFormData({ ...formData, deductible: checked === true })}
                  disabled={isSubmitting}
                  className="dark:border-gray-400"
                />
                <Label htmlFor="edit-deductible" className="cursor-pointer text-gray-900 dark:text-gray-300">
                  Deductible from Balance
                </Label>
              </div>
            </div>

            <div className="space-y-3 border rounded-lg p-4 dark:border-gray-600">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-requiresAttachment"
                  checked={formData.requiresAttachment}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    requiresAttachment: checked === true,
                    attachmentType: checked === true ? formData.attachmentType || 'medical' : ''
                  })}
                  disabled={isSubmitting}
                  className="dark:border-gray-400"
                />
                <Label htmlFor="edit-requiresAttachment" className="cursor-pointer font-medium text-gray-900 dark:text-gray-300">
                  Requires Supporting Attachment
                </Label>
              </div>
              
              {formData.requiresAttachment && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="edit-attachmentType" className="text-gray-900 dark:text-gray-300">Attachment Type *</Label>
                  <Select
                    value={formData.attachmentType}
                    onValueChange={(value: 'medical' | 'document' | 'other') => 
                      setFormData({ ...formData, attachmentType: value })
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select attachment type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="medical" className="dark:text-gray-300 dark:hover:bg-gray-700">Medical Certificate</SelectItem>
                      <SelectItem value="document" className="dark:text-gray-300 dark:hover:bg-gray-700">Official Document</SelectItem>
                      <SelectItem value="other" className="dark:text-gray-300 dark:hover:bg-gray-700">Other Supporting Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-minTenureMonths" className="text-gray-900 dark:text-gray-300">Minimum Tenure (months)</Label>
                <Input
                  id="edit-minTenureMonths"
                  type="number"
                  min="0"
                  value={formData.minTenureMonths}
                  onChange={(e) => setFormData({ ...formData, minTenureMonths: e.target.value })}
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxDurationDays" className="text-gray-900 dark:text-gray-300">Maximum Duration (days)</Label>
                <Input
                  id="edit-maxDurationDays"
                  type="number"
                  min="1"
                  value={formData.maxDurationDays}
                  onChange={(e) => setFormData({ ...formData, maxDurationDays: e.target.value })}
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.code || !formData.name || !formData.categoryId}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Updating...
                  </>
                ) : (
                  'Update Leave Type'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              This action cannot be undone. This will permanently delete the leave type "
              <span className="font-semibold text-gray-900 dark:text-white">{selectedLeaveType?.name}</span>" 
              (Code: <span className="font-mono text-gray-900 dark:text-white">{selectedLeaveType?.code}</span>).
              <br />
              <br />
              <span className="font-medium text-red-600 dark:text-red-400">
                Warning: If this leave type is linked to any active policies or requests, deletion will fail.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setSelectedLeaveType(null)}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900"
            >
              Delete Leave Type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
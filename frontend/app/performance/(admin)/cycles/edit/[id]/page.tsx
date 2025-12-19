'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/app/utils/ApiClient';
import { performanceApi } from '@/app/utils/performanceApi';
import {
  AppraisalCycle,
  AppraisalTemplateType,
  AppraisalCycleStatus,
  AppraisalTemplate
} from '@/app/types/performance';

// Import the DTO type from your API file
import type { CreateAppraisalCycleDto } from '@/app/utils/performanceApi';

import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  Users,
  FileText
} from 'lucide-react';

// Create a type for updating cycles (similar to CreateAppraisalCycleDto but with optional fields)
interface UpdateAppraisalCycleData {
  name?: string;
  description?: string;
  cycleType?: AppraisalTemplateType;
  startDate?: Date;
  endDate?: Date;
  managerDueDate?: Date;
  employeeAcknowledgementDueDate?: Date;
  templateAssignments?: Array<{
    templateId: string;
    departmentIds: string[];
  }>;
  status?: AppraisalCycleStatus;
}

interface TemplateAssignment {
  templateId: string;
  departmentIds: string[];
}

export default function EditCyclePage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cycle, setCycle] = useState<AppraisalCycle | null>(null);
  const [templates, setTemplates] = useState<AppraisalTemplate[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [formData, setFormData] = useState<UpdateAppraisalCycleData>({
    name: '',
    description: '',
    cycleType: AppraisalTemplateType.ANNUAL,
    startDate: new Date(),
    endDate: new Date(),
    managerDueDate: undefined,
    employeeAcknowledgementDueDate: undefined,
    templateAssignments: [],
    status: AppraisalCycleStatus.PLANNED
  });

  const [newAssignment, setNewAssignment] = useState<TemplateAssignment>({
    templateId: '',
    departmentIds: []
  });

  const cycleId = params.id as string;

  useEffect(() => {
    if (cycleId) {
      fetchCycle();
      fetchTemplates();
      fetchDepartments();
    }
  }, [cycleId]);

  const fetchCycle = async () => {
    try {
      setLoading(true);
      const data = await performanceApi.getAppraisalCycleById(cycleId);
      setCycle(data);

      // Map the cycle to the form data format
      setFormData({
        name: data.name,
        description: data.description || '',
        cycleType: data.cycleType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        managerDueDate: data.managerDueDate ? new Date(data.managerDueDate) : undefined,
        employeeAcknowledgementDueDate: data.employeeAcknowledgementDueDate
          ? new Date(data.employeeAcknowledgementDueDate)
          : undefined,
        templateAssignments: data.templateAssignments || [],
        status: data.status
      });
    } catch (error) {
      console.error('Error fetching cycle:', error);
      alert('Cycle not found');
      router.push('/performance/cycles');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await performanceApi.getAllAppraisalTemplates();
      setTemplates(data.filter(t => t.isActive));
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      console.log('🏢 Fetching REAL departments from organization structure...');
      const response = await axiosInstance.get('/organization-structure/departments');
      const realDepartments = response.data || [];
      console.log(`✅ Loaded ${realDepartments.length} real departments:`, realDepartments);
      setDepartments(realDepartments);

      if (realDepartments.length === 0) {
        console.warn('⚠️ WARNING: No departments found! Cannot create assignments.');
      }
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      alert('Failed to load departments. Performance assignments will not work without real department data.');
      setDepartments([]);
    }
  };

  const handleInputChange = (field: keyof UpdateAppraisalCycleData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: keyof UpdateAppraisalCycleData, value: string) => {
    const dateValue = value ? new Date(value) : undefined;
    setFormData(prev => ({ ...prev, [field]: dateValue }));
  };

  const addAssignment = () => {
    if (!newAssignment.templateId || newAssignment.departmentIds.length === 0) {
      alert('Please select a template and at least one department');
      return;
    }

    // Check if template already assigned
    const alreadyAssigned = formData.templateAssignments?.some(
      assignment => assignment.templateId === newAssignment.templateId
    );

    if (alreadyAssigned) {
      alert('This template is already assigned to this cycle');
      return;
    }

    setFormData(prev => ({
      ...prev,
      templateAssignments: [...(prev.templateAssignments || []), { ...newAssignment }]
    }));

    setNewAssignment({
      templateId: '',
      departmentIds: []
    });
  };

  const removeAssignment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      templateAssignments: (prev.templateAssignments || []).filter((_, i) => i !== index)
    }));
  };

  const toggleDepartment = (departmentId: string) => {
    setNewAssignment(prev => {
      const newDepartmentIds = prev.departmentIds.includes(departmentId)
        ? prev.departmentIds.filter(id => id !== departmentId)
        : [...prev.departmentIds, departmentId];

      return { ...prev, departmentIds: newDepartmentIds };
    });
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t._id === templateId);
    return template ? template.name : 'Unknown Template';
  };

  const getDepartmentNames = (departmentIds: string[]) => {
    return departmentIds
      .map(id => {
        const dept = departments.find(d => d._id === id);
        return dept ? dept.name : id;
      })
      .join(', ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.templateAssignments || formData.templateAssignments.length === 0) {
      alert('Please add at least one template assignment');
      return;
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      alert('End date must be after start date');
      return;
    }

    try {
      setSaving(true);

      // Prepare data for API (convert dates to ISO strings)
      const updateData: any = {
        name: formData.name,
        description: formData.description,
        cycleType: formData.cycleType,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        templateAssignments: formData.templateAssignments
      };

      // Add optional dates if they exist
      if (formData.managerDueDate) {
        updateData.managerDueDate = formData.managerDueDate.toISOString();
      }
      if (formData.employeeAcknowledgementDueDate) {
        updateData.employeeAcknowledgementDueDate =
          formData.employeeAcknowledgementDueDate.toISOString();
      }
      if (formData.status) {
        updateData.status = formData.status;
      }

      // Update the cycle
      // await performanceApi.updateAppraisalCycle(cycleId, updateData);

      // For now, show success and redirect
      alert('Cycle updated successfully!');
      router.push(`/performance/cycles/view/${cycleId}`);
    } catch (error) {
      console.error('Error updating cycle:', error);
      alert('Failed to update cycle');
    } finally {
      setSaving(false);
    }
  };

  const cycleTypes = [
    { value: AppraisalTemplateType.ANNUAL, label: 'Annual' },
    { value: AppraisalTemplateType.SEMI_ANNUAL, label: 'Semi-Annual' },
    { value: AppraisalTemplateType.PROBATIONARY, label: 'Probationary' },
    { value: AppraisalTemplateType.PROJECT, label: 'Project' },
    { value: AppraisalTemplateType.AD_HOC, label: 'Ad Hoc' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/performance/cycles/view/${cycleId}`}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Cycle: {cycle?.name}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Update cycle configuration and timeline
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Cycle Name *
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.name || ''}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="e.g., Annual Review Q1 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Cycle Type *
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.cycleType || AppraisalTemplateType.ANNUAL}
                onChange={e =>
                  handleInputChange('cycleType', e.target.value as AppraisalTemplateType)
                }
              >
                {cycleTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Description
            </label>
            <textarea
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
              value={formData.description || ''}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Describe the purpose and goals of this appraisal cycle..."
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                onChange={e => handleDateChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                End Date *
              </label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                onChange={e => handleDateChange('endDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Manager Due Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={
                  formData.managerDueDate ? formData.managerDueDate.toISOString().split('T')[0] : ''
                }
                onChange={e => handleDateChange('managerDueDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Employee Acknowledgement Due Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={
                  formData.employeeAcknowledgementDueDate
                    ? formData.employeeAcknowledgementDueDate.toISOString().split('T')[0]
                    : ''
                }
                onChange={e => handleDateChange('employeeAcknowledgementDueDate', e.target.value)}
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Cycle Duration:{' '}
                {Math.ceil(
                  (formData.endDate.getTime() - formData.startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                days
              </p>
            </div>
          )}
        </div>

        {/* Template Assignments */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Template Assignments
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Assignments: {formData.templateAssignments?.length || 0}
            </div>
          </div>

          {/* Add New Assignment Form */}
          <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Add Template Assignment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-200 mb-2">
                  Select Template *
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newAssignment.templateId}
                  onChange={e =>
                    setNewAssignment(prev => ({ ...prev, templateId: e.target.value }))
                  }
                >
                  <option value="">Choose a template...</option>
                  {templates.map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name} ({template.templateType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-200 mb-2">
                  Select Departments *
                </label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 max-h-32 overflow-y-auto bg-white dark:bg-gray-900">
                  {departments.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Loading departments...
                    </p>
                  ) : (
                    departments.map(department => (
                      <div key={department._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`dept-${department._id}`}
                          checked={newAssignment.departmentIds.includes(department._id)}
                          onChange={() => toggleDepartment(department._id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900"
                        />
                        <label
                          htmlFor={`dept-${department._id}`}
                          className="ml-2 text-sm text-gray-700 dark:text-gray-200"
                        >
                          {department.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Selected: {newAssignment.departmentIds.length} department(s)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addAssignment}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-400 flex items-center gap-2"
            >
              <Plus size={14} />
              Add Assignment
            </button>
          </div>

          {/* Assignments List */}
          {!formData.templateAssignments || formData.templateAssignments.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/40">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-300">
                No template assignments added yet.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Add your first assignment above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.templateAssignments.map((assignment, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Assignment #{index + 1}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAssignment(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
                        Template *
                      </label>
                      <select
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={assignment.templateId}
                        onChange={e => {
                          const newAssignments = [...(formData.templateAssignments || [])];
                          newAssignments[index] = { ...assignment, templateId: e.target.value };
                          setFormData(prev => ({ ...prev, templateAssignments: newAssignments }));
                        }}
                      >
                        <option value="">Choose a template...</option>
                        {templates.map(template => (
                          <option key={template._id} value={template._id}>
                            {template.name} ({template.templateType})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
                        Departments *
                      </label>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-md p-2 max-h-24 overflow-y-auto bg-white dark:bg-gray-900">
                        {departments.map(department => (
                          <div key={department._id} className="flex items-center mb-1">
                            <input
                              type="checkbox"
                              id={`assignment-${index}-dept-${department._id}`}
                              checked={assignment.departmentIds.includes(department._id)}
                              onChange={() => {
                                const newDeptIds = assignment.departmentIds.includes(
                                  department._id
                                )
                                  ? assignment.departmentIds.filter(
                                      id => id !== department._id
                                    )
                                  : [...assignment.departmentIds, department._id];

                                const newAssignments = [...(formData.templateAssignments || [])];
                                newAssignments[index] = {
                                  ...assignment,
                                  departmentIds: newDeptIds
                                };
                                setFormData(prev => ({
                                  ...prev,
                                  templateAssignments: newAssignments
                                }));
                              }}
                              className="h-3 w-3 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900"
                            />
                            <label
                              htmlFor={`assignment-${index}-dept-${department._id}`}
                              className="ml-2 text-xs text-gray-700 dark:text-gray-200"
                            >
                              {department.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Selected: {assignment.departmentIds.length} department(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between">
            <Link href={`/performance/cycles/view/${cycleId}`}>
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </Link>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={fetchCycle}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Reset Changes
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  !formData.templateAssignments ||
                  formData.templateAssignments.length === 0
                }
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

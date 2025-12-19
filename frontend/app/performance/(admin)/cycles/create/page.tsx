'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/app/utils/ApiClient';
import { performanceApi } from '@/app/utils/performanceApi';
import {
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
  Users,
  FileText
} from 'lucide-react';

interface TemplateAssignment {
  templateId: string;
  departmentIds: string[];
}

export default function CreateCyclePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<AppraisalTemplate[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateAppraisalCycleDto>({
    name: '',
    description: '',
    cycleType: AppraisalTemplateType.ANNUAL,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    managerDueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    employeeAcknowledgementDueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days from now
    templateAssignments: [],
    status: AppraisalCycleStatus.PLANNED
  });

  const [newAssignment, setNewAssignment] = useState<TemplateAssignment>({
    templateId: '',
    departmentIds: []
  });

  useEffect(() => {
    fetchTemplates();
    fetchDepartments();
  }, []);

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

  const handleInputChange = (field: keyof CreateAppraisalCycleDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: keyof CreateAppraisalCycleDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: new Date(value) }));
  };

  const addAssignment = () => {
    if (!newAssignment.templateId || newAssignment.departmentIds.length === 0) {
      alert('Please select a template and at least one department');
      return;
    }

    // Check if template already assigned
    const alreadyAssigned = formData.templateAssignments.some(
      assignment => assignment.templateId === newAssignment.templateId
    );

    if (alreadyAssigned) {
      alert('This template is already assigned to this cycle');
      return;
    }

    setFormData(prev => ({
      ...prev,
      templateAssignments: [...prev.templateAssignments, { ...newAssignment }]
    }));

    setNewAssignment({
      templateId: '',
      departmentIds: []
    });
  };

  const removeAssignment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      templateAssignments: prev.templateAssignments.filter((_, i) => i !== index)
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

    if (formData.templateAssignments.length === 0) {
      alert('Please add at least one template assignment');
      return;
    }

    if (formData.startDate >= formData.endDate) {
      alert('End date must be after start date');
      return;
    }

    try {
      setLoading(true);

      // Axios will automatically convert Date objects to ISO strings
      await performanceApi.createAppraisalCycle(formData);

      alert('Cycle created successfully!');
      router.push('/performance/cycles');
    } catch (error) {
      console.error('Error creating cycle:', error);
      alert('Failed to create cycle');
    } finally {
      setLoading(false);
    }
  };

  const cycleTypes = [
    { value: AppraisalTemplateType.ANNUAL, label: 'Annual' },
    { value: AppraisalTemplateType.SEMI_ANNUAL, label: 'Semi-Annual' },
    { value: AppraisalTemplateType.PROBATIONARY, label: 'Probationary' },
    { value: AppraisalTemplateType.PROJECT, label: 'Project' },
    { value: AppraisalTemplateType.AD_HOC, label: 'Ad Hoc' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/performance/cycles"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Appraisal Cycle
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Schedule and configure performance appraisal cycles
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cycle Name *
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Annual Review Q1 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cycle Type *
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={formData.cycleType}
                onChange={(e) =>
                  handleInputChange('cycleType', e.target.value as AppraisalTemplateType)
                }
              >
                {cycleTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[100px]"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the purpose and goals of this appraisal cycle..."
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Timeline
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={formData.startDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date *
              </label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={formData.endDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manager Due Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={formData.managerDueDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleDateChange('managerDueDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employee Acknowledgement Due Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={
                  formData.employeeAcknowledgementDueDate?.toISOString().split('T')[0] || ''
                }
                onChange={(e) =>
                  handleDateChange('employeeAcknowledgementDueDate', e.target.value)
                }
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Cycle Duration:{' '}
              {Math.ceil(
                (formData.endDate.getTime() - formData.startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              days
            </p>
          </div>
        </div>

        {/* Template Assignments */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Template Assignments
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Assignments: {formData.templateAssignments.length}
            </div>
          </div>

          {/* Add New Assignment Form */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Add Template Assignment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Select Template *
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  value={newAssignment.templateId}
                  onChange={(e) =>
                    setNewAssignment(prev => ({ ...prev, templateId: e.target.value }))
                  }
                >
                  <option value="">Choose a template...</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name} ({template.templateType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Select Departments *
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-32 overflow-y-auto bg-white dark:bg-gray-900">
                  {departments.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Loading departments...
                    </p>
                  ) : (
                    departments.map((department) => (
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
                          className="ml-2 text-sm text-gray-700 dark:text-gray-300"
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
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus size={14} />
              Add Assignment
            </button>
          </div>

          {/* Assignments List */}
          {formData.templateAssignments.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-300">
                No template assignments added yet.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-400">
                Add your first assignment above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.templateAssignments.map((assignment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {getTemplateName(assignment.templateId)}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-300">
                            Departments: {getDepartmentNames(assignment.departmentIds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAssignment(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between">
            <Link href="/performance/cycles">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </Link>

            <button
              type="submit"
              disabled={loading || formData.templateAssignments.length === 0}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? 'Creating...' : 'Create Cycle'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

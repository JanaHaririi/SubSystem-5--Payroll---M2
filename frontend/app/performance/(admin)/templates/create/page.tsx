'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { 
  CreateAppraisalTemplateDto,
  AppraisalTemplateType,
  AppraisalRatingScaleType 
} from '@/app/types/performance';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileText,
  Calendar,
  Users
} from 'lucide-react';

export default function CreateTemplatePage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAppraisalTemplateDto>({
    name: '',
    description: '',
    templateType: AppraisalTemplateType.ANNUAL,
    ratingScale: {
      type: AppraisalRatingScaleType.FIVE_POINT,
      min: 1,
      max: 5,
      labels: ['Poor', 'Below Average', 'Average', 'Above Average', 'Excellent']
    },
    criteria: [],
    instructions: '',
    isActive: true,
    applicableDepartmentIds: [],
    applicablePositionIds: []
  });

  const [newCriteria, setNewCriteria] = useState({
    key: '',
    title: '',
    details: '',
    weight: 20,
    maxScore: 5,
    required: true
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRatingScaleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      ratingScale: {
        ...prev.ratingScale,
        [field]: value
      }
    }));
  };

  const addCriteria = () => {
    if (!newCriteria.key.trim() || !newCriteria.title.trim()) {
      alert('Please enter criteria key and title');
      return;
    }
    
    // Generate key from title if not provided
    const criteriaKey = newCriteria.key.trim() || newCriteria.title.toLowerCase().replace(/\s+/g, '_');
    
    setFormData(prev => ({
      ...prev,
      criteria: [...prev.criteria, { 
        ...newCriteria, 
        key: criteriaKey 
      }]
    }));
    
    setNewCriteria({
      key: '',
      title: '',
      details: '',
      weight: 20,
      maxScore: 5,
      required: true
    });
  };

  const removeCriteria = (index: number) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }));
  };

  const getTotalWeight = () => {
    return formData.criteria.reduce((sum, item) => sum + (item.weight || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.criteria.length === 0) {
      alert('Please add at least one criteria item');
      return;
    }

    if (getTotalWeight() !== 100) {
      alert(`Total weight must be 100%. Current total: ${getTotalWeight()}%`);
      return;
    }

    try {
      setLoading(true);
      
      // Create the template
      await performanceApi.createAppraisalTemplate(formData);
      
      alert('Template created successfully!');
      router.push('/performance/templates');
      
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const templateTypes = [
    { value: AppraisalTemplateType.ANNUAL, label: 'Annual', icon: <Calendar className="h-4 w-4" /> },
    { value: AppraisalTemplateType.SEMI_ANNUAL, label: 'Semi-Annual', icon: <Calendar className="h-4 w-4" /> },
    { value: AppraisalTemplateType.PROBATIONARY, label: 'Probationary', icon: <Users className="h-4 w-4" /> },
    { value: AppraisalTemplateType.PROJECT, label: 'Project', icon: <FileText className="h-4 w-4" /> },
    { value: AppraisalTemplateType.AD_HOC, label: 'Ad Hoc', icon: <FileText className="h-4 w-4" /> },
  ];

  const ratingScaleTypes = [
    { value: AppraisalRatingScaleType.THREE_POINT, label: '3-Point Scale (1-3)', min: 1, max: 3 },
    { value: AppraisalRatingScaleType.FIVE_POINT, label: '5-Point Scale (1-5)', min: 1, max: 5 },
    { value: AppraisalRatingScaleType.TEN_POINT, label: '10-Point Scale (1-10)', min: 1, max: 10 },
  ];

  const handleRatingScaleTypeChange = (type: AppraisalRatingScaleType) => {
    const scaleType = ratingScaleTypes.find(t => t.value === type);
    if (scaleType) {
      setFormData(prev => ({
        ...prev,
        ratingScale: {
          ...prev.ratingScale,
          type,
          min: scaleType.min,
          max: scaleType.max
        }
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/performance/templates" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create Appraisal Template</h1>
          </div>
          <p className="text-gray-600">
            Define evaluation criteria and rating scales for performance appraisals
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                required
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Annual Performance Review 2024"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Type *
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.templateType}
                onChange={(e) => handleInputChange('templateType', e.target.value as AppraisalTemplateType)}
              >
                {templateTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the purpose and scope of this template..."
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions (Optional)
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              value={formData.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Add any special instructions for evaluators..."
            />
          </div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4 text-blue-600 rounded"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Make this template active (available for use)
            </label>
          </div>
        </div>

        {/* Rating Scale */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Scale</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating Scale Type *
              </label>
              <div className="space-y-2">
                {ratingScaleTypes.map((scale) => (
                  <div key={scale.value} className="flex items-center">
                    <input
                      type="radio"
                      id={`scale-${scale.value}`}
                      name="ratingScaleType"
                      checked={formData.ratingScale.type === scale.value}
                      onChange={() => handleRatingScaleTypeChange(scale.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor={`scale-${scale.value}`} className="ml-2 text-sm text-gray-700">
                      {scale.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating Labels (Optional)
                </label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  value={formData.ratingScale.labels?.join('\n') || ''}
                  onChange={(e) => handleRatingScaleChange('labels', e.target.value.split('\n').filter(label => label.trim()))}
                  placeholder="Enter each label on a new line\nExample:\nPoor\nAverage\nGood\nVery Good\nExcellent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  One label per line. Should match your scale range.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              Rating scale: {formData.ratingScale.min} to {formData.ratingScale.max} points
              {formData.ratingScale.labels?.length ? ` (${formData.ratingScale.labels.join(', ')})` : ''}
            </p>
          </div>
        </div>

        {/* Evaluation Criteria */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Evaluation Criteria</h2>
            <div className="text-sm text-gray-500">
              Total Weight: <span className={`font-bold ${getTotalWeight() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                {getTotalWeight()}%
              </span> (Must be 100%)
            </div>
          </div>
          
          {/* Add New Criteria Form */}
          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Add New Criteria</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Key *</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newCriteria.key}
                  onChange={(e) => setNewCriteria(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="e.g., communication_skills"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier</p>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newCriteria.title}
                  onChange={(e) => setNewCriteria(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Communication Skills"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">Weight (%) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newCriteria.weight}
                  onChange={(e) => setNewCriteria(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Max Score</label>
                <input
                  type="number"
                  min="1"
                  max={formData.ratingScale.max}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newCriteria.maxScore}
                  onChange={(e) => setNewCriteria(prev => ({ ...prev, maxScore: parseInt(e.target.value) || formData.ratingScale.max }))}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Details</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[60px]"
                value={newCriteria.details}
                onChange={(e) => setNewCriteria(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Describe what this criteria evaluates..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  className="h-4 w-4 text-blue-600 rounded"
                  checked={newCriteria.required}
                  onChange={(e) => setNewCriteria(prev => ({ ...prev, required: e.target.checked }))}
                />
                <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                  Required field
                </label>
              </div>
              
              <button
                type="button"
                onClick={addCriteria}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={14} />
                Add Criteria
              </button>
            </div>
          </div>
          
          {/* Criteria List */}
          {formData.criteria.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No criteria added yet. Add your first criteria above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.criteria.map((criteria, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{criteria.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Key: {criteria.key}</span>
                          {criteria.required && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {criteria.details && (
                      <p className="text-sm text-gray-500 mt-1 ml-9">{criteria.details}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                        {criteria.weight}%
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Max: {criteria.maxScore || formData.ratingScale.max}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCriteria(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between">
            <Link href="/performance/templates">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </Link>
            
            <button
              type="submit"
              disabled={loading || getTotalWeight() !== 100 || formData.criteria.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
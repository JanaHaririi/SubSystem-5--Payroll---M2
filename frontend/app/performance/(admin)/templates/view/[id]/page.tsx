'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { AppraisalTemplate, AppraisalTemplateType, AppraisalRatingScaleType } from '@/app/types/performance';
import { 
  ArrowLeft,
  Edit,
  Copy,
  Printer,
  FileText,
  Calendar,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function ViewTemplatePage() {
  const params = useParams();
  const router = useRouter();
  
  const [template, setTemplate] = useState<AppraisalTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const templateId = params.id as string;

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      // Use the correct API method
      const data = await performanceApi.getAppraisalTemplateById(templateId);
      setTemplate(data);
    } catch (error) {
      console.error('Error fetching template:', error);
      alert('Template not found');
      router.push('/performance/templates');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateTypeLabel = (type: AppraisalTemplateType) => {
    switch (type) {
      case AppraisalTemplateType.ANNUAL: return 'Annual';
      case AppraisalTemplateType.SEMI_ANNUAL: return 'Semi-Annual';
      case AppraisalTemplateType.PROBATIONARY: return 'Probationary';
      case AppraisalTemplateType.PROJECT: return 'Project';
      case AppraisalTemplateType.AD_HOC: return 'Ad Hoc';
      default: return type;
    }
  };

  const getTemplateTypeIcon = (type: AppraisalTemplateType) => {
    switch (type) {
      case AppraisalTemplateType.ANNUAL:
      case AppraisalTemplateType.SEMI_ANNUAL:
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case AppraisalTemplateType.PROBATIONARY:
        return <Users className="h-5 w-5 text-green-500" />;
      case AppraisalTemplateType.PROJECT:
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRatingScaleLabel = (type: AppraisalRatingScaleType) => {
    switch (type) {
      case AppraisalRatingScaleType.THREE_POINT: return '3-Point Scale';
      case AppraisalRatingScaleType.FIVE_POINT: return '5-Point Scale';
      case AppraisalRatingScaleType.TEN_POINT: return '10-Point Scale';
      default: return type;
    }
  };

  const getTotalWeight = () => {
    return template?.criteria?.reduce((sum, item) => sum + (item.weight || 0), 0) || 0;
  };

  const handleDuplicate = async () => {
    if (!template) return;
    
    if (window.confirm('Create a copy of this template?')) {
      try {
        const duplicateData = {
          ...template,
          name: `${template.name} (Copy)`,
          description: template.description ? `${template.description} - Copy` : 'Duplicate template'
        };
        
        await performanceApi.createAppraisalTemplate(duplicateData);
        alert('Template duplicated successfully!');
        router.push('/performance/templates');
      } catch (error) {
        console.error('Error duplicating template:', error);
        alert('Failed to duplicate template');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Template Not Found</h2>
        <p className="text-gray-600 mb-6">The template you're looking for doesn't exist or has been deleted.</p>
        <Link href="/performance/templates">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            Back to Templates
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/performance/templates" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {getTemplateTypeIcon(template.templateType)}
              <span className="text-sm text-gray-600">
                {getTemplateTypeLabel(template.templateType)}
              </span>
            </div>
            <span className="text-gray-400">•</span>
            {template.isActive ? (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Active
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Inactive
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/performance/templates/edit/${template._id}`}>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <Edit size={16} />
              Edit
            </button>
          </Link>
          <button 
            onClick={handleDuplicate}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Copy size={16} />
            Duplicate
          </button>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600">{template.description}</p>
        </div>
      )}

      {/* Instructions */}
      {template.instructions && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
          <p className="text-gray-600 whitespace-pre-line">{template.instructions}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Template Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rating Scale */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-4">Rating Scale</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="mb-3">
                <div className="text-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {template.ratingScale.min} - {template.ratingScale.max}
                  </span>
                  <p className="text-sm text-blue-700">Point Range</p>
                </div>
                <p className="text-sm text-blue-700 text-center mt-2">
                  {getRatingScaleLabel(template.ratingScale.type)}
                </p>
              </div>
              
              {template.ratingScale.labels && template.ratingScale.labels.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Rating Labels:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {template.ratingScale.labels.map((label, index) => (
                      <div key={index} className="bg-white p-2 rounded border text-center">
                        <span className="text-sm font-medium text-blue-700">{index + 1}</span>
                        <p className="text-xs text-blue-600">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Evaluation Criteria */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-medium text-gray-900">Evaluation Criteria</h3>
              <div className="text-sm text-gray-500">
                Total Weight: <span className={`font-bold ${getTotalWeight() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {getTotalWeight()}%
                </span>
              </div>
            </div>

            {(!template.criteria || template.criteria.length === 0) ? (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No criteria defined for this template.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {template.criteria.map((item, index) => (
                  <div key={item.key} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{item.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">Key: {item.key}</span>
                                {item.required && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                    Required
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                {item.weight || 0}%
                              </span>
                              {item.maxScore && (
                                <p className="text-xs text-gray-500 mt-1">Max: {item.maxScore}</p>
                              )}
                            </div>
                          </div>
                          {item.details && (
                            <p className="text-sm text-gray-600 mt-2">{item.details}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Template Info */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-4">Template Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{getTemplateTypeLabel(template.templateType)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">
                  {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </div>
              {template.updatedAt && (
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Number of Criteria</p>
                <p className="font-medium">{template.criteria?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rating Scale</p>
                <p className="font-medium">{getRatingScaleLabel(template.ratingScale.type)}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={handleDuplicate}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Copy size={14} />
                Duplicate Template
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                <Printer size={14} />
                Print Preview
              </button>
              <Link href={`/performance/templates/edit/${template._id}`}>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Edit size={14} />
                  Edit Template
                </button>
              </Link>
            </div>
          </div>

          {/* Applicability */}
          {((template.applicableDepartmentIds?.length ?? 0) > 0 || 
            (template.applicablePositionIds?.length ?? 0) > 0) && (
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-4">Applicability</h3>
              
              {(template.applicableDepartmentIds?.length ?? 0) > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Applicable Departments</p>
                  <div className="flex flex-wrap gap-1">
                    {template.applicableDepartmentIds!.map((deptId) => (
                      <span key={deptId} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {deptId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {(template.applicablePositionIds?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Applicable Positions</p>
                  <div className="flex flex-wrap gap-1">
                    {template.applicablePositionIds!.map((posId) => (
                      <span key={posId} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {posId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
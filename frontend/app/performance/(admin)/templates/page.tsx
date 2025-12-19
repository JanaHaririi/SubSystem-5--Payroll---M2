// app/performance/templates/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { performanceApi } from "@/app/utils/performanceApi";
import {
  AppraisalTemplate,
  AppraisalTemplateType,
} from "@/app/types/performance";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  Users,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
} from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<AppraisalTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AppraisalTemplate[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, typeFilter, statusFilter, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await performanceApi.getAllAppraisalTemplates();
      setTemplates(data);
      setFilteredTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(term) ||
          template.description?.toLowerCase().includes(term) ||
          template.templateType.toLowerCase().includes(term)
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((template) => template.templateType === typeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((template) =>
        statusFilter === "active" ? template.isActive : !template.isActive
      );
    }

    setFilteredTemplates(filtered);
  };

  const getTemplateTypeLabel = (type: AppraisalTemplateType) => {
    switch (type) {
      case AppraisalTemplateType.ANNUAL:
        return "Annual";
      case AppraisalTemplateType.SEMI_ANNUAL:
        return "Semi-Annual";
      case AppraisalTemplateType.PROBATIONARY:
        return "Probationary";
      case AppraisalTemplateType.PROJECT:
        return "Project";
      case AppraisalTemplateType.AD_HOC:
        return "Ad Hoc";
      default:
        return type;
    }
  };

  const getTemplateTypeIcon = (type: AppraisalTemplateType) => {
    switch (type) {
      case AppraisalTemplateType.ANNUAL:
      case AppraisalTemplateType.SEMI_ANNUAL:
        return <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case AppraisalTemplateType.PROBATIONARY:
        return <Users className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case AppraisalTemplateType.PROJECT:
        return <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500 dark:text-gray-300" />;
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this template? This action cannot be undone."
      )
    ) {
      try {
        // await performanceApi.deleteTemplate(templateId);
        setTemplates(templates.filter((t) => t._id !== templateId));
        alert("Template deleted successfully");
      } catch (error) {
        console.error("Error deleting template:", error);
        alert("Failed to delete template");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Appraisal Templates
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Create and manage performance appraisal templates
              </p>
            </div>

            <Link href="/performance/templates/create">
              <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-400 flex items-center gap-2">
                <Plus size={16} />
                Create Template
              </button>
            </Link>
          </div>

          {/* Template Stats */}
          {templates.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {templates.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Total Templates
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {templates.filter((t) => t.isActive).length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">Active</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {templates.filter((t) => t.templateType === AppraisalTemplateType.ANNUAL).length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">Annual</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {templates.reduce((acc, t) => acc + (t.criteria?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Total Criteria
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                  <select
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value={AppraisalTemplateType.ANNUAL}>Annual</option>
                    <option value={AppraisalTemplateType.SEMI_ANNUAL}>Semi-Annual</option>
                    <option value={AppraisalTemplateType.PROBATIONARY}>Probationary</option>
                    <option value={AppraisalTemplateType.PROJECT}>Project</option>
                    <option value={AppraisalTemplateType.AD_HOC}>Ad Hoc</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center shadow-sm">
              <FileText className="h-12 w-12 text-gray-300 dark:text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No templates found
              </h3>
              <p className="text-gray-500 dark:text-gray-300 mb-4">
                {templates.length === 0
                  ? "You haven't created any appraisal templates yet."
                  : "No templates match your search criteria."}
              </p>
              <Link href="/performance/templates/create">
                <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-400 flex items-center gap-2 mx-auto">
                  <Plus size={16} />
                  Create Your First Template
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template._id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-950 p-3 rounded-full">
                        {getTemplateTypeIcon(template.templateType)}
                      </div>

                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {template.name}
                        </h3>

                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 rounded-full">
                            {getTemplateTypeLabel(template.templateType)}
                          </span>

                          {template.isActive ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 rounded-full flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {template.description}
                    </p>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-300">
                        Criteria Items
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {template.criteria?.length || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-300">
                        Rating Scale
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {template.ratingScale?.min}-{template.ratingScale?.max} points
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-300">Created</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <Link href={`/performance/templates/view/${template._id}`}>
                        <button
                          className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                      </Link>

                      <Link href={`/performance/templates/edit/${template._id}`}>
                        <button
                          className="p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950 rounded-md"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      </Link>

                      <button
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 rounded-md"
                        title="Duplicate"
                        onClick={() => console.log("Duplicate template:", template._id)}
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    <button
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 rounded-md"
                      title="Delete"
                      onClick={() => handleDeleteTemplate(template._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
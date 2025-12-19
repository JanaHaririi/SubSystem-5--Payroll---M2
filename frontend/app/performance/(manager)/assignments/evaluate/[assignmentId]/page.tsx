'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { useAuth } from '@/app/(system)/context/authContext';
import { isLineManager } from '@/app/utils/roleCheck';
import {
  ArrowLeft,
  Save,
  Send,
  User,
  Calendar,
  Building2,
  FileText,
  Award,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface RatingEntry {
  key: string;
  title: string;
  ratingValue: number;
  ratingLabel?: string;
  weightedScore?: number;
  comments?: string;
}

export default function EvaluateAssignmentPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [assignment, setAssignment] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [managerSummary, setManagerSummary] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvementAreas, setImprovementAreas] = useState('');

  // Manager-only guard
  useEffect(() => {
    if (!authLoading && user && !isLineManager(user)) {
      router.replace('/performance');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!assignmentId) return;
    fetchAssignment();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const assignmentData = await performanceApi.getAppraisalAssignmentById(assignmentId);
      setAssignment(assignmentData);

      // Fetch template
      const templateId = typeof assignmentData.templateId === 'string'
        ? assignmentData.templateId
        : assignmentData.templateId?._id;

      if (templateId) {
        const templateData = await performanceApi.getAppraisalTemplateById(templateId);
        setTemplate(templateData);

        // Initialize ratings based on template criteria
        const initialRatings: RatingEntry[] = (templateData.criteria || []).map((criterion: any) => ({
          key: criterion.key,
          title: criterion.title,
          ratingValue: 0,
          ratingLabel: '',
          weightedScore: 0,
          comments: ''
        }));
        setRatings(initialRatings);
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      alert('Failed to load assignment');
      router.replace('/performance/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (index: number, value: number) => {
    const newRatings = [...ratings];
    newRatings[index].ratingValue = value;

    // Calculate weighted score if criterion has weight
    const criterion = template.criteria[index];
    if (criterion.weight) {
      newRatings[index].weightedScore = (value / template.ratingScale.max) * criterion.weight;
    }

    // Set rating label based on scale
    newRatings[index].ratingLabel = getRatingLabel(value);

    setRatings(newRatings);
  };

  const handleCommentChange = (index: number, comment: string) => {
    const newRatings = [...ratings];
    newRatings[index].comments = comment;
    setRatings(newRatings);
  };

  const getRatingLabel = (value: number): string => {
    if (!template?.ratingScale?.labels) return '';

    const { min, max, labels } = template.ratingScale;
    const range = max - min;
    const step = range / (labels.length - 1);
    const index = Math.round((value - min) / step);

    return labels[Math.max(0, Math.min(index, labels.length - 1))] || '';
  };

  const calculateTotalScore = (): number => {
    return ratings.reduce((sum, rating) => sum + (rating.weightedScore || rating.ratingValue), 0);
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);

      const recordData = {
        ratings,
        totalScore: calculateTotalScore(),
        managerSummary,
        strengths,
        improvementAreas,
        status: 'DRAFT'
      };

      await performanceApi.createOrUpdateAppraisalRecord(assignmentId, recordData);
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all ratings are filled
    const unratedCriteria = ratings.filter(r => r.ratingValue === 0);
    if (unratedCriteria.length > 0) {
      alert(`Please rate all criteria. Missing: ${unratedCriteria.map(r => r.title).join(', ')}`);
      return;
    }

    if (!managerSummary.trim()) {
      alert('Please provide a manager summary');
      return;
    }

    if (!window.confirm('Are you sure you want to submit this appraisal? Once submitted, it will be sent to HR for review.')) {
      return;
    }

    try {
      setSubmitting(true);

      // Save the record first
      const recordData = {
        ratings,
        totalScore: calculateTotalScore(),
        managerSummary,
        strengths,
        improvementAreas,
        status: 'MANAGER_SUBMITTED'
      };

      await performanceApi.createOrUpdateAppraisalRecord(assignmentId, recordData);

      // Then submit it
      await performanceApi.submitAppraisalRecord(assignmentId);

      alert('Appraisal submitted successfully!');
      router.push('/performance/assignments');
    } catch (error) {
      console.error('Error submitting appraisal:', error);
      alert('Failed to submit appraisal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assignment || !template) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Assignment or template not found</p>
      </div>
    );
  }

  const employee = assignment.employeeProfileId;
  const cycle = assignment.cycleId;
  const department = assignment.departmentId;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/performance/assignments"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Employee Appraisal Evaluation
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Complete the performance evaluation for this employee
            </p>
          </div>
        </div>

        {/* Employee & Cycle Info Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Appraisal Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Employee</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {employee?.firstName} {employee?.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {employee?.employeeNumber && `ID: ${employee.employeeNumber}`}
                  {employee?.position && employee?.employeeNumber ? ' • ' : ''}
                  {employee?.position}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {department?.name || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Appraisal Cycle</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {cycle?.name || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Template</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {template.name}
                </p>
              </div>
            </div>
          </div>

          {assignment.dueDate && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Rating Scale Info */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Rating Scale: {template.ratingScale.type}
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Range: {template.ratingScale.min} - {template.ratingScale.max}
          </p>
          {template.ratingScale.labels && (
            <div className="flex flex-wrap gap-2 mt-2">
              {template.ratingScale.labels.map((label: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Evaluation Criteria */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Evaluation Criteria
          </h2>

          <div className="space-y-6">
            {ratings.map((rating, index) => {
              const criterion = template.criteria[index];
              return (
                <div
                  key={rating.key}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {index + 1}. {rating.title}
                      {criterion.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h3>
                    {criterion.details && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {criterion.details}
                      </p>
                    )}
                    {criterion.weight && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Weight: {criterion.weight}%
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Rating Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rating
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={template.ratingScale.min}
                          max={template.ratingScale.max}
                          step={template.ratingScale.step || 1}
                          value={rating.ratingValue}
                          onChange={(e) => handleRatingChange(index, Number(e.target.value))}
                          className="flex-1"
                        />
                        <div className="text-center min-w-[80px]">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {rating.ratingValue}
                          </span>
                          {rating.ratingLabel && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {rating.ratingLabel}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Comments & Examples
                      </label>
                      <textarea
                        value={rating.comments}
                        onChange={(e) => handleCommentChange(index, e.target.value)}
                        placeholder="Provide specific examples, feedback, and context for this rating..."
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Summary Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Overall Summary
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manager Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                value={managerSummary}
                onChange={(e) => setManagerSummary(e.target.value)}
                placeholder="Provide an overall summary of the employee's performance during this period..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Strengths
              </label>
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Highlight the employee's key strengths and positive contributions..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Areas for Improvement
              </label>
              <textarea
                value={improvementAreas}
                onChange={(e) => setImprovementAreas(e.target.value)}
                placeholder="Identify areas where the employee can improve and develop..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Total Score Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-300">Total Score</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {calculateTotalScore().toFixed(2)}
              </p>
            </div>
            <Award className="h-12 w-12 text-blue-400" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link href="/performance/assignments">
              <button className="w-full sm:w-auto px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
            </Link>

            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-md text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Appraisal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

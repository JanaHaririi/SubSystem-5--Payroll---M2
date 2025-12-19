'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { performanceApi } from '@/app/utils/performanceApi';
import { useAuth } from '@/app/(system)/context/authContext';
import {
  ArrowLeft,
  User,
  Calendar,
  Building2,
  FileText,
  Award,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  Flag
} from 'lucide-react';

export default function ViewAppraisalRecordPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [record, setRecord] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId) return;
    fetchRecord();
  }, [recordId]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const recordData = await performanceApi.getAppraisalRecordById(recordId);
      setRecord(recordData);

      // Template is already populated in the record
      if (typeof recordData.templateId === 'object' && recordData.templateId) {
        setTemplate(recordData.templateId);
      }
    } catch (error) {
      console.error('Error fetching record:', error);
      alert('Failed to load appraisal record');
      router.replace('/performance/reviews');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!record || !template) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Appraisal record not found</p>
      </div>
    );
  }

  const employee = record.employeeProfileId;
  const manager = record.managerProfileId;
  const cycle = record.cycleId;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/performance/reviews"
                className="text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-100">
                Performance Appraisal Results
              </h1>
            </div>
            <p className="text-slate-400">
              Review your performance evaluation and feedback
            </p>
          </div>
          <Link href={`/performance/employeeDisputes?recordId=${recordId}`}>
            <button className="inline-flex items-center px-4 py-2 border border-red-600 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950">
              <Flag className="h-4 w-4 mr-2" />
              Raise Concern
            </button>
          </Link>
        </div>

        {/* Employee & Cycle Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Appraisal Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-400">Employee</p>
                <p className="font-medium text-slate-100">
                  {employee?.firstName} {employee?.lastName}
                </p>
                <p className="text-sm text-slate-400">
                  {employee?.employeeNumber && `ID: ${employee.employeeNumber}`}
                  {employee?.position && employee?.employeeNumber ? ' • ' : ''}
                  {employee?.position}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-purple-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-400">Evaluated By</p>
                <p className="font-medium text-slate-100">
                  {manager?.firstName} {manager?.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-400">Appraisal Cycle</p>
                <p className="font-medium text-slate-100">
                  {cycle?.name || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-400">Template</p>
                <p className="font-medium text-slate-100">
                  {template.name}
                </p>
              </div>
            </div>
          </div>

          {record.managerSubmittedAt && (
            <div className="mt-4 p-3 bg-green-950 rounded-lg flex items-center gap-2 border border-green-800">
              <Award className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-300">
                Submitted: {new Date(record.managerSubmittedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-300">Overall Score</p>
              <p className="text-4xl font-bold text-blue-400 mt-1">
                {record.totalScore?.toFixed(1) || 'N/A'}
              </p>
              {record.overallRatingLabel && (
                <p className="text-sm text-blue-300 mt-1">{record.overallRatingLabel}</p>
              )}
            </div>
            <TrendingUp className="h-16 w-16 text-blue-700" />
          </div>
        </div>

        {/* Ratings */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Performance Ratings
          </h2>

          <div className="space-y-6">
            {record.ratings && record.ratings.map((rating: any, index: number) => (
              <div key={index} className="border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-100">{rating.title}</h3>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-400">{rating.ratingValue}/{template.ratingScale?.max || 5}</p>
                    {rating.ratingLabel && (
                      <p className="text-xs text-slate-400">{rating.ratingLabel}</p>
                    )}
                  </div>
                </div>

                {rating.comments && (
                  <div className="mt-2 p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-300">{rating.comments}</p>
                  </div>
                )}

                {rating.weightedScore !== undefined && (
                  <p className="text-xs text-slate-400 mt-2">
                    Weighted Score: {rating.weightedScore.toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Manager Feedback */}
        {(record.managerSummary || record.strengths || record.improvementAreas) && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Manager Feedback
            </h2>

            {record.managerSummary && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Overall Summary</h3>
                <p className="text-slate-100">{record.managerSummary}</p>
              </div>
            )}

            {record.strengths && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Strengths</h3>
                <p className="text-slate-100">{record.strengths}</p>
              </div>
            )}

            {record.improvementAreas && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Areas for Improvement</h3>
                <p className="text-slate-100">{record.improvementAreas}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

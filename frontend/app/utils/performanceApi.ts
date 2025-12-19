// app/utils/performanceApi.ts
import axiosInstance from './ApiClient';
import {
  AppraisalTemplate,
  AppraisalCycle,
  AppraisalAssignment,
  AppraisalRecord,
  AppraisalDispute,
  PerformanceAnalytics,
  DepartmentAnalytics,
  AppraisalTemplateType,
  AppraisalRatingScaleType,
  AppraisalCycleStatus,
  AppraisalRecordStatus,
  AppraisalDisputeStatus,
} from '../types/performance';

// DTO Types matching your backend
export interface CreateAppraisalTemplateDto {
  name: string;
  description?: string;
  templateType: AppraisalTemplateType;
  ratingScale: {
    type: AppraisalRatingScaleType;
    min: number;
    max: number;
    step?: number;
    labels?: string[];
  };
  criteria: Array<{
    key: string;
    title: string;
    details?: string;
    weight?: number;
    maxScore?: number;
    required?: boolean;
  }>;
  instructions?: string;
  applicableDepartmentIds?: string[];
  applicablePositionIds?: string[];
  isActive?: boolean;
}

export interface CreateAppraisalCycleDto {
  name: string;
  description?: string;
  cycleType: AppraisalTemplateType; // Use AppraisalTemplateType enum
  startDate: Date;
  endDate: Date;
  managerDueDate?: Date;
  employeeAcknowledgementDueDate?: Date;
  templateAssignments: Array<{
    templateId: string;
    departmentIds: string[];
  }>;
  status?: AppraisalCycleStatus; // Use AppraisalCycleStatus enum
}

export interface CreateAppraisalRecordDto {
  ratings: Array<{
    key: string;
    title: string;
    ratingValue: number;
    ratingLabel?: string;
    weightedScore?: number;
    comments?: string;
  }>;
  totalScore?: number;
  overallRatingLabel?: string;
  managerSummary?: string;
  strengths?: string;
  improvementAreas?: string;
  status?: AppraisalRecordStatus;
}

export interface CreateAppraisalDisputeDto {
  appraisalId: string;
  assignmentId?: string;
  cycleId?: string;
  raisedByEmployeeId?: string;
  reason: string;
  details?: string;
  status?: AppraisalDisputeStatus;
  assignedReviewerEmployeeId?: string;
}

export interface UpdateAppraisalCycleStatusDto {
  status: AppraisalCycleStatus;
}

export interface UpdateAppraisalDisputeDto {
  status: AppraisalDisputeStatus;
  resolutionSummary?: string;
  resolvedByEmployeeId?: string;
}

export interface PublishAppraisalRecordDto {
  publishedByEmployeeId: string;
}

class PerformanceApi {
  // ========== TEMPLATE ENDPOINTS ==========
  async createAppraisalTemplate(data: CreateAppraisalTemplateDto): Promise<AppraisalTemplate> {
    const response = await axiosInstance.post('/performance/templates', data);
    return response.data;
  }

  async getAllAppraisalTemplates(): Promise<AppraisalTemplate[]> {
    const response = await axiosInstance.get('/performance/templates');
    return response.data;
  }

  async getAppraisalTemplateById(id: string): Promise<AppraisalTemplate> {
    const response = await axiosInstance.get(`/performance/templates/${id}`);
    return response.data;
  }

  async updateAppraisalTemplate(id: string, data: CreateAppraisalTemplateDto): Promise<AppraisalTemplate> {
    const response = await axiosInstance.put(`/performance/templates/${id}`, data);
    return response.data;
  }

  // ========== CYCLE ENDPOINTS ==========
  async createAppraisalCycle(data: CreateAppraisalCycleDto): Promise<AppraisalCycle> {
    const response = await axiosInstance.post('/performance/cycles', data);
    return response.data;
  }

  async getAllAppraisalCycles(): Promise<AppraisalCycle[]> {
    const response = await axiosInstance.get('/performance/cycles');
    return response.data;
  }

  async getAppraisalCycleById(id: string): Promise<AppraisalCycle> {
    const response = await axiosInstance.get(`/performance/cycles/${id}`);
    return response.data;
  }

  async updateAppraisalCycleStatus(id: string, status: AppraisalCycleStatus): Promise<AppraisalCycle> {
    const response = await axiosInstance.put(`/performance/cycles/${id}/status`, { status });
    return response.data;
  }

  // ========== ASSIGNMENT ENDPOINTS ==========
  async createAppraisalAssignments(cycleId: string): Promise<AppraisalAssignment[]> {
    const response = await axiosInstance.post(`/performance/cycles/${cycleId}/assignments`);
    return response.data;
  }

  async getEmployeeAppraisals(employeeProfileId: string): Promise<AppraisalAssignment[]> {
    const response = await axiosInstance.get(`/performance/employees/${employeeProfileId}/appraisals`);
    return response.data;
  }

  async getManagerAppraisalAssignments(managerProfileId: string): Promise<AppraisalAssignment[]> {
    const response = await axiosInstance.get(`/performance/managers/${managerProfileId}/assignments`);
    return response.data;
  }

  async getAppraisalAssignmentById(assignmentId: string): Promise<AppraisalAssignment> {
    const response = await axiosInstance.get(`/performance/assignments/${assignmentId}`);
    return response.data;
  }

  async getCycleAssignments(cycleId: string): Promise<AppraisalAssignment[]> {
    const response = await axiosInstance.get(`/performance/cycles/${cycleId}/assignments`);
    return response.data;
  }

  async getSubmittedAssignments(): Promise<AppraisalAssignment[]> {
    const response = await axiosInstance.get(`/performance/assignments/submitted`);
    return response.data;
  }

  async updateAssignmentStatus(assignmentId: string, status: string): Promise<AppraisalAssignment> {
    const response = await axiosInstance.put(`/performance/assignments/${assignmentId}/status`, { status });
    return response.data;
  }

  // ========== RECORD ENDPOINTS ==========
  async createOrUpdateAppraisalRecord(assignmentId: string, data: CreateAppraisalRecordDto): Promise<AppraisalRecord> {
    const response = await axiosInstance.post(`/performance/assignments/${assignmentId}/record`, data);
    return response.data;
  }

  async submitAppraisalRecord(assignmentId: string): Promise<AppraisalRecord> {
    const response = await axiosInstance.put(`/performance/assignments/${assignmentId}/submit`);
    return response.data;
  }

  async getAppraisalRecordById(recordId: string): Promise<AppraisalRecord> {
    const response = await axiosInstance.get(`/performance/records/${recordId}`);
    return response.data;
  }

  async publishAppraisalRecord(assignmentId: string, publishedByEmployeeId: string): Promise<AppraisalRecord> {
    const response = await axiosInstance.put(`/performance/assignments/${assignmentId}/publish`, {
      publishedByEmployeeId,
    });
    return response.data;
  }

  async updateRecordStatus(recordId: string, status: string): Promise<AppraisalRecord> {
    const response = await axiosInstance.put(`/performance/records/${recordId}/status`, { status });
    return response.data;
  }

  async updateAppraisalRecord(recordId: string, updateData: {
    ratings?: Array<{
      key: string;
      title: string;
      ratingValue: number;
      ratingLabel?: string;
      comments?: string;
    }>;
    managerSummary?: string;
    strengths?: string;
    improvementAreas?: string;
  }): Promise<AppraisalRecord> {
    const response = await axiosInstance.put(`/performance/records/${recordId}`, updateData);
    return response.data;
  }

  // ========== DISPUTE ENDPOINTS ==========
  async createAppraisalDispute(data: CreateAppraisalDisputeDto): Promise<AppraisalDispute> {
    const response = await axiosInstance.post('/performance/disputes', data);
    return response.data;
  }

  async getAppraisalDisputes(cycleId?: string): Promise<AppraisalDispute[]> {
    const url = cycleId ? `/performance/disputes?cycleId=${cycleId}` : '/performance/disputes';
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async getAppraisalDisputeById(disputeId: string): Promise<AppraisalDispute> {
    const response = await axiosInstance.get(`/performance/disputes/${disputeId}`);
    return response.data;
  }

  async updateDisputeStatus(disputeId: string, data: UpdateAppraisalDisputeDto): Promise<AppraisalDispute> {
    const response = await axiosInstance.put(`/performance/disputes/${disputeId}/status`, data);
    return response.data;
  }

  async assignDisputeReviewer(disputeId: string, reviewerId: string): Promise<AppraisalDispute> {
    const response = await axiosInstance.put(`/performance/disputes/${disputeId}/assign-reviewer`, { reviewerId });
    return response.data;
  }

  async getMyDisputes(): Promise<AppraisalDispute[]> {
    const response = await axiosInstance.get('/performance/my-disputes');
    return response.data;
  }

  // ========== ANALYTICS ENDPOINTS ==========
  async getPerformanceAnalytics(cycleId?: string): Promise<PerformanceAnalytics> {
    const url = cycleId ? `/performance/analytics?cycleId=${cycleId}` : '/performance/analytics';
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async getDepartmentPerformanceAnalytics(departmentId: string, cycleId?: string): Promise<DepartmentAnalytics> {
    const url = cycleId
      ? `/performance/analytics/department/${departmentId}?cycleId=${cycleId}`
      : `/performance/analytics/department/${departmentId}`;
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async getHistoricalTrendAnalysis(employeeProfileId?: string): Promise<any> {
    const url = employeeProfileId
      ? `/performance/analytics/trends?employeeProfileId=${employeeProfileId}`
      : '/performance/analytics/trends';
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async exportPerformanceReport(cycleId?: string): Promise<any> {
    const url = cycleId ? `/performance/reports/export?cycleId=${cycleId}` : '/performance/reports/export';
    const response = await axiosInstance.get(url);
    return response.data;
  }
}

export const performanceApi = new PerformanceApi();
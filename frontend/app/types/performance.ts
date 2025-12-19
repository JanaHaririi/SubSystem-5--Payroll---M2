// app/types/performance.ts
export enum AppraisalTemplateType {
  ANNUAL = 'ANNUAL',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  PROBATIONARY = 'PROBATIONARY',
  PROJECT = 'PROJECT',
  AD_HOC = 'AD_HOC',
}

export enum AppraisalCycleStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum AppraisalAssignmentStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  PUBLISHED = 'PUBLISHED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export enum AppraisalRecordStatus {
  DRAFT = 'DRAFT',
  MANAGER_SUBMITTED = 'MANAGER_SUBMITTED',
  HR_PUBLISHED = 'HR_PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum AppraisalDisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ADJUSTED = 'ADJUSTED',
  REJECTED = 'REJECTED',
}

// CORRECTED: Use the enum values from your performance.enums.ts
export enum AppraisalRatingScaleType {
  THREE_POINT = 'THREE_POINT',
  FIVE_POINT = 'FIVE_POINT',
  TEN_POINT = 'TEN_POINT',
}

// ADD THIS: DTO for creating appraisal template
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

// Rating Scale Definition
export interface RatingScaleDefinition {
  type: AppraisalRatingScaleType;
  min: number;
  max: number;
  step?: number;
  labels?: string[];
}

// Evaluation Criterion
export interface EvaluationCriterion {
  key: string;
  title: string;
  details?: string;
  weight?: number;
  maxScore?: number;
  required: boolean;
}

// Appraisal Template
export interface AppraisalTemplate {
  _id: string;
  name: string;
  description?: string;
  templateType: AppraisalTemplateType;
  ratingScale: RatingScaleDefinition;
  criteria: EvaluationCriterion[];
  instructions?: string;
  applicableDepartmentIds?: string[];
  applicablePositionIds?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cycle Template Assignment
export interface CycleTemplateAssignment {
  templateId: string;
  departmentIds: string[];
}

// Appraisal Cycle
export interface AppraisalCycle {
  _id: string;
  name: string;
  description?: string;
  cycleType: AppraisalTemplateType;
  startDate: Date;
  endDate: Date;
  managerDueDate?: Date;
  employeeAcknowledgementDueDate?: Date;
  templateAssignments: CycleTemplateAssignment[];
  status: AppraisalCycleStatus;
  publishedAt?: Date;
  closedAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Appraisal Assignment
export interface AppraisalAssignment {
  _id: string;
  cycleId: string | AppraisalCycle;
  templateId: string | AppraisalTemplate;
  employeeProfileId: string | any;
  managerProfileId?: string | any; // Optional - can be assigned later by HR
  departmentId: string | any;
  positionId?: string;
  status: AppraisalAssignmentStatus;
  assignedAt: Date;
  dueDate?: Date;
  submittedAt?: Date;
  publishedAt?: Date;
  latestAppraisalId?: string;
}

// Rating Entry
export interface RatingEntry {
  key: string;
  title: string;
  ratingValue: number;
  ratingLabel?: string;
  weightedScore?: number;
  comments?: string;
}

// Appraisal Record
export interface AppraisalRecord {
  _id: string;
  assignmentId: string | AppraisalAssignment;
  cycleId: string | AppraisalCycle;
  templateId: string | AppraisalTemplate;
  employeeProfileId: string | any;
  managerProfileId?: string | any; // Optional - may not be assigned yet
  ratings: RatingEntry[];
  totalScore?: number;
  overallRatingLabel?: string;
  managerSummary?: string;
  strengths?: string;
  improvementAreas?: string;
  status: AppraisalRecordStatus;
  managerSubmittedAt?: Date;
  hrPublishedAt?: Date;
  publishedByEmployeeId?: string | any;
  employeeViewedAt?: Date;
  employeeAcknowledgedAt?: Date;
  employeeAcknowledgementComment?: string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Appraisal Dispute
export interface AppraisalDispute {
  _id: string;
  appraisalId: string | AppraisalRecord;
  assignmentId: string | AppraisalAssignment;
  cycleId: string | AppraisalCycle;
  raisedByEmployeeId: string | any;
  reason: string;
  details?: string;
  submittedAt: Date;
  status: AppraisalDisputeStatus;
  assignedReviewerEmployeeId?: string | any;
  resolutionSummary?: string;
  resolvedAt?: Date;
  resolvedByEmployeeId?: string | any;
}

// Analytics
export interface PerformanceAnalytics {
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  notStartedAssignments: number;
  completionRate: string;
  averageScore: string;
  totalRecords: number;
}

export interface DepartmentAnalytics {
  departmentId: string;
  totalEmployees: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  completionRate: string;
  averageScore: string;
  assignments: Array<{
    employeeId: string;
    employeeName: string;
    status: AppraisalAssignmentStatus;
    assignedAt: Date;
    completedAt?: Date;
  }>;
}
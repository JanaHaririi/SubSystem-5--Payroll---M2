import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AppraisalDisputeStatus } from '../enums/performance.enums';

export class CreateAppraisalDisputeDto {
  @IsString()
  appraisalId: string;

  @IsString()
  assignmentId: string;

  @IsString()
  cycleId: string;

  @IsString()
  raisedByEmployeeId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsEnum(AppraisalDisputeStatus)
  status?: AppraisalDisputeStatus;

  @IsOptional()
  @IsString()
  assignedReviewerEmployeeId?: string;
}
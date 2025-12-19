import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AppraisalDisputeStatus } from '../enums/performance.enums';

export class CreateAppraisalDisputeDto {
  @IsString()
  appraisalId: string;

  @IsOptional()
  @IsString()
  assignmentId?: string;

  @IsOptional()
  @IsString()
  cycleId?: string;

  @IsOptional()
  @IsString()
  raisedByEmployeeId?: string;

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
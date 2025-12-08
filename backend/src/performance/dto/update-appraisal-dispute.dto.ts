import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { AppraisalDisputeStatus } from '../enums/performance.enums';

export class UpdateAppraisalDisputeDto {
  @IsEnum(AppraisalDisputeStatus)
  status: AppraisalDisputeStatus;

  @IsOptional()
  @IsString()
  resolutionSummary?: string;

  @IsOptional()
  @IsString()
  resolvedByEmployeeId?: string;
}